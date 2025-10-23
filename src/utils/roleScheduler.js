// Configuration
const CONFIG = {
    USER_ID: '556663419483324421',
    ROLE_ID: '1430757238749925387',
    GIVE_ROLE_TIME: { hour: 22, minute: 0 }, // 10:00 PM EST
    REMOVE_ROLE_TIME: { hour: 3, minute: 0 }, // 3:00 AM EST
    TIMEZONE_OFFSET: -5 // EST offset from UTC (EST is UTC-5)
};

class RoleScheduler {
    constructor(client) {
        this.client = client;
        this.checkInterval = null;
    }

    start() {
        if (this.checkInterval) {
            return; // Already running
        }

        // Check immediately on start
        this.checkAndUpdateRole();

        // Then check every minute
        this.checkInterval = setInterval(() => {
            this.checkAndUpdateRole();
        }, 60000); // Check every minute

        console.log('✅ Role scheduler started - checking every minute');
    }

    getESTTime() {
        const now = new Date();
        // Convert to EST by adding offset
        const estTime = new Date(now.getTime() + (CONFIG.TIMEZONE_OFFSET * 60 * 60 * 1000));
        return {
            hour: estTime.getUTCHours(),
            minute: estTime.getUTCMinutes(),
            full: estTime
        };
    }

    shouldHaveRole() {
        const est = this.getESTTime();
        const currentMinutes = est.hour * 60 + est.minute;

        const giveRoleMinutes = CONFIG.GIVE_ROLE_TIME.hour * 60 + CONFIG.GIVE_ROLE_TIME.minute;
        const removeRoleMinutes = CONFIG.REMOVE_ROLE_TIME.hour * 60 + CONFIG.REMOVE_ROLE_TIME.minute;

        // Role should be active from 10pm (22:00) to 3am (03:00)
        // This spans across midnight, so we need special logic
        if (giveRoleMinutes > removeRoleMinutes) {
            // Spans midnight (e.g., 22:00 to 03:00)
            return currentMinutes >= giveRoleMinutes || currentMinutes < removeRoleMinutes;
        } else {
            // Doesn't span midnight (e.g., 08:00 to 17:00)
            return currentMinutes >= giveRoleMinutes && currentMinutes < removeRoleMinutes;
        }
    }

    async checkAndUpdateRole() {
        try {
            const guild = this.client.guilds.cache.first();
            if (!guild) {
                console.log('❌ No guild found for role scheduler');
                return;
            }

            const member = await guild.members.fetch(CONFIG.USER_ID).catch(() => null);
            if (!member) {
                console.log(`❌ Could not find member ${CONFIG.USER_ID}`);
                return;
            }

            const role = guild.roles.cache.get(CONFIG.ROLE_ID);
            if (!role) {
                console.log(`❌ Could not find role ${CONFIG.ROLE_ID}`);
                return;
            }

            const shouldHave = this.shouldHaveRole();
            const currentlyHas = member.roles.cache.has(CONFIG.ROLE_ID);

            const est = this.getESTTime();
            const timeStr = `${est.hour.toString().padStart(2, '0')}:${est.minute.toString().padStart(2, '0')} EST`;

            if (shouldHave && !currentlyHas) {
                await member.roles.add(role, 'Scheduled role assignment (gotobed system)');
                console.log(`✅ [${timeStr}] Added role ${role.name} to ${member.user.tag}`);
            } else if (!shouldHave && currentlyHas) {
                await member.roles.remove(role, 'Scheduled role removal (gotobed system)');
                console.log(`🗑️ [${timeStr}] Removed role ${role.name} from ${member.user.tag}`);
            }
        } catch (error) {
            console.error('Error in role scheduler:', error);
        }
    }

}

module.exports = RoleScheduler;
