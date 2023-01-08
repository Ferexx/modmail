const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('id')
        .setDescription('Get this user\'s ID'),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)

        interaction.reply(thread.user_id)
    }
}