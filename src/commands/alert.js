const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alert')
        .setDescription('Ping you once this thread get a new reply')
        .addBooleanOption(option =>
            option.setName('cancel')
                .setDescription('Cancel your alert in this thread')
                .setRequired(false)),

    async execute(interaction) {
        const thread = await threads.findByChannelId(interaction.channelId)
        if (!thread) interaction.reply('This command can only be executed in a thread.')

        if (interaction.options.getBoolean('cancel') === true) {
            await thread.removeAlert(interaction.user.id)
            interaction.reply('Cancelled new message alert')
        } else {
            await thread.addAlert(interaction.user.id)
            interaction.reply('Pinging <@' + interaction.user.id + '> when this thread gets a new reply')
        }
    }
}