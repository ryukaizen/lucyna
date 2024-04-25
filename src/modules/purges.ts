import { bot } from "../bot";
import { grammyErrorLog } from "../logger";
import { 
    adminCanDeleteMessages, 
    botCanDeleteMessages
} from "../helpers/helper_func";
import { gramjs, gramJsApi } from "../utility";
import { Composer } from "grammy";

const composer = new Composer();

composer.chatType("supergroup" || "group").command("del", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id)
        .then(() => {
            ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
        })
        .catch((GrammyError: any) => {
            ctx.reply("Invalid message!");
            grammyErrorLog(ctx, GrammyError);
        });
    }
    else {
        await ctx.reply("Reply to a message to delete it!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));

composer.chatType("supergroup" || "group").command("purge", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let message = await ctx.reply(`Purging initiated...`)
        let message_ids = [];
        let start_from_message = ctx.message.reply_to_message.message_id;
        let end_at_message = ctx.message.message_id;
        for (let i = end_at_message; i >= start_from_message; i--) {
           message_ids.push(i);
        }

        if (message_ids.length <= 100) {
            await gramjs.deleteMessages(ctx.chat.id, message_ids, { revoke: true })
            .catch(() => {}) 
            .then(() => {
                bot.api.editMessageText(ctx.chat.id, message.message_id, `Done purging!`, {parse_mode: "HTML"})
            })
        }
        else {
            await ctx.reply(`I can only purge 100 messages at once!`, {parse_mode: "HTML"})
        }
        message_ids = [];
    }
    else {
        await ctx.reply("Reply to a message with /purge to bulk delete messages sent after it!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}
)));

export default composer;