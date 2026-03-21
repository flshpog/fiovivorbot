const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

let tokenInterval = null;
const TOKEN_CHANNEL_ID = '1484712008682049768';

function getRandomDelay() {
    // Random between 10-20 minutes in ms
    return (Math.floor(Math.random() * 11) + 10) * 60 * 1000;
}

function scheduleNextToken(client) {
    const delay = getRandomDelay();
    tokenInterval = setTimeout(async () => {
        try {
            const channel = client.channels.cache.get(TOKEN_CHANNEL_ID);
            if (channel) {
                await channel.send('A Totem has appeared. ');
            }
        } catch (error) {
            console.error('Error sending token message:', error);
        }
        // Schedule the next one
        scheduleNextToken(client);
    }, delay);
}

function startTokens(client) {
    if (tokenInterval) return false;
    scheduleNextToken(client);
    return true;
}

function stopTokens() {
    if (!tokenInterval) return false;
    clearTimeout(tokenInterval);
    tokenInterval = null;
    return true;
}

function isTokensActive() {
    return tokenInterval !== null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tokens')
        .setDescription('Toggle the totem spawn system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName('toggle')
                .setDescription('Turn tokens on or off')
                .setRequired(true)
                .addChoices(
                    { name: 'on', value: 'on' },
                    { name: 'off', value: 'off' }
                )),

    async execute(interaction) {
        const client = interaction.client;
        const toggle = interaction.options.getString('toggle');

        if (toggle === 'on') {
            if (isTokensActive()) {
                return interaction.reply({ content: 'Tokens are already active.', ephemeral: true });
            }
            startTokens(client);
            await interaction.reply({ content: 'Tokens system activated. Totems will appear every 10-20 minutes.', ephemeral: true });
        } else {
            if (!isTokensActive()) {
                return interaction.reply({ content: 'Tokens are already off.', ephemeral: true });
            }
            stopTokens();
            await interaction.reply({ content: 'Tokens system deactivated.', ephemeral: true });
        }
    },

    startTokens,
    stopTokens,
    isTokensActive,
};
