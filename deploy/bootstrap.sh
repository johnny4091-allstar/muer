#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Bootstrap
# Run this on any fresh Ubuntu server to install everything.
#
# One-liner (headless server):
#   curl -fsSL https://raw.githubusercontent.com/johnny4091-allstar/muer/claude/voice-assistant-ubuntu-Nn1c7/deploy/bootstrap.sh \
#     | sudo bash -s -- --headless --key "sk-ant-YOUR_KEY_HERE"
#
# Note: use --key to pass your Anthropic API key. Setting ANTHROPIC_API_KEY=...
# before sudo does NOT work — sudo strips environment variables by default.
# =============================================================================

set -euo pipefail

REPO="https://github.com/johnny4091-allstar/muer"
BRANCH="claude/voice-assistant-ubuntu-Nn1c7"
CLONE_DIR="/opt/muer-src"
ARGS=("$@")

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
die()     { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && die "Run with sudo:  sudo bash deploy/bootstrap.sh"

echo -e "\n${BOLD}${CYAN}Muer Voice Assistant — Bootstrap${RESET}\n"

# ── Ensure git is installed ───────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
    info "Installing git..."
    apt-get update -qq && apt-get install -y git -qq
fi

# ── Clone or update repo ──────────────────────────────────────────────────────
if [[ -d "$CLONE_DIR/.git" ]]; then
    info "Updating existing repo at $CLONE_DIR..."
    git -C "$CLONE_DIR" fetch origin "$BRANCH" --quiet
    git -C "$CLONE_DIR" checkout "$BRANCH" --quiet
    git -C "$CLONE_DIR" pull origin "$BRANCH" --quiet
    success "Repo updated."
else
    info "Cloning $REPO (branch: $BRANCH)..."
    git clone --branch "$BRANCH" --depth 1 "$REPO" "$CLONE_DIR"
    success "Repo cloned to $CLONE_DIR"
fi

# ── Run installer ─────────────────────────────────────────────────────────────
info "Running installer..."

# When piped through curl, stdin is not a terminal — force --quiet so read
# prompts don't hang.
EXTRA_ARGS=()
if [[ ! -t 0 ]]; then
    warn "Non-interactive mode detected (piped from curl) — using --quiet."
    EXTRA_ARGS+=(--quiet)
fi

# Forward ANTHROPIC_API_KEY env var as --key if not already in ARGS
if [[ -n "${ANTHROPIC_API_KEY:-}" ]] && ! printf '%s\n' "${ARGS[@]}" | grep -q -- '--key'; then
    EXTRA_ARGS+=(--key "$ANTHROPIC_API_KEY")
fi

bash "$CLONE_DIR/deploy/install.sh" "${ARGS[@]}" "${EXTRA_ARGS[@]}"
