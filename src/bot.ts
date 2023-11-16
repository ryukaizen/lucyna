import constants from "./config"
import { logger } from "./logger"
import { Bot, BotError, GrammyError, HttpError } from "grammy"

const bot = new Bot(constants.BOT_TOKEN)

export const personal = bot.filter(ctx => ctx.chat?.type === 'private');
export const group = bot.filter(ctx => ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup');
export const channel = bot.filter(ctx => ctx.chat?.type === 'channel'); // For future use

bot.catch((err) => {
    const ctx = err.ctx;
    const context = ctx;
    logger.error(`Error while handling update ${ctx.update.update_id.toString()}:`);
    const e = err.error;
    if (e instanceof BotError) {
        console.error(e.ctx);
    } else if (e instanceof GrammyError) {
        console.error(e.description);
    } else if (e instanceof HttpError) {
        console.error(e);
    } else {
        console.error(e);
    }
    send_logs(context, e);
});

async function send_logs(context: any, error: any) {
    try {
        if (constants.LOG_CHANNEL) {
            var log = (`${error}\n\n` + `Timestamp: <code>${new Date().toLocaleString()}</code>\n\n` + `Update object:\n<code>${JSON.stringify(context.update,  null, 2)}</code>`)
            if (log.length >= 4096) {
                log = log.substring(0, 4096)
            } 
            await bot.api.sendMessage(constants.LOG_CHANNEL, log, {parse_mode: "HTML"});           
        }
    }
    catch(err) {
        logger.error("Failed to post error log on LOG_CHANNEL: ", err);
    }
}

export default bot;
