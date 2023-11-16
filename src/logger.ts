import bot from "./bot";
import constants from "./config"
import { transports, format, createLogger, Logger } from "winston"

export const logger: Logger = createLogger({
    level: constants.LOG_LEVEL, 
    transports: [ 
        new transports.Console(
            { 
                format: format.combine( format.timestamp({format: 'DD-MM-YYYY HH:mm:ss'}),
                format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}` 
                + (info.splat!==undefined?`${info.splat}`:" "))
                )  
            }
        )
    ],

    exitOnError: false

}) 

export async function channel_log(log: string) {
    try {
        if (constants.LOG_CHANNEL) {
            await bot.api.sendMessage(constants.LOG_CHANNEL, log, {parse_mode: "HTML"});           
        }
    }
    catch(err) {
        logger.error("Failed to post message on LOG_CHANNEL: ", err);
    }
}