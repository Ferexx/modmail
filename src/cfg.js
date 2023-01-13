const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const schema = require("./data/cfg.schema.json");
const cliOpts = require("./cliOpts");

/** @type {ModmailConfig} */
let config = JSON.parse(fs.readFileSync(__dirname + '/../config.json'))

// Convert config keys with periods to objects
// E.g. commandAliases.mv -> commandAliases: { mv: ... }
for (const [key, value] of Object.entries(config)) {
  if (!key.includes(".")) continue;

  const keys = key.split(".");
  let cursor = config;
  for (let i = 0; i < keys.length; i++) {
    if (i === keys.length - 1) {
      cursor[keys[i]] = value;
    } else {
      cursor[keys[i]] = cursor[keys[i]] || {};
      cursor = cursor[keys[i]];
    }
  }

  delete config[key];
}

// mainGuildId => mainServerId
// mailGuildId => inboxServerId
if (config.mainGuildId && !config.mainServerId) {
  config.mainServerId = config.mainGuildId;
}
if (config.mailGuildId && !config.inboxServerId) {
  config.inboxServerId = config.mailGuildId;
}

if (!config.dbType) {
  config.dbType = "sqlite";
}

if (!config.sqliteOptions) {
  config.sqliteOptions = {
    filename: path.resolve(__dirname, "..", "db", "data.sqlite"),
  };
}

if (!config.logOptions) {
  config.logOptions = {};
}

config.categoryAutomation = config.categoryAutomation || {};
// categoryAutomation.newThreadFromGuild => categoryAutomation.newThreadFromServer
if (config.categoryAutomation && config.categoryAutomation.newThreadFromGuild && !config.categoryAutomation.newThreadFromServer) {
  config.categoryAutomation.newThreadFromServer = config.categoryAutomation.newThreadFromGuild;
}

// guildGreetings => serverGreetings
if (config.guildGreetings && !config.serverGreetings) {
  config.serverGreetings = config.guildGreetings;
}

// Move greetingMessage/greetingAttachment to the serverGreetings object internally
// Or, in other words, if greetingMessage and/or greetingAttachment is set, it is applied for all servers that don't
// already have something set up in serverGreetings. This retains backwards compatibility while allowing you to override
// greetings for specific servers in serverGreetings.
config.serverGreetings = config.serverGreetings || {};
if (config.greetingMessage || config.greetingAttachment) {
  for (const guildId of config.mainServerId) {
    if (config.serverGreetings[guildId]) continue;
    config.serverGreetings[guildId] = {
      message: config.greetingMessage,
      attachment: config.greetingAttachment
    };
  }
}

// newThreadCategoryId is syntactic sugar for categoryAutomation.newThread
if (config.newThreadCategoryId) {
  config.categoryAutomation = config.categoryAutomation || {};
  config.categoryAutomation.newThread = config.newThreadCategoryId;
  delete config.newThreadCategoryId;
}

// Delete empty string options (i.e. "option=" without a value in config.ini)
for (const [key, value] of Object.entries(config)) {
  if (value === "") {
    delete config[key];
  }
}

// Validate config and assign defaults (if missing)
const ajv = new Ajv({
  useDefaults: true,
  coerceTypes: "array",
  allowUnionTypes: true,
});

/**
 * @param {string[]} errors
 * @returns void
 */
function exitWithConfigurationErrors(errors) {
  console.error("");
  console.error("NOTE! Issues with configuration:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  console.error("Please restart the bot after fixing the issues mentioned above.");
  console.error("");

  process.exit(1);
}

// https://github.com/ajv-validator/ajv/issues/141#issuecomment-270692820
const truthyValues = ["1", "true", "on", "yes"];
const falsyValues = ["0", "false", "off", "no"];
ajv.addKeyword({
  keyword: "coerceBoolean",
  compile() {
    return (value, ctx) => {
      if (!value) {
        // Disabled -> no coercion
        return true;
      }

      // https://github.com/ajv-validator/ajv/issues/141#issuecomment-270777250
      // The "value" argument doesn't update within the same set of schemas inside "allOf",
      // so we're referring to the original property instead.
      // This also means we can't use { "type": "boolean" }, as it would test the un-updated data value.
      const realValue = ctx.parentData[ctx.parentDataProperty];

      if (typeof realValue === "boolean") {
        return true;
      }

      if (truthyValues.includes(realValue)) {
        ctx.parentData[ctx.parentDataProperty] = true;
      } else if (falsyValues.includes(realValue)) {
        ctx.parentData[ctx.parentDataProperty] = false;
      } else {
        return false;
      }

      return true;
    };
  },
});

ajv.addKeyword({
  keyword: "multilineString",
  compile() {
    return (value, ctx) => {
      if (!value) {
        // Disabled -> no coercion
        return true;
      }

      const realValue = ctx.parentData[ctx.parentDataProperty];
      if (typeof realValue === "string") {
        return true;
      }

      ctx.parentData[ctx.parentDataProperty] = realValue.join("\n");

      return true;
    };
  },
});

const validate = ajv.compile(schema);
const configIsValid = validate(config);
if (!configIsValid) {
  const errors = validate.errors.map(error => {
    if (error.params.missingProperty) {
      return `Missing required option: "${error.params.missingProperty.slice(1)}"`;
    } else {
      return `The "${error.instancePath.slice(1)}" option ${error.message}. (Is currently: ${typeof config[error.instancePath.slice(1)]})`;
    }
  });
  exitWithConfigurationErrors(errors);
}

const validStreamingUrlRegex = /^https:\/\/(www\.)?twitch.tv\/[a-z\d_\-]+\/?$/i;
if (config.statusType === "streaming") {
  if (!validStreamingUrlRegex.test(config.statusUrl)) {
    exitWithConfigurationErrors([
      "When statusType is set to \"streaming\", statusUrl must be set to a valid Twitch channel URL, such as https://www.twitch.tv/Dragory",
    ]);
  }
}

console.log("Configuration ok!");

/**
 * @type {ModmailConfig}
 */
module.exports = config;
