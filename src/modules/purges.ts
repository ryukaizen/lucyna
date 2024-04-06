import { bot } from "../bot";
import { logger, channel_log } from "../logger";
import { 
    adminCanDeleteMessages, 
    botCanDeleteMessages
} from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("del", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id)
        .then(() => {
            ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
        })
        .catch((GrammyError: any) => {
            ctx.reply("Invalid message!");
            logger.error(`${GrammyError}`);
            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
        });
    }
    else {
        await ctx.reply("Reply to a message to delete it!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));

bot.chatType("supergroup" || "group").command("purge", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {

})));