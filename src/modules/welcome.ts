import bot from "../bot";

bot.on("message:new_chat_members", async (ctx: any) => {
    await ctx.reply("Welcome!", {reply_parameters: {message_id: ctx.message.message_id}})
});