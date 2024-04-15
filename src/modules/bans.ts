import { bot } from "../bot";
import { grammyErrorLog } from "../logger";
import { InlineKeyboard } from "grammy";
import { 
    adminCanRestrictUsers,
    adminCanRestrictUsersCallback,
    adminCanDeleteMessages,
    botCanRestrictUsers, 
    botCanRestrictUsersCallback, 
    botCanDeleteMessages,
    checkElevatedUser,
    checkElevatedUserFrom,
    isUserBanned,
    isUserInChat,
    resolveUserhandle,
    getUserInstance,
    extract_time, 
    convertUnixTime,
    sleep
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

async function ban(ctx: any, user_id: number | string, message: string) {
    await ctx.api.banChatMember(ctx.chat.id, user_id, {revoke_messages: true})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unbanButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to ban user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
} 

async function unban(ctx: any, user_id: number | string, message: string) {
    await ctx.api.unbanChatMember(ctx.chat.id, user_id)
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to unban user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function sban(ctx: any, user_id: number | string, message: string) {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
    await sleep(2000);
    await ctx.api.banChatMember(ctx.chat.id, user_id, {revoke_messages: true})
    .then(() => {
        ctx.api.sendMessage(ctx.from.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {});
}

async function tban(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.api.banChatMember(ctx.chat.id, user_id, {until_date: duration, revoke_messages: true})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unbanButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to tmute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });

}

async function dban(ctx: any, user_id: number | string, message: string) {
    await ctx.api.banChatMember(ctx.chat.id, user_id, {revoke_messages: true})
    .then(() => {
        ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id)
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unbanButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to ban user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function kick(ctx: any, user_id: number | string, message: string) {
    await ctx.api.unbanChatMember(ctx.chat.id, user_id)
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to kick user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError); 
    });
}

async function kickme(ctx: any, user_id: number | string, message: string, sticker: string) {
    await ctx.api.unbanChatMember(ctx.chat.id, user_id)
    .then(() => {
        ctx.api.sendSticker(ctx.chat.id, sticker, {disable_notification: true})
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Nah, I don't want to...", {reply_parameters: {message_id: ctx.message.message_id}});
    });
}

async function banme(ctx: any, user_id: number | string, message: string, sticker: string) {
    await ctx.api.banChatMember(ctx.chat.id, user_id, {revoke_messages: true})
    .then(() => {
        ctx.api.sendSticker(ctx.chat.id, sticker, {disable_notification: true})
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Nah, I don't want to...", {reply_parameters: {message_id: ctx.message.message_id}});
    });
}

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
            await ban(ctx, ctx.message.reply_to_message.from.id, ban_message);
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    await ctx.reply("Imagine making me ban myself...", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("Imagine trying to ban yourself...", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await checkElevatedUserFrom(ctx, user_id) == true) {
                    await ctx.reply("Whoops, can't ban elevated users!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let ban_message = (
                        `<b>🚷 Banned</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
                        `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    if (split_args[1] != undefined) {
                        ban_message += `Reason: ${split_args[1]}`;
                    }
                    await ban(ctx, user_id, ban_message);
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
            let unban_message = `<b>🏳️ Unbanned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`
            await unban(ctx, ctx.message.reply_to_message.from.id, unban_message)
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                let is_user_in_chat = await isUserBanned(ctx, ctx.chat.id, user_id);
                if (is_user_in_chat == false) {
                    await ctx.reply("The user is not banned here!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else {
                    let unban_message = `<b>🏳️ Unbanned</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`
                    await unban(ctx, user_id, unban_message);
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
            await dban(ctx, ctx.message.reply_to_message.from.id, ban_message);
        }
    }
    else {
        await ctx.reply("Please reply to a message with /dban command to <i>delete-ban</i> it", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }       
})))));

bot.chatType("supergroup" || "group").command(["sban", "pew"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            return;
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            return;
        }
        else if (await checkElevatedUser(ctx) == true) {
            return;
        }
        else {
            let ban_message = (
                `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) in the chat named <b>${ctx.chat?.title}</b>\n\n`
            ); 
            await sban(ctx, ctx.message.reply_to_message.from.id, ban_message);
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    return;
                }
                else if (user_id == ctx.from.id) {
                    return;
                }
                else if (await checkElevatedUserFrom(ctx, user_id) == true) {
                    return;
                }
                else {
                    let ban_message = (
                        `<b>🚷 Banned</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>) in the chat named <b>${ctx.chat?.title}</b>\n\n` 
                    );
                    await sban(ctx, user_id, ban_message)
                }
            }
            else {
                return;
            }
        }       
        else {        
            await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
        }
    }
})));

bot.chatType("supergroup" || "group").command(["tban", "tempban"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
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
            if (ctx.match) {
                let args = ctx.match;
                let ban_message = (
                    `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                ); 
                let ban_duration = await extract_time(ctx, args.toString());
                if (ban_duration != false) {
                    let converted_time = await convertUnixTime(Number(ban_duration));
                    ban_message += `Duration: ${converted_time}`;
                }
                else {
                    ban_duration = 0;
                    if (args != "") {
                        ban_message += `Reason: ${ctx.match}`
                    }
                }
                await tban(ctx, ctx.message.reply_to_message.from.id, ban_duration, ban_message);
            }
            else {
                await ctx.api.sendMessage(ctx.chat.id, "Please type the duration next to /tban command, i.e. /tban 12h", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await checkElevatedUserFrom(ctx, user_id) == true) {
                    await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let ban_message = (
                        `<b>🚷 Banned</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
                        `Enforcer: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    let ban_duration;
                    if (split_args[1] != undefined) {
                        ban_duration = await extract_time(ctx, split_args[1].toString());
                        if (ban_duration != false) {
                            let converted_time = await convertUnixTime(Number(ban_duration));
                            ban_message += `Duration: ${converted_time}`;
                        }
                        else {
                            ban_duration = 0;
                            if (split_args[1] != undefined) {
                                ban_message += `Reason: ${split_args[1]}`
                            }
                        }
                    }
                    await tban(ctx, user_id, ban_duration, ban_message)
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }       
        else {        
            await ctx.reply("Please type the user ID and duration next to /tban command or reply to a message with /tban command with duration.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

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
                await kick(ctx, ctx.message.reply_to_message.from.id, kick_message);
            }
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    await ctx.reply("WHY WOULD YOU WANT TO DO THAT!?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("You can just leave this group, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await checkElevatedUserFrom(ctx, user_id) == true) {
                    await ctx.reply("Special guys can't be kicked, sorry to say.", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let is_user_in_chat = await isUserInChat(ctx, ctx.chat.id, user_id)
                    if (is_user_in_chat == false) {
                        await ctx.reply("The user is not in this group!", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let kick_message: string = (`${kick_responses[Math.floor(Math.random() * kick_responses.length)]} ${userInstance.firstName}.`);
                        await kick(ctx, user_id, kick_message);
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
    let kick_message: string = (`${kick_responses[Math.floor(Math.random() * kick_responses.length)]} ${ctx.from.first_name}.`);
    let kick_sticker = "CAACAgUAAxkBAAFVoJdl5143l3aQas2IfSFEUqovfKwmAQACnxIAAhQLOFf6_XYxuhju8DQE"
    
    await kickme(ctx, ctx.from.id, kick_message, kick_sticker);
})));

bot.chatType("supergroup" || "group").command("banme", (botCanRestrictUsers(async (ctx: any) => {
    let ban_message = `${ctx.from.first_name} banned themselves!`;
    let ban_sticker = "CAACAgUAAxkBAAFVnsdl5vx8BAvmJFo1HivZppw_lwHb2wACFg4AAn-LOVdoTyZHers4xjQE"

    await banme(ctx, ctx.from.id, ban_message, ban_sticker);
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
                grammyErrorLog(ctx, GrammyError);
            });     
        }       
    }
    else {
        await ctx.answerCallbackQuery({text: `Unable to extract ban information.`}).catch((GrammyError: any) => {return})
    }       
})));