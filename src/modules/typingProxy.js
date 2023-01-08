const config = require("../cfg");
const threads = require("../data/threads");
const Discord = require('discord.js')

module.exports = ({ bot }) => {
  // Typing proxy: forwarding typing events between the DM and the modmail thread
  if(config.typingProxy || config.typingProxyReverse) {
    bot.on("typingStart", async (channel, user) => {
      if (!user) {
        // If the user doesn't exist in the bot's cache, it will be undefined here
        return;
      }

      // config.typingProxy: forward user typing in a DM to the modmail thread
      if (config.typingProxy && (channel instanceof Discord.DMChannel)) {
        const thread = await threads.findOpenThreadByUserId(user.id);
        if (!thread) return;

        try {
          bot.channels.fetch(thread.channel_id)
            .then(channel => channel.sendTyping())
        } catch (e) {}
      }

      // config.typingProxyReverse: forward moderator typing in a thread to the DM
      else if (config.typingProxyReverse && (channel instanceof Discord.GuildChannel) && !user.bot) {
        const thread = await threads.findByChannelId(channel.id);
        if (!thread) return;

        const dmChannel = thread.getDMChannel();
        if (!dmChannel) return;

        try {
          dmChannel.sendTyping()
        } catch(e) {}
      }
    });
  }
};
