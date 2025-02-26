const humanizeDuration = require("humanize-duration");
const moment = require("moment");
const blocked = require("../data/blocked");
const utils = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowBlock) return;
  async function removeExpiredBlocks() {
    const expiredBlocks = await blocked.getExpiredBlocks();
    const logChannel = utils.getLogChannel();
    for (const userId of expiredBlocks) {
      await blocked.unblock(userId);
      logChannel.send({
        content: `Block of <@!${userId}> (id \`${userId}\`) expired`,
        allowedMentions: {
          users: [userId],
        },
      });
    }
  }

  async function expiredBlockLoop() {
    try {
      await removeExpiredBlocks();
    } catch (e) {
      console.error(e);
    }

    setTimeout(expiredBlockLoop, 2000);
  }

  expiredBlockLoop();

  const blockCmd = async (msg, args, thread) => {
    const userIdToBlock = args.userId || (thread && thread.user_id);
    if (! userIdToBlock) return;

    const channel = msg.channel

    const isBlocked = await blocked.isBlocked(userIdToBlock);
    if (isBlocked) {
      channel.send("User is already blocked");
      return;
    }

    const expiresAt = args.blockTime
      ? moment.utc().add(args.blockTime, "ms").format("YYYY-MM-DD HH:mm:ss")
      : null;

    const user = bot.users.cache.get(userIdToBlock);
    await blocked.block(userIdToBlock, (user ? user.username : ""), msg.author.id, expiresAt);

    if (expiresAt) {
      const humanized = humanizeDuration(args.blockTime, { largest: 2, round: true });
      msg.channel.send(`Blocked <@${userIdToBlock}> (id \`${userIdToBlock}\`) from modmail for ${humanized}`);

      const timedBlockMessage = config.timedBlockMessage || config.blockMessage;
      if (timedBlockMessage) {
        const dmChannel = await user.dmChannel;
        const formatted = timedBlockMessage
          .replace(/\{duration}/g, humanized)
          .replace(/\{timestamp}/g, moment.utc(expiresAt).format("X"));
        dmChannel.send(formatted).catch(utils.noop);
      }
    } else {
      msg.channel.send(`Blocked <@${userIdToBlock}> (id \`${userIdToBlock}\`) from modmail indefinitely`);

      if (config.blockMessage != null) {
        const dmChannel = await user.dmChannel || await user.createDM();
        dmChannel.send(config.blockMessage).catch(utils.noop);
      }
    }
  };

  commands.addInboxServerCommand("block", "<userId:userId> [blockTime:delay]", blockCmd);
  commands.addInboxServerCommand("block", "[blockTime:delay]", blockCmd);

  const unblockCmd = async (msg, args, thread) => {
    const userIdToUnblock = args.userId || (thread && thread.user_id);
    if (! userIdToUnblock) return;

    const isBlocked = await blocked.isBlocked(userIdToUnblock);
    if (! isBlocked) {
      msg.channel.send("User is not blocked");
      return;
    }

    const unblockAt = args.unblockDelay
      ? moment.utc().add(args.unblockDelay, "ms").format("YYYY-MM-DD HH:mm:ss")
      : null;

    const user = bot.users.cache.get(userIdToUnblock);
    if (unblockAt) {
      const humanized = humanizeDuration(args.unblockDelay, { largest: 2, round: true });
      await blocked.updateExpiryTime(userIdToUnblock, unblockAt);
      msg.channel.send(`Scheduled <@${userIdToUnblock}> (id \`${userIdToUnblock}\`) to be unblocked in ${humanized}`);

      const timedUnblockMessage = config.timedUnblockMessage || config.unblockMessage;
      if (timedUnblockMessage) {
        const dmChannel = await user.dmChannel;
        const formatted = timedUnblockMessage
          .replace(/\{delay}/g, humanized)
          .replace(/\{timestamp}/g, moment.utc(unblockAt).format("X"))
        dmChannel.send(formatted).catch(utils.noop);
      }
    } else {
      await blocked.unblock(userIdToUnblock);
      msg.channel.send(`Unblocked <@${userIdToUnblock}> (id ${userIdToUnblock}) from modmail`);

      if (config.unblockMessage) {
        const dmChannel = await user.dmChannel;
        dmChannel.send(config.unblockMessage).catch(utils.noop);
      }
    }
  };

  commands.addInboxServerCommand("unblock", "<userId:userId> [unblockDelay:delay]", unblockCmd);
  commands.addInboxServerCommand("unblock", "[unblockDelay:delay]", unblockCmd);

  commands.addInboxServerCommand("is_blocked",  "[userId:userId]", async (msg, args, thread) => {
    const userIdToCheck = args.userId || (thread && thread.user_id);
    if (! userIdToCheck) return;

    const blockStatus = await blocked.getBlockStatus(userIdToCheck);
    if (blockStatus.isBlocked) {
      if (blockStatus.expiresAt) {
        msg.channel.send({
          content: `<@!${userIdToCheck}> (id \`${userIdToCheck}\`) is blocked until ${blockStatus.expiresAt} (UTC)`,
          allowedMentions: { users: [userIdToCheck] },
        });
      } else {
        msg.channel.send({
          content: `<@!${userIdToCheck}> (id \`${userIdToCheck}\`) is blocked indefinitely`,
          allowedMentions: { users: [userIdToCheck] },
        });
      }
    } else {
      msg.channel.send({
        content: `<@!${userIdToCheck}> (id \`${userIdToCheck}\`) is NOT blocked`,
        allowedMentions: { users: [userIdToCheck] },
      });
    }
  });
};
