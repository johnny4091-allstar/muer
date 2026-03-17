"""
Enhanced system control: open apps, screen brightness, Bluetooth,
desktop notifications, shutdown/sleep/restart, clipboard.
"""

import shutil
import subprocess
from typing import Any

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.system")

# Common app name → command mapping
_APP_COMMANDS = {
    "firefox": "firefox",
    "chrome": "google-chrome",
    "chromium": "chromium-browser",
    "terminal": "gnome-terminal",
    "files": "nautilus",
    "settings": "gnome-control-center",
    "text editor": "gedit",
    "calculator": "gnome-calculator",
    "calendar": "gnome-calendar",
    "music": "rhythmbox",
    "videos": "totem",
    "photos": "eog",
    "email": "thunderbird",
    "office": "libreoffice",
    "word": "libreoffice --writer",
    "spreadsheet": "libreoffice --calc",
    "code": "code",
    "vscode": "code",
    "vim": "gnome-terminal -- vim",
    "camera": "cheese",
    "bluetooth": "gnome-control-center bluetooth",
    "wifi": "gnome-control-center wifi",
    "sound": "gnome-control-center sound",
}


def _notify(title: str, body: str, urgency: str = "normal") -> None:
    if shutil.which("notify-send"):
        subprocess.run(
            ["notify-send", "-u", urgency, title, body],
            check=False,
            capture_output=True,
        )


@register("open_app")
def open_app(params: dict[str, Any], tts, response_hint: str = "") -> None:
    app = params.get("app", "").strip().lower()
    cmd = _APP_COMMANDS.get(app, app)
    if not cmd:
        tts.speak("Which app would you like me to open?")
        return
    try:
        subprocess.Popen(cmd.split(), start_new_session=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tts.speak(response_hint or f"Opening {app}.")
    except FileNotFoundError:
        tts.speak(f"I couldn't find {app} on this system.")


@register("system_sleep")
def system_sleep(params: dict[str, Any], tts, response_hint: str = "") -> None:
    tts.speak("Going to sleep. Goodnight.")
    subprocess.run(["systemctl", "suspend"], check=False)


@register("system_shutdown")
def system_shutdown(params: dict[str, Any], tts, response_hint: str = "") -> None:
    tts.speak("Shutting down in 5 seconds. Goodbye!")
    import time  # noqa: PLC0415
    time.sleep(5)
    subprocess.run(["shutdown", "-h", "now"], check=False)


@register("system_restart")
def system_restart(params: dict[str, Any], tts, response_hint: str = "") -> None:
    tts.speak("Restarting in 5 seconds.")
    import time  # noqa: PLC0415
    time.sleep(5)
    subprocess.run(["reboot"], check=False)


@register("set_brightness")
def set_brightness(params: dict[str, Any], tts, response_hint: str = "") -> None:
    level = max(0, min(100, int(params.get("level", 50))))
    # Try xrandr (works on X11)
    if shutil.which("xrandr"):
        brightness = level / 100
        result = subprocess.run(
            ["xrandr", "--listmonitors"],
            capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            parts = line.split()
            if parts and parts[-1] and not parts[-1].startswith("+"):
                monitor = parts[-1]
                subprocess.run(
                    ["xrandr", "--output", monitor, "--brightness", str(brightness)],
                    check=False,
                )
    # Try brightnessctl (works on Wayland/backlight)
    elif shutil.which("brightnessctl"):
        subprocess.run(["brightnessctl", "set", f"{level}%"], check=False)
    else:
        tts.speak("I couldn't find a brightness control tool.")
        return
    tts.speak(response_hint or f"Brightness set to {level} percent.")


@register("desktop_notification")
def desktop_notification(params: dict[str, Any], tts, response_hint: str = "") -> None:
    title = params.get("title", "Muer Assistant")
    message = params.get("message", "").strip()
    if not message:
        tts.speak("What should the notification say?")
        return
    _notify(title, message)
    tts.speak(response_hint or f"Notification sent: {message}")


@register("announce")
def announce(params: dict[str, Any], tts, response_hint: str = "") -> None:
    message = params.get("message", "").strip()
    if not message:
        tts.speak("What would you like me to announce?")
        return
    _notify("Announcement", message, urgency="critical")
    tts.speak(message)


@register("get_clipboard")
def get_clipboard(params: dict[str, Any], tts, response_hint: str = "") -> None:
    try:
        result = subprocess.run(
            ["xclip", "-selection", "clipboard", "-o"],
            capture_output=True, text=True, timeout=3
        )
        content = result.stdout.strip()
        if content:
            tts.speak(f"Your clipboard contains: {content[:200]}")
        else:
            tts.speak("Your clipboard is empty.")
    except Exception:
        tts.speak("I couldn't read the clipboard.")


@register("bluetooth_list")
def bluetooth_list(params: dict[str, Any], tts, response_hint: str = "") -> None:
    try:
        result = subprocess.run(
            ["bluetoothctl", "devices"],
            capture_output=True, text=True, timeout=5
        )
        lines = [l.split("Device ")[-1] for l in result.stdout.splitlines() if "Device" in l]
        if lines:
            devices = [l.split(" ", 1)[-1] if " " in l else l for l in lines]
            tts.speak(f"Paired Bluetooth devices: {', '.join(devices)}.")
        else:
            tts.speak("No paired Bluetooth devices found.")
    except Exception:
        tts.speak("I couldn't list Bluetooth devices.")


@register("bluetooth_connect")
def bluetooth_connect(params: dict[str, Any], tts, response_hint: str = "") -> None:
    device = params.get("device", "").strip()
    if not device:
        tts.speak("Which device should I connect?")
        return
    try:
        # Try to find device MAC from name
        result = subprocess.run(
            ["bluetoothctl", "devices"],
            capture_output=True, text=True, timeout=5
        )
        mac = None
        for line in result.stdout.splitlines():
            if device.lower() in line.lower():
                parts = line.split("Device ")
                if len(parts) > 1:
                    mac = parts[1].split(" ")[0]
                    break
        if mac:
            subprocess.run(["bluetoothctl", "connect", mac], check=False, timeout=10)
            tts.speak(f"Connecting to {device}.")
        else:
            tts.speak(f"I couldn't find a device named {device}.")
    except Exception as e:
        log.error(f"Bluetooth connect failed: {e}")
        tts.speak("Bluetooth connection failed.")


@register("do_not_disturb")
def do_not_disturb(params: dict[str, Any], tts, response_hint: str = "") -> None:
    enabled = params.get("enabled", True)
    from assistant.main import VoiceAssistant  # noqa: PLC0415
    VoiceAssistant.DND = bool(enabled)
    state = "on" if enabled else "off"
    tts.speak(f"Do not disturb {state}.")
    log.info(f"DND mode: {state}")
