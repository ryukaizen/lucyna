import { Composer } from "grammy";

const composer = new Composer();

composer.chatType(["supergroup", "group"]).command("zombies", (async (ctx: any) => {
    await ctx.reply("This feature is currently under development. Stay tuned - @Ryukaizen", {reply_to_message_id: ctx.message.message_id});
}));

export default composer;