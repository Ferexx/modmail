const { SlashCommandBuilder, CategoryChannel } = require ('discord.js')
const threads = require('../data/threads')
const transliterate = require("transliteration")
const config = require('../cfg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('move the thread to another category')
        .addStringOption(option =>
            option.setName('category_name')
                .setDescription('the name of the category to move the thread to')
                .setRequired(true)
                .setAutocomplete(true)),

    async execute(interaction) {
        const thread = await threads.findOpenThreadByChannelId(interaction.channelId)
        if (!thread) {
            interaction.reply('Command must be executed inside a thread.')
            return
        }

        const categories = interaction.guild.channels.cache.filter(c => {
            return (c instanceof CategoryChannel) && (c.id !== interaction.channel.parentId)
        })

        if (categories.length == 0) {
            interaction.reply('No categories exist')
            return
        }

        const nameToFind = interaction.options.getString('category_name').toLowerCase()

         // See if any category name contains a part of the search string
        const containsRankings = categories.map(cat => {
            const normalizedCatName = transliterate.slugify(cat.name.toLowerCase())

            let i = 0
            do {
                if (!normalizedCatName.includes(nameToFind.slice(0, i + 1))) break
                i++
            } while (i < nameToFind.length)

            if (i > 0 && normalizedCatName.startsWith(nameToFind.slice(0, i))) {
                // Slightly prioritize categories that *start* with the search string
                i += 0.5
            }

            return [cat, i]
        });

        // Sort by best match
        containsRankings.sort((a, b) => {
            return a[1] > b[1] ? -1 : 1
        })

        if (containsRankings[0][1] === 0) {
            interaction.reply('No matching category')
            return
        }

        const targetCategory = containsRankings[0][0]
        let perms = []
        if (config.syncPermissionsOnMove) {
            perms = Array.from(targetCategory.permissionOverwrites.cache.values())
        }

        try {
            interaction.channel.edit({ parent: targetCategory.id, lockPermissions: true })
        } catch (e) {
            interaction.reply(`Failed to move thread: ${e.message}`)
            return;
        }

        interaction.reply(`Thread moved to ${targetCategory.name.toUpperCase()}`)
    }
}
