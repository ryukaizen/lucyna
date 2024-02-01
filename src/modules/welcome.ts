import bot from "../bot";

bot.on("message:new_chat_members", async (ctx) => {
    await ctx.reply("Welcome");
});