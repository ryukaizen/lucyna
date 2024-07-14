import { Composer, FilterQuery  } from "grammy";
import { botCanDeleteMessages, elevatedUsersOnly } from "../helpers/helper_func";
import { get_clean_service, set_clean_service } from "../database/clean_service_sql";

const composer = new Composer();

const serviceMessageTypes: FilterQuery[] = [
    "message:new_chat_members",
    "message:left_chat_member",
    "message:new_chat_title",
    "message:new_chat_photo",
    "message:delete_chat_photo",
    "message:group_chat_created",
    "message:supergroup_chat_created",
    "msg:channel_chat_created",
    "message:pinned_message",
    "message:message_auto_delete_timer_changed",
    "message:successful_payment",
    "message:users_shared",
    "message:chat_shared",
    "message:write_access_allowed",
    "message:proximity_alert_triggered",
    "message:boost_added",
    "message:forum_topic_created",
    "message:forum_topic_edited",
    "message:forum_topic_closed",
    "message:forum_topic_reopened",
    "message:general_forum_topic_hidden",
    "message:general_forum_topic_unhidden",
    "message:video_chat_scheduled",
    "message:video_chat_started",
    "message:video_chat_ended",
    "message:video_chat_participants_invited",
    "message:web_app_data"
];

async function cleanServiceSwitch(ctx: any, chatId: string, cleanService: boolean) {
    let clean_service_switch = await set_clean_service(chatId.toString(), cleanService);
    
    if (clean_service_switch) {
        await ctx.reply(`Cleaning of service messages has been turned <b>${cleanService ? "ON" : "OFF"}</b>.`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("An error occurred while trying to change the clean service status.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

composer.chatType(["supergroup", "group"]).on(serviceMessageTypes, async (ctx, next) => {

    let clean_service = await get_clean_service(ctx.chat.id.toString());
    if (clean_service?.clean_service) {
        await ctx.deleteMessage().catch(() => {})
    }
    
    await next();
});

composer.chatType(["supergroup", "group"]).command("cleanservice", elevatedUsersOnly(botCanDeleteMessages(async(ctx: any) => {
    let args = ctx.match.toLowerCase();

    if (args) {;
        if (args == "on" || args == "yes") {
            await cleanServiceSwitch(ctx, ctx.chat.id, true);
        }
        else if (args == "off" || args == "no") {
            await cleanServiceSwitch(ctx, ctx.chat.id, false);
        }
        else {
            await ctx.reply("Invalid argument. Please use /cleanservice <code>on</code> or /cleanservice <code>off</code> to <b>enable</b> or <b>disable</b> deleting service messages respectively.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
    }
    else {
        let clean_service = await get_clean_service(ctx.chat.id.toString());
        await ctx.reply(`Auto-deletion of service messages is turned <b>${clean_service?.clean_service ? "ON" : "OFF"}</b> as of now.`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
})));

export default composer;