const { SlashCommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const fs = require('fs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pose')
        .setDescription('Prompt user for a selfie pose')
        .addStringOption(option =>
            option.setName('pose')
                .setDescription('Specific pose to send')
                .setRequired(false)
                .setAutocomplete(true)),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        const pose = interaction.options.getString('pose')
        const poses = JSON.parse(fs.readFileSync(__dirname + '/../../poses.json'))

        let poseToSend
        if (pose) {
            poseToSend = poses[pose.toLowerCase()]
            if (!poseToSend) {
                interaction.reply('Couldn\'t find that pose')
                return
            }
        } else {
            do {
                const rand = Math.floor(Math.random() * Object.keys(poses).length)
                poseToSend = Object.values(poses)[rand]
            } while (Object.keys(poses).find(key => poses[key] === poseToSend) === 'time')
        }

        interaction.reply('Pose sent')

        thread.sendSystemMessageToUser('Please send us a selfie of you ' + poseToSend)
        thread.sendSystemMessageToUser(poses.time)
    }
}
