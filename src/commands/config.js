const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js')
const fs = require('fs')
const cfg = require('../cfg')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
    .setDescription('Change config values')
    .addSubcommand(new SlashCommandSubcommandBuilder()
      .setName('view')
      .setDescription('View existing value for a config')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('The name of the value to be viewed')
          .setRequired(true)
          .setAutocomplete(true)))
    .addSubcommand(new SlashCommandSubcommandBuilder()
      .setName('set')
      .setDescription('Set a new value for a config')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('The name of the config value to change')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('value')
          .setDescription('The new value for the config')
          .setRequired(true))),

  async execute(interaction) {
    if (interaction.options.getSubcommand() == 'view') {
      interaction.reply('Value is: ' + cfg[interaction.options.getString('name')])
    } else if (interaction.options.getSubcommand() == 'set') {
      const name = interaction.options.getString('name')
      const value = interaction.options.getString('value')

      cfg[name] = value
      fs.writeFileSync(__dirname + '/../../config.json', JSON.stringify(cfg, null, 2))
      interaction.reply(name + ' is now set to ' + value)
    }
  }
}
