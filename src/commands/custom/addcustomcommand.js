const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcustomcommand')
        .setDescription('Add a custom command')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the custom command')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('response')
                .setDescription('The response for the custom command')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            const name = interaction.options.getString('name').toLowerCase();
            const response = interaction.options.getString('response');

            // Check if command name contains invalid characters
            if (!/^[a-z0-9]+$/i.test(name)) {
                return await interaction.reply({
                    content: 'Command name can only contain letters and numbers.',
                    ephemeral: true
                });
            }

            // Check if command already exists
            if (interaction.client.customCommands.has(name)) {
                return await interaction.reply({
                    content: `Custom command "${name}" already exists!`,
                    ephemeral: true
                });
            }

            // Check if command conflicts with existing bot commands
            if (interaction.client.commands.has(name) || interaction.client.slashCommands.has(name)) {
                return await interaction.reply({
                    content: `Cannot create custom command "${name}" as it conflicts with an existing bot command.`,
                    ephemeral: true
                });
            }

            // Add to memory
            interaction.client.customCommands.set(name, response);

            // Save to file
            try {
                const customCommandsObj = {};
                interaction.client.customCommands.forEach((value, key) => {
                    customCommandsObj[key] = value;
                });

                fs.writeFileSync('./data/customCommands.json', JSON.stringify(customCommandsObj, null, 2));

                await interaction.reply({
                    content: `Custom command "${name}" has been added successfully!\nUsers can now use \`!${name}\` to trigger it.`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error saving custom command:', error);
                await interaction.reply({
                    content: 'Custom command was added to memory but could not be saved to file. It will be lost on restart.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Error in addcustomcommand:', error);
            await interaction.reply({
                content: 'There was an error adding the custom command.',
                ephemeral: true
            });
        }
    },
};