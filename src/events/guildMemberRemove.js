const { Events } = require('discord.js');

// CONFIG - Update these IDs for your server
const CONFIG = {
    JOIN_LOG_CHANNEL_ID: "1413999323515060286", // Replace with your join log channel ID (same as member add)
};

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            const joinLogChannel = member.guild.channels.cache.get(CONFIG.JOIN_LOG_CHANNEL_ID);
            
            if (!joinLogChannel) {
                console.error('Join log channel not found. Please update JOIN_LOG_CHANNEL_ID in guildMemberRemove.js');
                return;
            }

            const goodbyeMessage = `${member.displayName} just left the server. Someone's missing out!`;

            await joinLogChannel.send(goodbyeMessage);
            
        } catch (error) {
            console.error('Error in guildMemberRemove event:', error);
        }
    },
};