const Discord = require('discord.js');
const { GatewayIntentBits, Partials } = require('discord.js')
const config = require("./cfg");

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,

  // EXTRA INTENTS (from the config)
  ...config.extraIntents,
]
const partials = [
  Partials.Channel
]

const bot = new Discord.Client({
  intents: intents, partials: partials
})

// Eris allegedly handles these internally, so we can ignore them
const SAFE_TO_IGNORE_ERROR_CODES = [
  1001, // "CloudFlare WebSocket proxy restarting"
  1006, // "Connection reset by peer"
  "ECONNRESET", // Pretty much the same as above
];

bot.on("error", err => {
  if (SAFE_TO_IGNORE_ERROR_CODES.includes(err.code)) {
    return;
  }

  throw err;
});

/**
 * @type {Discord.Client}
 */
module.exports = bot;
