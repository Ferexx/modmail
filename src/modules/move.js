const transliterate = require("transliteration");
const Discord = require('discord.js')
const { Routes } = require("discord-api-types/v10");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowMove) return;

  commands.addInboxThreadCommand("move", "<category:string$>", async (msg, args, thread) => {
    const searchStr = args.category;
    const normalizedSearchStr = transliterate.slugify(searchStr);

    const channel = msg.channel
    const categories = channel.guild.channels.cache.filter(c => {
      // Filter to categories that are not the thread's current parent category
      return (c instanceof Discord.CategoryChannel) && (c.id !== channel.parentID);
    });

    if (categories.length === 0) return;

    // See if any category name contains a part of the search string
    const containsRankings = categories.map(cat => {
      const normalizedCatName = transliterate.slugify(cat.name);

      let i = 0;
      do {
        if (! normalizedCatName.includes(normalizedSearchStr.slice(0, i + 1))) break;
        i++;
      } while (i < normalizedSearchStr.length);

      if (i > 0 && normalizedCatName.startsWith(normalizedSearchStr.slice(0, i))) {
        // Slightly prioritize categories that *start* with the search string
        i += 0.5;
      }

      return [cat, i];
    });

    // Sort by best match
    containsRankings.sort((a, b) => {
      return a[1] > b[1] ? -1 : 1;
    });

    if (containsRankings[0][1] === 0) {
      thread.postSystemMessage("No matching category");
      return;
    }

    const targetCategory = containsRankings[0][0];

    try {
      await (await bot.channels.fetch(thread.channel_id)).setParent(targetCategory.id, { lockPermissions: config.syncPermissionsOnMove });
    } catch (e) {
      thread.postSystemMessage(`Failed to move thread: ${e.message}`);
      return;
    }

    thread.postSystemMessage(`Thread moved to ${targetCategory.name.toUpperCase()}`);
  });
};
