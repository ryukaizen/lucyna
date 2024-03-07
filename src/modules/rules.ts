import bot from "../bot";
import constants from "../config";
import { prisma } from "../database";
import { get_rules } from "../database/rules_sql";
import { InlineKeyboard } from "grammy";
import { elevatedUsersOnly } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("rules", (async(ctx: any) => {
    let chatId = ctx.chat.id.toString();
    let rules_button = new InlineKeyboard()
        .url("Rules❕", `https://telegram.me/${constants.BOT_USERNAME}?start=rules_${chatId}`);
    let rules = await get_rules(chatId);
    if (rules == null) {
        await ctx.reply("No rules have been set yet!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else { 
        if (ctx.message.reply_to_message == undefined) {
            await ctx.reply("Read the group rules via button below.", {reply_markup: rules_button, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply("Read the group rules via button below.", {reply_markup: rules_button, reply_parameters: {message_id: ctx.message.reply_to_message.message_id}, parse_mode: "HTML" });
        }
    }
}));

bot.chatType("supergroup" || "group").command("setrules", elevatedUsersOnly(async(ctx: any) => {
    let chatId = ctx.chat.id.toString();
    if (ctx.message.text.replace("/setrules" || "!setrules" || "?setrules", "").trim() == "") {
        if (ctx.message.reply_to_message != undefined) {
            await prisma.rules.upsert({
                where: {
                    chat_id: chatId,
                },
                update: {
                    rules: ctx.message.reply_to_message.text,
                },
                create: {
                    chat_id: chatId,
                    rules: ctx.message.reply_to_message.text,
                }
        });
        await ctx.reply("Rules have been set!");
        }
        else {
            await ctx.reply("Please type the rules next to /setrules command or reply to a message with /setrules command.", {reply_parameters: {message_id: ctx.message.message_id}});
            return;
        }
    }
    else {
        let rules_text = ctx.message.text.replace("/setrules" || "!setrules" || "?setrules", "").trim();
        if (rules_text.length > 4096) {
            rules_text = rules_text.substring(0, 4096);
            await prisma.rules.upsert({
                where: {
                    chat_id: chatId,
                },
                update: {
                    rules: rules_text,
                },
                create: {
                    chat_id: chatId,
                    rules: rules_text,
                }
            });
        }
        await ctx.reply("Rules have been set!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}));

bot.chatType("supergroup" || "group").command("resetrules", elevatedUsersOnly(async(ctx: any) => {
    let chatId = ctx.chat.id.toString();
    // check if rules have been set or not, and only then delete
    let rules = await prisma.rules.findUnique({
        where: {
            chat_id: chatId,
        }
    });
    if (rules == null) {
        await ctx.reply("No rules have been set yet!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        await prisma.rules.delete({
            where: {
                chat_id: chatId,
            }
    });
    await ctx.reply("Rules have been reset!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}));