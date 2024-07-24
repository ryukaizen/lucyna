import { Composer } from "grammy";

const composer = new Composer();

// we will be using spamwat.ch api on this one telegram.me/SpamWatchBot

composer.chatType(["supergroup", "group"]).command("antispam", (async (ctx: any) => {
    await ctx.reply("This feature is currently under development. Stay tuned - @Ryukaizen", {reply_to_message_id: ctx.message.message_id});
}));

export default composer;