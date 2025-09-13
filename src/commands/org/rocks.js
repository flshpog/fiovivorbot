const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rocks')
        .setDescription('Randomly eliminate one player from a list')
        .addStringOption(option =>
            option.setName('players')
                .setDescription('Comma or space separated list of players')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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

            if (players.length > 20) {
                return await interaction.reply({
                    content: 'Too many players! Please limit to 20 players or fewer for the rock draw.',
                    ephemeral: true
                });
            }

            // Randomly decide which player gets the purple rock (eliminated)
            const eliminatedIndex = Math.floor(Math.random() * players.length);

            // Create Stop Rocks button
            const stopButton = new ButtonBuilder()
                .setCustomId(`stop_rocks_${interaction.user.id}`)
                .setLabel('Stop Rocks!')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⏹️');

            const row = new ActionRowBuilder().addComponents(stopButton);

            // Send initial announcement
            const initialMessage = `@[ ${interaction.user.username} ] has started rocks!\n` +
                                 `${players.join(', ')} will now draw rocks.\n` +
                                 `Whoever draws the **PURPLE** rock will be eliminated.`;

            const rocksMessage = await interaction.reply({
                content: initialMessage,
                components: [row]
            });

            // Start the rock drawing sequence
            await this.startRockDrawing(rocksMessage, players, eliminatedIndex, interaction.user.id);

        } catch (error) {
            console.error('Error in rocks command:', error);
            await interaction.reply({
                content: 'There was an error processing the rock draw.',
                ephemeral: true
            });
        }
    },

    async startRockDrawing(message, players, eliminatedIndex, userId) {
        let currentPlayerIndex = 0;
        let gameActive = true;

        // Store game state for stop button
        if (!message.client.rocksGames) {
            message.client.rocksGames = new Map();
        }
        message.client.rocksGames.set(userId, { active: false });

        for (let i = 0; i < players.length && gameActive; i++) {
            currentPlayerIndex = i;
            
            // Check if game was stopped
            const gameState = message.client.rocksGames.get(userId);
            if (!gameState || !gameState.active) {
                gameActive = false;
                break;
            }

            const player = players[i];
            const isEliminated = (i === eliminatedIndex);

            // Wait a moment before starting each player's turn
            await this.sleep(1000);

            // Show player drawing
            await message.edit({
                content: message.content + `\n\n${player} draws a rock...`,
                components: message.components
            });

            await this.sleep(1000);

            // Start the suspense sequence
            const dots = ['...', '....', '.....', '....', '...'];
            
            for (let dotIndex = 0; dotIndex < dots.length; dotIndex++) {
                // Check if game was stopped during animation
                const gameState = message.client.rocksGames.get(userId);
                if (!gameState || !gameState.active) {
                    gameActive = false;
                    break;
                }

                await message.edit({
                    content: message.content.replace(/The color is\.+$|$/, `\nThe color is${dots[dotIndex]}`),
                    components: message.components
                });
                
                await this.sleep(1000);
            }

            if (!gameActive) break;

            // Reveal the color
            const color = isEliminated ? '**PURPLE**' : '**WHITE**';
            const colorEmoji = isEliminated ? '🟣' : '⚪';
            
            await message.edit({
                content: message.content.replace(/The color is\.+$/, `The color is... ${color} ${colorEmoji}`),
                components: message.components
            });

            if (isEliminated) {
                // Player eliminated - end game
                await this.sleep(2000);
                
                await message.edit({
                    content: message.content + 
                           `\n${player}, You live to fight another day... NOT!\n` +
                           `I'm sorry ${player}, the only rock left is purple. You have been eliminated in the worst way possible.\n\n` +
                           `**Goodbye.** *(edited)*`,
                    components: [] // Remove stop button
                });
                
                // Clean up game state
                message.client.rocksGames.delete(userId);
                return;
            } else {
                // Player is safe
                await this.sleep(1000);
                
                await message.edit({
                    content: message.content + `\n${player}, You live to fight another day.`,
                    components: message.components
                });
            }
        }

        // Clean up if game ended without elimination (shouldn't happen, but safety)
        message.client.rocksGames.delete(userId);
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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