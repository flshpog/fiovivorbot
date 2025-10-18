const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alliance')
        .setDescription('Create a private alliance channel')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of channel')
                .setRequired(true)
                .addChoices(
                    { name: '1-1', value: '1on1' },
                    { name: 'Alliance', value: 'alliance' }
                ))
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
            const type = interaction.options.getString('type');
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

            // Create channel name based on type
            const typePrefix = type === '1on1' ? '1on1' : 'alliance';
            const channelName = `${typePrefix}-${allianceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

            // Check if alliance already exists
            const existingChannel = category.children.cache.find(
                channel => channel.name === channelName
            );

            if (existingChannel) {
                const channelTypeLabel = type === '1on1' ? '1-on-1' : 'alliance';
                return await interaction.reply({
                    content: `A ${channelTypeLabel} channel with the name "${channelName}" already exists in this category.`,
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

            // Add spectator roles based on type
            // Role 1414012718293323776: Can view both 1-1s and alliances (no speaking)
            permissionOverwrites.push({
                id: '1414012718293323776',
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages]
            });

            // Role 1414011212718538833: Can view alliances only, NOT 1-1s (no speaking)
            if (type === 'alliance') {
                permissionOverwrites.push({
                    id: '1414011212718538833',
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                    deny: [PermissionFlagsBits.SendMessages]
                });
            } else {
                // For 1-1s, explicitly deny this role
                permissionOverwrites.push({
                    id: '1414011212718538833',
                    deny: [PermissionFlagsBits.ViewChannel]
                });
            }

            // Create the channel
            const channelTypeLabel = type === '1on1' ? '1-on-1' : 'alliance';
            const allianceChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category,
                permissionOverwrites: permissionOverwrites,
                topic: `Private ${channelTypeLabel} channel for: ${validRoles.map(r => r.name).join(', ')}`
            });

            // Send welcome message in the channel
            const channelType = type === '1on1' ? '1-on-1' : 'alliance';
            await allianceChannel.send(
                `🤝 **Welcome!**\n\n` +
                `This is a private ${channelType} channel for:\n` +
                `${validRoles.map(role => `• ${role}`).join('\n')}\n\n` +
                `This ${channelType} was requested by ${interaction.user}`
            );

            let responseMessage = `✅ ${channelType.charAt(0).toUpperCase() + channelType.slice(1)} channel created: ${allianceChannel}\n\n` +
                                 `**Type:** ${channelType}\n` +
                                 `**Name:** ${allianceName}\n` +
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