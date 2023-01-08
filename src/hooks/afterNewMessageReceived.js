const Discord = require('discord.js')

/**
 * @typedef AfterNewMessageReceivedHookData
 * @property {Discord.User} user
 * @property {Discord.Message} [message]
 * @property {CreateNewThreadForUserOpts} opts
 */

/**
 * @callback AfterNewMessageReceivedHookFn
 * @param {AfterNewMessageReceivedHookData} data
 * @return {void}
 */

/**
 * @callback AddAfterNewMessageReceivedHookFn
 * @param {AfterNewMessageReceivedHookFn} fn
 * @return {void}
 */

/**
 * @type AfterNewMessageReceivedHookFn[]
 */
const afterNewMessageReceivedHooks = [];

/**
 * @type {AddAfterNewMessageReceivedHookFn}
 */
let afterNewMessageReceived; // Workaround to inconsistent IDE bug with @type and anonymous functions
afterNewMessageReceived = (fn) => {
  afterNewMessageReceivedHooks.push(fn);
};

/**
 * @param {{
 *   user: Discord.User,
 *   message?: Discord.Message,
 *   opts: CreateNewThreadForUserOpts,
 * }} input
 */
async function callAfterNewMessageReceivedHooks(input) {
  for (const hook of afterNewMessageReceivedHooks) {
    await hook(input);
  }
}

module.exports = {
  afterNewMessageReceived: afterNewMessageReceived,
  callAfterNewMessageReceivedHooks: callAfterNewMessageReceivedHooks,
};
