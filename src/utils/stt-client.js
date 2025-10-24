// Scripty STT TCP Client
// This module handles communication with the Scripty STT service using the MessagePack protocol

const net = require('net');
const msgpack = require('msgpack-lite');
const { v4: uuidv4 } = require('uuid');

// Magic bytes for the Scripty protocol (must match scripty_common::MAGIC_BYTES)
const MAGIC_BYTES = Buffer.from([0x73, 0x63, 0x72, 0x69]); // "scri"

class ScriptySTTClient {
    constructor(host = '127.0.0.1', port = 7269) {
        this.host = host;
        this.port = port;
        this.socket = null;
    }

    /**
     * Connect to the STT service
     */
    async connect() {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
                console.log('Connected to Scripty STT service');

                // Wait for StatusConnectionOpen message
                this.readMessage()
                    .then(message => {
                        if (message.StatusConnectionOpen) {
                            console.log('STT service ready:', message.StatusConnectionOpen);
                            resolve(message.StatusConnectionOpen);
                        } else {
                            reject(new Error('Expected StatusConnectionOpen, got: ' + JSON.stringify(message)));
                        }
                    })
                    .catch(reject);
            });

            this.socket.on('error', (error) => {
                console.error('STT socket error:', error);
                reject(error);
            });
        });
    }

    /**
     * Read a message from the socket
     */
    async readMessage() {
        return new Promise((resolve, reject) => {
            let magicBytes = Buffer.alloc(4);
            let bytesRead = 0;

            const onData = (chunk) => {
                if (bytesRead < 4) {
                    // Read magic bytes
                    const toCopy = Math.min(4 - bytesRead, chunk.length);
                    chunk.copy(magicBytes, bytesRead, 0, toCopy);
                    bytesRead += toCopy;
                    chunk = chunk.slice(toCopy);
                }

                if (bytesRead >= 4 && chunk.length >= 8) {
                    // Verify magic bytes
                    if (!magicBytes.equals(MAGIC_BYTES)) {
                        this.socket.off('data', onData);
                        reject(new Error('Invalid magic bytes'));
                        return;
                    }

                    // Read length (8 bytes, network byte order = big endian)
                    const length = chunk.readBigUInt64BE(0);
                    const lengthNum = Number(length);

                    // Read the message data
                    const dataStart = 8;
                    const remainingInChunk = chunk.slice(dataStart);

                    if (remainingInChunk.length >= lengthNum) {
                        // We have the full message
                        const messageData = remainingInChunk.slice(0, lengthNum);
                        this.socket.off('data', onData);

                        try {
                            const decoded = msgpack.decode(messageData);
                            resolve(decoded);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        // Need to read more data
                        let messageBuffer = Buffer.alloc(lengthNum);
                        remainingInChunk.copy(messageBuffer, 0);
                        let messageBytes = remainingInChunk.length;

                        const onMoreData = (chunk) => {
                            const toCopy = Math.min(lengthNum - messageBytes, chunk.length);
                            chunk.copy(messageBuffer, messageBytes, 0, toCopy);
                            messageBytes += toCopy;

                            if (messageBytes >= lengthNum) {
                                this.socket.off('data', onMoreData);
                                try {
                                    const decoded = msgpack.decode(messageBuffer);
                                    resolve(decoded);
                                } catch (error) {
                                    reject(error);
                                }
                            }
                        };

                        this.socket.off('data', onData);
                        this.socket.on('data', onMoreData);
                    }
                }
            };

            this.socket.on('data', onData);
        });
    }

    /**
     * Write a message to the socket
     */
    writeMessage(message) {
        // Encode the message
        const encoded = msgpack.encode(message);

        // Create the full message: MAGIC_BYTES + LENGTH + DATA
        const lengthBuffer = Buffer.alloc(8);
        lengthBuffer.writeBigUInt64BE(BigInt(encoded.length), 0);

        const fullMessage = Buffer.concat([MAGIC_BYTES, lengthBuffer, encoded]);

        // Write to socket
        this.socket.write(fullMessage);
    }

    /**
     * Transcribe audio data
     * @param {Buffer} audioData - PCM i16 audio data
     * @param {number} sampleRate - Sample rate (e.g., 48000)
     * @param {number} channels - Number of channels (1 = mono, 2 = stereo)
     * @param {string} language - Language code (e.g., 'en')
     * @param {boolean} denoise - Whether to apply denoising
     */
    async transcribe(audioData, sampleRate = 48000, channels = 2, language = 'en', denoise = true) {
        const streamId = uuidv4();

        try {
            // Step 1: Initialize streaming
            console.log('Initializing stream...');
            this.writeMessage({
                InitializeStreaming: {
                    id: streamId
                }
            });

            // Wait for InitializationComplete
            const initResponse = await this.readMessage();
            if (!initResponse.InitializationComplete) {
                throw new Error('Expected InitializationComplete, got: ' + JSON.stringify(initResponse));
            }
            console.log('Stream initialized');

            // Step 2: Send audio details
            console.log('Sending audio details...');
            this.writeMessage({
                AudioDataDetails: {
                    id: streamId,
                    denoise_audio: denoise,
                    sample_rate: sampleRate,
                    channels: channels
                }
            });

            // Step 3: Send audio data in chunks (20ms chunks = 240 samples at 48kHz stereo)
            const samplesPerChunk = 240 * channels; // 240 samples per channel
            const bytesPerChunk = samplesPerChunk * 2; // 2 bytes per i16 sample

            console.log(`Sending audio data in chunks (${audioData.length} total bytes)...`);

            // Convert Buffer to Int16Array for proper chunking
            const int16Data = new Int16Array(
                audioData.buffer,
                audioData.byteOffset,
                audioData.length / 2
            );

            for (let i = 0; i < int16Data.length; i += samplesPerChunk) {
                const chunk = Array.from(int16Data.slice(i, i + samplesPerChunk));

                this.writeMessage({
                    AudioData: {
                        data: {
                            Integer: chunk
                        },
                        id: streamId
                    }
                });
            }

            console.log('Audio data sent');

            // Step 4: Finalize and request transcription
            console.log('Requesting transcription...');
            this.writeMessage({
                FinalizeStreaming: {
                    translate: false,
                    verbose: false,
                    language: language,
                    id: streamId,
                    priority: 'High'
                }
            });

            // Step 5: Wait for result
            console.log('Waiting for result...');
            while (true) {
                const response = await this.readMessage();

                if (response.SttResult) {
                    console.log('Transcription received');
                    return response.SttResult.result;
                } else {
                    console.log('Received non-result message:', response);
                }
            }

        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    /**
     * Close the connection
     */
    close() {
        if (this.socket) {
            this.socket.end();
            this.socket = null;
        }
    }
}

module.exports = ScriptySTTClient;
