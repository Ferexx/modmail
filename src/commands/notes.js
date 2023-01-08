const { SlashCommandBuilder, SlashCommandSubcommandBuilder, ThreadMemberFlags } = require('discord.js')
const threads = require('../data/threads')
const { findNotesByUserId, createUserNote, findNote, updateNote, deleteNote } = require("../data/notes");
const moment = require('moment')
const { START_CODEBLOCK, escapeMarkdown, END_CODEBLOCK, chunkMessageLines } = require('../utils')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notes')
        .setDescription('notes for a user')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('view')
            .setDescription('view existing notes for the user'))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('create')
            .setDescription('create a new note for the user')
            .addStringOption(option =>
                option.setName('note')
                    .setDescription('the note to be saved')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('update')
            .setDescription('update an existing note for the user')
            .addIntegerOption(option =>
                option.setName('note_id')
                    .setDescription('the id of the note to be updated')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('note')
                    .setDescription('the new text for the note')
                    .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('delete')
            .setDescription('delete an existing note')
            .addIntegerOption(option =>
                option.setName('note_id')
                    .setDescription('the id of the note to be deleted')
                    .setRequired(true))),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        const userIdOption = interaction.options.getString('user_id')
        const userId = thread ? thread.user_id : userIdOption
        if (!userId) {
            interaction.reply('Either execute this command in a thread, or specify a user ID')
            return
        }

        switch(interaction.options.getSubcommand()) {
            case 'view':
                viewUserNotes(interaction, userId)
                break
            case 'create':
                createNote(interaction, userId)
                break
            case 'update':
                updateUserNote(interaction, userId)
                break
            case 'delete':
                deleteUserNote(interaction, userId)
                break
        }
    }

}

async function viewUserNotes(interaction, userId) {
    const userNotes = await findNotesByUserId(userId)
    if (!userNotes.length) {
        interaction.reply(`No notes exist for <@!${userId}>`)
        return
    }
    interaction.reply('User notes:')
    for (const userNote of userNotes) {
        const timestamp = moment.utc(userNote.created_at).format('X')
        const content = [
            `Set by <@!${userNote.author_id}> at <t:${timestamp}:f>:`,
            `${START_CODEBLOCK}${escapeMarkdown(userNote.body)}${END_CODEBLOCK}`,
            `*Delete with /notes delete note_id:${userNote.id}\`*\n`,
        ].join("\n")
        const chunks = chunkMessageLines(content);
        for (const chunk of chunks) {
            interaction.channel.send(chunk)
        }
    }
}

function createNote(interaction, userId) {
    createUserNote(userId, interaction.user.id, interaction.options.getString('note'))
    interaction.reply('Note added')
}

function updateUserNote(interaction) {
    updateNote(interaction.options.getInteger('note_id'), interaction.options.getString('note'))
    interaction.reply('Note updated')
}

function deleteUserNote(interaction) {
    deleteNote(interaction.options.getInteger('note_id'))
    interaction.reply('Note deleted')
}