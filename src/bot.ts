import constants from "./config"
import { logger, channel_log } from "./logger"
import {
    Bot, 
    Context, 
    BotError, 
    GrammyError, 
    HttpError 
} from "grammy"        
import { type ChatMembersFlavor } from "@grammyjs/chat-members";
import { prisma } from "./database";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { type ChatMember } from "grammy/types";
import { chatMembers } from "@grammyjs/chat-members";

type ChatContext = Context & ChatMembersFlavor;

const bot = new Bot<ChatContext>(constants.BOT_TOKEN)

const adapter = new PrismaAdapter<ChatMember>(prisma.chat_members_data);

bot.use(chatMembers(adapter, { enableAggressiveStorage: true }));

bot.catch((err) => {
    const ctx = err.ctx;
    const context = ctx;
    let err_template = `while handling update ${ctx.update.update_id.toString()}`;
    const e = err.error;
    if (e instanceof BotError) {
        logger.error(`${err_template} | ${e.ctx}`);
    } else if (e instanceof GrammyError) {
        logger.error(`${err_template} | ${e.description}`);
    } else if (e instanceof HttpError) {
        logger.error(`${err_template} | ${e}`);
    } else {
        logger.error(`${err_template} | ${e}`);
    }
    var log = (`${e}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(context.update,  null, 2)}`)
    channel_log(log);
});

export default bot;