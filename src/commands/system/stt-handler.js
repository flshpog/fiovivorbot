// Speech-to-Text handler using Scripty STT service (local Whisper)
const fs = require('fs');
const path = require('path');
const os = require('os');
const ScriptySTTClient = require('../../utils/stt-client');
const AudioConverter = require('../../utils/audio-converter');

// STT service configuration
const STT_HOST = process.env.STT_HOST || '127.0.0.1';
const STT_PORT = parseInt(process.env.STT_PORT || '7269');

module.exports = {
    name: 'stt-handler',

    async handleVoiceMessage(message) {
        let processingMsg;
        let tempFile;
        let pcmFile;
        let sttClient;

        try {
            // Send initial processing message
            processingMsg = await message.reply('🎤 Processing speech to text...');

            // Get the voice message attachment
            const attachment = message.attachments.first();
            if (!attachment) {
                await processingMsg.edit('❌ No voice message found.');
                return;
            }

            console.log('📥 Downloading audio from:', attachment.url);

            // Download the audio file
            const response = await fetch(attachment.url);
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            console.log(`✅ Downloaded ${audioBuffer.length} bytes`);

            // Save to temporary file with .ogg extension
            tempFile = path.join(os.tmpdir(), `discord-voice-${Date.now()}.ogg`);
            fs.writeFileSync(tempFile, audioBuffer);

            console.log('🔄 Converting audio to PCM format...');

            // Convert Discord audio (Opus in OGG) to PCM i16
            const { data: pcmData, sampleRate, channels } = await AudioConverter.convertDiscordOpusToPCM(tempFile);

            console.log(`✅ Converted to PCM: ${pcmData.length} bytes, ${sampleRate}Hz, ${channels} channels`);

            console.log('🔊 Connecting to STT service...');

            // Connect to STT service
            sttClient = new ScriptySTTClient(STT_HOST, STT_PORT);
            await sttClient.connect();

            console.log('🔊 Transcribing audio...');

            // Transcribe the audio
            const transcription = await sttClient.transcribe(
                pcmData,
                sampleRate,
                channels,
                'en',  // Language
                true   // Denoise
            );

            console.log('✅ Transcription complete');

            // Send transcript
            if (transcription && transcription.trim()) {
                await processingMsg.edit(`📝 **Transcript:** ${transcription}`);
            } else {
                await processingMsg.edit('❌ Could not transcribe the audio. The message might be too short or unclear.');
            }

        } catch (error) {
            console.error('❌ STT Error:', error);

            // Send user-friendly error message
            const errorMsg = this.getErrorMessage(error);

            if (processingMsg) {
                await processingMsg.edit(`❌ ${errorMsg}`);
            } else {
                await message.reply(`❌ ${errorMsg}`);
            }
        } finally {
            // Clean up STT client connection
            if (sttClient) {
                try {
                    sttClient.close();
                } catch (closeError) {
                    console.error('Error closing STT client:', closeError);
                }
            }

            // Always clean up temp files
            if (tempFile) {
                try {
                    if (fs.existsSync(tempFile)) {
                        fs.unlinkSync(tempFile);
                        console.log('🗑️ Cleaned up temp file');
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up temp file:', cleanupError);
                }
            }

            if (pcmFile) {
                try {
                    if (fs.existsSync(pcmFile)) {
                        fs.unlinkSync(pcmFile);
                        console.log('🗑️ Cleaned up PCM file');
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up PCM file:', cleanupError);
                }
            }
        }
    },

    getErrorMessage(error) {
        if (error.message?.includes('ECONNREFUSED')) {
            return 'Cannot connect to STT service. Make sure it is running on ' + STT_HOST + ':' + STT_PORT;
        }
        if (error.message?.includes('ETIMEDOUT')) {
            return 'Connection to STT service timed out. Please try again.';
        }
        if (error.message?.includes('download')) {
            return 'Failed to download the voice message.';
        }
        if (error.message?.includes('FFmpeg')) {
            return 'Audio conversion failed. Make sure FFmpeg is installed.';
        }
        if (error.message?.includes('Invalid magic bytes')) {
            return 'Invalid response from STT service. Please check service configuration.';
        }
        return 'Failed to process the voice message. Please try again later.';
    }
};
