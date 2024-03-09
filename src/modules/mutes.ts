import bot from "../bot";
import { logger, channel_log } from "../logger";
import { GrammyError, InlineKeyboard } from "grammy";
import { 
    canRestrictUsers, 
    canRestrictUsersCallback, 
    canDeleteMessages, // for dmute
    checkElevatedUser,
    checkElevatedUserFrom,
    elevatedUsersOnly, 
    elevatedUsersCallbackOnly, 
    isUserRestricted,
    userInfo,
    extract_time,
    convertUnixTime
} from "../helpers/helper_func";

const mutePermissions = { 
    can_send_messages: false, 
    can_send_audios: false,
    can_send_documents: false,
    can_send_photos: false,
    can_send_videos: false,
    can_send_video_notes: false,
    can_send_voice_notes: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
    can_manage_topics: false
}

const unmutePermissions = { 
    can_send_messages: true, 
    can_send_audios: true,
    can_send_documents: true,
    can_send_photos: true,
    can_send_videos: true,
    can_send_video_notes: true,
    can_send_voice_notes: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
    can_manage_topics: true
}

const unmuteButton = new InlineKeyboard()
.text("🔊 Unmute", "unmute-our-boy");

bot.chatType("supergroup" || "group").command("mute", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to mute users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                let mute_message = (
                    `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                if (ctx.match) {
                    let mute_duration = await extract_time(ctx, `${ctx.match}`);
                    let converted_time = await convertUnixTime(Number(mute_duration));
                    mute_message += `Duration: ${converted_time}`;

                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, mutePermissions, {until_date: mute_duration})
                    .then(() => {
                        ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
                        logger.error(`${GrammyError}`);
                        channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                    });
                }
                else {
                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, mutePermissions)
                    .then(() => {
                        ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
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
                    .catch((GrammyError: any) => {
                        return;
                    });
                if (user_info != undefined) {
                    if (user_info.user.id == bot.botInfo.id) {
                        await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let mute_message = (
                            `<b>🔇 Stay quiet</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                            `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                        );
                        if (split_args[1] != undefined) {
                            let mute_duration = await extract_time(ctx, `${split_args.slice(1).join(" ")}`);
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Duration: ${converted_time}`;
                            await ctx.api.restrictChatMember(ctx.chat.id, user_info.user.id, mutePermissions, {until_date: mute_duration})
                            .then(() => {
                                ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                            })
                            .catch((GrammyError: any) => {
                                ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
                                logger.error(`${GrammyError}`);
                                channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                            });
                        }
                        else {
                            await ctx.api.restrictChatMember(ctx.chat.id, user_info.user.id, mutePermissions)
                            .then(() => {
                                ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                            })
                            .catch((GrammyError: any) => {
                                ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
                                logger.error(`${GrammyError}`);
                                channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                            });
                        }
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the user ID next to /mute command or reply to a message with /mute command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }

        }
    }
})));

bot.callbackQuery("unmute-our-boy", elevatedUsersCallbackOnly(canRestrictUsersCallback(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.answerCallbackQuery({ text: "You don't have enough rights to unmute users!"}).catch((GrammyError: any) => {return})
        return;
    }
    else {
        let text = ctx.callbackQuery.message?.text || "";
        let username = text.match(/(?<=🔇 Stay quiet )\S+/);
        let userid = text.match(/(?<=\()\d+(?=\))/);
        let muzzler = text.match(/(?<=Muted by: ).+/);
        let reason = text.match(/(?<=Reason: ).+/);
        if (username && userid) {
            let userId = Number(userid[0]);
            let userName = String(username[0]);
            let is_user_restricted = await isUserRestricted(ctx, ctx.callbackQuery.message.chat.id, userId);
            if (is_user_restricted == false) {
                await ctx.answerCallbackQuery({
                    text: `The user is not muted here!`,
                }).catch((GrammyError: any) => {return})
                return;
            }
            else {
                await ctx.api.restrictChatMember(ctx.chat.id, userId, unmutePermissions)
                .then(() => {
                    ctx.answerCallbackQuery({
                        text: `Unmuted ${userName}!`,                
                    }).catch((GrammyError: any) => {return}) // will improve this later
                    let unmute_message = `<b>🔊 Unmuted</b> ${userName} (<code>${userid}</code>) <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n`;
                    if (muzzler != ctx.from.first_name) {
                        unmute_message += `\nOriginally muted by: ${muzzler}`
                    }
                    if (reason != null) {
                        unmute_message += `\nReason was: ${reason}`;
                    }
                    ctx.editMessageText(unmute_message, { parse_mode: "HTML" });
                })
                .catch((GrammyError: any) => {
                    ctx.answerCallbackQuery({text: "Failed to unmute user: invalid user / user probably does not exist."}).catch((GrammyError: any) => {return}) //catching errors in error handlers itself yeah
                    logger.error(`${GrammyError}`);
                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                });     
            }       
        }
        else {
            await ctx.answerCallbackQuery({
                text: `Unable to extract information on user restrictions.`,
            }).catch((GrammyError: any) => {return})
        }
        
    }
})));

bot.chatType("supergroup" || "group").command("unmute", elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to unmute users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            let is_user_restricted = await isUserRestricted(ctx, ctx.message.reply_to_message.chat.id, ctx.message.reply_to_message.from.id);
            if (is_user_restricted == false) {
                await ctx.reply("The user is not muted here!", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
            else {
                await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, unmutePermissions)
                .then(() => {
                    ctx.api.sendMessage(ctx.chat.id, `<b>🔊 Unmuted</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, {parse_mode: "HTML"});
                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to unmute user: invalid user / user probably does not exist.");
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
                    let is_user_restricted = await isUserRestricted(ctx, ctx.chat.id, user_info.user.id);
                    if (is_user_restricted == false) {
                        await ctx.reply("The user is not muted here!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else {
                        await ctx.api.restrictChatMember(ctx.chat.id, user_info.user.id, unmutePermissions)
                        .then(() => {
                            ctx.api.sendMessage(ctx.chat.id, `<b>🔊 Unmuted</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, {parse_mode: "HTML"});
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to unmute user: invalid user / user probably does not exist.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
                else {
                    ctx.reply("Failed to unmute user: invalid user / user probably does not exist.");
                }
            }
            else {
                ctx.reply("Please type the user ID next to /unmute command or reply to a message with /unmute command.");
            }
        }
    }
})));

bot.chatType("supergroup" || "group").command(["tmute", "tempmute"], elevatedUsersOnly(canRestrictUsers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_restrict_members == false) {
        await ctx.reply("You don't have enough rights to mute users!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                let mute_message = (
                    `<b>🔇 Temporarily muted</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                if (ctx.match) {
                    let mute_duration = await extract_time(ctx, `${ctx.match}`);
                    let converted_time = await convertUnixTime(Number(mute_duration));
                    mute_message += `Duration: ${converted_time}`;

                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, mutePermissions, {until_date: mute_duration})
                    .then(() => {
                        ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
                        logger.error(`${GrammyError}`);
                        channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                    });
                }
                else {
                    await ctx.api.sendMessage(ctx.chat.id, "Please type the duration next to /tmute command, i.e /tmute <user's handle> 12h", {reply_parameters: {message_id: ctx.message.message_id}});
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
                        await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        let mute_message = (
                            `<b>🔇 Temporarily muted</b> <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>)<b>!</b>\n\n` +
                            `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                        );
                        if (split_args[1] != undefined) {
                            let mute_duration = await extract_time(ctx, `${split_args.slice(1).join(" ")}`);
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Duration: ${converted_time}`;
                            await ctx.api.restrictChatMember(ctx.chat.id, user_info.user.id, mutePermissions, {until_date: mute_duration})
                            .then(() => {
                                ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                            })
                            .catch((GrammyError: any) => {
                                ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
                                logger.error(`${GrammyError}`);
                                channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                            });
                        }
                        else {
                            await ctx.api.sendMessage(ctx.chat.id, "Please type the duration next to /tmute command, i.e /tmute <user's handle> 12h", {reply_parameters: {message_id: ctx.message.message_id}});
                        }
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the user ID next to /mute command or reply to a message with /mute command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }

        }
    }
})));

bot.chatType("supergroup" || "group").command(["dmute", "delmute"], elevatedUsersOnly(canRestrictUsers(canDeleteMessages(async (ctx: any) => {
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
                await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                let mute_message = (
                    `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                if (ctx.match) {
                    let mute_duration = await extract_time(ctx, `${ctx.match}`);
                    let converted_time = await convertUnixTime(Number(mute_duration));
                    mute_message += `Duration: ${converted_time}`;

                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, mutePermissions, {until_date: mute_duration})
                    .then(() => {
                        ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                        ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to delete-mute, please do it manually.");
                        logger.error(`${GrammyError}`);
                        channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                    });
                }
                else {
                    await ctx.api.restrictChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, mutePermissions)
                    .then(() => {
                        ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                        ctx.api.sendMessage(ctx.chat.id, mute_message, {reply_markup: unmuteButton, parse_mode: "HTML"});
                    })
                    .catch((GrammyError: any) => {
                        ctx.reply("Failed to delete-mute, please do it manually.");
                        logger.error(`${GrammyError}`);
                        channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                    });
                }
            }
        }
    } 
}))));