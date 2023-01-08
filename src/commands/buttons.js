const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('@discordjs/builders')
const { SlashCommandBuilder, ButtonStyle } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buttons')
        .setDescription('Send a message in this channel containing buttons to open a thread in a specific category'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Staff Communications')
            .setDescription('Here on Terra we want to make sure every member feels safe and heard. You always have the option to DM <@1013498455248883802> to report something. If you feel worried about any of your reports, you can also use the following buttons to open a DM with Nox and it will be auto-sorted to the appropriate section.\n\n✧ **Report a Staff Member**\n→ Clicking this button will open a thread with the bot that only the owner and a few admins are able to see, so you won\'t have to worry about anyone else seeing it.\n\n✧ **Report a Tech Issue**\n→ Clicking this button will open a thread directly with the tech oriented staff of the server. Use this for any bot glitches, bot issues, perms issues, etc.\n\n✧ **Donations**\n→ Clicking this will open a thread and send it directly to the donations sections. Use this for proof of you sending a donation or to ask any questions.\n\n✧ **Event Requests**\n→ Clicking this button will ping our heavily event oriented staff. Use this for any request or suggestions you have relating to events and someone will pick it up and work with you on it!')
            .setColor(3447003)
            .setFooter({
                text: "Terra 18+",
                iconURL: "https://i.imgur.com/TkSVmkc.jpg"
            })
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('b_staff_complaint').setStyle(ButtonStyle.Danger).setLabel('Staff Complaint'),
            new ButtonBuilder().setCustomId('b_tech_issue').setStyle(ButtonStyle.Primary).setLabel('Tech Issue'),
            new ButtonBuilder().setCustomId('b_donation').setStyle(ButtonStyle.Success).setLabel('Donation'),
            new ButtonBuilder().setCustomId('b_event_request').setStyle(ButtonStyle.Secondary).setLabel('Event Request')
        )
        interaction.channel.send({ embeds: [embed], components: [row] })
        interaction.reply({ content: 'Done!', ephemeral: true })
    }
}