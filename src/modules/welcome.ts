import bot from "../bot";

bot.on("message:new_chat_members", async (ctx: any) => {
    var user_info = await ctx.chatMembers.getChatMember();
    await ctx.reply(`Welcome to the group ${user_info.user.first_name}!`, {reply_parameters: {message_id: ctx.message.message_id}})
});