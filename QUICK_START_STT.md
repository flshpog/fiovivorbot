# Quick Start: Speech-to-Text

Get your bot transcribing Discord voice messages in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install FFmpeg

**Windows (PowerShell as Admin):**
```powershell
choco install ffmpeg
```

Or download from: https://ffmpeg.org/download.html

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 2. Set Up STT Service

```bash
# Navigate to the STT service directory
cd C:\Users\cash\Downloads\stt-service-master\stt-service

# Download Whisper model (base model, ~150MB)
mkdir models
cd models
curl -LO https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# Download VAD model (~3MB)
curl -LO https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin

cd ..

# Create config file
echo "[models]
whisper_model_path = \"models/ggml-base.bin\"
vad_model_path = \"models/ggml-silero-v5.1.2.bin\"

[usage]
max_concurrency = 2

[server]
host = \"127.0.0.1\"
port = 7269" > config.toml

# Build the service (one-time setup)
cargo build --release

# Start the service
.\target\release\scripty_stt_service.exe --config config.toml
```

**Keep this terminal open!** The service needs to be running for transcription to work.

### 3. Configure Your Bot

Copy `.env.example` to `.env` if you haven't already:
```bash
cp .env.example .env
```

The STT settings are already configured with defaults:
```env
STT_HOST=127.0.0.1
STT_PORT=7269
```

### 4. Test the Setup

```bash
# Test connection to STT service
node test-stt.js
```

Expected output:
```
✅ Successfully connected to STT service!
   Max utilization: 2
   Can overload: false
```

### 5. Start Your Bot

```bash
npm start
```

## 🎤 Usage

1. Go to any Discord channel your bot can see
2. Send a voice message (tap and hold microphone icon on mobile, or click it on desktop)
3. The bot will automatically:
   - Detect the voice message
   - Download it
   - Convert to PCM format
   - Send to STT service
   - Reply with the transcription

## 📊 What Happens Behind the Scenes

```
User sends voice message
         ↓
Bot detects audio attachment
         ↓
Downloads .ogg file (Opus audio)
         ↓
Converts to PCM i16 (48kHz, stereo) via FFmpeg
         ↓
Connects to STT service (TCP port 7269)
         ↓
Sends audio via MessagePack protocol
         ↓
Whisper AI transcribes audio
         ↓
Bot receives transcript
         ↓
Bot replies with text
```

## 🔧 Files Created

| File | Purpose |
|------|---------|
| `src/utils/stt-client.js` | TCP client for Scripty STT protocol |
| `src/utils/audio-converter.js` | Audio format conversion (Opus → PCM) |
| `src/commands/system/stt-handler.js` | Voice message handler (updated) |
| `test-stt.js` | Test script for verification |
| `STT_SETUP.md` | Complete setup documentation |

## 🐛 Troubleshooting

### "Cannot connect to STT service"
```bash
# Check if service is running
netstat -an | findstr 7269  # Windows
netstat -an | grep 7269     # Linux/Mac

# If not, start it
cd C:\Users\cash\Downloads\stt-service-master\stt-service
.\target\release\scripty_stt_service.exe --config config.toml
```

### "Audio conversion failed"
```bash
# Verify FFmpeg is installed
ffmpeg -version

# If not found, install it (see step 1)
```

### Service is slow
- Try the smaller `ggml-tiny.bin` model (faster, less accurate)
- Or the larger `ggml-small.bin` model (slower, more accurate)
- Adjust `max_concurrency` in `config.toml`

### Voice messages not detected
- Make sure `src/events/messageCreate.js` includes the STT handler
- Check bot has permission to read messages in the channel
- Verify message actually has audio attachment with `console.log`

## 📝 Next Steps

Want to enhance your STT setup?

1. **Add language selection** - Detect or let users specify language
2. **Set up auto-start** - Use PM2 or systemd to start STT service automatically
3. **Add voice channel recording** - Transcribe live voice chat with @discordjs/voice
4. **Create transcription logs** - Save transcripts to a database
5. **Add translation** - Set `translate: true` for auto-translation to English

See `STT_SETUP.md` for detailed documentation.

## 💰 Cost Comparison

| Service | Cost | Speed | Privacy |
|---------|------|-------|---------|
| **Scripty STT (Local)** | FREE! | 4x faster than real-time | Fully private |
| OpenAI Whisper API | $0.006/min | ~Real-time | Sent to OpenAI |
| Google Speech-to-Text | $0.006-0.024/min | Fast | Sent to Google |

Running locally = No API costs, better privacy, faster transcription!

## 🆘 Need Help?

1. Check `STT_SETUP.md` for detailed documentation
2. Run `node test-stt.js` to diagnose issues
3. Check STT service logs for errors
4. Verify all dependencies are installed

---

**That's it!** Your bot is now ready to transcribe voice messages. 🎉
