const Discord = require('discord.js');

/**
 * @typedef BeforeNewMessageReceivedHookData
 * @property {Discord.User} user
 * @property {Discord.Message} [message]
 * @property {CreateNewThreadForUserOpts} opts
 * @property {Function} cancel
 */

/**
 * @typedef BeforeNewMessageReceivedHookResult
 * @property {boolean} cancelled
 */

/**
 * @callback BeforeNewMessageReceivedHookFn
 * @param {BeforeNewMessageReceivedHookData} data
 * @return {void|Promise<void>}
 */

/**
 * @callback AddBeforeNewMessageReceivedHookFn
 * @param {BeforeNewMessageReceivedHookFn} fn
 * @return {void}
 */

/**
 * @type BeforeNewMessageReceivedHookFn[]
 */
const beforeNewMessageReceivedHooks = [];

/**
 * @type {AddBeforeNewMessageReceivedHookFn}
 */
let beforeNewMessageReceived; // Workaround to inconsistent IDE bug with @type and anonymous functions
beforeNewMessageReceived = (fn) => {
  beforeNewMessageReceivedHooks.push(fn);
};

/**
 * @param {{
 *   user: Discord.User,
 *   message?: Discord.Message,
 *   opts: CreateNewThreadForUserOpts,
 * }} input
 * @return {Promise<BeforeNewMessageReceivedHookResult>}
 */
async function callBeforeNewMessageReceivedHooks(input) {
  /**
   * @type {BeforeNewMessageReceivedHookResult}
   */
  const result = {
    cancelled: false,
  };

  /**
   * @type {BeforeNewMessageReceivedHookData}
   */
  const data = {
    ...input,

    cancel() {
      result.cancelled = true;
    },
  };

  for (const hook of beforeNewMessageReceivedHooks) {
    await hook(data);
  }

  return result;
}

module.exports = {
  beforeNewMessageReceived: beforeNewMessageReceived,
  callBeforeNewMessageReceivedHooks: callBeforeNewMessageReceivedHooks,
};
