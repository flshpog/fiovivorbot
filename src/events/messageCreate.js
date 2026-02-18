const { Events, EmbedBuilder } = require('discord.js');
const { LOG_CHANNEL_ID, COLORS } = require('../config/logging');

// Voice message flag (1 << 13)
const VOICE_MESSAGE_FLAG = 1 << 13;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Voice message transcription
        console.log(`[DEBUG] Message received | flags: ${message.flags.bitfield} | attachments: ${message.attachments.size} | isVoice: ${message.flags.has(VOICE_MESSAGE_FLAG)}`);

        if (message.flags.has(VOICE_MESSAGE_FLAG)) {
            console.log('[DEBUG] Voice message detected');

            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                console.log('[DEBUG] No OPENAI_API_KEY set, skipping');
                return;
            }

            const attachment = message.attachments.first();
            if (!attachment) {
                console.log('[DEBUG] No attachment found');
                return;
            }

            console.log(`[DEBUG] Attachment URL: ${attachment.proxyURL}`);

            try {
                const OpenAI = require('openai');
                console.log('[DEBUG] OpenAI loaded');

                // Download the audio
                const response = await fetch(attachment.proxyURL);
                const buffer = Buffer.from(await response.arrayBuffer());
                console.log(`[DEBUG] Audio downloaded, size: ${buffer.length} bytes`);

                // Send to Whisper API
                const openai = new OpenAI({ apiKey });
                const file = await OpenAI.toFile(buffer, 'voice.ogg');
                console.log('[DEBUG] Sending to Whisper API...');
                const transcription = await openai.audio.transcriptions.create({
                    model: 'whisper-1',
                    file,
                });
                console.log(`[DEBUG] Transcription result: ${JSON.stringify(transcription)}`);

                const text = transcription.text?.trim();
                if (text) {
                    await message.reply({
                        content: `**Transcription:** ${text}`,
                        allowedMentions: { repliedUser: false },
                    });
                }
            } catch (error) {
                console.error('[DEBUG] Error transcribing voice message:', error);
            }
            return;
        }

        const client = message.client;
        const prefix = client.config.prefix;

        // Handle prefix commands
        if (!message.content.startsWith(prefix)) {
            // Check for custom commands
            const content = message.content.toLowerCase();
            if (content.startsWith(prefix)) {
                const commandName = content.slice(prefix.length).split(' ')[0];
                const customResponse = client.customCommands.get(commandName);

                if (customResponse) {
                    try {
                        // Process newlines in custom command responses
                        const processedResponse = customResponse.replace(/\\n/g, '\n');
                        await message.reply(processedResponse);

                        // Log custom command usage
                        try {
                            const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
                            if (logChannel) {
                                const embed = new EmbedBuilder()
                                    .setColor(COLORS.CUSTOM_COMMAND)
                                    .setTitle('⚡ Custom Command Triggered')
                                    .setDescription(`**Custom command used in ${message.channel}**`)
                                    .addFields(
                                        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                                        { name: 'Command', value: `!${commandName}`, inline: true },
                                        { name: 'Channel', value: `${message.channel.name}`, inline: true }
                                    )
                                    .setThumbnail(message.author.displayAvatarURL())
                                    .setTimestamp();

                                await logChannel.send({ embeds: [embed] });
                            }
                        } catch (logError) {
                            console.error('Error logging custom command:', logError);
                        }
                    } catch (error) {
                        console.error('Error executing custom command:', error);
                    }
                }
            }
            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Check application commands first
        const appCommands = require('../commands/util/application-commands');
        if (await appCommands.handleApplicationCommand(message, commandName)) {
            return; // Application command was handled
        }

        // Check custom commands
        const customResponse = client.customCommands.get(commandName);
        if (customResponse) {
            try {
                // Process newlines in custom command responses
                const processedResponse = customResponse.replace(/\\n/g, '\n');
                await message.reply(processedResponse);

                // Log custom command usage
                try {
                    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.CUSTOM_COMMAND)
                            .setTitle('⚡ Custom Command Triggered')
                            .setDescription(`**Custom command used in ${message.channel}**`)
                            .addFields(
                                { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                                { name: 'Command', value: `!${commandName}`, inline: true },
                                { name: 'Channel', value: `${message.channel.name}`, inline: true }
                            )
                            .setThumbnail(message.author.displayAvatarURL())
                            .setTimestamp();

                        await logChannel.send({ embeds: [embed] });
                    }
                } catch (logError) {
                    console.error('Error logging custom command:', logError);
                }

                return;
            } catch (error) {
                console.error('Error executing custom command:', error);
                return;
            }
        }

        // Check regular commands
        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error('Error executing prefix command:', error);
            try {
                await message.reply('There was an error executing that command.');
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    },
};