import { bot } from "../bot";
import { Composer, InlineKeyboard } from "grammy";
import { get_report_settings, set_report_settings } from "../database/reports_sql";
import { datacenterLocation, elevatedUsersOnly, getUserInstance, getUserFullInstance, resolveUserhandle, isUserAdmin } from "../helpers/helper_func";
import { gramjs, gramJsApi } from "../utility";

const composer = new Composer();

async function reportSettings(ctx: any) {
    let reports = await get_report_settings(ctx.chat.id.toString());
    let reports_status = reports?.should_report;
    let current_status;
    if (reports_status == undefined) {
        await set_report_settings(ctx.chat.id.toString(), true)
    }

    if (reports_status) {
        current_status = "enabled"
    }
    else {
        current_status = "disabled"
    }

    if (ctx.match) {
        let split_args = ctx.match.split(" ");
        let arg = split_args[0].toLowerCase();
        if (arg === "on") {
            await set_report_settings(ctx.chat.id.toString(), true)
            await ctx.reply(`Reporting is now <b>enabled</b> in this chat!`, 
            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else if (arg === "off") {
            await set_report_settings(ctx.chat.id.toString(), false)
            await ctx.reply(`Reporting is now <b>disabled</b> in this chat!`, 
            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            await ctx.reply(
                `Invalid arguments!` +
                `\n\nUsage:\n<code>/reports on</code> - enable reports\n<code>/reports off</code> - disable reports` +
                `\n\nCurrent status: <b>${current_status}</b>`, 
                {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}
            );
        }
    }
    else {
        await ctx.reply(`Reporting is currently <b>${current_status}</b> in this chat!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
}

async function reportHandler(ctx: any) {
    let reports = await get_report_settings(ctx.chat.id.toString());
    let reports_status = reports?.should_report;
    
    if (reports_status) {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("What wrong did I do :(", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("Turning yourself in, eh?", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id) == true) {
                await ctx.reply("They are an admin, dismissed.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
            }
            else {
                let reported_user_chat_id = ctx.message.reply_to_message.chat.id;
                let reported_user_chat_title = ctx.message.reply_to_message.chat.title;
                let reported_user_chat_username = ctx.message.reply_to_message.chat.username;

                let reported_user_id = ctx.message.reply_to_message.from.id;
                let reported_user_first_name = ctx.message.reply_to_message.from.first_name;

                let reported_by_user_id = ctx.message.from.id;
                let reported_by_user_first_name = ctx.message.from.first_name;

                let reported_user_message_id = ctx.message.reply_to_message.message_id;
                let reported_by_user_message_id = ctx.message.message_id;

                const actionButtons = new InlineKeyboard()
                    .url('💬 Message', `https://telegram.me/${reported_user_chat_username}/${reported_user_message_id}`).row()
                    .text('🗑 Delete', `d:${reported_user_chat_id}_${reported_user_id}_${reported_user_message_id}`)
                    .text('👢 Kick', `k:${reported_user_chat_id}_${reported_user_id}_${reported_user_message_id}`)
                    .text('🚷 Ban', `b:${reported_user_chat_id}_${reported_user_id}_${reported_user_message_id}`).row()
                    .text('👤 Reported user info', `u:${reported_user_chat_id}_${reported_user_id}_${reported_user_message_id}`)

                let report_message_dm = `Report from <b>${reported_user_chat_title}</b> by <a href="tg://user?id=${reported_by_user_id}">${reported_by_user_first_name}</a> (<code>${reported_by_user_id}</code>)\n\n` 
                let report_message_grp = `Reported <a href="tg://user?id=${reported_user_id}">${reported_user_first_name}</a> (<code>${reported_user_id}</code>) to the admins!`

                let report_reason = ctx.match.toString();
                
                if (report_reason != "" && report_reason != "@admin" && report_reason != "@admins") {
                    report_message_dm += `Reason: ${report_reason.replace(/@admins?/, "")}\n\n`
                }

                report_message_dm += (`• Reported User: <a href="tg://user?id=${reported_user_id}">${reported_user_first_name}</a> (<code>${reported_user_id}</code>)`);

                if (ctx.chat.type != "undefined" && ctx.chat.username != undefined) {
                    report_message_dm += `\n• Reported Message: <a href="https://telegram.me/${reported_user_chat_username}/${reported_user_message_id}">Click Here</a>`
                    report_message_dm += `\n• Originated From: <a href="https://telegram.me/${reported_user_chat_username}/${reported_by_user_message_id}">Click Here</a>`
                }
                else {
                    let chat_id = reported_user_chat_id.toString().slice(4);
                    report_message_dm += `\n• Reported Message: <a href="https://telegram.me/c/${chat_id}/${reported_user_message_id}">Click Here</a>` 
                    report_message_dm += `\n• Originated From: <a href="https://telegram.me/c/${chat_id}/${reported_by_user_message_id}">Click Here</a>` 
                }
                
                let admins = await ctx.api.getChatAdministrators(reported_user_chat_id);
                admins.forEach( async(admin: any) => {
                    if (admin.user.is_bot /*|| admin.is_anonymous */) {
                        return;
                    }       
                    else {
                        report_message_grp += `<a href="tg://user?id=${admin.user.id}">​</a>`;
                        await ctx.api.sendMessage(admin.user.id, report_message_dm, {parse_mode: "HTML", reply_markup: actionButtons}).catch(() => {});
                    }
                });
                await ctx.reply(report_message_grp, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
            }
        }
    }
}

composer.chatType(["supergroup", "group"]).command("reports", elevatedUsersOnly((async (ctx: any) => {
    await reportSettings(ctx);
})));

composer.chatType(["supergroup", "group"]).command("report", (async (ctx: any) => {
    await reportHandler(ctx);
}));

composer.on(':text').hears(/.*(\s|^)(@admins?)\b.*/g, (async (ctx: any, next) => {
    await reportHandler(ctx);
    await next();
}));

// data format is like this: "d:<chat ID>_<user ID>_<message ID>" #L79
composer.callbackQuery(RegExp(/d:(.*)/), (async(ctx: any) => {
    let data = (ctx.callbackQuery.data.split(":")[1]).split("_");
    let chat_id = data[0];
    let user_id = data[1]; // future use
    let message_id = data[2];
    await ctx.api.deleteMessage(chat_id, message_id)
    .catch((GrammyError: any) => {ctx.answerCallbackQuery({text: `Error occured!`})})
    .then(ctx.answerCallbackQuery({text: `Deleted!`}))
}));

composer.callbackQuery(RegExp(/k:(.*)/), (async(ctx: any) => {
    let data = (ctx.callbackQuery.data.split(":")[1]).split("_");
    let chat_id = data[0];
    let user_id = data[1]; 
    let message_id = data[2]; // future use
    await ctx.api.unbanChatMember(chat_id, user_id)
    .catch((GrammyError: any) => {ctx.answerCallbackQuery({text: `Error occured!`})})
    .then(ctx.answerCallbackQuery({text: `Kicked!`}))
}));

composer.callbackQuery(RegExp(/b:(.*)/), (async(ctx: any) => {
    let data = (ctx.callbackQuery.data.split(":")[1]).split("_");
    let chat_id = data[0];
    let user_id = data[1]; 
    let message_id = data[2]; // future use
    await ctx.api.banChatMember(chat_id, user_id)
    .catch((GrammyError: any) => {ctx.answerCallbackQuery({text: `Error occured!`})})
    .then(ctx.answerCallbackQuery({text: `Banned!`}))
}));

composer.callbackQuery(RegExp(/u:(.*)/), (async(ctx: any) => {
    let data = (ctx.callbackQuery.data.split(":")[1]).split("_");
    let chat_id = data[0]; // future use
    let user_id = data[1]; 
    let message_id = data[2]; // future use
    let user = await resolveUserhandle(user_id);
    let userfull = await getUserFullInstance(user);
    let userinstance = await getUserInstance(user);

    let photos = await gramjs.invoke(new gramJsApi.photos.GetUserPhotos({
        userId: userinstance.id,
        offset:0,
        limit:1,
    }));

    // Name
    let message_body = `<b>Name</b>: ${userinstance.firstName} `;
    if (userinstance.lastName) {
        message_body += userinstance.lastName;
    };
    
    // Username
    if (userinstance.username) {
        message_body += `\n<b>Username</b>: @${userinstance.username}`;
    };

    // Multiple usernames (for rich kids)
    if (userinstance.usernames) {
        message_body += `\n<b>Usernames</b>:`;
        userinstance.usernames.forEach(async(user: any) => message_body += (`\n - @${user.username}`))
    }

    // User ID
    message_body += `\n<b>ID</b>: <code>${userinstance.id}</code>`;

    
    // User bio
    if (userfull.fullUser.about) {
        message_body += `\n<b>Bio</b>: ${userfull.fullUser.about}`;
    };
        
    
    // Datacenter
    if (userinstance.photo != null) {
        let datacenter = await datacenterLocation(userinstance.photo.dcId);;
        message_body += `\n<b>Datacenter</b>: ${datacenter}`;
    };

    // Phone no. (Only to be shown in bot's DM)
    if (userinstance.phone) {
        message_body += `\n<b>Phone</b>: +${userinstance.phone}`;
    };

    // Premium status
    let premium_status;
    if (userinstance.premium) {
        premium_status = "🌟 Premium Account";
    }
    else {
        premium_status = "Non-Premium Account";
    }
    message_body += `\n<b>Premium</b>: ${premium_status}`;

    // Profile picture count
    let photos_string = JSON.stringify(photos);
    let regex = /"count"\s*:\s*(\d+)/;
    let match = photos_string.match(regex);
    if (match && match[1]) {
        let count = parseInt(match[1]);
            message_body += `\n<b>Profile Photo Count</b>: <code>${count}</code>`;
    }   

    // User mention
    message_body += `\n<b>Permalink</b>: <a href="tg://user?id=${userinstance.id}">User Profile</a>`;

    await gramjs.sendMessage(ctx.chat.id, {
        file:photos.photos[0], message: message_body, parseMode: "html"
    });

    await ctx.answerCallbackQuery({text: "Loaded..."}).catch((GrammyError: any) => {return}) //catching errors in error handlers itself yeah
    
}));

export default composer;