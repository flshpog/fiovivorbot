const { Events, EmbedBuilder } = require('discord.js');
const { LOG_CHANNEL_ID, COLORS } = require('../config/logging');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        const client = message.client;
        const prefix = client.config.prefix;

        // Debug logging for attachments
        if (message.attachments.size > 0) {
            console.log('Message has attachments:');
            message.attachments.forEach(att => {
                console.log(`- ${att.filename}: ${att.contentType}, flags: ${att.flags}`);
            });
        }

        // Check for voice messages (STT feature)
        if (message.attachments.size > 0) {
            const voiceAttachment = message.attachments.find(att => 
                att.contentType === 'audio/ogg' || 
                att.contentType === 'audio/ogg; codecs=opus' ||
                att.filename?.endsWith('.ogg') ||
                (att.flags && att.flags & 4) // Voice message flag
            );
            
            if (voiceAttachment) {
                console.log('🎤 VOICE MESSAGE DETECTED! Processing...');
                console.log('Voice attachment details:', {
                    filename: voiceAttachment.filename,
                    contentType: voiceAttachment.contentType,
                    size: voiceAttachment.size,
                    url: voiceAttachment.url
                });
                
                const sttCommand = client.slashCommands.get('stt-handler');
                if (sttCommand && sttCommand.handleVoiceMessage) {
                    try {
                        await sttCommand.handleVoiceMessage(message);
                    } catch (error) {
                        console.error('Error processing voice message:', error);
                    }
                } else {
                    console.log('❌ STT handler not found');
                }
                return;
            }
        }

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