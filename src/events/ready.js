const { Events, REST, Routes } = require('discord.js');
const { startPeriodicCheck } = require('../handlers/stickyManager');
// const RoleScheduler = require('../utils/roleScheduler');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // Register slash commands
        const commands = [];
        client.slashCommands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST().setToken(client.config.token);

        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // Replace 'YOUR_GUILD_ID' with your server ID for guild commands
            // For global commands, use Routes.applicationCommands(client.user.id)
            const data = await rest.put(
                Routes.applicationGuildCommands(client.user.id, '1413999322676203602'),
                { body: commands },
            );

            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);

            // Also register globally for the Supports Commands badge
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log('Successfully registered global application (/) commands.');
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }

        client.user.setActivity('Fiovivor Server', { type: 'WATCHING' });

        startPeriodicCheck(client);

        // Initialize and start role scheduler
        // client.roleScheduler = new RoleScheduler(client);
        // client.roleScheduler.start();
        // console.log('🌙 Role scheduler initialized and started');
    },
};