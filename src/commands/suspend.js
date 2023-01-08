const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suspend')
        .setDescription('Suspend a thread'),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        if (thread) {
            await thread.suspend()
            interaction.reply('Thread suspended')
            return
        } else {
            const suspendedThread = await threads.findSuspendedThreadByChannelId(interaction.channelId)
            if (suspendedThread) {
                const otherOpenThread = await threads.findOpenThreadByUserId(suspendedThread.user_id)
                if (otherOpenThread) {
                    interaction.reply('Cannot unsuspend, there is another thread open with this user: <#' + otherOpenThread.channel_id + '>')
                    return
                }
                await suspendedThread.unsuspend()
                interaction.reply('Thread unsuspended')
                return
            }
        }
        interaction.reply('Command must be run in a thread')
    }
}