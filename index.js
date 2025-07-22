require("dotenv").config();
const { Client } = require("discord.js-selfbot-v13");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const client = new Client();
const voiceChannelId = "1397149731205021736";
const guildId = "1258074801139089418";
function connectToVC() {
  try {
    joinVoiceChannel({
      channelId: voiceChannelId,
      guildId: guildId,
      adapterCreator: client.guilds.cache.get(guildId).voiceAdapterCreator,
      selfMute: false,
      selfDeaf: false
    });
    console.log("🎙️ Joined voice channel successfully");
  } catch (err) {
    console.error("❌ Failed to join voice channel:", err);
  }
}
client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  connectToVC();
});

setInterval(() => {
  const connection = getVoiceConnection(guildId);
  if (!connection || connection.state.status === "disconnected") {
    console.log("🔌 Voice connection lost. Attempting to reconnect in 5 seconds...");
    setTimeout(() => {
      connectToVC();
    }, 5000);
  }
}, 10000);
client.login(process.env.DISCORD_TOKEN);
