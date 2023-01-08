const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const config = require('../cfg')
const blocked = require("../data/blocked")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('block')
        .setDescription('Block/unblock this user'),
    
    async execute(interaction) {
        if (!config.allowBlock) return

        const userId = (await threads.findOpenThreadByChannelId(interaction.channelId)).user_id
        const isBlocked = await blocked.isBlocked(userId)
        if (isBlocked) {
            blocked.unblock(userId)
            interaction.reply('Unlocked <@' + userId + '> from Modmail.')
        } else {
            blocked.block(userId)
            interaction.reply('Blocked <@' + userId + '> from Modmail indefinitely.')
        }

    }
}