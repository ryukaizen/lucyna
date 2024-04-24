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
// import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { RedisAdapter } from '@grammyjs/storage-redis';
import { FileFlavor } from "@grammyjs/files";
import IORedis from 'ioredis';
import { type ChatMember } from "grammy/types";

type ChatContext = Context & ChatMembersFlavor;
type FileContext = FileFlavor<Context>
export type MyContext = ChatContext & FileContext;

export const bot = new Bot<MyContext>(constants.BOT_TOKEN)
const redisInstance = new IORedis(constants.REDIS_CACHE_URL)
export const adapter = new RedisAdapter<ChatMember>({ instance: redisInstance, ttl: 10 });

bot.catch((err) => {
    const ctx = err.ctx;
    let err_template = `while handling update ${ctx.update.update_id.toString()}`;
    const e = err.error;
    if (e instanceof BotError) {
        logger.error(`${err_template} | ${e}`);
    } else if (e instanceof GrammyError) {
        logger.error(`${err_template} | ${e}`);
    } else if (e instanceof HttpError) {
        logger.error(`${err_template} | ${e}`);
    } else {
        logger.error(`${err_template} | ${e}`);
    }
    let log = (`${e}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
    channel_log(log);
});