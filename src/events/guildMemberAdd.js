const { Events } = require('discord.js');

// CONFIG - Update these IDs for your server
const CONFIG = {
    JOIN_LOG_CHANNEL_ID: "1413999323515060286", // Replace with your join log channel ID
    DEFAULT_AUTOROLE_ID: "1414011563895164990", // Your specified role ID
};

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Send welcome message
            const joinLogChannel = member.guild.channels.cache.get(CONFIG.JOIN_LOG_CHANNEL_ID);
            
            if (joinLogChannel) {
                const memberCount = member.guild.memberCount;
                let suffix = 'th';
                
                // Determine correct suffix for the number
                if (memberCount % 100 >= 11 && memberCount % 100 <= 13) {
                    suffix = 'th';
                } else {
                    switch (memberCount % 10) {
                        case 1: suffix = 'st'; break;
                        case 2: suffix = 'nd'; break;
                        case 3: suffix = 'rd'; break;
                        default: suffix = 'th';
                    }
                }

                const welcomeMessage = `Welcome ${member} to Fiovivor, you are the ${memberCount}${suffix} to join. Enjoy your stay!`;
                await joinLogChannel.send(welcomeMessage);
            } else {
                console.error('Join log channel not found. Please update JOIN_LOG_CHANNEL_ID in guildMemberAdd.js');
            }

            // Handle autorole
            await this.handleAutorole(member);

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },

    async handleAutorole(member) {
        try {
            // Import the autorole command to use its helper function
            const autoroleCommand = require('../commands/mod/autorole.js');
            
            // Get autorole settings for this guild
            const autoroleSettings = await autoroleCommand.getAutorole(member.guild.id);
            
            if (!autoroleSettings) {
                // No autorole set, but check if we should use the default
                if (CONFIG.DEFAULT_AUTOROLE_ID) {
                    const defaultRole = member.guild.roles.cache.get(CONFIG.DEFAULT_AUTOROLE_ID);
                    if (defaultRole) {
                        await this.assignRole(member, defaultRole, 'Default autorole');
                    } else {
                        console.error(`Default autorole with ID ${CONFIG.DEFAULT_AUTOROLE_ID} not found in guild ${member.guild.name}`);
                    }
                }
                return;
            }

            // Get the role
            const role = member.guild.roles.cache.get(autoroleSettings.roleId);
            
            if (!role) {
                console.error(`Autorole with ID ${autoroleSettings.roleId} not found in guild ${member.guild.name}`);
                return;
            }

            // Assign the role
            await this.assignRole(member, role, 'Autorole system');

        } catch (error) {
            console.error('Error in autorole system:', error);
        }
    },

    async assignRole(member, role, reason) {
        try {
            // Check if bot can manage this role
            const botMember = member.guild.members.cache.get(member.client.user.id);
            if (role.position >= botMember.roles.highest.position) {
                console.error(`Cannot assign role ${role.name} - bot's role is not high enough`);
                return;
            }

            // Check if user already has the role (shouldn't happen on join, but just in case)
            if (member.roles.cache.has(role.id)) {
                console.log(`User ${member.user.tag} already has role ${role.name}`);
                return;
            }

            // Assign the role
            await member.roles.add(role, reason);
            console.log(`Successfully assigned role ${role.name} to ${member.user.tag}`);

            // Optional: Send a DM to the user (uncomment if you want this)
            /*
            try {
                await member.send(`Welcome to **${member.guild.name}**! You've been automatically assigned the **${role.name}** role.`);
            } catch (dmError) {
                // User has DMs disabled, ignore
                console.log(`Could not send welcome DM to ${member.user.tag}`);
            }
            */

        } catch (error) {
            console.error(`Error assigning role ${role.name} to ${member.user.tag}:`, error);
        }
    }
};