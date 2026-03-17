# Muer Voice Assistant — Deployment Guide

A voice assistant for Ubuntu Linux, similar to Alexa or Google Home.

## Features

| Feature | Command Example |
|---|---|
| Wake word | "Hey Muer" |
| Play music | "Play some jazz" / "Play Daft Punk" |
| Stop music | "Stop the music" |
| Volume control | "Turn it up" / "Volume down" / "Set volume to 50" |
| Timers | "Set a 5 minute timer" |
| Weather | "What's the weather in Chicago?" |
| Time & date | "What time is it?" / "What's today's date?" |
| General Q&A | "Who invented the telephone?" |

## Requirements

- Ubuntu 18.04 / 20.04 / 22.04 / 24.04
- Python 3.8+
- Microphone and speakers
- `ANTHROPIC_API_KEY` (for smart NLP + Q&A)

---

## Option 1: System Install (Recommended)

```bash
# Clone the repo
git clone https://github.com/johnny4091/muer /opt/muer-src
cd /opt/muer-src

# Run installer (requires sudo)
sudo bash deploy/install.sh

# Edit config
nano /opt/muer-assistant/.env

# Start service
sudo systemctl start muer-assistant@$USER
sudo systemctl status muer-assistant@$USER
```

### Service management
```bash
# Start / stop / restart
sudo systemctl start muer-assistant@$USER
sudo systemctl stop muer-assistant@$USER
sudo systemctl restart muer-assistant@$USER

# Enable on boot (already done by installer)
sudo systemctl enable muer-assistant@$USER

# View live logs
journalctl -u muer-assistant@$USER -f
```

---

## Option 2: Manual / Development

```bash
cd /path/to/muer

# Create virtualenv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r assistant/requirements.txt

# Copy and edit config
cp .env.sample .env
nano .env   # Fill in ANTHROPIC_API_KEY

# Run in text mode (no microphone needed for testing)
python -m assistant.main --text

# Run with wake word
python -m assistant.main

# Run without wake word (always listening)
python -m assistant.main --no-wake
```

---

## Option 3: Docker

```bash
# Build
docker build -f deploy/Dockerfile.assistant -t muer-assistant .

# Run with audio passthrough (PulseAudio)
docker run \
  --device /dev/snd \
  -e PULSE_SERVER=unix:${XDG_RUNTIME_DIR}/pulse/native \
  -v ${XDG_RUNTIME_DIR}/pulse/native:${XDG_RUNTIME_DIR}/pulse/native \
  -e ANTHROPIC_API_KEY=your_key_here \
  -e OPENWEATHERMAP_API_KEY=your_key_here \
  muer-assistant
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Claude API key for smart NLP |
| `ASSISTANT_NAME` | No | `Muer` | Assistant's name |
| `WAKE_WORD` | No | `hey_jarvis` | Wake word model name |
| `WAKE_WORD_THRESHOLD` | No | `0.5` | Detection sensitivity (0-1) |
| `STT_MODEL` | No | `base` | Whisper model: tiny/base/small/medium |
| `STT_DEVICE` | No | `cpu` | `cpu` or `cuda` |
| `AUDIO_DEVICE_INDEX` | No | _(default)_ | Microphone device index |
| `OPENWEATHERMAP_API_KEY` | No | — | For weather feature |
| `DEFAULT_WEATHER_CITY` | No | `New York` | Default city for weather |
| `TTS_RATE` | No | `175` | Speech rate (words/min) |
| `LOG_LEVEL` | No | `INFO` | `DEBUG`/`INFO`/`WARNING` |

---

## Troubleshooting

**No audio input detected:**
```bash
# List audio devices
python3 -c "from assistant.utils.audio_utils import list_input_devices; print(list_input_devices())"
# Set AUDIO_DEVICE_INDEX in .env to the correct index
```

**mpv/yt-dlp not found:**
```bash
sudo apt install mpv
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod +x /usr/local/bin/yt-dlp
```

**Permission denied on microphone:**
```bash
sudo usermod -aG audio $USER
# Log out and back in
```

**Wake word not triggering:**
- Speak clearly and at a normal volume
- Lower `WAKE_WORD_THRESHOLD` in `.env` (e.g., `0.3`)
- Run with `--no-wake` flag for always-listening mode
