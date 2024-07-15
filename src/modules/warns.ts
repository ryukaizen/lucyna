import { bot } from "../bot";
import { grammyErrorLog } from "../logger";
import { Composer, InlineKeyboard } from "grammy";
import { 
    get_warn_numbers, 
    get_warn_settings, 
    set_warn_numbers, 
    set_warn_settings,
    set_warn_mode,
    set_warn_limit,
    reset_warn_numbers,
    reset_all_warns,
    reset_all_chat_warns
} from "../database/warns_sql";
import {
    adminCanRestrictUsers,
    adminCanRestrictUsersCallback,
    adminCanDeleteMessages, 
    botCanRestrictUsers, 
    botCanRestrictUsersCallback, 
    botCanDeleteMessages, 
    isUserAdmin,
    ownerOnly,
    ownerOnlyCallback,
    resolveUserhandle,
    getUserInstance
} from "../helpers/helper_func";
import { get_all_warn_filters, get_warn_filter, reset_all_warn_filters, reset_warn_filter, set_warn_filter } from "../database/warn_filters_sql";

const composer = new Composer();

const unwarnButton = new InlineKeyboard()
    .text("*️⃣ Remove Warn", "unwarn-once-my-beloved")

async function warns(ctx: any, user_id: bigint, first_name: string) {
    let warn_numbers = await get_warn_numbers(ctx.chat.id, user_id);
    let warn_settings = await get_warn_settings(ctx.chat.id)
    let warns_message = `Warnings received by <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>)\n\n`
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
        warns_message = `User <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>) have no warnings yet!`
    }
    await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"});
}

async function warn(ctx: any, user_id: bigint, first_name: string, inputReason: string) {
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

async function unwarn(ctx: any, user_id: bigint, first_name: string) {
    let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_id);
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
        warns_message = `User <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>) have no warnings yet!`
    }
    else {
        warnNumber = warnNumber ?? 0n;
        warnNumber -= 1n;
        warns_message = (
            `<b>🏳️ Removed latest warn for</b> <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
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
        await reset_warn_numbers(ctx.chat.id.toString(), user_id, warnReasons);
    }   
    await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"}); 
}

async function dwarn(ctx: any, user_id: bigint, first_name: string) {
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
    await set_warn_numbers(ctx.chat.id.toString(), user_id, [`${inputReason}`]);
            
    if (warnNumber >= warnLimit) {
        if (warnMode == true) {
            warn_message += "\n\n<b>🦿 Kicked out of the group!</b>"
            await ctx.api.unbanChatMember(ctx.chat.id, user_id)
            .then(() => {
                ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
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
                ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
                ctx.api.sendMessage(ctx.chat.id, warn_message, {parse_mode: "HTML"});
            })
            .catch((GrammyError: any) => {
                ctx.reply("Failed to ban user, they can be removed manually.");
                grammyErrorLog(ctx, GrammyError);
            });
        }
    }
    else {
        await ctx.api.deleteMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
        await ctx.api.sendMessage(ctx.chat.id, warn_message, {reply_markup: unwarnButton, parse_mode: "HTML"});
    }
}

async function resetwarns(ctx: any, user_id: bigint, first_name: string) {
    let getWarnNumbers = await get_warn_numbers(ctx.chat.id, user_id);
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
        warns_message = `User <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>) have no warnings yet!`
    }
    else {
        warnNumber = warnNumber ?? 0n;
        warnNumber = 0n;
        warns_message = (
            `<b>🏳️ Warns resetted for</b> <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>)<b>!</b>\n\n` +
            `Unwarned by: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>\n` +
            `Warn count: <b>${warnNumber}/${warnLimit}</b>\n`
        );
        warnReasons = warnReasons ?? [];
        warnReasons.pop()
        warnReasons = []
        await reset_all_warns(ctx.chat.id.toString(), user_id, warnReasons)
    }   
    await ctx.api.sendMessage(ctx.chat.id, warns_message, {parse_mode: "HTML"}); 
}

async function warnmode(ctx: any) {
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
}

async function warnlimit(ctx: any) {
    let getWarnSettings = await get_warn_settings(ctx.chat.id);
    let warnLimit = getWarnSettings?.warn_limit;

    if (warnLimit == undefined) {
        await set_warn_settings(ctx.chat.id.toString(), 3n, false); // default limit to 3, and soft_warn is disabled
        warnLimit = 3n;
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
}

async function warnfilters(ctx: any) {
    let warn_filters = await get_all_warn_filters(ctx.chat.id.toString());
    let message;
    if (warn_filters.length > 0) {
        let warn_filter_triggers = warn_filters.map(filter => filter.keyword);
        message = `Warn-filters set in <b>${ctx.message.chat.title}</b>:\n\n${warn_filter_triggers.map((filter, index) => `${index + 1}. <code>${filter}</code>`).join("\n")}`;
    }
    else {
        message = "There are <b>NO</b> warn filters set in this chat yet!";
    }
    await ctx.reply(message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});

}

async function addwarn(ctx: any) {
    let args = ctx.match;
    let split_args = args.split(" ");
    let keyword = split_args[0].toLowerCase();
    let reply = split_args.slice(1).join(" ");
    if (!keyword) {
        await ctx.reply("Please provide a trigger keyword first!", {reply_parameters: {message_id: ctx.message.message_id}});
        
    }
    else if (!reply) {
        await ctx.reply("Please provide a reply for your warning filter!\n\n(<i>Example: /warnfilter stupid Please be polite!</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});

    }
    else {
        let warn_filter = await set_warn_filter(ctx.chat.id.toString(), keyword, reply);
        if (warn_filter) {
            await ctx.reply(`Warn filter for <code>${keyword}</code> has been set with reply: <i>${reply}</i>`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply("Failed to set the warn filter!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

async function nowarn(ctx: any) {
    let args = ctx.match;
    let split_args = args.split(" ");
    let keyword = split_args[0].toLowerCase();
    if (!keyword) {
        await ctx.reply("Please provide the trigger keyword to remove!", {reply_parameters: {message_id: ctx.message.message_id}});  
    }
    else {
        let warn_filter = await reset_warn_filter(ctx.chat.id.toString(), keyword);
        if (warn_filter) {
            await ctx.reply(`Stopped warning filter for <code>${keyword}</code>`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply("Failed to stop the warn filter!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

async function resetallwarnfilters(ctx: any) {
    let confirmReset = new InlineKeyboard()
    .text("Yes", "yes-reset-all-warn-filters")
    .text("No", "no-reset")

    await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to reset <b>ALL WARN FILTERS</b> in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});     

}

async function resetallwarns(ctx: any) {
    let confirmReset = new InlineKeyboard()
    .text("Yes", "yes-reset")
    .text("No", "no-reset")

    await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to reset <b>everyone's</b> warnings in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});     
}

composer.chatType(["supergroup", "group"]).command("warns", (async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        await warns(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = user?.fullUser?.id.toJSNumber();
                await warns(ctx, BigInt(user_id), userInstance.firstName);
            }
            else {
                await ctx.reply("Invalid user ID specified.")
            }
        }
        else {        
            await ctx.reply("Please type the user ID next to /warns command or reply to a user with /warns command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}));

composer.chatType(["supergroup", "group"]).command("warn", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        }
        else {
            let inputReason;
            if (ctx.match) {
                inputReason = ctx.match;
            }
            else {
                inputReason = "No reason provided";
            }
            await warn(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name, inputReason)
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
                let user_id = user?.fullUser?.id.toJSNumber();

                if (user_id == bot.botInfo.id) {
                    await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    let inputReason;
                    inputReason = inputReason ?? "";
                    if (split_args[1] != undefined) {
                        inputReason += split_args.slice(1).join(" ");
                    }
                    else {
                        inputReason = "No reason provided";
                    }
                    await warn(ctx, BigInt(user_id), userInstance.firstName, inputReason);
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
})));

composer.chatType(["supergroup", "group"]).command(["unwarn", "rmwarn"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("🏳️ <b>Unwarned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        }
        else {
            await unwarn(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
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
                let user_id = user?.fullUser?.id.toJSNumber();

                if (user_id == bot.botInfo.id) {
                    await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("🏳️ <b>Unwarned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    await unwarn(ctx, BigInt(user_id), userInstance.firstName);
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }      
        }
        else {        
            await ctx.reply("Please type the user ID next to /unwarn command or reply to a user with /unwarn command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

composer.chatType(["supergroup", "group"]).command(["dwarn", "delwarn"], adminCanRestrictUsers(adminCanDeleteMessages(botCanRestrictUsers(botCanDeleteMessages(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("Warn myself? for what!?", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("It's good to be self-aware.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("⚠️ <b>Warned!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        }
        else {
            await dwarn(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
        }
    }
    else {
        await ctx.reply("Please reply to a message with /dwarn command to <i>delete-warn</i> it", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})))));

composer.chatType(["supergroup", "group"]).command(["resetwarns", "rmwarns"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("🏳️ <b>Warns resetted!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        }
        else {
            await resetwarns(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
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
                let user_id = user?.fullUser?.id.toJSNumber();

                if (user_id == bot.botInfo.id) {
                    await ctx.reply("I can't be warned in first place.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("You are an admin. Period.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("🏳️ <b>Warns resetted!</b> <tg-spoiler>Just kidding.</tg-spoiler>", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    await resetwarns(ctx, BigInt(user_id), userInstance.firstName);
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }      
        }
        else {        
            await ctx.reply("Please type the user ID next to /resetwarns command or reply to a user with /resetwarns command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("warnmode", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await warnmode(ctx);
})));

composer.chatType(["supergroup", "group"]).command("warnlimit", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await warnlimit(ctx); 
})));

composer.chatType(["supergroup", "group"]).command(["warnfilters", "warnlist"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await warnfilters(ctx); 
})));

composer.chatType(["supergroup", "group"]).command("addwarn", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await addwarn(ctx); 
})));

composer.chatType(["supergroup", "group"]).command("nowarn", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await nowarn(ctx); 
})));

composer.chatType(["supergroup", "group"]).command("resetallwarnfilters", ownerOnly(botCanRestrictUsers(async (ctx: any) => {
    await resetallwarnfilters(ctx); 
})));

composer.chatType(["supergroup", "group"]).command("resetallwarns", ownerOnly(botCanRestrictUsers(async (ctx: any) => {
    await resetallwarns(ctx);
})));

// composer.chatType(["supergroup", "group"]).on(["message"], async (ctx: any, next) => {
//     let trigger_message = ctx.message.text || "";
//     let all_warn_filters = await get_all_warn_filters(ctx.chat.id.toString());

//     all_warn_filters.sort((a, b) => b.keyword.length - a.keyword.length);

//     let matched_keywords = all_warn_filters
//         .map(filter => ({
//             keyword: filter.keyword,
//             position: trigger_message.toLowerCase().indexOf(filter.keyword.toLowerCase())
//         }))
//         .filter(match => {
//             if (match.position === -1) return false;

//             let word_boundary_before = match.position === 0 || !/\w/.test(trigger_message[match.position - 1]);
            
//             let word_boundary_after = match.position + match.keyword.length === trigger_message.length || !/\w/.test(trigger_message[match.position + match.keyword.length]);
            
//             let exact_match = word_boundary_before && word_boundary_after;
            
//             let is_part_of_longer_match = all_warn_filters.some(f => 
//                 f.keyword.length > match.keyword.length &&
//                 f.keyword.toLowerCase().includes(match.keyword.toLowerCase()) &&
//                 trigger_message.toLowerCase().indexOf(f.keyword.toLowerCase()) !== -1
//             );

//             return exact_match && !is_part_of_longer_match;
//         })
//         .sort((a, b) => a.position - b.position);
    
//     if (matched_keywords.length > 0) {
//         let first_match_keyword = matched_keywords[0].keyword;
//         let warn_filter = await get_warn_filter(ctx.chat.id, first_match_keyword);
 
//         if (warn_filter) {
//             let text = warn_filter?.reply;
//             // Will implement this in future as we finish working on cache
//         }
//     }        
//     await next();
// }); 

composer.callbackQuery("unwarn-once-my-beloved", adminCanRestrictUsersCallback(botCanRestrictUsersCallback(async(ctx: any) => {
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
})));

composer.callbackQuery("yes-reset-all-warn-filters", ownerOnlyCallback(async(ctx: any) => {
    let resetted = await reset_all_warn_filters(ctx.chat.id.toString()) 
    if (resetted == true) {
        await ctx.editMessageText("All warn filters in this chat have been resetted!", { parse_mode: "HTML" });
    }
    else {
        await ctx.editMessageText("Failed to reset all warn filters of this chat!", { parse_mode: "HTML" });
    }
}));

composer.callbackQuery("yes-reset", ownerOnlyCallback(async(ctx: any) => {
    let resetted = await reset_all_chat_warns(ctx.chat.id.toString()) 
    if (resetted == true) {
        await ctx.editMessageText("All warnings in this chat have been resetted!", { parse_mode: "HTML" });
    }
    else {
        await ctx.editMessageText("Failed to reset all warnings of this chat!", { parse_mode: "HTML" });
    }
}));

composer.callbackQuery("no-reset", ownerOnlyCallback(async(ctx: any) => {
    await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
}));

export default composer;