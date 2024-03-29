const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const utils = require('../utils')
const cfg = require('../cfg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify the user')
        .addIntegerOption(option =>
            option.setName('day')
                .setDescription('The day (number) of their DOB')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('The month (number) of their DOB')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('year')
                .setDescription('The year (number) of their DOB')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('gender')
                .setDescription('m or f')
                .setRequired(true)),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        const gender = interaction.options.getString('gender').toLowerCase()
        if (!thread) {
            await interaction.reply('Command must be executed in a thread')
            return
        }
        let age = _calculateage(Date.parse(interaction.options.getInteger('year') + "-" + interaction.options.getInteger('month') + "-" + interaction.options.getInteger('day')))
        if (age < 18) {
            await interaction.reply('User is underage, please kick them.')
            return
        }

        const verificationChannel = utils.getMainGuilds().at(0).channels.cache.find(channel => channel.name === 'verified')

        verificationChannel.send({ embeds: [{"description": "**Member:**\n<@" + thread.user_id + ">\n**DOB**:\n" + interaction.options.getInteger('day') + "/" + interaction.options.getInteger('month') + "/" + interaction.options.getInteger('year') + "\n**Verified By:**\n<@" + interaction.member.id + ">" }]})
        const member = await utils.getMainGuilds().at(0).members.fetch(thread.user_id)
        await member.roles.add("1013496081272803415")
        await member.roles.remove("1013496081272803412")
        if (gender === 'f' || gender === 'female') {
            await member.roles.remove("1013496081369288879")
            await member.roles.add("1013496081369288880")
            thread.sendSystemMessageToUser(cfg['verifiedFemale'])
        } else if (gender === 'm' || gender === 'male') {
            thread.sendSystemMessageToUser(cfg['verifiedMale'])
        }
        if (age > 21) {
            await member.roles.add("1013496081272803414")
        }
        utils.getMainGuilds().at(0).channels.fetch("1013496082338156588")
            .then(channel => channel.send({ content: "Welcome <@" + thread.user_id + "> to Terra!! Please read our <#1013496082086494321> and grab some <#1013496082086494322>. Feel free to join our voice chats to get to know us! <@&1087586010076037140> please welcome our newwest member"}))
        await interaction.reply('User verified')
    }
}

function _calculateage(birthday){
    var agedifMs = Date.now() - birthday;
    var ageDate = new Date(agedifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}
