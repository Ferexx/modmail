const express = require("express");
const helmet = require("helmet");
const mime = require("mime");
const fs = require("fs");
const threads = require("../data/threads");
const attachments = require("../data/attachments");
const { formatters } = require("../formatters");

function notfound(res) {
  res.status(404).send("Page Not Found");
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function serveLogs(req, res) {
  const thread = await threads.findById(req.params.threadId);
  if (!thread) return notfound(res);

  let threadMessages = (await thread.getThreadMessages()).filter(threadMessage => !threadMessage.isChat());

  const formatLogResult = await formatters.formatLog(thread, threadMessages);

  res.set('Content-Type', 'text/html');
  res.send(formatLogResult.content);
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function serveChat(req, res) {
  const thread = await threads.findById(req.params.threadId)
  if (!thread) return notfound(res)

  let threadMessages = (await thread.getThreadMessages()).filter(threadMessage => threadMessage.isChat())

  const formatLogResult = await formatters.formatChatLog(thread, threadMessages)

  res.set('Content-Type', 'text/html')
  res.send(formatLogResult.content)
}

function serveAttachments(req, res) {
  if (req.params.attachmentId.match(/^[0-9]+$/) === null) return notfound(res);
  if (req.params.filename.match(/^[0-9a-z._-]+$/i) === null) return notfound(res);

  const attachmentPath = attachments.getLocalAttachmentPath(req.params.attachmentId);
  fs.access(attachmentPath, (err) => {
    if (err) return notfound(res);

    const filenameParts = req.params.filename.split(".");
    const ext = (filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : "bin");
    const fileMime = mime.getType(ext);

    res.set("Content-Type", fileMime);

    const read = fs.createReadStream(attachmentPath);
    read.pipe(res);
  })
}

const server = express();
server.use(helmet());

server.get("/logs/:threadId", serveLogs);
server.get('/chats/:threadId/', serveChat)
server.get("/attachments/:attachmentId/:filename", serveAttachments);

server.on("error", err => {
  console.log("[WARN] Web server error:", err.message);
});

module.exports = server;
