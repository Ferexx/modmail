const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const { setModeratorThreadRoleOverride, setModeratorDefaultRoleOverride } = require('../data/displayRoles')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Change the role that is displayed when you send a message to a user')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('the role to display')
                .setRequired(true)),

    async execute(interaction) {
        const role = interaction.options.getRole('role')
        if (!interaction.member.roles.cache.has(role.id)) {
            interaction.reply('You don\'t have that role')
            return
        }

        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        if (thread) {
            await setModeratorThreadRoleOverride(interaction.member.id, thread.id, role.id)
            interaction.reply('Your display role has been to ' + role.name + ' for this thread')
        } else {
            await setModeratorDefaultRoleOverride(interaction.member.id, role.id)
            interaction.reply('Your default display role has been set to ' + role.name)
        }
    }
}