#!/usr/bin/env bash
# =============================================================================
# Muer Voice Assistant — Docker helper
#
# Usage:
#   bash deploy/docker-run.sh build          # build image
#   bash deploy/docker-run.sh start          # build + run with audio
#   bash deploy/docker-run.sh start --text   # run in text-only mode
#   bash deploy/docker-run.sh stop
#   bash deploy/docker-run.sh logs
#   bash deploy/docker-run.sh shell          # bash inside container
#   bash deploy/docker-run.sh update         # rebuild + restart
# =============================================================================

set -euo pipefail

IMAGE="muer-assistant"
CONTAINER="muer"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
die()     { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

ENV_FILE="$REPO_DIR/.env"
TEXT_MODE=false

# ── Helpers ───────────────────────────────────────────────────────────────────
build() {
    info "Building Docker image: $IMAGE"
    docker build \
        -f "$REPO_DIR/deploy/Dockerfile.assistant" \
        -t "$IMAGE" \
        "$REPO_DIR"
    success "Image built: $IMAGE"
}

_env_flags() {
    # Pass all MUER-relevant vars from .env as -e flags
    local flags=()
    if [[ -f "$ENV_FILE" ]]; then
        while IFS= read -r line; do
            # Skip comments and blank lines
            [[ "$line" =~ ^# ]] && continue
            [[ -z "$line" ]]    && continue
            # Skip web-app vars (Supabase, session)
            [[ "$line" =~ ^(SUPABASE|SESSION|DATABASE) ]] && continue
            key="${line%%=*}"
            flags+=(-e "$key=${line#*=}")
        done < "$ENV_FILE"
    fi
    echo "${flags[@]}"
}

start() {
    # Stop existing container if running
    docker rm -f "$CONTAINER" 2>/dev/null || true

    CMD_ARGS="python3 -m assistant.main"
    [[ $TEXT_MODE == true ]] && CMD_ARGS="$CMD_ARGS --text" || CMD_ARGS="$CMD_ARGS --no-wake"

    AUDIO_FLAGS=()
    if [[ $TEXT_MODE == false ]]; then
        # Pass PulseAudio socket through (Linux desktop)
        if [[ -d "${XDG_RUNTIME_DIR:-/run/user/1000}/pulse" ]]; then
            PULSE_SOCK="${XDG_RUNTIME_DIR:-/run/user/1000}/pulse/native"
            AUDIO_FLAGS+=(
                --device /dev/snd
                -e PULSE_SERVER="unix:$PULSE_SOCK"
                -v "$PULSE_SOCK:$PULSE_SOCK"
            )
        else
            warn "PulseAudio socket not found — audio may not work."
            warn "To run without audio: $0 start --text"
        fi
    fi

    # shellcheck disable=SC2046
    docker run -d \
        --name "$CONTAINER" \
        --restart unless-stopped \
        "${AUDIO_FLAGS[@]}" \
        $(_env_flags) \
        "$IMAGE" \
        $CMD_ARGS

    success "Container started: $CONTAINER"
    info "Logs: bash deploy/docker-run.sh logs"
}

# ── Commands ──────────────────────────────────────────────────────────────────
CMD="${1:-help}"
shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --text) TEXT_MODE=true; shift ;;
        *)      break ;;
    esac
done

case "$CMD" in
    build)
        build ;;

    start)
        [[ "$(docker images -q $IMAGE 2>/dev/null)" == "" ]] && build
        start ;;

    stop)
        docker rm -f "$CONTAINER" 2>/dev/null && success "Stopped." || warn "Not running." ;;

    restart)
        docker restart "$CONTAINER" 2>/dev/null && success "Restarted." || { build; start; } ;;

    update)
        info "Rebuilding with latest code..."
        build
        docker rm -f "$CONTAINER" 2>/dev/null || true
        start
        success "Updated and restarted." ;;

    logs)
        docker logs -f "$CONTAINER" ;;

    shell)
        docker exec -it "$CONTAINER" bash ;;

    status)
        docker ps --filter "name=$CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" ;;

    *)
        echo ""
        echo -e "${BOLD}Muer Voice Assistant — Docker helper${RESET}"
        echo ""
        echo "  bash deploy/docker-run.sh build            Build image"
        echo "  bash deploy/docker-run.sh start            Build (if needed) + start"
        echo "  bash deploy/docker-run.sh start --text     Start in text-only mode"
        echo "  bash deploy/docker-run.sh stop             Stop container"
        echo "  bash deploy/docker-run.sh restart          Restart container"
        echo "  bash deploy/docker-run.sh update           Rebuild + restart"
        echo "  bash deploy/docker-run.sh logs             Tail logs"
        echo "  bash deploy/docker-run.sh shell            Open bash in container"
        echo "  bash deploy/docker-run.sh status           Show container status"
        echo ""
        ;;
esac
