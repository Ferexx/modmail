const { SlashCommandBuilder, Utils } = require('discord.js')
const threads = require('../data/threads')
const utils = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unverify')
        .setDescription('Remove all roles and add unverified role'),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)

        if (!thread) {
            interaction.reply('Command must be executed in a thread')
            return
        }
        const member = await utils.getMainGuilds().at(0).members.fetch(thread.user_id)
        await member.roles.set(['1013496081272803412'])
        
        interaction.reply('Unverified')
    }
}