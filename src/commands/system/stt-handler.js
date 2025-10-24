// Speech-to-Text handler using OpenAI Whisper API
const OpenAI = require('openai');
const { toFile } = require('openai');

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Add your API key to .env file
});

module.exports = {
    name: 'stt-handler',
    
    async handleVoiceMessage(message) {
        try {
            // Send initial processing message
            const processingMsg = await message.reply('🎤 Processing speech to text...');

            // Get the voice message attachment
            const attachment = message.attachments.first();
            if (!attachment) {
                await processingMsg.edit('❌ No voice message found.');
                return;
            }

            // Download the audio file
            const audioBuffer = await this.downloadAudio(attachment.url);

            // Transcribe using OpenAI Whisper
            const transcript = await this.transcribeAudio(audioBuffer, attachment.name);

            if (transcript && transcript.trim()) {
                await processingMsg.edit(`📝 **Transcript:** ${transcript}`);
            } else {
                await processingMsg.edit('❌ Could not transcribe the audio. The message might be too short or unclear.');
            }

        } catch (error) {
            console.error('Error processing voice message:', error);
            try {
                await message.reply('❌ Failed to process the voice message. Please try again later.');
            } catch (replyError) {
                console.error('Error sending STT error message:', replyError);
            }
        }
    },

    async downloadAudio(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
            }
            
            // Get the audio data as an ArrayBuffer, then convert to Buffer
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('Error downloading audio:', error);
            throw new Error('Failed to download audio file');
        }
    },

    async transcribeAudio(audioBuffer, filename) {
        try {
            // Convert to File using OpenAI's toFile helper
            const audioFile = await toFile(audioBuffer, filename || 'voice-message.ogg', {
                type: 'audio/ogg'
            });

            // Use OpenAI Whisper to transcribe
            const transcription = await client.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
                language: "en", // You can change this or remove it for auto-detection
                response_format: "text"
            });

            return transcription;

        } catch (error) {
            console.error('Error transcribing audio with Whisper:', error);

            // Handle specific OpenAI errors
            if (error.status === 401) {
                throw new Error('Invalid OpenAI API key');
            } else if (error.status === 429) {
                throw new Error('OpenAI API rate limit exceeded');
            } else if (error.status === 413) {
                throw new Error('Audio file too large (max 25MB)');
            }

            throw new Error('Failed to transcribe audio');
        }
    }
};