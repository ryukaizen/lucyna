import bot from "../bot";
import { logger, channel_log } from "../logger";
import { elevatedUsersOnly, checkElevatedUser, userIdExtractor, userInfo } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("ban", elevatedUsersOnly(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.user.can_restrict_members == false) {
        await ctx.reply("You do not have rights to ban users.", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("Imagine making me ban myself...", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("Imagine trying to ban yourself...", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("Whoops, can't ban elevated users!", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                let ban_message = (
                    `<b>Banned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                if (ctx.match) {
                    let ban_reason = ctx.match;
                    ban_message += `Reason: ${ban_reason}`;
                }
                await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                .then(() => {
                    ctx.api.sendMessage(ctx.chat.id, ban_message, {parse_mode: "HTML"});
                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to ban user: invalid user / user probably does not exist.");
                    logger.error(`${GrammyError}`);
                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                });
            }
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
                if (user_info != undefined) {
                    if (user_info.user.id == bot.botInfo.id) {
                        await ctx.reply("Imagine making me ban myself...", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("Imagine trying to ban yourself...", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else {
                        let ban_message = (
                            `<b>Banned</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                            `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                        );
                        if (split_args[1] != undefined) {
                            ban_message += `Reason: ${split_args[1]}`;
                        }
                        await ctx.api.banChatMember(ctx.chat.id, user_info.user.id)
                        .then(() => {
                            ctx.api.sendMessage(ctx.chat.id, ban_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to ban user: couldn't identify the user, the user haven't interacted with me!");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the user id or username next to /ban command or reply to a message with /ban command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
}));