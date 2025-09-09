const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing slash command:', error);
                const reply = { 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            }
        }

        // Handle button interactions
        else if (interaction.isButton()) {
            if (interaction.customId === 'create_ticket') {
                // Handle ticket creation
                const ticketCommand = interaction.client.slashCommands.get('ticket-setup');
                if (ticketCommand && ticketCommand.handleButton) {
                    try {
                        await ticketCommand.handleButton(interaction);
                    } catch (error) {
                        console.error('Error handling ticket button:', error);
                        await interaction.reply({
                            content: 'There was an error creating your ticket. Please try again later.',
                            ephemeral: true
                        });
                    }
                }
            }
        }
    },
};