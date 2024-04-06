import { bot } from "../bot";

bot.chatType("supergroup" || "group").command("id", (async (ctx: any) => {
    let chat_id = ctx.chat.id;
    let message_id = ctx.message.message_id;
    let user_id = ctx.from.id;
    let response = (
        `<b>Chat ID :</b> <code>${chat_id}</code>` +
        `<b>\nUser ID :</b> <code>${user_id}</code>`
    );
    if (ctx.message.reply_to_message != undefined) {
        let replied_to_user_id = ctx.message.reply_to_message.from.id;
        let replied_to_message_id = ctx.message.reply_to_message.message_id;
        response += `\n<b>Replied message ID :</b> <code>${replied_to_message_id}</code>`;
        response += `\n<b>Replied user's ID :</b> <code>${replied_to_user_id}</code>`;
    }
    else {
        response += `<b>\nMessage ID :</b> <code>${message_id}</code>` 
    }
    await ctx.api.sendMessage(ctx.chat.id, response, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}));