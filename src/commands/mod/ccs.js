const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ccs')
        .setDescription('Create confessional and submission channels for castaways')
        .addChannelOption(option =>
            option.setName('confessionals-category')
                .setDescription('Category for confessional channels')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('submissions-category')
                .setDescription('Category for submission channels')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('number-of-castaways')
                .setDescription('Number of castaway channel pairs to create')
                .setMinValue(1)
                .setMaxValue(25)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const confessionalsCategory = interaction.options.getChannel('confessionals-category');
            const submissionsCategory = interaction.options.getChannel('submissions-category');
            const numberOfCastaways = interaction.options.getInteger('number-of-castaways');

            // Validate categories
            if (confessionalsCategory.type !== ChannelType.GuildCategory) {
                return await interaction.reply({
                    content: 'Please select a valid category for confessionals.',
                    ephemeral: true
                });
            }

            if (submissionsCategory.type !== ChannelType.GuildCategory) {
                return await interaction.reply({
                    content: 'Please select a valid category for submissions.',
                    ephemeral: true
                });
            }

            // Check if categories have enough space
            const confessionalsSpace = 50 - confessionalsCategory.children.cache.size;
            const submissionsSpace = 50 - submissionsCategory.children.cache.size;

            if (confessionalsSpace < numberOfCastaways) {
                return await interaction.reply({
                    content: `Not enough space in **${confessionalsCategory.name}** category. Available: ${confessionalsSpace}, Needed: ${numberOfCastaways}`,
                    ephemeral: true
                });
            }

            if (submissionsSpace < numberOfCastaways) {
                return await interaction.reply({
                    content: `Not enough space in **${submissionsCategory.name}** category. Available: ${submissionsSpace}, Needed: ${numberOfCastaways}`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const results = {
                confessionals: { success: 0, failed: 0, failedChannels: [] },
                submissions: { success: 0, failed: 0, failedChannels: [] }
            };

            // Create channels for each castaway
            for (let i = 1; i <= numberOfCastaways; i++) {
                const castawayNumber = i.toString().padStart(2, '0'); // 01, 02, 03, etc.
                
                // Create confessional channel
                try {
                    const confessionalChannel = await interaction.guild.channels.create({
                        name: `confessional-${castawayNumber}`,
                        type: ChannelType.GuildText,
                        parent: confessionalsCategory,
                        topic: `Private confessional channel for Castaway ${castawayNumber}`,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id, // @everyone
                                deny: [PermissionFlagsBits.ViewChannel],
                            }
                            // Note: You may want to add specific role permissions here
                            // based on your server's setup
                        ],
                        reason: `Created by ${interaction.user.tag} using /ccs command`
                    });

                    // Send welcome message
                    await confessionalChannel.send(
                        `🎥 **Welcome to your Confessional!**\n\n` +
                        `This is your private space to share thoughts, strategies, and reactions.\n` +
                        `Only you and the hosts can see this channel.\n\n` +
                        `Good luck, Castaway ${castawayNumber}! 🏝️`
                    );

                    results.confessionals.success++;
                } catch (error) {
                    console.error(`Failed to create confessional-${castawayNumber}:`, error);
                    results.confessionals.failed++;
                    results.confessionals.failedChannels.push(`confessional-${castawayNumber}`);
                }

                // Create submission channel
                try {
                    const submissionChannel = await interaction.guild.channels.create({
                        name: `submission-${castawayNumber}`,
                        type: ChannelType.GuildText,
                        parent: submissionsCategory,
                        topic: `Challenge and tribal council submission channel for Castaway ${castawayNumber}`,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id, // @everyone
                                deny: [PermissionFlagsBits.ViewChannel],
                            }
                            // Note: You may want to add specific role permissions here
                        ],
                        reason: `Created by ${interaction.user.tag} using /ccs command`
                    });

                    // Send welcome message
                    await submissionChannel.send(
                        `📝 **Submission Channel Ready!**\n\n` +
                        `Use this channel to submit:\n` +
                        `• Challenge responses\n` +
                        `• Tribal Council votes\n` +
                        `• Any other game-related submissions\n\n` +
                        `Make sure to follow all submission guidelines!\n` +
                        `Good luck, Castaway ${castawayNumber}! 🗳️`
                    );

                    results.submissions.success++;
                } catch (error) {
                    console.error(`Failed to create submission-${castawayNumber}:`, error);
                    results.submissions.failed++;
                    results.submissions.failedChannels.push(`submission-${castawayNumber}`);
                }

                // Add a small delay to avoid rate limits
                if (i < numberOfCastaways) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Create summary message
            let responseMessage = `✅ **Castaway Channels Creation Complete!**\n\n`;
            
            responseMessage += `**📊 Results Summary:**\n`;
            responseMessage += `• **Total Castaways:** ${numberOfCastaways}\n`;
            responseMessage += `• **Confessionals Created:** ${results.confessionals.success}/${numberOfCastaways}\n`;
            responseMessage += `• **Submissions Created:** ${results.submissions.success}/${numberOfCastaways}\n\n`;

            responseMessage += `**📁 Categories Used:**\n`;
            responseMessage += `• **Confessionals:** ${confessionalsCategory.name}\n`;
            responseMessage += `• **Submissions:** ${submissionsCategory.name}\n`;

            // Add failure information if any
            if (results.confessionals.failed > 0) {
                responseMessage += `\n⚠️ **Failed Confessionals:** ${results.confessionals.failedChannels.join(', ')}`;
            }
            
            if (results.submissions.failed > 0) {
                responseMessage += `\n⚠️ **Failed Submissions:** ${results.submissions.failedChannels.join(', ')}`;
            }

            if (results.confessionals.failed > 0 || results.submissions.failed > 0) {
                responseMessage += `\n\n💡 **Note:** Failed channels may be due to permission issues or rate limits. Try creating them manually or check bot permissions.`;
            }

            await interaction.editReply(responseMessage);

        } catch (error) {
            console.error('Error in ccs command:', error);
            const errorMessage = 'There was an error creating the castaway channels.';
            
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};