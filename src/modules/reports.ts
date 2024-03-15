import bot from "../bot";
import { get_report_settings, set_report_settings } from "../database/reports_sql";
import { checkElevatedUser, elevatedUsersOnly } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("reports", elevatedUsersOnly((async (ctx: any) => {
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
})));

bot.chatType("supergroup" || "group").command("report", (async (ctx: any) => {
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
            else if (await checkElevatedUser(ctx) == true) {
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

                let report_message = (
                    `Report from: ${reported_user_chat_title}` +
                    `\n\n• Reported by: <a href="tg://user?id=${reported_by_user_id}">${reported_by_user_first_name}</a> (<code>${reported_by_user_id}</code>)` +
                    `\n• Reported user: <a href="tg://user?id=${reported_user_id}">${reported_user_first_name}</a>`
                )

                if (ctx.chat.type != "undefined" && ctx.chat.username != undefined) {
                    report_message += `\n• Reported Message: <a href="https://telegram.me/${reported_user_chat_username}/${reported_user_message_id}">Click Here</a>`
                }
                else {
                    let chat_id = reported_user_chat_id.toString().slice(4);
                    report_message += `\n• Reported Message: <a href="https://telegram.me/c/${chat_id}/${reported_user_message_id}">Click Here</a>` 
                }
            
                let admins = await ctx.api.getChatAdministrators(reported_user_chat_id);
                for (let admin of admins) {
                    if (admin.user.is_bot == false) {
                        await ctx.api.sendMessage(admin.user.id, report_message, {parse_mode: "HTML"});
                    }
                }
                await ctx.reply(`Report <a href="tg://user?id=${reported_user_id}">${reported_user_first_name}</a> to the admins!`, {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
    }
}));