"""
Auto-updater for Muer Voice Assistant.

Polls git for new commits on the configured branch and automatically:
1. Pulls the latest code
2. Reinstalls Python dependencies if requirements.txt changed
3. Restarts the systemd service (or exits for the process manager to restart)

Also starts a lightweight webhook server so GitHub can trigger instant updates.
"""

import hashlib
import hmac
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from assistant.config import config
from assistant.utils.logger import get_logger

log = get_logger("updater")


class AutoUpdater:
    def __init__(self) -> None:
        self._thread: threading.Thread | None = None
        self._webhook_thread: threading.Thread | None = None
        self._running = False
        self._repo = Path(config.REPO_DIR)

    def start(self) -> None:
        self._running = True

        # Polling thread
        self._thread = threading.Thread(target=self._poll_loop, daemon=True, name="UpdaterPoll")
        self._thread.start()
        log.info(f"Auto-updater started. Polling every {config.AUTO_UPDATE_INTERVAL}s.")

        # Webhook server thread (optional)
        if config.WEBHOOK_SECRET:
            self._webhook_thread = threading.Thread(
                target=self._start_webhook_server, daemon=True, name="UpdaterWebhook"
            )
            self._webhook_thread.start()
            log.info(f"Webhook server started on port {config.WEBHOOK_PORT}.")

    def stop(self) -> None:
        self._running = False

    def _poll_loop(self) -> None:
        while self._running:
            try:
                self._check_for_updates()
            except Exception as e:
                log.error(f"Update check failed: {e}")
            time.sleep(config.AUTO_UPDATE_INTERVAL)

    def _check_for_updates(self) -> None:
        """Fetch remote and compare HEAD with remote HEAD."""
        log.debug("Checking for updates...")

        # Fetch remote without merging
        result = subprocess.run(
            ["git", "fetch", config.GIT_REMOTE, config.GIT_BRANCH],
            cwd=self._repo, capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            log.warning(f"git fetch failed: {result.stderr.strip()}")
            return

        # Compare local HEAD with remote HEAD
        local = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=self._repo, capture_output=True, text=True
        ).stdout.strip()

        remote = subprocess.run(
            ["git", "rev-parse", f"{config.GIT_REMOTE}/{config.GIT_BRANCH}"],
            cwd=self._repo, capture_output=True, text=True
        ).stdout.strip()

        if local == remote:
            log.debug("Already up to date.")
            return

        log.info(f"Update available: {local[:8]} → {remote[:8]}")
        self._apply_update()

    def _apply_update(self) -> None:
        """Pull latest code, update deps, restart service."""
        log.info("Applying update...")

        # Check if requirements.txt changed
        req_before = self._hash_file("assistant/requirements.txt")

        # Pull
        result = subprocess.run(
            ["git", "pull", config.GIT_REMOTE, config.GIT_BRANCH],
            cwd=self._repo, capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            log.error(f"git pull failed: {result.stderr.strip()}")
            return

        log.info(f"Pulled: {result.stdout.strip()}")

        # Reinstall deps if requirements.txt changed
        req_after = self._hash_file("assistant/requirements.txt")
        if req_before != req_after:
            log.info("requirements.txt changed, reinstalling dependencies...")
            venv_pip = self._find_venv_pip()
            if venv_pip:
                subprocess.run(
                    [venv_pip, "install", "-r", str(self._repo / "assistant" / "requirements.txt")],
                    capture_output=True, timeout=120
                )
                log.info("Dependencies updated.")

        # Restart
        self._restart_service()

    def _hash_file(self, relative_path: str) -> str:
        path = self._repo / relative_path
        if not path.exists():
            return ""
        return hashlib.md5(path.read_bytes()).hexdigest()

    def _find_venv_pip(self) -> str | None:
        """Find the pip executable in the virtualenv."""
        candidates = [
            self._repo / "venv" / "bin" / "pip",
            self._repo / "assistant" / ".venv" / "bin" / "pip",
            Path("/opt/muer-assistant/venv/bin/pip"),
        ]
        for p in candidates:
            if p.exists():
                return str(p)
        return None

    def _restart_service(self) -> None:
        """Restart via systemd if available, otherwise exit for process manager."""
        service_name = f"muer-assistant@{os.getenv('USER', 'ubuntu')}.service"

        # Try systemctl restart (requires sudo or service runner)
        result = subprocess.run(
            ["systemctl", "is-active", "--quiet", service_name],
            capture_output=True
        )
        if result.returncode == 0:
            log.info(f"Restarting systemd service: {service_name}")
            subprocess.run(["sudo", "systemctl", "restart", service_name], check=False)
        else:
            # Exit and let systemd Restart=on-failure bring us back
            log.info("Exiting for process manager restart...")
            os.execv(sys.executable, [sys.executable] + sys.argv)

    def _start_webhook_server(self) -> None:
        """Lightweight HTTP server for GitHub webhook push events."""
        updater_ref = self

        class WebhookHandler(BaseHTTPRequestHandler):
            def do_POST(self):
                if self.path != "/webhook":
                    self.send_response(404)
                    self.end_headers()
                    return

                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length)

                # Verify signature if secret is configured
                if config.WEBHOOK_SECRET:
                    sig_header = self.headers.get("X-Hub-Signature-256", "")
                    expected = "sha256=" + hmac.new(
                        config.WEBHOOK_SECRET.encode(), body, hashlib.sha256
                    ).hexdigest()
                    if not hmac.compare_digest(sig_header, expected):
                        log.warning("Webhook signature mismatch — rejecting.")
                        self.send_response(403)
                        self.end_headers()
                        return

                try:
                    event = self.headers.get("X-GitHub-Event", "")
                    if event == "push":
                        payload = json.loads(body)
                        ref = payload.get("ref", "")
                        branch = config.GIT_BRANCH
                        if ref == f"refs/heads/{branch}":
                            log.info(f"Webhook: push to {branch} received — updating now.")
                            threading.Thread(
                                target=updater_ref._apply_update, daemon=True
                            ).start()
                except Exception as e:
                    log.error(f"Webhook handler error: {e}")

                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"OK")

            def log_message(self, fmt, *args):
                log.debug(f"Webhook: {fmt % args}")

        server = HTTPServer(("0.0.0.0", config.WEBHOOK_PORT), WebhookHandler)
        log.info(f"Webhook listening on 0.0.0.0:{config.WEBHOOK_PORT}/webhook")
        server.serve_forever()
