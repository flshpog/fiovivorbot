const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alliance')
        .setDescription('Create a private alliance channel')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('The category to create the alliance channel in')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name for the alliance channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('roles')
                .setDescription('Space-separated role IDs or mentions for alliance members')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        try {
            const category = interaction.options.getChannel('category');
            const allianceName = interaction.options.getString('name');
            const rolesInput = interaction.options.getString('roles');

            // Validate category
            if (category.type !== ChannelType.GuildCategory) {
                return await interaction.reply({
                    content: 'Please select a valid category channel.',
                    ephemeral: true
                });
            }

            // Parse roles from input
            const roleIds = this.parseRoles(rolesInput);
            if (roleIds.length === 0) {
                return await interaction.reply({
                    content: 'Please provide valid role IDs or mentions. Example: `@Role1 @Role2` or `123456789 987654321`',
                    ephemeral: true
                });
            }

            // Validate roles exist
            const validRoles = [];
            const invalidRoles = [];

            for (const roleId of roleIds) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    validRoles.push(role);
                } else {
                    invalidRoles.push(roleId);
                }
            }

            if (validRoles.length === 0) {
                return await interaction.reply({
                    content: 'None of the provided roles were found in this server.',
                    ephemeral: true
                });
            }

            // Create channel name
            const channelName = `alliance-${allianceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            // Check if alliance already exists
            const existingChannel = category.children.cache.find(
                channel => channel.name === channelName
            );

            if (existingChannel) {
                return await interaction.reply({
                    content: `An alliance channel with the name "${channelName}" already exists in this category.`,
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            // Create permission overwrites
            const permissionOverwrites = [
                {
                    id: interaction.guild.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel],
                }
            ];

            // Add permissions for each valid role
            validRoles.forEach(role => {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.UseExternalEmojis,
                        PermissionFlagsBits.AddReactions
                    ],
                });
            });

            // Create the alliance channel
            const allianceChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category,
                permissionOverwrites: permissionOverwrites,
                topic: `Private alliance channel for: ${validRoles.map(r => r.name).join(', ')}`
            });

            // Send welcome message in the alliance channel
            await allianceChannel.send(
                `🤝 **Welcome!**\n\n` +
                `This is a private channel for alliance members:\n` +
                `${validRoles.map(role => `• ${role}`).join('\n')}\n\n` +
                `This alliance was requested by...`
            );

            let responseMessage = `✅ Alliance channel created: ${allianceChannel}\n\n` +
                                 `**Alliance Name:** ${allianceName}\n` +
                                 `**Roles with access:** ${validRoles.map(r => r.name).join(', ')}`;

            if (invalidRoles.length > 0) {
                responseMessage += `\n\n⚠️ **Warning:** The following role IDs were not found and were skipped:\n${invalidRoles.join(', ')}`;
            }

            await interaction.editReply(responseMessage);

        } catch (error) {
            console.error('Error creating alliance:', error);
            const errorMessage = 'There was an error creating the alliance channel.';
            
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    parseRoles(input) {
        // Parse role mentions (<@&123456>) and raw IDs
        const rolePattern = /<@&(\d+)>|(\d+)/g;
        const roleIds = [];
        let match;

        while ((match = rolePattern.exec(input)) !== null) {
            const roleId = match[1] || match[2];
            if (roleId && !roleIds.includes(roleId)) {
                roleIds.push(roleId);
            }
        }

        return roleIds;
    }
};