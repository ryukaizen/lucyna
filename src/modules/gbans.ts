import { Composer } from "grammy";
import { superusersOnly } from "../helpers/helper_func";

const composer = new Composer();

composer.chatType(["supergroup", "group", "private"]).command("gban", superusersOnly(async (ctx: any) => {
    // enough to scare someone while this is still in development
    await ctx.reply(`Gbanned ${ctx.message.reply_to_message.from.first_name} in 8092 chats.\n\nTime taken: 0.9ms`, {reply_to_message_id: ctx.message.message_id});
}));

export default composer;