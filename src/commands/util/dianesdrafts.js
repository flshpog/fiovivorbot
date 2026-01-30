module.exports = {
    name: 'dianesdrafts',
    description: 'Adds you to the Diane\'s Drafts thread',
    usage: '!dianesdrafts',

    async execute(message, args) {
        const THREAD_ID = '1466831559783874701';

        try {
            const thread = await message.client.channels.fetch(THREAD_ID);

            if (!thread || !thread.isThread()) {
                console.log('Thread not found or invalid');
                return await message.reply('Could not find the thread.');
            }

            // Reply to command with thread link
            await message.reply(`https://discord.com/channels/${thread.guildId}/${THREAD_ID}`);

            // Send ping message in the thread to add user
            const pingMessage = await thread.send(`<@${message.author.id}>`);

            // Delete the ping message
            await pingMessage.delete();

            console.log(`Added ${message.author.tag} to Diane's Drafts thread`);
        } catch (error) {
            console.error('Error in dianesdrafts command:', error);
            await message.reply('An error occurred while trying to add you to the thread.');
        }
    }
};
