import bot from "../bot";
import { get_report_settings, set_report_settings } from "../database/reports_sql";
import { elevatedUsersOnly } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("reports", elevatedUsersOnly((async (ctx: any) => {
    let reports = await get_report_settings(ctx.chat.id.toString());
    let reports_status = reports?.should_report;
    let current_status;
    if (reports_status == undefined) {
        await set_report_settings(ctx.chat.id.toString(), true)
    }

    if (reports_status == true) {
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