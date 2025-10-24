// Speech-to-Text handler using OpenAI Whisper API
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
    name: 'stt-handler',

    async handleVoiceMessage(message) {
        let processingMsg;
        let tempFile;

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

            console.log('🔊 Transcribing audio...');

            // Create a read stream and transcribe
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFile),
                model: 'whisper-1',
            });

            console.log('✅ Transcription complete');

            // Send transcript
            if (transcription.text && transcription.text.trim()) {
                await processingMsg.edit(`📝 **Transcript:** ${transcription.text}`);
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
            // Always clean up temp file
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
        }
    },

    getErrorMessage(error) {
        if (error.status === 401 || error.message?.includes('API key')) {
            return 'Invalid OpenAI API key. Please check your configuration.';
        }
        if (error.status === 429) {
            return 'OpenAI API rate limit exceeded. Please try again later.';
        }
        if (error.status === 413) {
            return 'Audio file too large (max 25MB).';
        }
        if (error.message?.includes('download')) {
            return 'Failed to download the voice message.';
        }
        return 'Failed to process the voice message. Please try again later.';
    }
};
