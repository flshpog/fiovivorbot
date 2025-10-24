#!/usr/bin/env node

/**
 * Test script for Scripty STT integration
 *
 * This script tests the connection to the Scripty STT service
 * and can optionally test transcription with a WAV file.
 *
 * Usage:
 *   node test-stt.js                    # Test connection only
 *   node test-stt.js path/to/audio.wav  # Test transcription
 */

require('dotenv').config();
const ScriptySTTClient = require('./src/utils/stt-client');
const AudioConverter = require('./src/utils/audio-converter');
const fs = require('fs');

const STT_HOST = process.env.STT_HOST || '127.0.0.1';
const STT_PORT = parseInt(process.env.STT_PORT || '7269');

async function testConnection() {
    console.log('\n=== Testing Scripty STT Connection ===\n');
    console.log(`Connecting to ${STT_HOST}:${STT_PORT}...`);

    const client = new ScriptySTTClient(STT_HOST, STT_PORT);

    try {
        const status = await client.connect();
        console.log('✅ Successfully connected to STT service!');
        console.log('   Max utilization:', status.max_utilization);
        console.log('   Can overload:', status.can_overload);

        client.close();
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to STT service:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n💡 Troubleshooting:');
            console.error('   1. Make sure the STT service is running');
            console.error('   2. Check that it\'s listening on port', STT_PORT);
            console.error('   3. Verify firewall settings');
            console.error('\n   To start the service:');
            console.error('   cd C:\\Users\\cash\\Downloads\\stt-service-master\\stt-service');
            console.error('   .\\target\\release\\scripty_stt_service.exe --config config.toml');
        }

        return false;
    }
}

async function testTranscription(audioFile) {
    console.log('\n=== Testing Audio Transcription ===\n');

    if (!fs.existsSync(audioFile)) {
        console.error('❌ Audio file not found:', audioFile);
        return false;
    }

    console.log('Audio file:', audioFile);
    console.log('File size:', fs.statSync(audioFile).size, 'bytes');

    const client = new ScriptySTTClient(STT_HOST, STT_PORT);

    try {
        // Connect
        console.log('\n1. Connecting to STT service...');
        await client.connect();
        console.log('   ✅ Connected');

        // Convert audio
        console.log('\n2. Converting audio to PCM...');
        const { data: pcmData, sampleRate, channels } = await AudioConverter.convertDiscordOpusToPCM(audioFile);
        console.log(`   ✅ Converted: ${pcmData.length} bytes, ${sampleRate}Hz, ${channels} channels`);

        // Transcribe
        console.log('\n3. Transcribing audio...');
        const startTime = Date.now();
        const transcription = await client.transcribe(pcmData, sampleRate, channels, 'en', true);
        const duration = Date.now() - startTime;

        console.log('\n✅ Transcription complete!');
        console.log('   Duration:', duration, 'ms');
        console.log('\n📝 Transcript:', transcription);

        client.close();
        return true;

    } catch (error) {
        console.error('❌ Transcription failed:', error.message);
        console.error('\n   Full error:', error);
        client.close();
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║  Scripty STT Integration Test Suite   ║');
    console.log('╚════════════════════════════════════════╝');

    // Test 1: Connection
    const connectionSuccess = await testConnection();

    if (!connectionSuccess) {
        console.log('\n❌ Connection test failed. Cannot proceed with transcription test.');
        process.exit(1);
    }

    // Test 2: Transcription (if audio file provided)
    if (process.argv.length > 2) {
        const audioFile = process.argv[2];
        const transcriptionSuccess = await testTranscription(audioFile);

        if (!transcriptionSuccess) {
            process.exit(1);
        }
    } else {
        console.log('\n💡 To test transcription, provide an audio file:');
        console.log('   node test-stt.js path/to/audio.ogg');
    }

    console.log('\n✅ All tests passed!\n');
}

main().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});
