const Discord = require('discord.js-selfbot-v13');
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("discord token");
    process.exit(1);
}

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        status: "idle",
    });
});
client.login(token).catch(err => {
    console.error("Failed to login:", err);
});
