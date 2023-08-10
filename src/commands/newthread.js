const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const utils = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newthread')
        .setDescription('create a new thread')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('the id of the user to create the thread with')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('the category to create the new channel in')
                .setRequired(false)),

    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true)
        let category = interaction.options.getString('category', false)
        if (!category) {
            category = utils.getInboxGuild().channels.cache.find(channel => channel.name === 'new')
        } else {
            category = utils.getInboxGuild().channels.cache.find(channel => channel.name === category)
        }
        const member = await utils.getMainGuilds().at(0).members.fetch(userId)
        if (!member) {
            interaction.reply('Could not find this user, try again with a real person')
            return
        }
        let thread = await threads.findOpenThreadByUserId(userId)
        if (thread) {
            interaction.reply('There\'s already an open thread with this user: <#' + thread.channel_id + '>')
            return
        }

        thread = await threads.createNewThreadForUser(member.user, {
            categoryId: category.id,
            ignoreRequirements: true,
            ignoreHooks: true,
            quiet: true,
            source: 'command'
        })

        if (thread) {
            thread.postSystemMessage('Thread was opened by <@' + interaction.user.id + '>')
            interaction.reply('Thread created: <#' + thread.channel_id + '>')
            return
        }
        interaction.reply('Could not find this user, try again with a real person')
    }
}
