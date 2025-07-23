require("dotenv").config();
const { Client } = require("discord.js-selfbot-v13");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Selfbot is running"));
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`HTTP server running on port ${port}`);
});
const c = new Client();
const gId = "1397403162511409192";
const vId = "1397403830559178814";
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
