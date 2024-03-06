import bot from "../bot";
import { logger, channel_log } from "../logger";
import { GrammyError, InlineKeyboard } from "grammy";
import { prisma } from "../database";
import { 
    canRestrictUsers, 
    canRestrictUsersCallback, 
    canDeleteMessages, // for dwarn
    checkElevatedUser,
    checkElevatedUserFrom,
    elevatedUsersOnly, 
    elevatedUsersCallbackOnly, 
    isUserBanned,
    isUserInChat,
    userIdExtractor, 
    userInfo
} from "../helpers/helper_func";

const unwarnButton = new InlineKeyboard()
    .text("Remove Latest Warn", "unwarn-once-my-beloved")
    .text("Remove All Warns", "unwarn-all-of-it");

async function get_warn_numbers(chatId: string, userId: number) {
    let warn_numbers = await prisma.warns.findFirst({
        where: {
            chat_id: chatId.toString(),
            user_id: userId
        }
    })
    return warn_numbers;
}

async function get_warn_settings(chatId: string) {
    let warn_settings = await prisma.warn_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return warn_settings;
}

bot.chatType("supergroup" || "group").command("warns", (async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let warn_numbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
        let warn_settings = await get_warn_settings(ctx.chat.id)
        let warns_message = `Total warns for user <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)\n\n`
        if (warn_numbers?.num_warns != null) {
            warns_message += `<b>> ${warn_numbers?.num_warns}</b>`
            if (warn_settings?.warn_limit != null) {
            warns_message += `<b>/${warn_settings?.warn_limit}</b>` 
            }
        }
        else {
            warns_message = `User <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) have no warnings yet!`

        }
        await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"});
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let user_id = split_args[0];
            let user_info =  await ctx.getChatMember(user_id)
                .catch((GrammyError: any) => {
                    return;
                });
            let warns_message = `Total warns for user <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)\n\n`
            if (user_info != undefined) {
                let warn_numbers = await get_warn_numbers(ctx.chat.id, user_info.user.id);
                let warn_settings = await get_warn_settings(ctx.chat.id)
                if (warn_numbers?.num_warns != null) {
                    warns_message += `<b>> ${warn_numbers?.num_warns}</b>`
                    if (warn_settings?.warn_limit != null) {
                    warns_message += `<b>/${warn_settings?.warn_limit}</b>` 
                    }
                }
                else {
                    warns_message = `User <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) have no warnings yet!`
                }
                await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"});
            }
            else {
                await ctx.reply("Invalid user ID specified.")
            }
        }
        else {        
            await ctx.reply("Please type the user ID next to /warns command or reply to a user with /warns command.", {reply_parameters: {message_id: ctx.message.message_id}});
            return;
        }

    }
}));
