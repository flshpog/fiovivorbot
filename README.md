# Fiovivor Discord Bot

A comprehensive Discord bot built with Discord.js v14 for the Fiovivor server, featuring both slash commands and prefix commands for most functionality.

## Features

###  **Ticket System**
- Embed with button for ticket creation
- Private channels for support
- Automatic welcome messages with links and instructions

###  **Welcome/Goodbye System**
- Welcome messages with member count and ordinal suffixes
- Goodbye messages when members leave
- Configurable join log channel

###  **Custom Commands**
- Create, delete, and list custom commands via slash commands
- Use custom commands with prefix (`!commandname`)
- Persistent storage in JSON files

###  **Image Processing**
- Grayscale filter for images using Jimp
- Support for attachments and URLs
- Both slash and prefix command support

###  **Speech-to-Text (Placeholder)**
- Detects Discord voice messages
- Placeholder implementation ready for STT API integration
- Comments and structure for easy API addition

###  **ORG-Specific Commands**
- **Alliance**: Create private alliance channels with role permissions
- **Sort Category**: Alphabetically sort channels within categories  
- **Snowflake**: Convert Discord IDs to timestamps with comparison
- **Stopwatch**: Multi-user stopwatch system with persistent storage
- **Rocks**: Random player elimination from lists
- **Announce**: Send messages to all confessional channels
- **Channel Move**: Move channels between categories
- **Castaway Channel Setup**: Bulk create confessional and submission channels

###  **Utility Commands**
- **Say**: Send messages to specific channels
- Both slash and prefix command support for most commands

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd fiovivor-discord-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   - Copy `.env.example` to `.env`
   - Fill in your bot token and other configuration values

4. **Update configuration IDs:**
   Each command file has a `CONFIG` section at the top with placeholder IDs. Update these with your actual Discord IDs:

   **src/events/guildMemberAdd.js & guildMemberRemove.js:**
   ```javascript
   const CONFIG = {
       JOIN_LOG_CHANNEL_ID: "YOUR_ACTUAL_CHANNEL_ID",
   };
   ```

   **src/commands/mod/ticket-setup.js:**
   ```javascript
   const CONFIG = {
       APPLY_HERE_CHANNEL_ID: "YOUR_ACTUAL_CHANNEL_ID",
       TICKETS_CATEGORY_ID: "YOUR_ACTUAL_CATEGORY_ID",
       STAFF_ROLE_ID: "YOUR_ACTUAL_ROLE_ID",
   };
   ```

   **src/commands/mod/announce.js:**
   ```javascript
   const CONFIG = {
       CONFESSIONAL_CATEGORY_ID: "YOUR_ACTUAL_CATEGORY_ID",
   };
   ```

5. **Update the main configuration:**
   In `src/index.js`, update:
   ```javascript
   client.config = {
       prefix: '!', // Your desired prefix
       token: 'YOUR_BOT_TOKEN',
   };
   ```

   In `src/events/ready.js`, replace `YOUR_GUILD_ID` with your server ID.

6. **Create data directory:**
   ```bash
   mkdir data
   ```

7. **Start the bot:**
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## Bot Permissions

Your bot needs the following permissions:
- `Send Messages`
- `Use Slash Commands`
- `Manage Channels`
- `Manage Messages`
- `Read Message History`
- `Connect` (for voice message detection)
- `Embed Links`
- `Attach Files`
- `Use External Emojis`
- `Add Reactions`
- `Manage Roles` (for alliance command)

## Folder Structure

```
src/
├── commands/
│   ├── custom/          # Custom command management
│   ├── mod/             # Moderation commands (tickets, announce, etc.)
│   ├── org/             # ORG-specific commands (alliance, rocks, etc.)
│   ├── system/          # System commands (STT handler)
│   └── util/            # Utility commands (grayscale, say, etc.)
├── events/              # Discord event handlers
├── utils/               # Helper functions (if needed)
└── index.js             # Main bot file
data/                    # JSON data storage
├── customCommands.json  # Custom commands storage
└── stopwatches.json     # Stopwatch data storage
```

## Command Usage

### Slash Commands
All major functionality is available via slash commands:
- `/ticket-setup` - Set up ticket system
- `/addcustomcommand` - Add custom command
- `/alliance` - Create alliance channel
- `/grayscale` - Convert image to grayscale
- `/stopwatch start` - Start stopwatch
- And many more...

### Prefix Commands  
Most commands also work with the configured prefix:
- `!grayscale [image]` - Convert image to grayscale
- `!say #channel message` - Send message to channel
- `!snowflake <id1> [id2]` - Convert snowflakes to timestamps
- `!customcommandname` - Use any created custom command

## STT Integration

The STT feature is currently a placeholder. To implement real speech-to-text:

1. Choose an STT service (OpenAI Whisper, Google Cloud Speech, Azure, etc.)
2. Update the `src/commands/system/stt-handler.js` file
3. Install additional dependencies as needed
4. Add API keys to your `.env` file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the console logs for error messages
2. Ensure all IDs in CONFIG sections are updated
3. Verify bot permissions
4. Check that required channels and categories exist

## License

This project is licensed under the MIT License - see the LICENSE file for details.