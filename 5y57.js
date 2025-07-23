require("dotenv").config();
const { Client } = require("discord.js-selfbot-v13");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const c = new Client();
const gId = "1258074801139089418";
const vId = "1397149731205021736";
const vc = () => {
  const g = c.guilds.cache.get(gId);
  if (!g) return;
  joinVoiceChannel({
    channelId: vId,
    guildId: gId,
    adapterCreator: g.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: false
  });
};
c.on("ready", () => {
  console.log(`${c.user.tag}`);
  vc();
  setInterval(() => {
    const cn = getVoiceConnection(gId);
    if (!cn || cn.state.status === "disconnected") vc();
  }, 1e4);
});
c.login(process.env.DISCORD_TOKEN);
