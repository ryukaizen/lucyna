import { Composer, FilterQuery, InlineKeyboard } from "grammy";
import { get_blacklist, reset_all_blacklist, reset_blacklist, set_blacklist } from "../database/blacklist_sql";
import { adminCanDeleteMessages, adminCanRestrictUsers, adminCanRestrictUsersCallback, botCanDeleteMessages, botCanRestrictUsers, botCanRestrictUsersCallback, convertUnixTime, extract_time, isUserAdmin, isUserBanned, isUserRestricted, ownerOnlyCallback } from "../helpers/helper_func";
import { get_blacklist_settings, set_blacklist_settings } from "../database/blacklist_settings_sql";
import { get_warn_numbers, get_warn_settings, set_warn_numbers, set_warn_settings } from "../database/warns_sql";
import { grammyErrorLog } from "../logger";

// TODO: 
// something like this very suboptimal we need to fix this:
// adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(

const composer = new Composer();

const stickerMessageTypes: FilterQuery[] = [
    "message:sticker", 
    "message:sticker:is_animated", 
    "message:sticker:is_video", 
    "message:sticker:premium_animation",
    "edited_message:sticker",
    "edited_message:sticker:is_animated",
    "edited_message:sticker:is_video",
    "edited_message:sticker:premium_animation",
];

async function blacklist(ctx: any) {
    let blacklist = await get_blacklist(ctx.chat.id);
    let filter_list = `Current blacklisted words in <b>${ctx.chat.title}</b>:\n\n`;
    
    if (blacklist && blacklist.length > 0) {
        blacklist.forEach((item: { trigger: string }, index: number) => {
            filter_list += `${index + 1}. <code>${item.trigger}</code>\n`;
        });
    } else {
        filter_list = "There are <b>NO</b> blacklisted words in this chat.";
    }

    await ctx.reply(filter_list, { reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML", link_preview_options: {is_disabled: true} });
}

const unwarnButton = new InlineKeyboard()
    .text("*️⃣ Remove Warn", "unwarn-once-my-beloved")

async function blacklist_warn(ctx: any, user_id: bigint, first_name: string, inputReason: string) {
    let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_id);
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
        `<b>⚠️ Warned</b> <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
        `Warner: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
        `Warns: <b>${warnNumber}/${warnLimit}</b>\n`
    );
    warnReasons = warnReasons ?? [];
    warnReasons.push(`${inputReason}`);
    let warnReasonsWithBullets = warnReasons.map((reason, index) => `\n ${index + 1}. ${reason}`);
    warn_message += `Reason: ${warnReasonsWithBullets}`;
    await set_warn_numbers(ctx.chat.id.toString(), user_id, [`${inputReason}`]);
            
    if (warnNumber >= warnLimit) {
        if (warnMode == true) {
            warn_message += "\n\n<b>🦿 Kicked out of the group!</b>"
            await ctx.api.unbanChatMember(ctx.chat.id, user_id)
            .then(() => {
                ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
            })
            .catch((GrammyError: any) => {
                ctx.reply("Failed to kick user, they can be removed manually.");
                grammyErrorLog(ctx, GrammyError);
            });
        }
        else {
            warn_message += "\n\n<b>❌ Banned out of the group!</b>"
            await ctx.api.banChatMember(ctx.chat.id, user_id)
            .then(() => {
                ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
            })
            .catch((GrammyError: any) => {
                ctx.reply("Failed to ban user, they can be removed manually.");
                grammyErrorLog(ctx, GrammyError);
            });
        }
    }
    else {
        await ctx.api.sendMessage(ctx.chat.id, warn_message, {reply_markup: unwarnButton, parse_mode: "HTML"});
    }
}

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

const unmuteButton = new InlineKeyboard()
.text("🔊 Unmute", "unmute-blacklisted-fella");

async function blacklist_mute(ctx: any, user_id: number | string, message: string) {
    await ctx.deleteMessage().catch(() => {})
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions)
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unmuteButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to mute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

const unbanButton = new InlineKeyboard()
.text("🔘 Unban", "unban-blacklisted-dawg");

async function blacklist_ban(ctx: any, user_id: number | string, message: string) {
    await ctx.deleteMessage().catch(() => {})
    await ctx.api.banChatMember(ctx.chat.id, user_id, {revoke_messages: true})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unbanButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to ban user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
} 

async function blacklist_kick(ctx: any, user_id: number | string, message: string) {
    await ctx.deleteMessage().catch(() => {})
    await ctx.api.unbanChatMember(ctx.chat.id, user_id)
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to kick user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError); 
    });
}

async function blacklist_tban(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.deleteMessage().catch(() => {})
    await ctx.api.banChatMember(ctx.chat.id, user_id, {until_date: duration, revoke_messages: true})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unbanButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to temp-ban user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });

}

async function blacklist_tmute(ctx: any, user_id: number | string, duration: any, message: string) {
    await ctx.deleteMessage().catch(() => {})
    await ctx.api.restrictChatMember(ctx.chat.id, user_id, mutePermissions, {until_date: duration})
    .then(() => {
        ctx.api.sendMessage(ctx.chat.id, message, {reply_markup: unmuteButton, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to tmute user: invalid user / user probably does not exist.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function addblacklist(ctx: any, triggers: string[]) {
    let addedTriggers: string[] = [];

    for (let trigger of triggers) {
        let result = await set_blacklist(ctx.chat.id.toString(), trigger);
        if (result) {
            addedTriggers.push(trigger);
        }
    }

    return addedTriggers;
}

async function removeblacklist(ctx: any, triggers: string[]) {
    let removedTriggers: string[] = [];

    for (let trigger of triggers) {
        let result = await reset_blacklist(ctx.chat.id.toString(), trigger);
        if (result) {
            removedTriggers.push(trigger);
        }
    }

    return removedTriggers;
}

const BLACKLIST_ACTIONS: { [key: number]: string } = {
    0: "do nothing",
    1: "delete",
    2: "warn",
    3: "mute",
    4: "kick",
    5: "ban",
    6: "temporarily ban",
    7: "temporarily mute"
};

async function blacklistmode(ctx: any) {
    let chatId = ctx.chat.id.toString();
    let { blacklist_type: mode, value } = await get_blacklist_settings(chatId) || {};
    if (mode === undefined) {
        mode = 2n;
        value = "0";
        await set_blacklist_settings(chatId, mode, value);
    }

    let args = ctx.match ? ctx.match.trim().split(/\s+/) : [];

    if (args.length === 0) {
        let action = BLACKLIST_ACTIONS[Number(mode)] || "unknown";
        let response;
        if (mode === 6n || mode === 7n) {
            if (value && !isNaN(parseInt(value))) {
                let renderTime = await extract_time(ctx, value);
                let humanReadableTime = convertUnixTime(parseInt(renderTime.toString()));
                response = `Current blacklist mode: *${action} for ${humanReadableTime}*`;
            } else {
                response = `Current blacklist mode: *${action}* (invalid time value)`;
            }
        } else {
            response = `Current blacklist mode: *${action}*`;
        }
        await ctx.reply(response, { reply_parameters: { message_id: ctx.message.message_id }, parse_mode: "Markdown" });
        return;
    }

    let newMode = args[0].toLowerCase();
    let newValue = "0";
    let settypeblacklist = "";

    switch (newMode) {
        case "off":
        case "nothing":
        case "no":
            mode = 0n;
            settypeblacklist = BLACKLIST_ACTIONS[0];
            break;
        case "del":
        case "delete":
            mode = 1n;
            settypeblacklist = BLACKLIST_ACTIONS[1];
            break;
        case "warn":
            mode = 2n;
            settypeblacklist = BLACKLIST_ACTIONS[2];
            break;
        case "mute":
            mode = 3n;
            settypeblacklist = BLACKLIST_ACTIONS[3];
            break;
        case "kick":
            mode = 4n;
            settypeblacklist = BLACKLIST_ACTIONS[4];
            break;
        case "ban":
            mode = 5n;
            settypeblacklist = BLACKLIST_ACTIONS[5];
            break;
        case "tban":
        case "tmute":
            if (args.length === 1) {
                await ctx.reply(`Please specify a time value. For example: /blacklistmode ${newMode} 1d`, 
                    { reply_parameters: { message_id: ctx.message.message_id } });
                return;
            }
            newValue = args.slice(1).join(' ');
            let extractedTime = await extract_time(ctx, newValue);
            if (extractedTime === false) {
                return;
            }
            mode = newMode === "tban" ? 6n : 7n;
            let humanReadableTime = convertUnixTime(extractedTime);
            settypeblacklist = `${BLACKLIST_ACTIONS[Number(mode)]} for ${humanReadableTime}`;
            break;
        default:
            await ctx.reply("Invalid mode. Use: off/del/warn/mute/kick/ban/tban/tmute", 
                { reply_parameters: { message_id: ctx.message.message_id }, parse_mode: "HTML" });
            return;
    }

    let blacklist = await get_blacklist(chatId);
    await set_blacklist_settings(chatId, mode, newValue);

    let cachedData = blacklistCache.get(chatId);
    let now = Date.now();

    cachedData = {
        mode: mode,
        value: newValue ?? "0",
        words: new Set(blacklist),
        expiry: now + CACHE_DURATION
    };

    blacklistCache.set(chatId, cachedData);
    await ctx.reply(`Changed blacklist mode to: *${settypeblacklist}*`, 
        { reply_parameters: { message_id: ctx.message.message_id }, parse_mode: "Markdown" });
}

async function unblacklistall(ctx: any) {
    let confirmReset = new InlineKeyboard()
    .text("Yes", "yes-unblacklist-all")
    .text("No", "no-dont-unblacklist-all")

    await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to <b>REMOVE ALL THE BLACKLISTED WORDS</b> from this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});     
}

const blacklistCache = new Map<string, { mode: bigint, value: string, words: Set<{ chat_id: string; trigger: string; }>, expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

composer.chatType(["supergroup", "group"]).on(["message", "edited_message"], async (ctx: any, next) => {
    let chatId = ctx.chat?.id.toString();

    let cachedData = blacklistCache.get(chatId);
    let now = Date.now();

    if (!cachedData || now > cachedData.expiry) {
        let [blacklist, settings] = await Promise.all([
            get_blacklist(ctx.chat.id),
            get_blacklist_settings(chatId)
        ]);

        if (!settings || settings.blacklist_type === null) {
            cachedData = {
                mode: 2n, // Default mode warn
                value: "0",
                words: new Set(blacklist),
                expiry: now + CACHE_DURATION
            };
        } else {
            cachedData = {
                mode: settings.blacklist_type,
                value: settings.value ?? "0",
                words: new Set(blacklist),
                expiry: now + CACHE_DURATION
            };
        }
        blacklistCache.set(chatId, cachedData);
    }

    let messageText = ctx.message.text;
    let blacklistedWord = [...cachedData.words].find(word => {
        let escapedTrigger = word.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let regex = new RegExp(`\\b${escapedTrigger}\\b`, 'i');
        let isMatch = regex.test(messageText);
        return isMatch;
    });

    let duration_value;
    if (cachedData.value) {
        duration_value = cachedData.value;
    }
    else {
        duration_value = "12h";
    }

    if (blacklistedWord) {
        let isAdmin = await isUserAdmin(ctx, ctx.from.id)
        if (!isAdmin) {
            let mute_message = (
                `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> (<code>${ctx.from.id}</code>)<b>!</b>\n\n`  
            );
            let ban_message = (
                `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> (<code>${ctx.from.id}</code>)<b>!</b>\n\n` 
            );

            switch (cachedData.mode) {
                case 0n:
                    return;
                case 1n:
                    await ctx.deleteMessage().catch(() => {})
                    break;
                case 2n:
                    await blacklist_warn(ctx, ctx.from.id, ctx.from.first_name, `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>`);
                    break;
                case 3n:
                    mute_message += `The message ${ctx.from.first_name} sent, contained a blacklisted word: <tg-spoiler><s>${blacklistedWord?.trigger}</s></tg-spoiler>`
                    await blacklist_mute(ctx, ctx.from.id, `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>`);
                    break;
                case 4n:
                    await blacklist_kick(ctx, ctx.from.id, `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>`);
                    break;
                case 5n:
                    ban_message += `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>\n\n`
                    await blacklist_ban(ctx, ctx.from.id, `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>`);
                    break;
                case 6n:
                    ban_message += `The message ${ctx.from.first_name} sent, contained a blacklisted word: <s>${blacklistedWord?.trigger}</s>\n\n`
                    let ban_duration = await extract_time(ctx, duration_value);
                    if (ban_duration != false) {
                        let converted_time = await convertUnixTime(Number(ban_duration));
                        ban_message += `Ban duration: ${converted_time}`;
                    }
                    await blacklist_tban(ctx, ctx.from.id, ban_duration, ban_message)
                    break;
                case 7n:
                    mute_message += `The message ${ctx.from.first_name} sent, contained a blacklisted word: <tg-spoiler><s>${blacklistedWord?.trigger}</s></tg-spoiler>`
                    let mute_duration = await extract_time(ctx, duration_value);
                    if (mute_duration != false) {
                        let converted_time = await convertUnixTime(Number(mute_duration));
                        mute_message += `Mute duration: ${converted_time}`;
                    }
                    await blacklist_tmute(ctx, ctx.from.id, mute_duration, mute_message)
                    break;
            }
        }
    }

    await next();
});

composer.chatType(["supergroup", "group"]).command(["blacklist", "blacklists"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    await blacklist(ctx);
})))));

composer.chatType(["supergroup", "group"]).command("addblacklist", adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    let triggers = ctx.match;
  
    if (!triggers) {
        await ctx.reply("Please provide at least one trigger to add to the blacklist. Each line will be considered as a separate trigger.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        return;
    }

    triggers = triggers.trim().split('\n').filter((trigger: string) => trigger.trim() !== '');

    if (triggers.length === 0) {
        await ctx.reply("No valid triggers found. Please provide at least one trigger to add to the blacklist.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        return;
    }

    let addedTriggers = await addblacklist(ctx, triggers);
    let blacklist = await get_blacklist(ctx.chat.id);
    let blacklist_settings = await get_blacklist_settings(ctx.chat.id);
    let cachedData = blacklistCache.get(ctx.chat.id);
    let now = Date.now();

    if (blacklist_settings !== null) {
        cachedData = {
            mode: blacklist_settings.blacklist_type ?? 2n,
            value: blacklist_settings.value ?? "0",
            words: new Set(blacklist),
            expiry: now + CACHE_DURATION
        };
    }
    else {
        cachedData = {
            mode: 2n,
            value: "0",
            words: new Set(blacklist),
            expiry: now + CACHE_DURATION
        };
        await set_blacklist_settings(ctx.chat.id, 2n, "0");
    }

    blacklistCache.set(ctx.chat.id, cachedData);

    if (addedTriggers.length > 0) {
        let response = `Added ${addedTriggers.length} trigger${addedTriggers.length > 1 ? 's' : ''} to the blacklist:\n${addedTriggers.map(t => `- ${t}`).join('\n')}`;
        await ctx.reply(response, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    } 
    else {
        await ctx.reply("No new triggers were added to the blacklist. They might already exist in the list.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})))));

composer.chatType(["supergroup", "group"]).command(["unblacklist", "rmblacklist"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    let input = ctx.match;
  
    if (!input) {
        await ctx.reply("Please provide at least one trigger to remove from the blacklist. You can provide multiple triggers separated by spaces or newlines.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        return;
    }

    let triggers = input.split(/[\n\s]+/).filter((trigger: string) => trigger.trim() !== '');

    if (triggers.length === 0) {
        await ctx.reply("No valid triggers found. Please provide at least one trigger to remove from the blacklist.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        return;
    }

    let removedTriggers = await removeblacklist(ctx, triggers);

    if (removedTriggers.length > 0) {
        let response = `Removed ${removedTriggers.length} trigger${removedTriggers.length > 1 ? 's' : ''} from the blacklist:\n${removedTriggers.map(t => `- ${t}`).join('\n')}`;
        await ctx.reply(response, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    } 
    else {
        await ctx.reply("No triggers were removed from the blacklist. They might not exist in the list.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})))));

composer.chatType(["supergroup", "group"]).command(["blacklistmode", "setblacklistmode"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    await blacklistmode(ctx);
})))));

composer.chatType(["supergroup", "group"]).command(["unblacklistall", "rmblacklistall"], ownerOnlyCallback(async (ctx: any) => {
    await unblacklistall(ctx);
}));

composer.chatType(["supergroup", "group"]).command(["blsticker", "blstickers"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    
})))));

composer.chatType(["supergroup", "group"]).command("addblsticker", adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    
})))));

composer.chatType(["supergroup", "group"]).command(["unblsticker", "rmblsticker"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    
})))));

composer.chatType(["supergroup", "group"]).command("blstickermode", adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    
})))));

composer.on(["message", "edited_message"], (async (ctx: any, next) => {

    await next();        
}));

composer.on(stickerMessageTypes, (async (ctx: any, next) => {
        
    await next();        
}));

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

composer.callbackQuery("unban-blacklisted-dawg", adminCanRestrictUsersCallback(botCanRestrictUsersCallback(async(ctx: any) => {
    let text = ctx.callbackQuery.message?.text || "";
    let username = text.match(/(?<=🚷 Banned )\S+/);
    let userid = text.match(/(?<=\()\d+(?=\))/);

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

composer.callbackQuery("unmute-blacklisted-fella", adminCanRestrictUsersCallback(botCanRestrictUsersCallback(async(ctx: any) => {
    let text = ctx.callbackQuery.message?.text || "";
    let username = text.match(/(?<=🔇 Stay quiet )\S+/);
    let userid = text.match(/(?<=\()\d+(?=\))/);

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

composer.callbackQuery("yes-unblacklist-all", ownerOnlyCallback(async(ctx: any) => {
    let resetted = await reset_all_blacklist(ctx.chat.id.toString()) 
    if (resetted == true) {
        await ctx.editMessageText("All the blacklisted words in this chat have been unblacklisted!", { parse_mode: "HTML" });
    }
    else {
        await ctx.editMessageText("Failed to remove all filter triggers of this chat!", { parse_mode: "HTML" });
    }
}));

composer.callbackQuery("no-dont-unblacklist-all", ownerOnlyCallback(async(ctx: any) => {
    await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
}));

export default composer;