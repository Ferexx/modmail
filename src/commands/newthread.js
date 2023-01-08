const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newthread')
        .setDescription('create a new thread')
        .addStringOption(option => 
            option.setName('user_id')
                .setDescription('the id of the user to create the thread with')
                .setRequired(true)),
    
    async execute(interaction) {
        const userId = interaction.options.getString('user_id')
        const user = await interaction.client.users.fetch(userId)
        if (!user) {
            interaction.reply('Could not find this user, try again with a real person')
            return
        }
        let thread = await threads.findOpenThreadByUserId(userId)
        if (thread) {
            interaction.reply('There\'s already an open thread with this user <#' + thread.channel_id + '>')
            return
        }

        thread = await threads.createNewThreadForUser(user, {
            ignoreRequirements: true,
            ignoreHooks: true,
            source: 'command'
        })
        
        if (thread) {
            thread.postSystemMessage('Thread was opened by <@' + interaction.user.id + '>')
            interaction.reply('Thread created: <#' + thread.channel_id + '>')
            return
        }
        interaction.reply('Could find this user, try again with a real person')
    }
}