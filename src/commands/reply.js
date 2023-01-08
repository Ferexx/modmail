const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const config = require('../cfg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reply')
        .setDescription('manage the replies to the user in the thread')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('edit')
            .setDescription('edit a previously sent message')
            .addIntegerOption(option =>
                option.setName('message_number')
                    .setDescription('the number of the message to edit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('the new content of the message')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('delete')
            .setDescription('delete a previously sent message')
            .addIntegerOption(option =>
                option.setName('message_number')
                    .setDescription('the number of the message to delete')
                    .setRequired(true))),
    
    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        if (!thread) {
            interaction.reply('This command must be executed in a thread')
            return
        }
        switch(interaction.options.getSubcommand()) {
            case 'edit':
                editMessage(interaction, thread)
                break
            case 'delete':
                deleteMessage(interaction, thread)
                break
        }
    }    
}

async function editMessage(interaction, thread) {
    if (!config.allowStaffEdit) {
        interaction.reply('You are not allowed to edit messages')
        return
    }
    const threadMessage = await thread.findThreadMessageByMessageNumber(interaction.options.getInteger('message_number'))
    if (!threadMessage) {
        interaction.reply('Unknown message number')
        return
    }
    if (threadMessage.user_id !== interaction.user.id) {
        interaction.reply('You can only edit your own replies')
        return
    }
    const edited = await thread.editStaffReply(threadMessage, interaction.options.getString('text'))
    if (edited) {
        interaction.reply({ content: 'Message edited', ephemeral: true })
    }
}

async function deleteMessage(interaction, thread) {
    if (!config.allowStaffDelete) {
        interaction.reply('You are not allowed to delete messages')
        return
    }
    const threadMessage = await thread.findThreadMessageByMessageNumber(interaction.options.getInteger('message_number'))
    if (!threadMessage) {
        interaction.reply('Unknown message number')
        return
    }
    if (threadMessage.user_id !== interaction.user.id) {
        interaction.reply('You can only delete your own replies')
        return
    }
    await thread.deleteStaffReply(threadMessage)
    interaction.reply({ content: 'Message deleted', ephemeral: true })
}