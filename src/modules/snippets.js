const threads = require("../data/threads");
const snippets = require("../data/snippets");
const utils = require("../utils");
const { parseArguments } = require("knub-command-manager");

const whitespaceRegex = /\s/;
const quoteChars = ["'", "\""];

module.exports = ({ bot, knex, config, commands }) => {
  if (!config.allowSnippets) return;
  /**
   * "Renders" a snippet by replacing all argument placeholders e.g. {1} {2} with their corresponding arguments.
   * The number in the placeholder is the argument's order in the argument list, i.e. {1} is the first argument (= index 0)
   * @param {String} body
   * @param {String[]} args
   * @returns {String}
   */
  function renderSnippet(body, args) {
    return body
      .replace(/(?<!\\){\d+}/g, match => {
        const index = parseInt(match.slice(1, -1), 10) - 1;
        return (args[index] != null ? args[index] : match);
      })
      .replace(/\\{/g, "{");
  }

  /**
   * When a staff member uses a snippet (snippet prefix + trigger word), find the snippet and post it as a reply in the thread
   */
  bot.on("messageCreate", async msg => {
    if (!utils.messageIsOnInboxServer(msg)) return;
    if (!utils.isStaff(msg.member)) return;

    if (msg.author.bot) return;
    if (!msg.content) return;
    if (!msg.content.startsWith(config.snippetPrefix) && !msg.content.startsWith(config.snippetPrefixAnon)) return;

    let snippetPrefix, isAnonymous;

    if (config.snippetPrefixAnon.length > config.snippetPrefix.length) {
      // Anonymous prefix is longer -> check it first
      if (msg.content.startsWith(config.snippetPrefixAnon)) {
        snippetPrefix = config.snippetPrefixAnon;
        isAnonymous = true;
      } else {
        snippetPrefix = config.snippetPrefix;
        isAnonymous = false;
      }
    } else {
      // Regular prefix is longer -> check it first
      if (msg.content.startsWith(config.snippetPrefix)) {
        snippetPrefix = config.snippetPrefix;
        isAnonymous = false;
      } else {
        snippetPrefix = config.snippetPrefixAnon;
        isAnonymous = true;
      }
    }

    const thread = await threads.findByChannelId(msg.channel.id);
    if (!thread) return;

    const snippetInvoke = msg.content.slice(snippetPrefix.length);
    if (!snippetInvoke) return;

    let [, trigger, rawArgs] = snippetInvoke.match(/(\S+)(?:\s+(.*))?/s);
    trigger = trigger.toLowerCase();

    const snippet = await snippets.get(trigger);
    if (!snippet) return;

    let args = rawArgs ? parseArguments(rawArgs) : [];
    args = args.map(arg => arg.value);
    msg.content = renderSnippet(snippet.body, args);
    
    const replied = await thread.replyToUser(msg, isAnonymous);
    if (replied) msg.delete();
  });
};
