const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const { getLogUrl, saveLogToStorage } = require("../data/logs");
const LOG_LINES_PER_PAGE = 10
const hooks = require('../hooks/afterThreadClose')
const utils = require('../utils')
const moment = require('moment')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Print links to logs for this user')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Which page of logs to print (' + LOG_LINES_PER_PAGE + ' per page)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('the ID of the user to print logs for')
                .setRequired(false)),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        const pageOption = interaction.options.getInteger('page')
        const inputPage = pageOption ? pageOption : 1
        if (inputPage < 0) {
            interaction.reply('Page cannot be less than 0')
            return
        }
        if (thread && interaction.options.getString('user_id')) {
            interaction.reply('If you want to get logs for a specific user, don\'t run this command in a thread')
            return
        }
        if (!thread && !interaction.options.getString('user_id')) {
            interaction.reply('Please supply a user ID when running this command outside a thread.')
            return
        }

        const userId = thread ? thread.user_id : interaction.options.getString('user_id')
        let closedThreads = await threads.getClosedThreadsByUserId(userId)
        // Descending by date
        closedThreads.sort((a, b) => {
            if (a.created_at > b.created_at) return -1;
            if (a.created_at < b.created_at) return 1;
            return 0;
        });

        const totalUserThreads = closedThreads.length
        const maxPage = Math.ceil(totalUserThreads / LOG_LINES_PER_PAGE)
        const page = Math.max(Math.min(inputPage, maxPage), 1); // Clamp page to 1-<max page>
        const isPaginated = totalUserThreads > LOG_LINES_PER_PAGE;
        const start = (page - 1) * LOG_LINES_PER_PAGE;
        const end = page * LOG_LINES_PER_PAGE;
        closedThreads = closedThreads.slice((page - 1) * LOG_LINES_PER_PAGE, page * LOG_LINES_PER_PAGE);

        const threadLines = await Promise.all(closedThreads.map(async userThread => {
        const logUrl = await getLogUrl(userThread);
        const formattedLogUrl = logUrl
            ? `<${logUrl}>`
            : `View log with \`${config.prefix}log ${userThread.thread_number}\``
        const formattedDate = moment.utc(userThread.created_at).format("MMM Do [at] HH:mm [UTC]");
        return `\`#${userThread.thread_number}\` \`${formattedDate}\`: ${formattedLogUrl}`;
        }));

        let message = isPaginated
        ? `**Log files for <@${userId}>** (page **${page}/${maxPage}**, showing logs **${start + 1}-${end}/${totalUserThreads}**):`
        : `**Log files for <@${userId}>:**`;

        message += `\n${threadLines.join("\n")}`;

        if (isPaginated) {
        message += "\nTo view more, add a page number to the end of the command";
        }

        if (threadLines.length === 0) message = `**There are no log files for <@${userId}>**`;
        
        // Send the list of logs in chunks of 15 lines per message
        const lines = message.split("\n");
        const chunks = utils.chunk(lines, 15);

        let root = Promise.resolve();
        chunks.forEach(chunkLines => {
        root = root.then(() => interaction.reply(chunkLines.join("\n")));
        });
    }
}

hooks.afterThreadClose(async ({ threadId }) => {
    const thread = await threads.findById(threadId);
    await saveLogToStorage(thread);
});