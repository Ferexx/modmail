const Discord = require('discord.js')
const utils = require("./utils");
const config = require("./cfg");
const ThreadMessage = require("./data/ThreadMessage");
const {THREAD_MESSAGE_TYPE} = require("./data/constants");
const moment = require("moment");
const bot = require("./bot");

/**
 * Function to format the DM that is sent to the user when a staff member replies to them via !reply
 * @callback FormatStaffReplyDM
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to send as a DM
 */

/**
 * Function to format a staff reply in a thread channel
 * @callback FormatStaffReplyThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format a user reply in a thread channel
 * @callback FormatUserReplyThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format the inbox channel notification for a staff reply edit
 * @callback FormatStaffReplyEditNotificationThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format the inbox channel notification for a staff reply deletion
 * @callback FormatStaffReplyDeletionNotificationThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format a system message in a thread channel
 * @callback FormatSystemThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format a system message sent to the user in a thread channel
 * @callback FormatSystemToUserThreadMessage
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to post in the thread channel
 */

/**
 * Function to format the DM that is sent to the user when the bot sends a system message to the user
 * @callback FormatSystemToUserDM
 * @param {ThreadMessage} threadMessage
 * @return {String|Promise<String>} Message content to send as a DM
 */

/**
 * @typedef {Object} FormatLogOptions
 * @property {Boolean?} simple
 * @property {Boolean?} verbose
 */

/**
 * @typedef {Object} FormatLogResult
 * @property {String} content Contents of the entire log
 * @property {*?} extra
 */

/**
 * @typedef {Object} FormatChatLogResult
 * @property {String} content Contents of the entire log
 * @property {*?} extra
 */

/**
 * Function to format the inbox channel notification for a staff reply deletion
 * @callback FormatLog
 * @param {Thread} thread
 * @param {ThreadMessage[]} threadMessages
 * @param {FormatLogOptions={}} opts
 * @return {FormatLogResult|Promise<FormatLogResult>}
 */

/**
 * Function to format the logs for staff chat thread
 * @callback FormatChatLog
 * @param {Thread} thread
 * @param {ThreadMessage[]} threadMessages
 * @return {FormatChatLogResult|Promise<FormatChatLogResult>}
 */

/**
 * @typedef MessageFormatters
 * @property {FormatStaffReplyDM} formatStaffReplyDM
 * @property {FormatStaffReplyThreadMessage} formatStaffReplyThreadMessage
 * @property {FormatUserReplyThreadMessage} formatUserReplyThreadMessage
 * @property {FormatStaffReplyEditNotificationThreadMessage} formatStaffReplyEditNotificationThreadMessage
 * @property {FormatStaffReplyDeletionNotificationThreadMessage} formatStaffReplyDeletionNotificationThreadMessage
 * @property {FormatSystemThreadMessage} formatSystemThreadMessage
 * @property {FormatSystemToUserThreadMessage} formatSystemToUserThreadMessage
 * @property {FormatSystemToUserDM} formatSystemToUserDM
 * @property {FormatLog} formatLog
 * @property {FormatChatLog} formatChatLog
 */

/**
 * @type {MessageFormatters}
 */
const defaultFormatters = {
  formatStaffReplyDM(threadMessage) {
    const roleName = threadMessage.role_name || config.fallbackRoleName;
    const modInfo = threadMessage.is_anonymous
      ? roleName
      : (roleName ? `(${roleName}) ${threadMessage.user_name}` : threadMessage.user_name);

    return modInfo
      ? `**${modInfo}:** ${threadMessage.body}`
      : threadMessage.body;
  },

  formatStaffReplyThreadMessage(threadMessage) {
    const roleName = threadMessage.role_name || config.fallbackRoleName;
    const modInfo = threadMessage.is_anonymous
      ? (roleName ? `(Anonymous) (${threadMessage.user_name}) ${roleName}` : `(Anonymous) (${threadMessage.user_name})`)
      : (roleName ? `(${roleName}) ${threadMessage.user_name}` : threadMessage.user_name);

    let result = modInfo
      ? `**${modInfo}:** ${threadMessage.body}`
      : threadMessage.body;

    if (config.threadTimestamps) {
      const formattedTimestamp = utils.getTimestamp(threadMessage.created_at);
      result = `[${formattedTimestamp}] ${result}`;
    }

    result = `\`${threadMessage.message_number}\`  ${result}`;

    return result;
  },

  formatUserReplyThreadMessage(threadMessage) {
    let result = `**${threadMessage.user_name}:** ${threadMessage.body}`;

    if (config.threadTimestamps) {
      const formattedTimestamp = utils.getTimestamp(threadMessage.created_at);
      result = `[${formattedTimestamp}] ${result}`;
    }

    return result;
  },

 formatStaffReplyEditNotificationThreadMessage(threadMessage) {
    const originalThreadMessage = threadMessage.getMetadataValue("originalThreadMessage");
    const newBody = threadMessage.getMetadataValue("newBody");

    let content = `**${originalThreadMessage.user_name}** (\`${originalThreadMessage.user_id}\`) edited reply \`${originalThreadMessage.message_number}\``;

    if (originalThreadMessage.body.length < 200 && newBody.length < 200) {
      // Show edits of small messages inline
      content += ` from \`${utils.disableInlineCode(originalThreadMessage.body)}\` to \`${newBody}\``;
    } else {
      // Show edits of long messages in two code blocks
      content += ":";
      content += `\n\nBefore:\n\`\`\`${utils.disableCodeBlocks(originalThreadMessage.body)}\`\`\``;
      content += `\nAfter:\n\`\`\`${utils.disableCodeBlocks(newBody)}\`\`\``;
    }

    return content;
  },

  formatStaffReplyDeletionNotificationThreadMessage(threadMessage) {
    const originalThreadMessage = threadMessage.getMetadataValue("originalThreadMessage");
    let content = `**${originalThreadMessage.user_name}** (\`${originalThreadMessage.user_id}\`) deleted reply \`${originalThreadMessage.message_number}\``;

    if (originalThreadMessage.body.length < 200) {
      // Show the original content of deleted small messages inline
      content += ` (message content: \`${utils.disableInlineCode(originalThreadMessage.body)}\`)`;
    } else {
      // Show the original content of deleted large messages in a code block
      content += ":\n```" + utils.disableCodeBlocks(originalThreadMessage.body) + "```";
    }

    return content;
  },

  formatSystemThreadMessage(threadMessage) {
    let result = threadMessage.body;

    for (const link of threadMessage.attachments) {
      result += `\n\n${link}`;
    }

    return result;
  },

  formatSystemToUserThreadMessage(threadMessage) {
    let result = `**⚙️ ${bot.user.username}:** ${threadMessage.body}`;

    for (const link of threadMessage.attachments) {
      result += `\n\n${link}`;
    }

    return result;
  },

  formatSystemToUserDM(threadMessage) {
    let result = threadMessage.body;

    for (const link of threadMessage.attachments) {
      result += `\n\n${link}`;
    }

    return result;
  },

  formatLog(thread, threadMessages) {
      const lines = threadMessages.map(message => {
      let line = `[${moment.utc(message.created_at).format("YYYY-MM-DD HH:mm:ss")}]`

      if (message.message_type === THREAD_MESSAGE_TYPE.FROM_USER) {
        line += ` [FROM USER] [${message.user_name}] ${message.body}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.TO_USER) {
          line += ` [TO USER] [${message.user_name}]`

        if (message.is_anonymous) {
          if (message.role_name) {
            line += ` (Anonymous) ${message.role_name}: ${message.body}`
          } else {
            line += ` (Anonymous) Moderator: ${message.body}`
          }
        } else {
          if (message.role_name) {
            line += ` (${message.role_name}) ${message.user_name}: ${message.body}`
          } else {
            line += ` ${message.user_name}: ${message.body}`
          }
        }
      } else if (message.message_type === THREAD_MESSAGE_TYPE.SYSTEM) {
        line += ` [BOT] ${message.body}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.SYSTEM_TO_USER) {
        line += ` [BOT TO USER] ${message.body}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.CHAT) {
        line += ` [CHAT] [${message.user_name}] ${message.body}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.COMMAND) {
        line += ` [COMMAND] [${message.user_name}] ${message.body}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.REPLY_EDITED) {
        const originalThreadMessage = message.getMetadataValue("originalThreadMessage");
        line += ` [REPLY EDITED] ${originalThreadMessage.user_name} edited reply ${originalThreadMessage.message_number}:`
        line += `<br><br>Before:<br>${originalThreadMessage.body}`
        line += `<br><br>After:<br>${message.getMetadataValue("newBody")}`
      } else if (message.message_type === THREAD_MESSAGE_TYPE.REPLY_DELETED) {
        const originalThreadMessage = message.getMetadataValue("originalThreadMessage")
        line += ` [REPLY DELETED] ${originalThreadMessage.user_name} deleted reply ${originalThreadMessage.message_number}:`
        line += `<br><br>${originalThreadMessage.body}`
      } else {
        line += ` [${message.user_name}] ${message.body}`
      }

      if (message.attachments.length) {
        line += "<br><br>"
        line += message.attachments.join("<br>")
      }

      return line
    })

    const htmlHeader = '<!doctype HTML><html><body><p>'
    const htmlCloser = '</p></body></html>'
    const openedAt = moment(thread.created_at).format("YYYY-MM-DD HH:mm:ss");
    const header = `# Modmail thread #${thread.thread_number} with ${thread.user_name} (${thread.user_id}) started at ${openedAt}. All times are in UTC+0.<br><a href="../chats/${thread.id}">View staff chats for this thread</a>`

    const fullResult = htmlHeader + header + "<br><br>" + lines.join("<br>") + htmlCloser

    return {
      content: fullResult,
    };
  },

  formatChatLog(thread, threadMessages) {
    const lines = threadMessages.map(message => {
      return `[${moment.utc(message.created_at).format("YYYY-MM-DD HH:mm:ss")}] [${message.user_name}] ${message.body} ${message.attachments}`
    })

    const htmlHeader = '<!doctype HTML><html><body><p>'
    const htmlCloser = '</p></body></html>'
    const openedAt = moment(thread.created_at).format("YYYY-MM-DD HH:mm:ss")
    const header = `# Modmail thread #${thread.thread_number} with ${thread.user_name} (${thread.user_id}) started at ${openedAt}. All times are in UTC+0.<br><a href="../logs/${thread.id}">View logs for this thread</a>`

    const fullResult = htmlHeader + header + "<br><br>" + lines.join("<br>") + htmlCloser

    return {
      content: fullResult,
    }
  }
}

/**
 * @type {MessageFormatters}
 */
const formatters = { ...defaultFormatters };

/**
 * @typedef {object} FormattersExport
 * @property {MessageFormatters} formatters Read only
 * @property {function(FormatStaffReplyDM): void} setStaffReplyDMFormatter
 * @property {function(FormatStaffReplyThreadMessage): void} setStaffReplyThreadMessageFormatter
 * @property {function(FormatUserReplyThreadMessage): void} setUserReplyThreadMessageFormatter
 * @property {function(FormatStaffReplyEditNotificationThreadMessage): void} setStaffReplyEditNotificationThreadMessageFormatter
 * @property {function(FormatStaffReplyDeletionNotificationThreadMessage): void} setStaffReplyDeletionNotificationThreadMessageFormatter
 * @property {function(FormatSystemThreadMessage): void} setSystemThreadMessageFormatter
 * @property {function(FormatSystemToUserThreadMessage): void} setSystemToUserThreadMessageFormatter
 * @property {function(FormatSystemToUserDM): void} setSystemToUserDMFormatter
 * @property {function(FormatLog): void} setLogFormatter
 */

/**
 * @type {FormattersExport}
 */
module.exports = {
  formatters: new Proxy(formatters, {
    set() {
      throw new Error("Please use the formatter setter functions instead of modifying the formatters directly");
    },
  }),

  setStaffReplyDMFormatter(fn) {
    formatters.formatStaffReplyDM = fn;
  },

  setStaffReplyThreadMessageFormatter(fn) {
    formatters.formatStaffReplyThreadMessage = fn;
  },

  setUserReplyThreadMessageFormatter(fn) {
    formatters.formatUserReplyThreadMessage = fn;
  },

  setStaffReplyEditNotificationThreadMessageFormatter(fn) {
    formatters.formatStaffReplyEditNotificationThreadMessage = fn;
  },

  setStaffReplyDeletionNotificationThreadMessageFormatter(fn) {
    formatters.formatStaffReplyDeletionNotificationThreadMessage = fn;
  },

  setSystemThreadMessageFormatter(fn) {
    formatters.formatSystemThreadMessage = fn;
  },

  setSystemToUserThreadMessageFormatter(fn) {
    formatters.formatSystemToUserThreadMessage = fn;
  },

  setSystemToUserDMFormatter(fn) {
    formatters.formatSystemToUserDM = fn;
  },

  setLogFormatter(fn) {
    formatters.formatLog = fn;
  },
};
