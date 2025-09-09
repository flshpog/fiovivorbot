const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rocks')
        .setDescription('Randomly eliminate one player from a list')
        .addStringOption(option =>
            option.setName('players')
                .setDescription('Comma or space separated list of players')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const playersInput = interaction.options.getString('players');
            
            // Parse players from input
            const players = this.parsePlayers(playersInput);

            // Validate input
            if (players.length === 0) {
                return await interaction.reply({
                    content: 'No valid players found in your input. Please provide a list of players separated by commas or spaces.',
                    ephemeral: true
                });
            }

            if (players.length === 1) {
                return await interaction.reply({
                    content: `Cannot eliminate from a list with only one player: **${players[0]}**`,
                    ephemeral: true
                });
            }

            if (players.length > 50) {
                return await interaction.reply({
                    content: 'Too many players! Please limit to 50 players or fewer.',
                    ephemeral: true
                });
            }

            // Randomly select a player to eliminate
            const eliminatedIndex = Math.floor(Math.random() * players.length);
            const eliminatedPlayer = players[eliminatedIndex];
            const remainingPlayers = players.filter((_, index) => index !== eliminatedIndex);

            const embed = new EmbedBuilder()
                .setTitle('🪨 Rock Draw Results')
                .setColor(0xFF0000)
                .addFields(
                    {
                        name: '❌ Eliminated Player',
                        value: `**${eliminatedPlayer}**`,
                        inline: false
                    },
                    {
                        name: '✅ Safe Players',
                        value: remainingPlayers.length > 0 ? remainingPlayers.map(p => `• ${p}`).join('\n') : 'None',
                        inline: false
                    },
                    {
                        name: '📊 Statistics',
                        value: `**Total Players:** ${players.length}\n**Eliminated:** 1\n**Remaining:** ${remainingPlayers.length}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${eliminatedPlayer} drew the unlucky rock! 😢` 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in rocks command:', error);
            await interaction.reply({
                content: 'There was an error processing the rock draw.',
                ephemeral: true
            });
        }
    },

    parsePlayers(input) {
        // First try comma separation
        let players = input.split(',').map(p => p.trim()).filter(p => p.length > 0);
        
        // If only one result, try space separation
        if (players.length === 1) {
            players = input.split(/\s+/).map(p => p.trim()).filter(p => p.length > 0);
        }

        // Remove duplicates while preserving order
        const uniquePlayers = [];
        const seen = new Set();
        
        for (const player of players) {
            const lowerPlayer = player.toLowerCase();
            if (!seen.has(lowerPlayer)) {
                seen.add(lowerPlayer);
                uniquePlayers.push(player);
            }
        }

        // Filter out very short names (likely typos)
        return uniquePlayers.filter(p => p.length >= 1 && p.length <= 50);
    }
};