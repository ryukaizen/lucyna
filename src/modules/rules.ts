import { bot } from "../bot";
import constants from "../config";
import { get_rules, set_rules, reset_rules } from "../database/rules_sql";
import { InlineKeyboard } from "grammy";
import { elevatedUsersOnly } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command(["rule", "rules"], (async(ctx: any) => {
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

bot.chatType("supergroup" || "group").command(["setrule", "setrules", "addrule", "addrules"], elevatedUsersOnly(async(ctx: any) => {
    let chatId = ctx.chat.id.toString();

    const rulesPreview = new InlineKeyboard()
    .url("Show Preview", `https://telegram.me/${constants.BOT_USERNAME}?start=rules_${chatId}`);

    if (ctx.message.reply_to_message != undefined) {
        let setRules = await set_rules(chatId, ctx.message.reply_to_message.text)
        if (setRules == true) {
            await ctx.reply("Rules have been set!", {reply_markup: rulesPreview, reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            await ctx.reply("An error occurred while setting the rules. Please re-check the provided data.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let rules_text = args
            if (rules_text.length > 4096) {
                rules_text = rules_text.substring(0, 4096);
            }
            let setRules = await set_rules(chatId, rules_text)
            if (setRules == true) {
                await ctx.reply("Rules have been set!", {reply_markup: rulesPreview, reply_parameters: {message_id: ctx.message.message_id}});
            }
            else {
                await ctx.reply("An error occurred while setting the rules. Please re-check the provided data.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
        else {
            await ctx.reply("Please type the rules next to /setrules command or reply to a message with /setrules command.", {reply_parameters: {message_id: ctx.message.message_id}});
            return;
        }
    }
}));

bot.chatType("supergroup" || "group").command(["resetrule", "resetrules", "rmrule", "rmrules"], elevatedUsersOnly(async(ctx: any) => {
    let chatId = ctx.chat.id.toString();
    let rules = await get_rules(chatId);
    if (rules == null) {
        await ctx.reply("No rules have been set yet!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        let resetRules = await reset_rules(chatId);
        if (resetRules == true) {
            await ctx.reply("Rules have been reset!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            await ctx.reply("An error occurred while resetting the rules.", {reply_parameters: {message_id: ctx.message.message_id}});
        }       
    }
}));