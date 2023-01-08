const { SlashCommandBuilder } = require('discord.js')
const { THREAD_MESSAGE_TYPE } = require('../data/constants')
const threads = require('../data/threads')
const { getLogUrl, getLogFile, getLogCustomResponse } = require("../data/logs")
const utils = require('../utils')
const moment = require("moment");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close this thread')
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Time from now in minutes that this thread should be closed')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('cancel')
                .setDescription('Remove a scheduled close from a thread')
                .setRequired(false)),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        if (!thread) {
            interaction.reply('This command must be executed in a thread.')
            return
        }
        if (interaction.options.getBoolean('cancel') !== null && interaction.options.getInteger('minutes') !== null) {
            interaction.reply('Cannot have both cancel and minutes option.')
            return
        }
        
        if (interaction.options.getBoolean('cancel') === true) {
            if (thread.scheduled_close_at) {
                await thread.cancelScheduledClose()
                interaction.reply('Cancelled scheduled closing.')
                return
            }
        }

        if (interaction.options.getInteger('minutes') !== null) {
            const minutes = interaction.options.getInteger('minutes')
            if (minutes <= 0) {
                interaction.reply('Minutes must be greater than 0')
                return
            }
            const ms = minutes * 60 * 1000
            const closeAt = moment.utc().add(ms, 'ms')
            await thread.scheduleClose(closeAt.format('YYYY-MM-DD HH:mm:ss'), interaction.user, 0)
            interaction.reply(`Thread is now scheduled to be closed in ${minutes} minutes. Use \`/close cancel:true\` to cancel.`)
            return
        }

        await thread.close(false, true)
        await sendCloseNotification(thread, `Modmail thread #${thread.thread_number} with ${thread.user_name} (${thread.user_id}) was closed as scheduled by ${thread.scheduled_close_name}`)
    }
}

async function getMessagesAmounts(thread) {
    const messages = await thread.getThreadMessages()
    const chatMessages = []
    const toUserMessages = []
    const fromUserMessages = []

    messages.forEach(message => {
        switch(message.message_type) {
            case THREAD_MESSAGE_TYPE.CHAT:
                chatMessages.push()
                break
            case THREAD_MESSAGE_TYPE.TO_USER:
                toUserMessages.push()
                break
            case THREAD_MESSAGE_TYPE.FROM_USER:
                fromUserMessages.push()
                break
        }
    })

    let amounts = `**${fromUserMessages.length}** message${fromUserMessages.length >= 2 ? "s" : ""} from the user`;

    amounts = `${amounts}, **${toUserMessages.length}** message${toUserMessages.length >= 2 ? "s" : ""} to the user`;
    amounts = `${amounts} and **${chatMessages.length}** internal chat message${toUserMessages.length >= 2 ? "s" : ""}.`;

    return amounts;
}

// Check for threads that are scheduled to be closed and close them
async function applyScheduledCloses() {
    const threadsToBeClosed = await threads.getThreadsThatShouldBeClosed();
    for (const thread of threadsToBeClosed) {
        await thread.close(false, true);

        await sendCloseNotification(thread, `Modmail thread #${thread.thread_number} with ${thread.user_name} (${thread.user_id}) was closed as scheduled by ${thread.scheduled_close_name}`);
    }
}

async function sendCloseNotification(thread, body) {
    const logCustomResponse = await getLogCustomResponse(thread);
    if (logCustomResponse) {
        await utils.postLog(body);
        await utils.postLog(logCustomResponse.content, logCustomResponse.file);
        return;
    }

    body = `${body}\n${await getMessagesAmounts(thread)}`;

    const logUrl = await getLogUrl(thread);
    if (logUrl) {
        utils.postLog(utils.trimAll(`
            ${body}
            Logs: ${logUrl}
        `));
        return;
    }

    const logFile = await getLogFile(thread);
    if (logFile) {
        utils.postLog(body, logFile);
        return;
    }

    utils.postLog(body);
  }

async function scheduledCloseLoop() {
    try {
        await applyScheduledCloses();
    } catch (e) {
        console.error(e);
    }

    setTimeout(scheduledCloseLoop, 2000);
}

scheduledCloseLoop();