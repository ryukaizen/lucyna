import bot from "../bot";
import constants from "../config";
import { prisma } from "../database";
import { InlineKeyboard } from "grammy";

bot.chatType("supergroup" || "group").command("rules", (async(ctx: any) => {
    let chatId = ctx.chat.id.toString();
    let rules_button = new InlineKeyboard()
        .url("Rules❕", `https://telegram.me/${constants.BOT_USERNAME}?start=rules_${chatId}`);  
    if (ctx.message.reply_to_message == undefined) {
        await ctx.reply("Read the group rules from the button below.", {reply_markup: rules_button, reply_parameters: {message_id: ctx.message.message_id, parse_mode: "HTML" }});
    }
    else {
        await ctx.reply("Read the group rules from the button below.", {reply_markup: rules_button, reply_parameters: {message_id: ctx.message.reply_to_message.message_id}, parse_mode: "HTML" });
    }
}));

export async function get_rules(chatId: string) {
    let rules = await prisma.rules.findUnique({
        where: {
        chat_id: chatId,
        },
    });
    return rules?.rules;
}