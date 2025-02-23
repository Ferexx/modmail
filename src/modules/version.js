const utils = require("../utils");
const updates = require("../data/updates");
const { getPrettyVersion } = require("../botVersion");


module.exports = ({ bot, knex, config, commands }) => {
  commands.addInboxServerCommand("version", [], async (msg, args, thread) => {
    let response = `Modmail ${getPrettyVersion()}`;

    if (config.updateNotifications) {
      const availableUpdate = await updates.getAvailableUpdate();
      if (availableUpdate) {
        response += ` (version ${availableUpdate} available)`;
      }
    }

    utils.postSystemMessageWithFallback(msg.channel, thread, response);
  });
};
