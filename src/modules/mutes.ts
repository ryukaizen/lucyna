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
    isUserAdmin,
    isUserRestricted,
    extract_time,
    convertUnixTime,
    resolveUserhandle, 
    getUserInstance,
    sleep
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
.text("🔊 Unmute", "unmute-our-fella");

async function mute(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions, {until_date: duration})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unmuteButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function unmute(ctx: any, user_id: number | string, message: string) {
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, unmutePermissions)
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to unmute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);        
    });
}

async function tmute(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions, {until_date: duration})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unmuteButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to tmute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function smute(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {});
    await sleep(2000);
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions, {until_date: duration})
    .then(() => {
        ctx.api.sendMessage(ctx.from.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {});
}

async function dmute(ctx: any, user_id: number | string, message_id: number, duration: any, message: string) {
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions, {until_date: duration})
    .then(() => {
        ctx.api.deleteMessage(ctx.chat.id, message_id);
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unmuteButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to delete-mute, please do it manually.");
        grammyErrorLog(ctx, GrammyError);
    });
}

bot.chatType("supergroup" || "group").command("mute", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else {
            let args = ctx.match;
            let mute_message = (
                `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
            );
            let mute_duration = await extract_time(ctx, args.toString());
            if (mute_duration != false) {
                let converted_time = await convertUnixTime(Number(mute_duration));
                mute_message += `Duration: ${converted_time}`;
            }
            else {
                mute_duration = 0;
                if (args != "") {
                    mute_message += `Reason: ${ctx.match}`
                }
            }
            await mute(ctx, ctx.message.reply_to_message.from.id, mute_duration, mute_message)
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
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let mute_message = (
                        `<b>🔇 Stay quiet</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
                        `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    let mute_duration;
                    if (split_args[1] != undefined) {
                        mute_duration = await extract_time(ctx, split_args[1].toString());
                        if (mute_duration != false) {
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Duration: ${converted_time}`;
                        }
                        else {
                            mute_duration = 0;
                            if (split_args[1] != undefined) {
                                mute_message += `Reason: ${split_args[1]}`
                            }
                        }
                    }
                    await mute(ctx, user_id, mute_duration, mute_message)
                }
            }
        else {
            await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }       
    else {        
        await ctx.reply("Please type the user ID next to /mute command or reply to a message with /mute command.", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}
})));

bot.chatType("supergroup" || "group").command("unmute", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let is_user_restricted = await isUserRestricted(ctx, ctx.message.reply_to_message.chat.id, ctx.message.reply_to_message.from.id);
        if (is_user_restricted == false) {
            await ctx.reply("The user is not muted here!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            let unmute_message = `<b>🔊 Unmuted</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`
            await unmute(ctx, ctx.message.reply_to_message.from.id, unmute_message);
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
                let is_user_restricted = await isUserRestricted(ctx, ctx.chat.id, user_id);
                if (is_user_restricted == false) {
                    await ctx.reply("The user is not muted here!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else {
                    let unmute_message = `<b>🔊 Unmuted</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> <b>by</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`
                    await unmute(ctx, user_id, unmute_message);
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
})));

bot.chatType("supergroup" || "group").command(["tmute", "tempmute"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else {
            if (ctx.match) {
                let args = ctx.match;
                let mute_message = (
                    `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                let mute_duration = await extract_time(ctx, args.toString());
                if (mute_duration != false) {
                    let converted_time = await convertUnixTime(Number(mute_duration));
                    mute_message += `Duration: ${converted_time}`;
                }
                else {
                    mute_duration = 0;
                    if (args != "") {
                        mute_message += `Reason: ${ctx.match}`
                    }
                }
                await tmute(ctx, ctx.message.reply_to_message.from.id, mute_duration, mute_message);
            }
            else {
                await ctx.api.sendMessage(ctx.chat.id, "Please type the duration next to /tmute command, i.e. /tmute 12h", {reply_parameters: {message_id: ctx.message.message_id}});
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
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let mute_message = (
                        `<b>🔇 Stay quiet</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
                        `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    let mute_duration;
                    if (split_args[1] != undefined) {
                        mute_duration = await extract_time(ctx, split_args[1].toString());
                        if (mute_duration != false) {
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Duration: ${converted_time}`;
                        }
                        else {
                            mute_duration = 0;
                            if (split_args[1] != undefined) {
                                mute_message += `Reason: ${split_args[1]}`
                            }
                        }
                    }
                    await tmute(ctx, user_id, mute_duration, mute_message);
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }       
        else {        
            await ctx.reply("Please type the user ID and duration next to /tmute command or reply to a message with /tmute command with duration.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

bot.chatType("supergroup" || "group").command(["smute", "pss"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            return;
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            return;
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            return;
        }
        else {
            if (ctx.match) {
                let args = ctx.match;
                let mute_message = (
                    `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                    `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                );
                let mute_duration = await extract_time(ctx, args.toString());
                if (mute_duration != false) {
                    let converted_time = await convertUnixTime(Number(mute_duration));
                    mute_message += `Duration: ${converted_time}`;
                }
                else {
                    mute_duration = 0;
                    if (args != "") {
                        mute_message += `Reason: ${ctx.match}`
                    }
                }
                await tmute(ctx, ctx.message.reply_to_message.from.id, mute_duration, mute_message);
            }
            else {
                await ctx.api.sendMessage(ctx.chat.id, "Please type the duration next to /tmute command, i.e. /tmute 12h", {reply_parameters: {message_id: ctx.message.message_id}});
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
                    return;
                }
                else if (user_id == ctx.from.id) {
                    return;
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    return;
                }
                else {
                    let mute_message = (
                        `<b>🔇 Stay quiet</b> <a href="tg://user?id=${user_id}">${userInstance.firstName}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
                        `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
                    );
                    let mute_duration;
                    if (split_args[1] != undefined) {
                        mute_duration = await extract_time(ctx, split_args[1].toString());
                        if (mute_duration != false) {
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Duration: ${converted_time}`;
                        }
                        else {
                            mute_duration = 0;
                            if (split_args[1] != undefined) {
                                mute_message += `Reason: ${split_args[1]}`
                            }
                        }
                    }
                    await smute(ctx, user_id, mute_duration, mute_message);
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

bot.chatType("supergroup" || "group").command(["dmute", "delmute"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("YOU CAN'T MAKE ME STAY QUIET!!!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You can just stop typing, you know?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Muting the privileged users is out of my league :(", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else {
            let args = ctx.match;
            let mute_message = (
                `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>)<b>!</b>\n\n` +
                `Muted by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` 
            );
            let mute_duration = await extract_time(ctx, args.toString());
            if (mute_duration != false) {
                let converted_time = await convertUnixTime(Number(mute_duration));
                mute_message += `Duration: ${converted_time}`;
            }
            else {
                mute_duration = 0;
                if (args != "") {
                    mute_message += `Reason: ${ctx.match}`
                }
            }
            await dmute(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.message_id, mute_duration, mute_message);
        }
    }
    else {
        await ctx.reply("Please reply to a message with /dmute command to <i>delete-mute</i> it", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})))));

bot.callbackQuery("unmute-our-fella", adminCanRestrictUsersCallback(botCanRestrictUsersCallback(async(ctx: any) => {
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
                grammyErrorLog(ctx, GrammyError); 
            });     
        }       
    }
    else {
        await ctx.answerCallbackQuery({
            text: `Unable to extract information on user restrictions.`,
        }).catch((GrammyError: any) => {return})
    }       
})));