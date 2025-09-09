const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chmove')
        .setDescription('Move a channel to a different category')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to move')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('The category to move the channel to')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');
            const category = interaction.options.getChannel('category');

            // Validate channel type
            if (!channel.isTextBased() && 
                channel.type !== ChannelType.GuildVoice && 
                channel.type !== ChannelType.GuildStageVoice &&
                channel.type !== ChannelType.GuildForum &&
                channel.type !== ChannelType.GuildAnnouncement) {
                return await interaction.reply({
                    content: 'You can only move text, voice, stage, forum, or announcement channels.',
                    ephemeral: true
                });
            }

            // Validate category
            if (category.type !== ChannelType.GuildCategory) {
                return await interaction.reply({
                    content: 'Please select a valid category channel.',
                    ephemeral: true
                });
            }

            // Check if channel is already in the target category
            if (channel.parentId === category.id) {
                return await interaction.reply({
                    content: `${channel} is already in the **${category.name}** category.`,
                    ephemeral: true
                });
            }

            // Check category channel limit (Discord limit is 50 channels per category)
            const categoryChannelCount = category.children.cache.size;
            if (categoryChannelCount >= 50) {
                return await interaction.reply({
                    content: `The **${category.name}** category is full (50/50 channels). Please choose a different category or remove some channels first.`,
                    ephemeral: true
                });
            }

            const oldCategory = channel.parent ? channel.parent.name : 'No Category';

            await interaction.deferReply({ ephemeral: true });

            try {
                // Move the channel
                await channel.setParent(category, {
                    reason: `Channel moved by ${interaction.user.tag} using /chmove command`
                });

                const successMessage = `✅ Successfully moved ${channel} to the **${category.name}** category!\n\n` +
                                      `**📊 Move Details:**\n` +
                                      `• **Channel:** ${channel.name}\n` +
                                      `• **From:** ${oldCategory}\n` +
                                      `• **To:** ${category.name}\n` +
                                      `• **Category Usage:** ${categoryChannelCount + 1}/50 channels`;

                await interaction.editReply(successMessage);

            } catch (moveError) {
                console.error('Error moving channel:', moveError);
                
                let errorMessage = 'Failed to move the channel. ';
                
                if (moveError.code === 50013) {
                    errorMessage += 'I don\'t have permission to manage this channel or category.';
                } else if (moveError.code === 50001) {
                    errorMessage += 'I don\'t have access to the specified channel or category.';
                } else {
                    errorMessage += 'Please check that I have the necessary permissions and try again.';
                }

                await interaction.editReply(errorMessage);
            }

        } catch (error) {
            console.error('Error in chmove command:', error);
            const errorMessage = 'There was an error processing the channel move command.';
            
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};