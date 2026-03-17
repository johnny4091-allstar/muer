# Muer Voice Assistant — Deployment Guide

Ubuntu voice assistant (Alexa/Google Home style) with 30+ built-in skills.

---

## Quick Start

### Option A — System Install (recommended)

```bash
git clone <repo-url> ~/muer && cd ~/muer
sudo bash deploy/install.sh --key "sk-ant-YOUR_KEY_HERE"
```

The installer configures systemd and starts the service automatically.

**Headless / cloud server (no microphone):**
```bash
sudo bash deploy/install.sh --headless --key "sk-ant-YOUR_KEY_HERE"
```

**One-liner (no git clone needed):**
```bash
curl -fsSL https://raw.githubusercontent.com/johnny4091-allstar/muer/claude/voice-assistant-ubuntu-Nn1c7/deploy/bootstrap.sh \
  | sudo bash -s -- --headless --key "sk-ant-YOUR_KEY_HERE"
```

> Use `--key` to pass your Anthropic API key. Do not use `ANTHROPIC_API_KEY=... sudo bash` — `sudo` strips environment variables.

---

### Option B — Docker

```bash
git clone <repo-url> ~/muer && cd ~/muer
cp .env.sample .env && nano .env       # add ANTHROPIC_API_KEY

bash deploy/docker-run.sh start        # with audio passthrough
bash deploy/docker-run.sh start --text # text-only (no mic needed)
```

---

### Option C — Dev / manual

```bash
cd ~/muer
python3 -m venv venv && source venv/bin/activate
pip install -r assistant/requirements.txt
cp .env.sample .env && nano .env

python -m assistant.main --text        # text mode (test without mic)
python -m assistant.main --no-wake     # always listening
python -m assistant.main               # wake-word mode
```

---

## Scripts

| Script | What it does |
|---|---|
| `deploy/install.sh` | Full install with interactive config wizard |
| `deploy/update.sh` | Pull latest code + restart service |
| `deploy/uninstall.sh` | Remove everything |
| `deploy/docker-run.sh` | Build/run/stop/update via Docker |

```bash
# Install
sudo bash deploy/install.sh [--headless] [--quiet] [--user USER] [--dir DIR]

# Update
sudo bash deploy/update.sh

# Uninstall
sudo bash deploy/uninstall.sh           # keep system packages
sudo bash deploy/uninstall.sh --purge   # also remove mpv, ffmpeg, etc.

# Docker
bash deploy/docker-run.sh start         # start
bash deploy/docker-run.sh stop          # stop
bash deploy/docker-run.sh update        # rebuild + restart
bash deploy/docker-run.sh logs          # tail logs
bash deploy/docker-run.sh shell         # bash inside container
```

---

## Service Management

```bash
# Start / stop / restart
sudo systemctl start   muer-assistant@$USER
sudo systemctl stop    muer-assistant@$USER
sudo systemctl restart muer-assistant@$USER

# Logs (live)
journalctl -u muer-assistant@$USER -f

# Auto-updater timer
sudo systemctl start  muer-updater@$USER.timer
sudo systemctl status muer-updater@$USER.timer
```

---

## Features

| Skill | Example commands |
|---|---|
| **Music** | "Play some jazz" / "Play Daft Punk" / "Stop the music" |
| **Volume** | "Turn it up" / "Set volume to 70" / "Mute" |
| **Timers** | "Set a 10 minute timer" / "Cancel the timer" |
| **Alarms** | "Set an alarm for 7:30 AM" / "Cancel my alarm" / "Snooze" |
| **Reminders** | "Remind me to call John at 3pm" |
| **Lists** | "Add milk to my shopping list" / "Read my to-do list" |
| **Notes** | "Take a note: buy flowers" / "Read my notes" |
| **Weather** | "What's the weather in Chicago?" |
| **Time / Date** | "What time is it?" / "What's today's date?" |
| **News** | "What's the news?" / "Tech headlines" |
| **Flash briefing** | "Give me my briefing" (time + weather + news) |
| **Wikipedia** | "Who is Marie Curie?" / "What is a black hole?" |
| **Math** | "What's 15% of 89?" / "Convert 5 miles to km" |
| **Jokes** | "Tell me a joke" / "Give me a fun fact" |
| **Coin / Dice** | "Flip a coin" / "Roll a dice" |
| **Translation** | "How do you say hello in Spanish?" |
| **Spelling** | "How do you spell pneumonia?" |
| **Definitions** | "Define serendipity" |
| **Routines** | "Good morning" / "Good night" |
| **Ambient sounds** | "Play rain sounds" / "Play white noise" / "Play ocean" |
| **Radio** | "Play NPR" / "Play BBC World" / "Play jazz radio" |
| **Stopwatch** | "Start stopwatch" / "Lap" / "Stop stopwatch" |
| **Sports** | "NBA scores" / "What's the Lakers score?" |
| **Open apps** | "Open Firefox" / "Open terminal" |
| **Brightness** | "Set brightness to 50%" |
| **Bluetooth** | "List Bluetooth devices" / "Connect to my headphones" |
| **Notifications** | "Send a notification: dinner is ready" |
| **Smart home** | "Turn on the living room lights" / "Set thermostat to 72" |
| **System** | "Sleep the computer" / "Shutdown" |
| **Do Not Disturb** | "Do not disturb" / "Turn off do not disturb" |
| **Q&A** | Any other question — answered by Claude |

---

## Environment Variables

### Required
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key — get at https://console.anthropic.com |

### Voice / Audio
| Variable | Default | Description |
|---|---|---|
| `ASSISTANT_NAME` | `Muer` | Assistant's spoken name |
| `WAKE_WORD` | `hey_jarvis` | Wake word model |
| `WAKE_WORD_THRESHOLD` | `0.5` | Detection sensitivity (0–1, lower = more sensitive) |
| `STT_MODEL` | `base` | Whisper model: `tiny` / `base` / `small` / `medium` |
| `STT_DEVICE` | `cpu` | `cpu` or `cuda` |
| `AUDIO_DEVICE_INDEX` | _(system default)_ | Microphone device index |
| `TTS_RATE` | `175` | Speech rate (words/min) |
| `FOLLOW_UP_SECONDS` | `5` | Seconds to keep listening after a response |

### Skills
| Variable | Description |
|---|---|
| `OPENWEATHERMAP_API_KEY` | Weather — https://openweathermap.org/api (free) |
| `DEFAULT_WEATHER_CITY` | Default city for weather queries |
| `NEWS_API_KEY` | News — https://newsapi.org (free tier); BBC RSS used if blank |
| `HA_URL` | Home Assistant URL, e.g. `http://192.168.1.10:8123` |
| `HA_TOKEN` | Home Assistant long-lived access token |
| `DATA_DIR` | Where to store alarms/lists/notes (default: `~/.config/muer-assistant`) |

### Auto-updater
| Variable | Default | Description |
|---|---|---|
| `AUTO_UPDATE_ENABLED` | `true` | Poll git every N seconds for updates |
| `AUTO_UPDATE_INTERVAL` | `300` | Seconds between git checks |
| `GIT_BRANCH` | `claude/voice-assistant-ubuntu-Nn1c7` | Branch to track |
| `WEBHOOK_SECRET` | _(blank)_ | GitHub webhook secret — enables instant push-triggered updates |
| `WEBHOOK_PORT` | `9000` | Webhook listener port |

### GitHub Webhook Setup (instant updates on push)

1. Add to `.env`:
   ```
   WEBHOOK_SECRET=pick_a_secret
   WEBHOOK_PORT=9000
   ```
2. In GitHub: **Settings → Webhooks → Add webhook**
   - URL: `http://YOUR_SERVER_IP:9000/webhook`
   - Secret: same as `WEBHOOK_SECRET`
   - Events: **Just the push event**

Every `git push` will immediately update all servers.

---

## Troubleshooting

**No microphone detected:**
```bash
# List audio devices
cd /opt/muer-assistant
venv/bin/python3 -c "from assistant.utils.audio_utils import list_input_devices; print(list_input_devices())"
# Then set AUDIO_DEVICE_INDEX in .env
```

**Permission denied on microphone:**
```bash
sudo usermod -aG audio $USER
# Log out and back in
```

**Wake word never triggers:**
```bash
# Lower the threshold or skip wake word entirely
WAKE_WORD_THRESHOLD=0.3        # in .env
# Or run with: --no-wake flag
```

**Test without a microphone:**
```bash
sudo -u $USER /opt/muer-assistant/venv/bin/python -m assistant.main --text
```

**mpv / yt-dlp not found:**
```bash
sudo apt install mpv
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp
```

**Check logs:**
```bash
journalctl -u muer-assistant@$USER -f --since "5 min ago"
```
