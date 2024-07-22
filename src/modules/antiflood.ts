import { Composer, InlineKeyboard } from "grammy";
import { get_flood as get_flood_db, set_flood as set_flood_db, update_flood as update_flood_db } from "../database/antiflood_sql";
import { get_flood_settings, set_flood_settings } from "../database/antiflood_settings_sql"
import { adminCanRestrictUsers, botCanRestrictUsers, convertUnixTime, extract_time, isUserAdmin } from "../helpers/helper_func";
import { prisma } from "../database";
import { grammyErrorLog } from "../logger";

const composer = new Composer();

type FloodControl = {
    user_id: number | null;
    count: bigint | null;
    limit: bigint | null;
};


type ChatFloodMap = {
    [chatId: string]: FloodControl;
};

const CHAT_FLOOD: ChatFloodMap = {};
const DEF_COUNT = 0n;
const DEF_LIMIT = 0n;
const DEF_OBJ: FloodControl = { user_id: null, count: DEF_COUNT, limit: DEF_LIMIT };


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
.text("🔊 Unmute", "unmute-flooded-fella");

async function antiflood_mute(ctx: any, user_id: number | string, message: string) {
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

async function antiflood_ban(ctx: any, user_id: number | string, message: string) {
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

async function antiflood_kick(ctx: any, user_id: number | string, message: string) {
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

async function antiflood_tban(ctx: any, user_id: number | string, duration: any, message: string) {
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

async function antiflood_tmute(ctx: any, user_id: number | string, duration: any, message: string) {
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

async function captureflood(ctx: any) {
    let chatId = ctx.chat.id.toString();
    let flood = await get_flood(chatId);
    
    if (flood.limit !== null && flood.limit > 0n) {
        if (flood.user_id !== ctx.from.id) {
            flood.user_id = ctx.from.id;
            flood.count = 1n;
        } else {
            flood.count = (flood.count || 0n) + 1n;
        }


        CHAT_FLOOD[chatId] = flood;

        if (flood.count >= flood.limit) {
            let flood_settings = await get_flood_settings(chatId);
            let isAdmin = await isUserAdmin(ctx, ctx.from.id)
            if (!isAdmin) {
                let mute_message = (
                    `<b>🔇 Stay quiet</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> (<code>${ctx.from.id}</code>)<b>!</b>\n\n`  
                );
                let ban_message = (
                    `<b>🚷 Banned</b> <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> (<code>${ctx.from.id}</code>)<b>!</b>\n\n` 
                );

                let duration_value;
                if (flood_settings?.value) {
                    duration_value = flood_settings?.value;
                }
                else {
                    duration_value = "365d";
                }
                switch (flood_settings?.flood_type) {
                    case 0n:
                        return;
                    case 1n:
                        ban_message += `${ctx.from.first_name} spammed & hit flood limit of <code>${flood.limit}</code> consecutive messages!\n\n`
                        await antiflood_ban(ctx, ctx.from.id, ban_message);
                        break;
                    case 2n:
                        await antiflood_kick(ctx, ctx.from.id, `${ctx.from.first_name} spammed & hit flood limit of <code>${flood.limit}</code> consecutive messages!\n\n<b>Kicked outta the group.</b>`);
                        break;
                    case 3n:
                        mute_message += `${ctx.from.first_name} spammed & hit flood limit of <code>${flood.limit}</code> consecutive messages!\n\n`
                        await antiflood_mute(ctx, ctx.from.id, mute_message);
                        break;
                    case 4n:
                        ban_message += `${ctx.from.first_name} spammed & hit flood limit of <code>${flood.limit}</code> consecutive messages!\n\n`
                        let ban_duration = await extract_time(ctx, duration_value);
                        if (ban_duration != false) {
                            let converted_time = await convertUnixTime(Number(ban_duration));
                            ban_message += `Ban duration: ${converted_time}`;
                        }
                        await antiflood_tban(ctx, ctx.from.id, ban_duration, ban_message)
                        break;
                    case 5n:
                        mute_message += `${ctx.from.first_name} spammed & hit flood limit of <code>${flood.limit}</code> consecutive messages!\n\n`
                        let mute_duration = await extract_time(ctx, duration_value);
                        if (mute_duration != false) {
                            let converted_time = await convertUnixTime(Number(mute_duration));
                            mute_message += `Mute duration: ${converted_time}`;
                        }
                        await antiflood_tmute(ctx, ctx.from.id, mute_duration, mute_message)
                        break;
                }
            }
            flood.count = 0n;
            flood.user_id = null;
            CHAT_FLOOD[chatId] = flood;
            await update_flood_db(chatId, flood.count, flood.user_id);
        } 
        else {

            await update_flood_db(chatId, flood.count, flood.user_id);
        }
    }
}

async function get_flood(chat_id: string | number): Promise<FloodControl> {
    let chatId = chat_id.toString();

    if (Object.keys(CHAT_FLOOD).length === 0) {
        const allChats = await prisma.antiflood.findMany();
        for (const chat of allChats) {
            CHAT_FLOOD[chat.chat_id] = {
                user_id: null,
                count: 0n, 
                limit: chat.limit ?? DEF_LIMIT
            };
        }
    }

    if (!(chatId in CHAT_FLOOD)) {
        let flood = await get_flood_db(chatId);
        CHAT_FLOOD[chatId] = flood
            ? { 
                user_id: null, 
                count: 0n, 
                limit: flood.limit ?? DEF_LIMIT 
              }
            : { ...DEF_OBJ, count: 0n }; 
    }

    return CHAT_FLOOD[chatId];
}

async function set_flood(chat_id: string | number, count: bigint, limit: bigint): Promise<void> {
    let chatId = chat_id.toString();
    CHAT_FLOOD[chatId] = { user_id: null, count, limit };
    await set_flood_db(chatId, count, limit);
}

async function flood_type_meaning(flood_type: bigint) {
    switch (flood_type) {
        case 1n:
            return "ban";
        case 2n:
            return "kick";
        case 3n:
            return "mute";
        case 4n:
            return "tban";
        case 5n:
            return "tmute";
    }
}

async function validateTimeValue(input: string): Promise<string | false> {
    let regex = /^(\d+m|\d+h|\d+d)(\s+(\d+m|\d+h|\d+d))*$/i;

    if (regex.test(input)) {
        return input;
    }

    return false;
}

async function flood(ctx: any) {
    let flood = await get_flood(ctx.chat.id);
    let flood_settings = await get_flood_settings(ctx.chat.id);
    if (ctx.match) {
        await ctx.reply(`Use <code>/setflood (number)</code> to enable anti-flood (i.e. <code>/setflood 12</code> - limit 12 consecutive messages).\n\nOr use <code>/setflood off</code> to disable anti-flood!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
    }
    else if (!flood?.limit) {
        await ctx.reply("I'm not enforcing any flood control here!", {reply_parameters: {message_id: ctx.message.message_id}});
    } 
    else {
        await ctx.reply(`I'm currently restricting members after <code>${flood?.limit}</code> consecutive messages.\n<b>Action on exceeding the limit</b>: <code>${await flood_type_meaning(flood_settings?.flood_type || 1n)}</code>`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
}

async function floodmode(ctx: any) {
    let flood_settings = await get_flood_settings(ctx.chat.id);
    if (ctx.match) {
        await ctx.reply(`Usage: <code>/setfloodmode ban/kick/mute/tban/tmute value</code> to set action to be taken after members exceed the flood limit!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});        
    }
    else if (flood_settings?.flood_type == undefined) {
        await set_flood_settings(ctx.chat.id.toString(), 1n);
        await ctx.reply(`Members will be <b>banned</b> after exceeding the flood limit!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
    } 
    else {
        if (flood_settings?.value !== null && flood_settings?.value !== "0") {
            await ctx.reply(`Current flood mode is set to: <b>${await flood_type_meaning(flood_settings?.flood_type || 1n)} ${flood_settings?.value}</b>`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}}); 
        }
        else {
            await ctx.reply(`Current flood mode is set to: <b>${await flood_type_meaning(flood_settings?.flood_type || 1n)}</b>`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}}); 
        }
    }   
}

async function setflood(ctx: any) {
    let args = ctx.match.toLowerCase();
    if (args) {
        let flood_settings = await get_flood_settings(ctx.chat.id);
        if (args == "off" || args == "no" || args == "disable" || args == "0") {
            await set_flood(ctx.chat.id.toString(), 0n, 0n);
            await ctx.reply(`Anti-flood has been <b>disabled</b>!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (!isNaN(Number(args))) {
            if (flood_settings?.flood_type == undefined) {
                await set_flood_settings(ctx.chat.id.toString(), 1n);
            }
            await set_flood(ctx.chat.id.toString(), 0n, BigInt(args));
            await ctx.reply(`Anti-flood has been set to <code>${args}</code> consecutive messages!\n<b>Action on exceeding the limit</b>: <code>${await flood_type_meaning(flood_settings?.flood_type || 1n)}</code>`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            await ctx.reply(`Invalid argument. Please use a number to set flood limit or use '<code>off</code>' or '<code>no</code>' to disable anti-flood.`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
    else { 
        await ctx.reply(`Use <code>/setflood (number)</code> to enable anti-flood (i.e. <code>/setflood 12</code> - limit 12 consecutive messages).\n\nOr use <code>/setflood off</code> to disable anti-flood!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
    }
}

async function setfloodmode(ctx: any) {
    let args = ctx.match.toLowerCase();
    if (args) {
        let split_args = args.split(" ");
        if (split_args[0] == "ban") {
            await set_flood_settings(ctx.chat.id.toString(), 1n);
            await ctx.reply(`Members will be <b>banned</b> after exceeding the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
        } 
        else if (split_args[0] == "kick") {
            await set_flood_settings(ctx.chat.id.toString(), 2n);
            await ctx.reply(`Members will be <b>kicked</b> after exceeding the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
        }     
        else if (split_args[0] == "mute") {
            await set_flood_settings(ctx.chat.id.toString(), 3n);
            await ctx.reply(`Members will be <b>muted</b> after exceeding the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
        }
        else if (split_args[0] == "tban") {
            if (split_args.length > 1) {
                let time_value = await validateTimeValue(split_args.slice(1).join(" "));
                if (time_value !== false) {
                    await set_flood_settings(ctx.chat.id.toString(), 4n, time_value);
                    await ctx.reply(`Members will be <b>temporarily banned for ${time_value}</b> after exceeding the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
                }
                else {
                    await ctx.reply(`It looks like you didn't specify a valid time; Try, <code>/setfloodmode tmute 12h</code>.\n\nExamples of time value: 4m = 4 minutes, 3h = 3 hours, 6d = 6 days, 5w = 5 weeks.`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
                } 
            }
            else {
                await ctx.reply(`It looks like you didn't specify a valid time; Try, <code>/setfloodmode tmute 12h</code>.\n\nExamples of time value: 4m = 4 minutes, 3h = 3 hours, 6d = 6 days, 5w = 5 weeks.`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
            }
        } 
        else if (split_args[0] == "tmute") {
            if (split_args.length > 1) {
                let time_value = await validateTimeValue(split_args.slice(1).join(" "));
                if (time_value !== false) {
                    await set_flood_settings(ctx.chat.id.toString(), 5n, time_value);
                    await ctx.reply(`Members will be <b>temporarily muted for ${time_value}</b> after exceeding the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
                }
                else {
                    await ctx.reply(`It looks like you didn't specify a valid time; Try, <code>/setfloodmode tmute 12h</code>.\n\nExamples of time value: 4m = 4 minutes, 3h = 3 hours, 6d = 6 days, 5w = 5 weeks.`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
                } 
            }
            else {
                await ctx.reply(`It looks like you didn't specify a valid time; Try, <code>/setfloodmode tmute 12h</code>.\n\nExamples of time value: 4m = 4 minutes, 3h = 3 hours, 6d = 6 days, 5w = 5 weeks.`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
            }
        }
        else {
            await ctx.reply(`Usage: <code>/setfloodmode ban/kick/mute/tban/tmute value</code> to set action to be taken after members exceed the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
        }
    } 
    else {
      await ctx.reply(`Usage: <code>/setfloodmode ban/kick/mute/tban/tmute value</code> to set action to be taken after members exceed the flood limit!`, { parse_mode: "HTML", reply_parameters: { message_id: ctx.message.message_id } });
    }
}

composer.on(["message", "edited_message"], async (ctx: any, next) => {
    await captureflood(ctx);
    await next();
});

composer.chatType(["supergroup", "group"]).command(["flood", "antiflood"], (async (ctx: any) => {
    await flood(ctx);
}));

composer.chatType(["supergroup", "group"]).command(["floodmode", "antifloodmode"], (async (ctx: any) => {
    await floodmode(ctx);
}));

composer.chatType(["supergroup", "group"]).command(["setflood", "setantiflood"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await setflood(ctx);
})));

composer.chatType(["supergroup", "group"]).command(["setfloodmode", "setantifloodmode"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await setfloodmode(ctx);
})));

export default composer;