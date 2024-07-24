import { Composer } from "grammy";

const composer = new Composer();

composer.chatType(["supergroup", "group", "private"]).command("afk", (async (ctx: any) => {
    let args = ctx.message.text.split(" ").slice(1).join(" ");
    let user = ctx.from.first_name;
    let chat_id = ctx.chat.id;
    let user_id = ctx.from.id;

    if (args) {
        await ctx.api.sendMessage(chat_id, `${user} is now AFK: ${args}`, {reply_to_message_id: ctx.message.message_id});
    }
    else {
        await ctx.api.sendMessage(chat_id, `${user} is now AFK.`, {reply_to_message_id: ctx.message.message_id});
    }

    let userAfk = {
        user: user,
        user_id: user_id,
        chat_id: chat_id,
        afk: true,
        reason: args,
    }

    // await set_afk_status(userAfk);
}));

export default composer;