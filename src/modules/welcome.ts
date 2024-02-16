import bot from "../bot";
import { prisma } from "../database";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { type ChatMember } from "grammy/types";
import { chatMembers } from "@grammyjs/chat-members";

const adapter = new PrismaAdapter<ChatMember>(prisma.session);

bot.use(chatMembers(adapter));

bot.on("message:new_chat_members", async (ctx: any) => {
    var user_info = await ctx.chatMembers.getChatMember();
    await ctx.reply(`Welcome to the group ${user_info.user.first_name}!`, {reply_parameters: {message_id: ctx.message.message_id}})
});