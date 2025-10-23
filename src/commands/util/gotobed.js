const { EmbedBuilder } = require('discord.js');

const CONFIG = {
    USER_ID: '556663419483324421',
    ROLE_ID: '1430757238749925387'
};

module.exports = {
    name: 'gotobed',
    description: 'Toggle the bedtime role on or off',
    usage: '!gotobed',

    async execute(message, args) {
        try {
            const guild = message.guild;
            const member = await guild.members.fetch(CONFIG.USER_ID).catch(() => null);
            const role = guild.roles.cache.get(CONFIG.ROLE_ID);

            if (!member) {
                return message.reply('❌ Could not find the target user.');
            }

            if (!role) {
                return message.reply('❌ Could not find the target role.');
            }

            // Toggle the role
            const hasRole = member.roles.cache.has(CONFIG.ROLE_ID);

            if (hasRole) {
                // Remove the role
                await member.roles.remove(role, 'Manual toggle via !gotobed command');

                const embed = new EmbedBuilder()
                    .setTitle('☀️ Good Morning!')
                    .setDescription(`Removed the bedtime role from ${member.user.tag}`)
                    .setColor(0xFFD700)
                    .addFields(
                        {
                            name: '👤 User',
                            value: `${member.user.tag}`,
                            inline: true
                        },
                        {
                            name: '🎭 Role',
                            value: `${role.name}`,
                            inline: true
                        }
                    )
                    .setFooter({ text: 'The automatic schedule will still run at 10 PM EST' })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            } else {
                // Add the role
                await member.roles.add(role, 'Manual toggle via !gotobed command');

                const embed = new EmbedBuilder()
                    .setTitle('🌙 Bedtime!')
                    .setDescription(`Added the bedtime role to ${member.user.tag}`)
                    .setColor(0x5865F2)
                    .addFields(
                        {
                            name: '👤 User',
                            value: `${member.user.tag}`,
                            inline: true
                        },
                        {
                            name: '🎭 Role',
                            value: `${role.name}`,
                            inline: true
                        }
                    )
                    .setFooter({ text: 'The role will be automatically removed at 3 AM EST' })
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in gotobed command:', error);
            await message.reply('❌ There was an error toggling the bedtime role.');
        }
    }
};
