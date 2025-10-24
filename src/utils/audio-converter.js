// Audio Converter Utility
// Converts Discord audio formats to PCM i16 for Scripty STT

const fs = require('fs');
const prism = require('prism-media');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

class AudioConverter {
    /**
     * Convert audio file to PCM i16 format
     * @param {string} inputPath - Path to input audio file
     * @param {string} outputPath - Path to output PCM file (optional)
     * @returns {Promise<Buffer>} - PCM i16 audio data
     */
    static async convertToPCM(inputPath, outputPath = null) {
        return new Promise((resolve, reject) => {
            const chunks = [];

            // Create FFmpeg transcoder
            const transcoder = new prism.FFmpeg({
                args: [
                    '-i', inputPath,
                    '-f', 's16le',        // PCM signed 16-bit little-endian
                    '-ar', '48000',       // 48kHz sample rate (Discord's native rate)
                    '-ac', '2',           // Stereo (2 channels) - can be changed to 1 for mono
                    '-acodec', 'pcm_s16le'
                ]
            });

            transcoder.on('data', (chunk) => {
                chunks.push(chunk);
            });

            transcoder.on('end', () => {
                const buffer = Buffer.concat(chunks);

                // Optionally save to file
                if (outputPath) {
                    fs.writeFileSync(outputPath, buffer);
                }

                resolve(buffer);
            });

            transcoder.on('error', (error) => {
                console.error('FFmpeg error:', error);
                reject(error);
            });

            // Read input file and pipe to transcoder
            const readStream = fs.createReadStream(inputPath);
            readStream.pipe(transcoder);

            readStream.on('error', (error) => {
                console.error('Read stream error:', error);
                reject(error);
            });
        });
    }

    /**
     * Convert Discord .ogg (Opus) file to PCM i16
     * @param {string} inputPath - Path to Discord .ogg file
     * @returns {Promise<Object>} - { data: Buffer, sampleRate: number, channels: number }
     */
    static async convertDiscordOpusToPCM(inputPath) {
        const pcmData = await this.convertToPCM(inputPath);

        return {
            data: pcmData,
            sampleRate: 48000,  // Discord uses 48kHz
            channels: 2         // Stereo
        };
    }

    /**
     * Convert to mono from stereo
     * @param {Buffer} pcmData - Stereo PCM i16 data
     * @returns {Buffer} - Mono PCM i16 data
     */
    static convertToMono(pcmData) {
        const stereoSamples = new Int16Array(
            pcmData.buffer,
            pcmData.byteOffset,
            pcmData.length / 2
        );

        const monoSamples = new Int16Array(stereoSamples.length / 2);

        for (let i = 0; i < monoSamples.length; i++) {
            // Average left and right channels
            const left = stereoSamples[i * 2];
            const right = stereoSamples[i * 2 + 1];
            monoSamples[i] = Math.floor((left + right) / 2);
        }

        return Buffer.from(monoSamples.buffer);
    }

    /**
     * Get audio file info
     * @param {string} filePath - Path to audio file
     * @returns {Promise<Object>} - Audio file information
     */
    static async getAudioInfo(filePath) {
        return new Promise((resolve, reject) => {
            const ffprobe = new prism.FFmpeg({
                args: [
                    '-i', filePath,
                    '-show_format',
                    '-show_streams',
                    '-v', 'quiet',
                    '-of', 'json'
                ]
            });

            const chunks = [];

            ffprobe.on('data', (chunk) => {
                chunks.push(chunk);
            });

            ffprobe.on('end', () => {
                try {
                    const output = Buffer.concat(chunks).toString();
                    const info = JSON.parse(output);
                    resolve(info);
                } catch (error) {
                    reject(error);
                }
            });

            ffprobe.on('error', reject);
        });
    }
}

module.exports = AudioConverter;
