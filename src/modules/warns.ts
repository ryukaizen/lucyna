import bot from "../bot";
import { logger, channel_log } from "../logger";
import { GrammyError, InlineKeyboard } from "grammy";
import { 
    get_warn_numbers, 
    get_warn_settings, 
    set_warn_numbers, 
    set_warn_settings,
    set_warn_mode,
    set_warn_limit,
    reset_warn_numbers,
    reset_all_warns
} from "../database/warns_sql";
import { 
    canRestrictUsers, 
    canRestrictUsersCallback, 
    canDeleteMessages, 
    checkElevatedUser,
    checkElevatedUserFrom,
    elevatedUsersOnly, 
    elevatedUsersCallbackOnly, 
    ownerOnly,
    ownerOnlyCallback,
    userInfo
} from "../helpers/helper_func";

const unwarnButton = new InlineKeyboard()
    .text("*️⃣ Remove Warn", "unwarn-once-my-beloved")

bot.chatType("supergroup" || "group").command("warns", (async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let warn_numbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
        let warn_settings = await get_warn_settings(ctx.chat.id)
        let warns_message = `Warnings received by user <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)\n\n`
        if (warn_numbers?.num_warns != null) {
            warns_message += `Total warning(s): <b>${warn_numbers?.num_warns}</b>`
            if (warn_settings?.warn_limit != null) {
                warns_message += `<b>/${warn_settings?.warn_limit}</b>` 
            }
            if (warn_numbers?.reasons.length != 0) {
                let warnReasonsWithBullets = warn_numbers?.reasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
                warns_message += `\nReason(s): ${warnReasonsWithBullets}`;
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
            let warns_message = `Warnings received by user <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)\n\n`
            if (user_info != undefined) {
                let warn_numbers = await get_warn_numbers(ctx.chat.id, user_info.user.id);
                let warn_settings = await get_warn_settings(ctx.chat.id)
                if (warn_numbers?.num_warns != null) {
                    warns_message += `Total warning(s): <b>${warn_numbers?.num_warns}</b>`
                    if (warn_settings?.warn_limit != null) {
                    warns_message += `<b>/${warn_settings?.warn_limit}</b>` 
                    }
                    if (warn_numbers?.reasons.length != 0) {
                        let warnReasonsWithBullets = warn_numbers?.reasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
                        warns_message += `\nReason(s): ${warnReasonsWithBullets}`;
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

bot.chatType("supergroup" || "group").command("warn", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to warn users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
            }
            else {
                let getWarnNumbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
                let getWarnSettings = await get_warn_settings(ctx.chat.id);
                let warnNumber = getWarnNumbers?.num_warns;
                let warnReasons = getWarnNumbers?.reasons;
                let warnLimit = getWarnSettings?.warn_limit;
                let warnMode = getWarnSettings?.soft_warn;
                
                warnNumber = warnNumber ?? 0n;
                warnNumber += 1n;
                if (warnLimit == undefined) {
                    await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                    warnLimit = 3n;
                }
                let warn_message = (
                    `<b>⚠️ Warned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Warner: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                    `Warns: <b>${warnNumber}/${warnLimit}</b>\n`
                );
                warnReasons = warnReasons ?? [];
                let inputReason;
                if (ctx.match) {
                    inputReason = ctx.match;
                }
                else {
                    inputReason = "No reason provided";
                }
                warnReasons.push(`${inputReason}`);
                let warnReasonsWithBullets = warnReasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
                warn_message += `Reason: ${warnReasonsWithBullets}`;
                await set_warn_numbers(ctx.chat.id.toString(), ctx.message.reply_to_message.from.id, [`${inputReason}`]);
                        
                if (warnNumber >= warnLimit) {
                    if (warnMode == true) {
                        warn_message += "\n\n<b>🦿 Kicked out of the group!</b>"
                        await ctx.api.unbanChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                        .then(() => {
                            ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to kick user, they can be removed manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                    else {
                        warn_message += "\n\n<b>❌ Banned out of the group!</b>"
                        await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                        .then(() => {
                            ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to ban user, they can be removed manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
                else {
                    await ctx.api.sendMessage(ctx.chat.id, warn_message, {reply_markup: unwarnButton, parse_mode: "HTML"});
                }
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
                        await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_info.user.id);
                        let getWarnSettings = await get_warn_settings(ctx.chat.id);
                        let warnNumber = getWarnNumbers?.num_warns;
                        let warnReasons = getWarnNumbers?.reasons;
                        let warnLimit = getWarnSettings?.warn_limit;
                        let warnMode = getWarnSettings?.soft_warn;
                
                        warnNumber = warnNumber ?? 0n;
                        warnNumber += 1n;
                        if (warnLimit == undefined) {
                            await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                            warnLimit = 3n;
                        }
                        let warn_message = (
                            `<b>⚠️ Warned</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                            `Warner: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                            `Warns: <b>${warnNumber}/${warnLimit}</b>\n`
                        );
                        warnReasons = warnReasons ?? [];
                        let inputReason;
                        inputReason = inputReason ?? "";
                        if (split_args[1] != undefined) {
                            inputReason += split_args.slice(1).join(" ");
                        }
                        else {
                            inputReason = "No reason provided";
                        }
                        warnReasons.push(`${inputReason}`);
                        let warnReasonsWithBullets = warnReasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
                        warn_message += `Reason: ${warnReasonsWithBullets}`;
                        await set_warn_numbers(ctx.chat.id.toString(), user_info.user.id, [`${inputReason}`]);
                        
                        if (warnNumber >= warnLimit) {
                            if (warnMode == true) {
                                warn_message += "\n\n<b>🦿 Kicked out of the group!</b>"
                                await ctx.api.unbanChatMember(ctx.chat.id, user_info.user.id)
                                .then(() => {
                                    ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                                })
                                .catch((GrammyError: any) => {
                                    ctx.reply("Failed to kick user, they can be removed manually.");
                                    logger.error(`${GrammyError}`);
                                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                                });
                            }
                            else {
                                warn_message += "\n\n<b>❌ Banned out of the group!</b>"
                                await ctx.api.banChatMember(ctx.chat.id, user_info.user.id)
                                .then(() => {
                                    ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                                })
                                .catch((GrammyError: any) => {
                                    ctx.reply("Failed to ban user, they can be removed manually.");
                                    logger.error(`${GrammyError}`);
                                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                                });
                            }
                        }
                        else {
                            await ctx.api.sendMessage(ctx.chat.id, warn_message, {reply_markup: unwarnButton, parse_mode: "HTML"});
                        }
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
            }       
            else {        
                await ctx.reply("Please type the user ID next to /warn command or reply to a message with /warn command.", {reply_parameters: {message_id: ctx.message.message_id}});
            }   
        }
    }
})));

bot.callbackQuery("unwarn-once-my-beloved", elevatedUsersCallbackOnly(canRestrictUsersCallback(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.answerCallbackQuery({ text: "You don't have enough rights to unwarn users!"}).catch((GrammyError: any) => {return})
        return;
    }
    else {
        let text = ctx.callbackQuery.message?.text || "";
        let username = text.match(/(?<=⚠️ Warned )\S+/);
        let userid = text.match(/(?<=\()\d+(?=\))/);
        if (username && userid) {
            let userId = BigInt(userid[0]);
            let userName = String(username[0]);

            let getWarnNumbers = await get_warn_numbers(ctx.chat.id, userId);
            let getWarnSettings = await get_warn_settings(ctx.chat.id);
            let warnNumber = getWarnNumbers?.num_warns;
            let warnReasons = getWarnNumbers?.reasons;
            let warnLimit = getWarnSettings?.warn_limit;

            let warns_message;
            if (warnNumber == 0n || warnNumber == undefined) {
                warnNumber = 0n;
                warns_message = `User <a href="tg://user?id=${userId}">${userName}</a> (<code>${userId}</code>) have no warnings yet!`
            }
            else {
                warnNumber = warnNumber ?? 0n;
                warnNumber -= 1n;
                warns_message = (
                    `<b>🏳️ Removed latest warn for</b> <a href="tg://user?id=${userId}">${userName}</a> (<code>${userId}</code>)<b>!</b>\n\n` +
                    `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                    `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
                );
                warnReasons = warnReasons ?? [];
                if (warnReasons.length === 1) {
                    warnReasons.pop()
                    warnReasons = []
                }
                else {
                    warnReasons.pop();
                }
                await reset_warn_numbers(ctx.chat.id.toString(), userId, warnReasons);
            }   
            await ctx.editMessageText(warns_message, { parse_mode: "HTML" });
        }       
        else {
            await ctx.answerCallbackQuery({
                text: `Unable to extract user information.`,
            }).catch((GrammyError: any) => {return})
        }
    }
})));

bot.chatType("supergroup" || "group").command(["unwarn", "rmwarn"], elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to unwarn users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("🏳️ <b>Unwarned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
            }
            else {
                let getWarnNumbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
                let getWarnSettings = await get_warn_settings(ctx.chat.id);
                let warnNumber = getWarnNumbers?.num_warns;
                let warnReasons = getWarnNumbers?.reasons;
                let warnLimit = getWarnSettings?.warn_limit;
                let warns_message;
                if (warnLimit == undefined) {
                    await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                    warnLimit = 3n;
                }
                if (warnNumber == 0n || warnNumber == undefined) {
                    warnNumber = 0n;
                    warns_message = `User <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) have no warnings yet!`
                }
                else {
                    warnNumber = warnNumber ?? 0n;
                    warnNumber -= 1n;
                    warns_message = (
                        `<b>🏳️ Removed latest warn for</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                        `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                        `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
                    );
                    warnReasons = warnReasons ?? [];
                    if (warnReasons.length === 1) {
                        warnReasons.pop()
                        warnReasons = []
                    }
                    else {
                        warnReasons.pop();
                    }
                    await reset_warn_numbers(ctx.chat.id.toString(), ctx.message.reply_to_message.from.id, warnReasons);

                }   
                await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"}); 
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
                        await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("🏳️ <b>Unwarned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_info.user.id );
                        let getWarnSettings = await get_warn_settings(ctx.chat.id);
                        let warnNumber = getWarnNumbers?.num_warns;
                        let warnReasons = getWarnNumbers?.reasons;
                        let warnLimit = getWarnSettings?.warn_limit;
                        let warns_message;
                        if (warnLimit == undefined) {
                            await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                            warnLimit = 3n;
                        }
                        if (warnNumber == 0n || warnNumber == undefined) {
                            warnNumber = 0n;
                            warns_message = `User <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) have no warnings yet!`
                        }
                        else {
                            warnNumber = warnNumber ?? 0n;
                            warnNumber -= 1n;
                            warns_message = (
                                `<b>🏳️ Removed latest warn for</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                                `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                                `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
                            );
                            warnReasons = warnReasons ?? [];
                            if (warnReasons.length === 1) {
                                warnReasons.pop()
                                warnReasons = []
                            }
                            else {
                                warnReasons.pop();
                            }
                            await reset_warn_numbers(ctx.chat.id.toString(), user_info.user.id, warnReasons);
                        }
                        await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"}); 
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                }      
            }
            else {        
                await ctx.reply("Please type the user ID next to /unwarn command or reply to a user with /unwarn command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
})));

bot.chatType("supergroup" || "group").command(["dwarn", "delwarn"], elevatedUsersOnly(canRestrictUsers(canDeleteMessages(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to mute users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else if (user_info.can_delete_messages == false) {
        await ctx.reply("You don't have enough rights to delete messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
            }
            else {
                let getWarnNumbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
                let getWarnSettings = await get_warn_settings(ctx.chat.id);
                let warnNumber = getWarnNumbers?.num_warns;
                let warnReasons = getWarnNumbers?.reasons;
                let warnLimit = getWarnSettings?.warn_limit;
                let warnMode = getWarnSettings?.soft_warn;
                
                warnNumber = warnNumber ?? 0n;
                warnNumber += 1n;
                if (warnLimit == undefined) {
                    await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                    warnLimit = 3n;
                }
                let warn_message = (
                    `<b>⚠️ Warned</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Warner: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                    `Warns: <b>${warnNumber}/${warnLimit}</b>\n`
                );
                warnReasons = warnReasons ?? [];
                let inputReason;
                if (ctx.match) {
                    inputReason = ctx.match;
                }
                else {
                    inputReason = "No reason provided";
                }
                warnReasons.push(`${inputReason}`);
                let warnReasonsWithBullets = warnReasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
                warn_message += `Reason: ${warnReasonsWithBullets}`;
                await set_warn_numbers(ctx.chat.id.toString(), ctx.message.reply_to_message.from.id, [`${inputReason}`]);
                        
                if (warnNumber >= warnLimit) {
                    if (warnMode == true) {
                        warn_message += "\n\n<b>🦿 Kicked out of the group!</b>"
                        await ctx.api.unbanChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                        .then(() => {
                            ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                            ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to kick user, they can be removed manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                    else {
                        warn_message += "\n\n<b>❌ Banned out of the group!</b>"
                        await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
                        .then(() => {
                            ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                            ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to ban user, they can be removed manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
                else {
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                    await ctx.api.sendMessage(ctx.chat.id, warn_message, {reply_markup: unwarnButton, parse_mode: "HTML"});
                }
            }
        }
        else {
            await ctx.reply("Please reply to a message with /dwarn command to <i>delete-warn</i> it", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
    } 
}))));

bot.chatType("supergroup" || "group").command("resetwarns", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to reset warns of a user!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("🏳️ <b>Warns resetted!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
            }
            else {
                let getWarnNumbers = await get_warn_numbers(ctx.chat.id, ctx.message.reply_to_message.from.id);
                let getWarnSettings = await get_warn_settings(ctx.chat.id);
                let warnNumber = getWarnNumbers?.num_warns;
                let warnReasons = getWarnNumbers?.reasons;
                let warnLimit = getWarnSettings?.warn_limit;
                let warns_message;
                if (warnLimit == undefined) {
                    await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                    warnLimit = 3n;
                }
                if (warnNumber == 0n || warnNumber == -1n || warnNumber == undefined || warnNumber == null) {
                    warnNumber = 0n;
                    warns_message = `User <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) have no warnings yet!`
                }
                else {
                    warnNumber = warnNumber ?? 0n;
                    warnNumber = 0n;
                    warns_message = (
                        `<b>🏳️ Warns resetted for</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                        `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                        `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
                    );
                    warnReasons = warnReasons ?? [];
                    warnReasons.pop()
                    warnReasons = []

                    await reset_all_warns(ctx.chat.id.toString(), ctx.message.reply_to_message.from.id, warnReasons)
                }   
                await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"}); 
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
                        await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("🏳️ <b>Warns resetted!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_info.user.id);
                        let getWarnSettings = await get_warn_settings(ctx.chat.id);
                        let warnNumber = getWarnNumbers?.num_warns;
                        let warnReasons = getWarnNumbers?.reasons;
                        let warnLimit = getWarnSettings?.warn_limit;
                        let warns_message;
                        if (warnLimit == undefined) {
                            await set_warn_settings(ctx.chat.id.toString(), 3n, false);
                            warnLimit = 3n;
                        }
                        if (warnNumber == 0n || warnNumber == -1n || warnNumber == undefined || warnNumber == null) {
                            warnNumber = 0n;
                            warns_message = `User <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) have no warnings yet!`
                        }
                        else {
                            warnNumber = warnNumber ?? 0n;
                            warnNumber = 0n;
                            warns_message = (
                                `<b>🏳️ Warns resetted for</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                                `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
                                `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
                            );
                            warnReasons = warnReasons ?? [];
                            warnReasons.pop()
                            warnReasons = []
        
                            await reset_all_warns(ctx.chat.id.toString(), user_info.user.id, warnReasons)
                        }   
                        await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"});  
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                }      
            }
            else {        
                await ctx.reply("Please type the user ID next to /resetwarns command or reply to a user with /resetwarns command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
})));

// bot.chatType("supergroup" || "group").command("resetallwarns", ownerOnly(canRestrictUsers(async (ctx: any) => {
//     let confirmReset = new InlineKeyboard()
//         .text("Yes", "yes-reset")
//         .text("No", "no-reset")

//     await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to reset <b>everyone's</b> warnings in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
// })));

// bot.callbackQuery("yes-reset", ownerOnlyCallback(async(ctx: any) => {
//     // await reset_all_chat_warns(ctx.chat.id) // will do this later
// }));

// bot.callbackQuery("no-reset", ownerOnlyCallback(async(ctx: any) => {
//     await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
// }));

bot.chatType("supergroup" || "group").command("warnmode", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let getWarnSettings = await get_warn_settings(ctx.chat.id);
    let warnMode = getWarnSettings?.soft_warn
    let whatWillHappen;

    if (warnMode == undefined) {
        await set_warn_settings(ctx.chat.id.toString(), 3n, false); // default limit to 3, and soft_warn is disabled
        warnMode = false;
        whatWillHappen = "ban"
    }
    else if (warnMode == true) {
        whatWillHappen = "kick"
    }
    else if (warnMode == false) {
        whatWillHappen = "ban"
    }

    if (ctx.match) {
        let split_args = ctx.match.split(" ");
        let mode = split_args[0].toLowerCase();
        if (mode == "ban") {
            warnMode = false;
            await ctx.reply(`Crossing the warning threshold will result in <b>BANNING</b> the user!`, 
            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else if (mode == "kick") {
            warnMode = true;
            whatWillHappen = "kick"
            await ctx.reply(`Crossing the warning threshold will result in <b>KICKING</b> the user!`, 
            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply(
                `Invalid arguments!` +
                `\n\nUsage:\n<code>/warnmode ban</code> - set to ban\n<code>/warnmode kick</code> - set to kick` +
                `\n\nCurrent mode: <b>${whatWillHappen}</b> the user!`, 
                {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}
            );
        }
        await set_warn_mode(ctx.chat.id.toString(), warnMode)
    }
    else {
        await ctx.reply(`Crossing the warning threshold will <b>${whatWillHappen} the user!</b>`, 
        {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})));

bot.chatType("supergroup" || "group").command("warnlimit", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let getWarnSettings = await get_warn_settings(ctx.chat.id);
    let warnLimit = getWarnSettings?.warn_limit;

    if (warnLimit == undefined) {
        await set_warn_settings(ctx.chat.id.toString(), 3n, false); // default limit to 3, and soft_warn is disabled
    }

    if (ctx.match) {
        let split_args = ctx.match.split(" ");
        let limit = split_args[0];
        if (limit >= 1 && limit <= 5) {
            await ctx.reply(`Warning limit has been set to <b>${limit}</b> warn(s)!`, 
            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply(
                `Invalid arguments!` +
                `\n\nUsage:\n<code>/warnlimit 3</code> - set max warns to 3\n<code>/warnlimit 5</code> - set max warns to 5` +
                `\n\nRange of the limit should be between 1 (minimum) to 5 (maximum)` +
                `\nCurrent limit: <b>${warnLimit}</b>`, 
                {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}
            );
            limit = warnLimit;
        }
        await set_warn_limit(ctx.chat.id.toString(), BigInt(limit))
    }
    else {
        await ctx.reply(`Current warning limit: <b>${warnLimit}</b> warn(s)`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})));