const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs-extra');
dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const dbPath = './calendar.json';

if (!fs.existsSync(dbPath)) {
    fs.writeJsonSync(dbPath, {});
}

client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('?') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const userId = message.author.id;
    const db = await fs.readJson(dbPath);

    if (!db[userId]) {
        db[userId] = [];
    }

    if (command === 'calendrier') {
        const tasks = db[userId];
        if (tasks.length === 0) {
            message.reply("Ton calendrier est vide.");
        } else {
            const list = tasks.map((t, i) => `**${i+1}.** ${t.name} -> ${t.date}`).join('\n');
            message.reply(`Ton calendrier :\n${list}`);
        }
    }

    if (command === 'add-calendar') {
        const name = args.slice(0, -3).join(' ');
        const day = args[args.length - 3];
        const month = args[args.length - 2];
        const year = args[args.length - 1];

        if (!name || !day || !month || !year) {
            return message.reply('Utilisation correcte: `?add-calendar nom day month year`');
        }

        const date = `${day}/${month}/${year}`;
        db[userId].push({ name, date });
        await fs.writeJson(dbPath, db, { spaces: 2 });
        message.reply(`Ajouté **${name}** pour le **${date}** à ton calendrier.`);
    }

    if (command === 'supp-calendar') {
        const name = args.join(' ');
        if (!name) {
            return message.reply('Utilisation correcte: `?supp-calendar nom de la tâche`');
        }

        const index = db[userId].findIndex(t => t.name.toLowerCase() === name.toLowerCase());
        if (index === -1) {
            return message.reply("Tâche non trouvée !");
        }

        db[userId].splice(index, 1);
        await fs.writeJson(dbPath, db, { spaces: 2 });
        message.reply(`La tâche **${name}** a été supprimée.`);
    }

    if (command === 'fais') {
        const name = args.join(' ');
        if (!name) {
            return message.reply('Utilisation correcte: `?fais nom de la tâche`');
        }

        const task = db[userId].find(t => t.name.toLowerCase() === name.toLowerCase());
        if (!task) {
            return message.reply("Tâche non trouvée !");
        }

        message.reply(`Bravo ! Tu as effectué **${task.name}** prévue pour le **${task.date}**.`);
    }
});

client.login(process.env.TOKEN);
