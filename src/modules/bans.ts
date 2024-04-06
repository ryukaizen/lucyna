import { bot } from "../bot";
import { logger, channel_log } from "../logger";
import { GrammyError, InlineKeyboard } from "grammy";
import { 
    adminCanRestrictUsers,
    adminCanRestrictUsersCallback,
    adminCanDeleteMessages,
    botCanRestrictUsers, 
    botCanRestrictUsersCallback, 
    botCanDeleteMessages,
    checkElevatedUser,
    checkElevatedUserFrom,
    elevatedUsersOnly,  
    isUserBanned,
    isUserInChat, 
    userInfo
} from "../helpers/helper_func";

// some humor
const kick_responses: string[] = [
    "And the award for the fastest exit goes to... drumroll... you!",
    "You've been voted off the island!",
    "Better luck surviving on your own,",
    "Guess who just got a free ticket to the 'Ex-Group Members' club?",
    "Oops! Looks like you accidentally clicked on the 'Eject' button. Happens to the best of us!",
    "Time to spread those wings and fly... away from this group. Farewell!",
    "Consider this your group exit interview,",
    "Thanks for your contributions... or lack thereof!",
    "And just like that, you're out!",
    "One small step for you, one giant leap out of the group!",
    "Cya later, alligator!",
    "Time to say goodbye. Ta-ta!",
    "Ejected! See you never!",
    "Out of the group, into the great unknown!",
    "Group's loss is your gain... or something like that,",
    "You've left the group chat, but have you really left the group?",
    "Kicked from the group: it's like getting unfriended but in 2D!",
    "Just remember, wherever you go, you'll always be part of this group's history,",
    "Group exit strategy: Stage 1 complete. Stage 2: Taking over the world by",
    "Congratulations! You've been upgraded from 'Group Member' to 'Free Spirit',",
    "And with a single click, you've been cast out into the digital darkness,",
    "In a dramatic turn of events, the group has cut ties with you,",
    "Looks like someone hit you with the 'Ctrl+Alt+Delete',",
    "Well, you've been kicked quicker than a bot in a Discord server,",
    "Error 404: User not found in this group anymore ;)",
];

const unbanButton = new InlineKeyboard()
.text("🔘 Unban", "unban-the-dawg");

bot.chatType("supergroup" || "group").command("ban", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
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
                `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
            );
            if (ctx.match) {
                let ban_reason = ctx.match;
                ban_message += `Reason: ${ban_reason}`;
            }
            await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
            .then(() => {
                ctx.api.sendMessage(ctx.chat.id, ban_message, {reply_markup: unbanButton, parse_mode: "HTML"});
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
            let user_info =  await ctx.getChatMember(user_id).catch((GrammyError: any) => {return});
            if (user_info != undefined) {
                if (user_info.user.id == bot.botInfo.id) {
                    await ctx.reply("Imagine making me ban myself...", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_info.user.id == ctx.from.id) {
                    await ctx.reply("Imagine trying to ban yourself...", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                    await ctx.reply("Whoops, can't ban elevated users!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let ban_message = (
                        `<b>🚷 Banned</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                        `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    if (split_args[1] != undefined) {
                        ban_message += `Reason: ${split_args[1]}`;
                    }
                    await ctx.api.banChatMember(ctx.chat.id, user_info.user.id)
                    .then(() => {
                        ctx.api.sendMessage(ctx.chat.id, ban_message, {reply_markup: unbanButton, parse_mode: "HTML"});
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
            }
        }       
        else {        
            await ctx.reply("Please type the user ID next to /ban command or reply to a message with /ban command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

bot.callbackQuery("unban-the-dawg", adminCanRestrictUsersCallback(botCanRestrictUsersCallback(async(ctx: any) => {
    let text = ctx.callbackQuery.message?.text || "";
    let username = text.match(/(?<=🚷 Banned )\S+/);
    let userid = text.match(/(?<=\()\d+(?=\))/);
    let enforcer = text.match(/(?<=Enforcer: ).+/);
    let reason = text.match(/(?<=Reason: ).+/);
    if (username && userid) {
        let userId = Number(userid[0]);
        let userName = String(username[0]);
        let is_user_in_chat = await isUserBanned(ctx, ctx.callbackQuery.message.chat.id, userId);
        if (is_user_in_chat == false) {
            await ctx.answerCallbackQuery({text: `The user is not banned here!`}).catch((GrammyError: any) => {return})
        }
        else {
            await ctx.api.unbanChatMember(`${ctx.callbackQuery?.message?.chat?.id}`, userId)
            .then(() => {
                ctx.answerCallbackQuery({
                    text: `Unbanned ${userName}!`,                
                }).catch((GrammyError: any) => {return}) // will improve this later
                let unban_message = `<b>🏳️ Unbanned</b> ${userName} (<code>${userid}</code>) <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n`;
                if (enforcer != ctx.from.first_name) {
                    unban_message += `\nOriginal enforcer: ${enforcer}`
                }
                if (reason != null) {
                    unban_message += `\nReason was: ${reason}`;
                }
                ctx.editMessageText(unban_message, { parse_mode: "HTML" });
            })
            .catch((GrammyError: any) => {
                ctx.answerCallbackQuery({text: "Failed to unban user: invalid user / user probably does not exist."}).catch((GrammyError: any) => {return}) //catching errors in error handlers itself yeah
                logger.error(`${GrammyError}`);
                channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
            });     
        }       
    }
    else {
        await ctx.answerCallbackQuery({text: `Unable to extract ban information.`}).catch((GrammyError: any) => {return})
    }       
})));

bot.chatType("supergroup" || "group").command("unban", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let is_user_in_chat = await isUserBanned(ctx, ctx.message.reply_to_message.chat.id, ctx.message.reply_to_message.from.id);
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("Don't worry sweetie, I'm never gonna get banned here!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (is_user_in_chat == false) {
            await ctx.reply("The user is not banned here!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            await ctx.api.unbanChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                .then(() => {
                    ctx.api.sendMessage(ctx.chat.id, `<b>🏳️ Unbanned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, {parse_mode: "HTML"});
                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to unban user: invalid user / user probably does not exist.");
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
                .catch((GrammyError: any) => {return});
            if (user_info != undefined) {
                let is_user_in_chat = await isUserBanned(ctx, ctx.chat.id, user_info.user.id);
                if (is_user_in_chat == false) {
                    await ctx.reply("The user is not banned here!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else {
                    await ctx.api.unbanChatMember(ctx.chat.id, user_info.user.id)
                    .then(() => {
                        ctx.api.sendMessage(ctx.chat.id, `<b>🏳️ Unbanned</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, {parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to unban user: invalid user / user probably does not exist.");
                        logger.error(`${GrammyError}`);
                        channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                    });
                }
            }
            else {
                ctx.reply("Failed to unban user: invalid user / user probably does not exist.");
            }
        }
        else {
            ctx.reply("Please type the user ID next to /unban command or reply to a message with /unban command.");
        }
    }
})));

bot.chatType("supergroup" || "group").command("dban", adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
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
                `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
            );
            if (ctx.match) {
                let ban_reason = ctx.match;
                ban_message += `Reason: ${ban_reason}`;
            }
            await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
            .then(() => {
                ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id)
                ctx.api.sendMessage(ctx.chat.id, ban_message, {reply_markup: unbanButton, parse_mode: "HTML"});
            })
            .catch((GrammyError: any) => {
                ctx.reply("Failed to ban user: invalid user / user probably does not exist.");
                logger.error(`${GrammyError}`);
                channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
            });
        }
    }
    else {
        await ctx.reply("Please reply to a message with /dban command to <i>delete-ban</i> it", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }       
})))));

bot.chatType("supergroup" || "group").command("kick", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("WHY WOULD YOU WANT TO DO THAT!?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You can just leave this group, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await checkElevatedUser(ctx) == true) {
            await ctx.reply("Special guys can't be kicked, sorry to say.", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else {
            let is_user_in_chat = await isUserInChat(ctx, ctx.chat.id, ctx.message.reply_to_message.from.id)
            if (is_user_in_chat == false) {
                await ctx.reply("The user is not in this group!", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                let kick_message: string = (`${kick_responses[Math.floor(Math.random() * kick_responses.length)]} ${ctx.message.reply_to_message.from.first_name}.`);
                await ctx.api.unbanChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                .then(() => {
                    ctx.api.sendMessage(ctx.chat.id, kick_message, {parse_mode: "HTML"});
                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to kick user: invalid user / user probably does not exist.");
                    logger.error(`${GrammyError}`);
                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                });
            }
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let user_id = split_args[0];
            let user_info =  await ctx.getChatMember(user_id)
                .catch((GrammyError: any) => {return});
            if (user_info != undefined) {
                if (user_info.user.id == bot.botInfo.id) {
                    await ctx.reply("WHY WOULD YOU WANT TO DO THAT!?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_info.user.id == ctx.from.id) {
                    await ctx.reply("You can just leave this group, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                    await ctx.reply("Special guys can't be kicked, sorry to say.", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let is_user_in_chat = await isUserInChat(ctx, ctx.chat.id, user_info.user.id)
                    if (is_user_in_chat == false) {
                        await ctx.reply("The user is not in this group!", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let kick_message: string = (`${kick_responses[Math.floor(Math.random() * kick_responses.length)]} ${ctx.message.reply_to_message.from.first_name}.`);
                        await ctx.api.unbanChatMember(ctx.chat.id, user_info.user.id)
                        .then(() => {
                            ctx.api.sendMessage(ctx.chat.id, kick_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to kick user: invalid user / user probably does not exist.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }    
    }       
})));

bot.chatType("supergroup" || "group").command("kickme", (botCanRestrictUsers(async (ctx: any) => {
    let kick_sticker = "CAACAgUAAxkBAAFVoJdl5143l3aQas2IfSFEUqovfKwmAQACnxIAAhQLOFf6_XYxuhju8DQE"
    await ctx.api.unbanChatMember(ctx.chat.id, ctx.from.id)
    .then(() => {
        ctx.api.sendSticker(ctx.chat.id, kick_sticker, {disable_notification: true})
        ctx.api.sendMessage(ctx.chat.id, `${ctx.from.first_name} kicked out themselves!`, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Nah, I don't want to...");
    });
})));

bot.chatType("supergroup" || "group").command("banme", (botCanRestrictUsers(async (ctx: any) => {
    let ban_message = `${ctx.from.first_name} banned themselves!`;
    let ban_sticker = "CAACAgUAAxkBAAFVnsdl5vx8BAvmJFo1HivZppw_lwHb2wACFg4AAn-LOVdoTyZHers4xjQE"
    await ctx.api.banChatMember(ctx.chat.id, ctx.from.id, {revoke_messages: true})
    .then(() => {
        ctx.api.sendSticker(ctx.chat.id, ban_sticker, {disable_notification: true})
        ctx.api.sendMessage(ctx.chat.id, ban_message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Nah, I don't want to...");
    });
})));