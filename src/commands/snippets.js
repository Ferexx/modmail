const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const threads = require('../data/threads')
const snippets = require("../data/snippets");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snippets')
        .setDescription('Manage snippets')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('create')
            .setDescription('Create a new snippet')
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The string that will trigger the snippet')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('The string that will replace the trigger')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('edit')
            .setDescription('Edit an existing snippet')
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The name of the snippet to edit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('text')
                    .setDescription('The new string that will replace the trigger')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('delete')
            .setDescription('Delete an existing snippet')
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The trigger for the snippet to be deleted')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('list')
            .setDescription('List existing snippets')),

    async execute(interaction) {
        if (await threads.findOpenThreadByChannelId(interaction.channelId)) {
            interaction.reply('Don\'t run these commands in a thread you psycho.')
            return
        }
        switch(interaction.options.getSubcommand()) {
            case 'create':
                createSnippet(interaction)
                break
            case 'edit':
                editSnippet(interaction)
                break
            case 'delete':
                deleteSnippet(interaction)
                break
            case 'list':
                listSnippets(interaction)
        }
    }
}

async function createSnippet(interaction) {
    const snippet = await snippets.get(interaction.options.getString('trigger'))
    if (snippet) {
        interaction.reply('This snippet already exists')
        return
    }
    await snippets.add(interaction.options.getString('trigger'), interaction.options.getString('text'), interaction.member.id)
    interaction.reply('Snippet created!')
}

async function editSnippet(interaction) {
    const trigger = interaction.options.getString('trigger')
    const snippet = await snippets.get(trigger)
    if (!snippet) {
        interaction.reply('Snippet doesn\'t exist!')
        return
    }
    await snippets.del(trigger)
    await snippets.add(trigger, interaction.options.getString('text'), interaction.member.id)
    interaction.reply('Snippet edited!')
}

async function deleteSnippet(interaction) {
    const snippet = await snippets.get(interaction.options.getString('trigger'))
    if (!snippet) {
        interaction.reply('Snippet does not exist')
        return
    }
    await snippets.del(interaction.options.getString('trigger'))
    interaction.reply('Snippet deleted!')
}

async function listSnippets(interaction) {
    const allSnippets = await snippets.all()
    const triggers = allSnippets.map(s => s.trigger)
    triggers.sort()

    if (triggers.length > 0) {
        interaction.reply(triggers.toString())
    } else {
        interaction.reply('No snippets')
    }
}