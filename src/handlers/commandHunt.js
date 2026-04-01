const fs = require('fs');
const path = require('path');

const HUNT_PATH = path.join(__dirname, '../../data/commandHunt.json');
const HUNT_COMMANDS = ['velvet', 'fracture', 'neon', 'silence', 'rogue', 'abyss'];

function loadHuntData() {
    try {
        return JSON.parse(fs.readFileSync(HUNT_PATH, 'utf8'));
    } catch {
        const data = {};
        saveHuntData(data);
        return data;
    }
}

function saveHuntData(data) {
    fs.writeFileSync(HUNT_PATH, JSON.stringify(data, null, 2));
}

async function handleHuntCommand(message, commandName) {
    if (!HUNT_COMMANDS.includes(commandName)) return false;

    const userId = message.author.id;
    const data = loadHuntData();

    if (!data[userId]) {
        data[userId] = [];
    }

    // Already found this one
    if (data[userId].includes(commandName)) {
        const count = data[userId].length;
        await message.reply(`\u2705 ${count}/6`);
        return true;
    }

    data[userId].push(commandName);
    saveHuntData(data);

    const count = data[userId].length;

    if (count < 6) {
        await message.reply(`\u2705 ${count}/6`);
    } else {
        await message.reply(`\u2705 6/6`);
        await new Promise(r => setTimeout(r, 1000));
        await message.channel.send('https://klipy.com/gifs/closing-the-door-door-1');
        await new Promise(r => setTimeout(r, 1000));
        await message.channel.send('https://pycto.io/?hash=awmcMx8zffhxlJ3vfpzp4w');
    }

    return true;
}

module.exports = { handleHuntCommand, HUNT_COMMANDS };
