import bot from "../bot";
import { InlineKeyboard } from "grammy";
import { elevatedUsersOnly, canPinMessages, elevatedUsersCallbackOnly, userInfo} from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("pin", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to pin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message == undefined) {
            await ctx.reply("Reply to a message to pin it.", {reply_parameters: {message_id: ctx.message.message_id}});
            return;
        }

        if (ctx.match == "silent" || ctx.match == "quiet" || ctx.match == "noalert") {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: true});
        }
        else if (ctx.match == "alert" || ctx.match == "loud") {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: false});
        }
        else {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: true});   
        }
    }
})));

bot.chatType("supergroup" || "group").command("unpin", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to unpin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message == undefined) {
            await ctx.api.unpinChatMessage(ctx.chat.id)
                .then(ctx.reply("Unpinned the most recent pinned message!", {reply_parameters: {message_id: ctx.message.message_id}}))
                .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")});
        }
        else {
            await ctx.api.unpinChatMessage(ctx.chat.id, {message_id: ctx.message.reply_to_message.message_id})
                .then(ctx.reply("Unpinned the message successfully!", {reply_parameters: {message_id: ctx.message.message_id}}))
                .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")});
        }
    }
})));


bot.chatType("supergroup" || "group").command("unpinall", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to unpin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        let confirmUnpin = new InlineKeyboard()
            .text("Yes", "yes-unpin")
            .text("No", "no-unpin");
    
        await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to unpin <b>ALL the pinned messages</b> in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmUnpin, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
    }
})));
    
bot.callbackQuery("yes-unpin", elevatedUsersCallbackOnly(async(ctx: any) => {
    await ctx.api.unpinAllChatMessages(ctx.chat.id)
        .then(ctx.editMessageText("Unpinned all the messages successfully!"))
        .catch((GrammyError: any) => {ctx.editMessageText("Failed to unpin messages: invalid message / message probably does not exist.")});
}));
    
bot.callbackQuery("no-unpin", elevatedUsersCallbackOnly(async(ctx: any) => {
        await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
}));


