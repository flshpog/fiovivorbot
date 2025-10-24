# Speech-to-Text Setup Guide

Your bot now uses the **Scripty STT service** - a local, high-performance speech-to-text solution powered by OpenAI's Whisper model. This is much faster and more cost-effective than using the OpenAI API.

## Architecture Overview

The implementation consists of three main components:

1. **STT Client** (`src/utils/stt-client.js`) - Handles TCP communication with the Scripty service using MessagePack protocol
2. **Audio Converter** (`src/utils/audio-converter.js`) - Converts Discord's Opus audio to PCM i16 format
3. **STT Handler** (`src/commands/system/stt-handler.js`) - Main handler that processes Discord voice messages

## Prerequisites

### 1. Install FFmpeg

The audio converter requires FFmpeg to be installed on your system:

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt-get install ffmpeg  # Debian/Ubuntu
sudo yum install ffmpeg      # CentOS/RHEL
```

**macOS:**
```bash
brew install ffmpeg
```

### 2. Set up Scripty STT Service

The STT service is located in: `C:\Users\cash\Downloads\stt-service-master\stt-service`

#### Download Required Models

1. **Whisper Model:**
   - Go to https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md
   - Download `ggml-base.bin` (or `ggml-base.en.bin` for English-only)
   - Place in: `/usr/share/whisper-models/` (Linux) or a custom directory

2. **VAD Model:**
   - Download from: https://huggingface.co/ggml-org/whisper-vad/blob/main/ggml-silero-v5.1.2.bin
   - Place in the same directory as the Whisper model

#### Build the STT Service

```bash
cd C:\Users\cash\Downloads\stt-service-master\stt-service

# Build with CPU optimization (recommended for Ryzen CPUs with AVX512)
RUSTFLAGS="-Ctarget-cpu=native" cargo build --release

# Or with GPU support (if you have compatible hardware)
cargo build --release --features opencl
```

#### Configure the Service

1. Copy the example config:
```bash
cp config.example.toml config.toml
```

2. Edit `config.toml` to set your model paths and max concurrency:
```toml
[models]
whisper_model_path = "/path/to/ggml-base.bin"
vad_model_path = "/path/to/ggml-silero-v5.1.2.bin"

[usage]
max_concurrency = 4  # Adjust based on your CPU
```

#### Run the Service

**Option 1: Direct execution (for testing)**
```bash
./target/release/scripty_stt_service --config config.toml
```

**Option 2: Systemd service (Linux, recommended for production)**
```bash
# Copy binary
sudo cp target/release/scripty_stt_service /usr/local/bin/

# Copy config
sudo mkdir -p /etc/scripty-stt-service
sudo cp config.toml /etc/scripty-stt-service/

# Install systemd service
sudo cp util/scripty-stt-service.service /etc/systemd/system/
sudo cp util/scripty-stt-service.socket /etc/systemd/system/

# Start the service
sudo systemctl enable --now scripty-stt-service.socket
```

**Option 3: Windows (run in background)**
```bash
# Run in a separate terminal/PowerShell window
cd C:\Users\cash\Downloads\stt-service-master\stt-service
.\target\release\scripty_stt_service.exe --config config.toml
```

### 3. Configure Your Discord Bot

Add these environment variables to your `.env` file (or set them in your environment):

```env
# STT Service Configuration (optional - defaults shown)
STT_HOST=127.0.0.1
STT_PORT=7269
```

## Testing

### Test the STT Service

Use the included test binary to verify your STT setup:

```bash
cd C:\Users\cash\Downloads\stt-service-master\stt-service\stt_testing
cargo build --release
./target/release/stt_testing ../2830-3980-0043.wav
```

Expected output: `"Experience proves this."`

### Test with Discord

1. Start your Discord bot
2. Send a voice message in a channel the bot can see
3. The bot should automatically transcribe it and reply with the text

## How It Works

### Voice Message Flow

1. User sends a voice message in Discord
2. Bot detects the message (via message event handler - you need to wire this up)
3. STT handler downloads the .ogg file
4. Audio converter transforms Opus → PCM i16 (48kHz, stereo)
5. STT client:
   - Connects to Scripty service (port 7269)
   - Initializes a stream with UUID
   - Sends audio details (sample rate, channels, denoise settings)
   - Streams audio data in 20ms chunks
   - Requests finalization and transcription
   - Receives transcript result
6. Bot replies with the transcription

### Protocol Details

The implementation uses Scripty's custom MessagePack protocol:

```
Message Format:
[MAGIC_BYTES (4 bytes)] + [LENGTH (8 bytes, big-endian)] + [MSGPACK_DATA]
```

Message types:
- `InitializeStreaming` - Start a new transcription session
- `AudioDataDetails` - Specify audio format
- `AudioData` - Send audio chunks
- `FinalizeStreaming` - Request transcription
- `SttResult` - Receive transcription result

## Performance

- **Speed:** ~4x faster than real-time on Ryzen 7 7700X (with base model)
- **Latency:** Depends on audio length, typically 1-3 seconds for short messages
- **Concurrency:** Handles multiple transcriptions simultaneously
- **Cost:** Free! No API costs, just your compute resources

## Troubleshooting

### "Cannot connect to STT service"
- Make sure the service is running: `netstat -an | grep 7269`
- Check STT_HOST and STT_PORT are correct
- Verify firewall isn't blocking the connection

### "Audio conversion failed"
- Install FFmpeg (see Prerequisites)
- Verify FFmpeg is in your PATH: `ffmpeg -version`

### "Invalid magic bytes"
- The STT service might be using a different protocol version
- Check that you're using compatible versions

### Service crashes or hangs
- Check service logs
- Verify model files are correctly downloaded and not corrupted
- Try reducing `max_concurrency` in config.toml

## Wiring Up the Handler

You need to add code to detect voice messages. Here's an example for your message event handler:

```javascript
// In your message event handler (e.g., src/events/messageCreate.js)
const sttHandler = require('../commands/system/stt-handler');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // ... other message handling code ...

        // Check if message has voice/audio attachment
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();

            // Check if it's an audio file (Discord voice messages are .ogg)
            if (attachment.contentType?.startsWith('audio/')) {
                await sttHandler.handleVoiceMessage(message);
            }
        }
    }
};
```

## Additional Features You Could Add

- **Language detection** - Auto-detect or allow users to specify language
- **Translation** - Set `translate: true` in `FinalizeStreaming`
- **Selective transcription** - Only transcribe in certain channels
- **Persistent connection** - Keep a connection pool for better performance
- **Voice channel recording** - Record voice channels and transcribe (requires @discordjs/voice)

## Resources

- [Scripty STT GitHub](https://github.com/scripty-bot/scripty) (assumed source)
- [Whisper Models](https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md)
- [Discord.js Voice Guide](https://discordjs.guide/voice/)
