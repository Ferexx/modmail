const utils = require("../utils");
const {
  setModeratorDefaultRoleOverride,
  resetModeratorDefaultRoleOverride,

  setModeratorThreadRoleOverride,
  resetModeratorThreadRoleOverride,

  getModeratorThreadDisplayRoleName,
  getModeratorDefaultDisplayRoleName,
} = require("../data/displayRoles");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowChangingDisplayRole) {
    return;
  }

  function resolveRoleInput(input) {
    if (utils.isSnowflake(input)) {
      return utils.getInboxGuild().roles.get(input);
    }

    return utils.getInboxGuild().roles.cache.find(r => r.name.toLowerCase() === input.toLowerCase());
  }

  // Get display role for a thread
  commands.addInboxThreadCommand("role", [], async (msg, args, thread) => {
    const displayRole = await getModeratorThreadDisplayRoleName(msg.member, thread.id);
    if (displayRole) {
      thread.postSystemMessage(`Your display role in this thread is currently **${displayRole}**`);
    } else {
      thread.postSystemMessage("Your replies in this thread do not currently display a role");
    }
  }, { allowSuspended: true });

  // Reset display role for a thread
  commands.addInboxThreadCommand("role reset", [], async (msg, args, thread) => {
    await resetModeratorThreadRoleOverride(msg.member.id, thread.id);

    const displayRole = await getModeratorThreadDisplayRoleName(msg.member, thread.id);
    if (displayRole) {
      thread.postSystemMessage(`Your display role for this thread has been reset. Your replies will now display the default role **${displayRole}**.`);
    } else {
      thread.postSystemMessage("Your display role for this thread has been reset. Your replies will no longer display a role.");
    }
  }, {
    aliases: ["role_reset", "reset_role"],
    allowSuspended: true,
  });

  // Set display role for a thread
  commands.addInboxThreadCommand("role", "<role:string$>", async (msg, args, thread) => {
    const role = resolveRoleInput(args.role);
    if (! role || ! msg.member.roles.cache.find(ele => ele.id === role.id)) {
      thread.postSystemMessage("No matching role found. Make sure you have the role before trying to set it as your display role in this thread.");
      return;
    }

    await setModeratorThreadRoleOverride(msg.member.id, thread.id, role.id);
    thread.postSystemMessage(`Your display role for this thread has been set to **${role.name}**. You can reset it with \`${config.prefix}role reset\`.`);
  }, { allowSuspended: true });

  // Get default display role
  commands.addInboxServerCommand("role", [], async (msg, args, thread) => {
    const channel = msg.channel
    const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
    if (displayRole) {
      channel.send(`Your default display role is currently **${displayRole}**`);
    } else {
      channel.send("Your replies do not currently display a role by default");
    }
  });

  // Reset default display role
  commands.addInboxServerCommand("role reset", [], async (msg, args, thread) => {
    await resetModeratorDefaultRoleOverride(msg.member.id);

    const channel = msg.channel
    const displayRole = await getModeratorDefaultDisplayRoleName(msg.member);
    if (displayRole) {
      channel.send(`Your default display role has been reset. Your replies will now display the role **${displayRole}** by default.`);
    } else {
      channel.send("Your default display role has been reset. Your replies will no longer display a role by default.");
    }
  }, {
    aliases: ["role_reset", "reset_role"],
  });

  // Set default display role
  commands.addInboxServerCommand("role", "<role:string$>", async (msg, args, thread) => {
    const channel = msg.channel
    const role = resolveRoleInput(args.role);
    if (! role || ! msg.member.roles.includes(role.id)) {
      channel.send("No matching role found. Make sure you have the role before trying to set it as your default display role.");
      return;
    }

    await setModeratorDefaultRoleOverride(msg.member.id, role.id);
    channel.send(`Your default display role has been set to **${role.name}**. You can reset it with \`${config.prefix}role reset\`.`);
  });
};
