import { Composer } from "grammy";
import { bot } from "../bot";
import { get_flood, get_flood_settings, set_flood, set_flood_settings } from "../database/antiflood_sql";
import { adminCanRestrictUsers, botCanRestrictUsers, convertUnixTime, extract_time } from "../helpers/helper_func";

const composer = new Composer();

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
    const regex = /^(\d+m|\d+h|\d+d)(\s+(\d+m|\d+h|\d+d))*$/i;

    if (regex.test(input)) {
        return input;
    }

    return false;
}

// async function captureflood(ctx: any) {
//     let flood = await get_flood(ctx.chat.id);
//     let flood_settings = await get_flood_settings(ctx.chat.id);
//     if (flood?.limit) {
//         if (flood.count >= flood.limit) {
//             switch (flood_settings?.flood_type) {
//                 case 1n:
//                     await ctx.kickChatMember(ctx.from.id);
//                     break;
//                 case 2n:
//                     await ctx.kickChatMember(ctx.from.id);
//                     break;
//                 case 3n:
//                     await ctx.restrictChatMember(ctx.from.id, {until_date: Math.floor(Date.now() / 1000) + 3600});
//                     break;
//                 case 4n:
//                     await ctx.kickChatMember(ctx.from.id);
//                     await ctx.restrictChatMember(ctx.from.id, {until_date: Math.floor(Date.now() / 1000) + convertUnixTime(flood_settings?.value || "0")});
//                     break;
//                 case 5n:
//                     await ctx.restrictChatMember(ctx.from.id, {until_date: Math.floor(Date.now() / 1000) + convertUnixTime(flood_settings?.value || "0")});
//                     break;
//             }
//             await ctx.deleteMessage(ctx.message.message_id);
//             await ctx.reply(`You have exceeded the flood limit of <code>${flood.limit}</code> consecutive messages!`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
//         }
//         else {
//             await set_flood(ctx.chat.id.toString(), flood?.count + 1n, flood.limit);
//         }
//     }
// }

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
            await ctx.reply(`Invalid argument please use a number to set flood limit <i>OR</i> use '<code>off</code>' or '<code>no</code>' to disable anti-flood.`, {parse_mode: "HTML", reply_parameters: {message_id: ctx.message.message_id}});
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

// var FLOODCOUNT: bigint = 0n;

// composer.on(["message", "edited_message"], (async (ctx: any) => {
//     // await captureflood(ctx);
//     // FLOODCOUNT += 1n
//     // let limit = 10n
//     // console.log(`${FLOODCOUNT}/${limit}`)
//     // if (FLOODCOUNT > limit) {
//     //     FLOODCOUNT = 0n
//     // }
//     // await next();
    
// }));

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