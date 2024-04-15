import { bot } from "../bot";
import { grammyErrorLog } from "../logger";
import { 
    adminCanDeleteMessages, 
    botCanDeleteMessages
} from "../helpers/helper_func";
import { gramjs } from "../utility";

bot.chatType("supergroup" || "group").command("del", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {
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

bot.chatType("supergroup" || "group").command("purge", adminCanDeleteMessages(botCanDeleteMessages(async (ctx: any) => {
    let message_ids = [];
    for (let i = ctx.message.reply_to_message.message_id; i <= ctx.message.message_id; i += 1) {
        message_ids.push(i);
    }
    if (message_ids.length <= 100) {
        await gramjs.deleteMessages(ctx.chat.id, message_ids, { revoke: true }).catch(() => {
           ctx.reply("Purging has encountered an issue: cannot delete one of the messages you tried to delete, most likely because it is a service message, neglect that message and try again :(", {reply_parameters: {message_id: ctx.message.message_id}});
        })
        message_ids = [];
    }
    else {
        await ctx.reply("I can only purge maximum 100 messages at once!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));