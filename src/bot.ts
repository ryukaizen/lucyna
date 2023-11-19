import constants from "./config"
import { logger, channel_log } from "./logger"
import { Bot, BotError, GrammyError, HttpError } from "grammy"

const bot = new Bot(constants.BOT_TOKEN)

export const personal = bot.filter(ctx => ctx.chat?.type === 'private');
export const group = bot.filter(ctx => ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup');
export const channel = bot.filter(ctx => ctx.chat?.type === 'channel'); // For future use

bot.catch((err) => {
    const ctx = err.ctx;
    const context = ctx;
    let err_template = `While handling update ${ctx.update.update_id.toString()}`;
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