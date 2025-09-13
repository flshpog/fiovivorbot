const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        const client = message.client;
        const prefix = client.config.prefix;

        // Check for voice messages (STT feature)
        if (message.flags?.has('IsVoiceMessage') || 
            (message.attachments.size > 0 && 
             message.attachments.some(att => att.contentType?.includes('ogg')))) {
            
            const sttCommand = client.slashCommands.get('stt-handler');
            if (sttCommand && sttCommand.handleVoiceMessage) {
                try {
                    await sttCommand.handleVoiceMessage(message);
                } catch (error) {
                    console.error('Error processing voice message:', error);
                }
            }
            return;
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
                        await message.reply(customResponse);
                    } catch (error) {
                        console.error('Error executing custom command:', error);
                    }
                }
            }
            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Check custom commands first
        const customResponse = client.customCommands.get(commandName);
        if (customResponse) {
            try {
                // Process newlines in custom command responses
                const processedResponse = customResponse.replace(/\\n/g, '\n');
                await message.reply(processedResponse);
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