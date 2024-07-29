import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../bot";
import constants from "../config";
import { get_goodbye, get_welcome, reset_goodbye, reset_welcome, set_clean_welcome, set_clean_welcome_switch, set_goodbye, set_goodbye_switch, set_welcome, set_welcome_switch } from "../database/welcome_sql";
import { get_greet_urls, set_greet_urls, reset_greet_buttons } from "../database/welcome_urls_sql";
import { elevatedUsersOnly, extractButtons, messageFillings, format_json, iterateInlineKeyboard, MessageTypes, escapeMarkdownV2 } from "../helpers/helper_func";
import { channel_log } from "../logger";
import { Composer, InlineKeyboard } from "grammy";
import { register_chat } from "../database/chats_sql";

const composer = new Composer();

async function saveWelcome(ctx: any, custom_welcome: string | null = null) {
    let message;
    let welcome;
    let caption;
    
    if (ctx.message.reply_to_message) {
        message = ctx.message.reply_to_message;
    }
    else {
        message = ctx.message;
    }

    if (message.caption) {
        let text = await extractButtons(message.caption);
        caption = text.text.replace(/^\/setwelcome\s*/, '') // remove the command from the caption
    }
    else {
        caption = custom_welcome;
    }

    if (message.text) {
        welcome = await set_welcome(ctx.chat.id, null, custom_welcome, MessageTypes.TEXT)
    }
    else if (message.sticker) {
        let custom_content = message.sticker?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.STICKER)
    }
    else if (message.document) {
        let custom_content = message.document.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.DOCUMENT)
    }
    else if (message.photo) {
        let custom_content = message.photo?.slice(-1)[0]?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.PHOTO)
    }
    else if (message.audio) {
        let custom_content = message.audio?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.AUDIO)
    }
    else if (message.voice) {
        let custom_content = message.voice?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.VOICE)
    }
    else if (message.video || message.animation) {
        let custom_content = message.video?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.VIDEO)
    }
    else if (message.video_note) {
        let custom_content = message.video_note?.file_id;
        welcome = await set_welcome(ctx.chat.id, custom_content, custom_welcome, MessageTypes.VIDEO_NOTE)
    }

    if (welcome) {
        await ctx.reply("I'll be welcoming new members with the provided content!", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("Couldn't set new welcome message for some reason!", {reply_parameters: {message_id: ctx.message.message_id}})
    
    }
}

async function saveGoodbye(ctx: any, custom_leave: string | null = null) {
    let message;
    let goodbye;
    let caption;
    if (ctx.message.reply_to_message) {
        message = ctx.message.reply_to_message;
    }
    else {
        message = ctx.message;
    }
    
    if (message.caption) {
        let text = await extractButtons(message.caption);
        caption = text.text.replace(/^\/setgoodbye\s*/, '') // remove the command from the caption
    }
    else {
        caption = custom_leave;
    }
    
    if (message.text) {
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.TEXT)
    }
    else if (message.sticker) {
        let custom_content = message.sticker?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.STICKER)
    }
    else if (message.document) {
        let custom_content = message.document.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.DOCUMENT)
    }
    else if (message.photo) {
        let custom_content = message.photo?.slice(-1)[0]?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.PHOTO)
    }
    else if (message.audio) {
        let custom_content = message.audio?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.AUDIO)
    }
    else if (message.voice) {
        let custom_content = message.voice?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.VOICE)
    }
    else if (message.video || message.animation) {
        let custom_content = message.video?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.VIDEO)
    }
    else if (message.video_note) {
        let custom_content = message.video_note?.file_id;
        custom_leave = custom_content || custom_leave;
        goodbye = await set_goodbye(ctx.chat.id, custom_leave, MessageTypes.VIDEO_NOTE)
    }
    
    if (goodbye) {
        await ctx.reply("I'll be farewelling leaving members with the provided content!", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("Couldn't set new goodbye message for some reason!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

async function saveGreetButtons(ctx: any, buttons: any) {
    for (let button of buttons) {
        await set_greet_urls(ctx.chat.id, button.name, button.url, button.same_line)
    }
}

async function welcomeSwitch(ctx: any, chatId: string, shouldWelcome: boolean) {
    let welcome_switch = await set_welcome_switch(chatId.toString(), shouldWelcome);
    if (welcome_switch) {
        await ctx.reply(`Welcome message has been turned <b>${shouldWelcome ? "ON" : "OFF"}</b>.`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("An error occurred while trying to change the welcome message status.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

async function goodbyeSwitch(ctx: any, chatId: string, shouldGoodbye: boolean) {
    let goodbye_switch = await set_goodbye_switch(chatId.toString(), shouldGoodbye);
    if (goodbye_switch) {
        await ctx.reply(`Goodbye message has been turned <b>${shouldGoodbye ? "ON" : "OFF"}.</b>`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("An error occurred while trying to change the goodbye message status.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

async function cleanWelcomeSwitch(ctx: any, chatId: string, shouldClean: boolean) {
    let clean_welcome_switch = await set_clean_welcome_switch(chatId.toString(), shouldClean);
    if (clean_welcome_switch) {
        await ctx.reply(`Cleaning old welcome messages has been turned <b>${shouldClean ? "ON" : "OFF"}</b>.`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("An error occurred while trying to change the clean welcome message status.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

async function sendWelcome(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, parseMode: string, keyboard: any) {
    let current_message;
    
    if (message_type == 0) {
        current_message = await ctx.reply(text, {parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 1) {
        current_message = await ctx.reply(text, {parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 2) {
        current_message = await ctx.api.sendSticker(ctx.chat.id, file, {reply_markup: keyboard});
    }
    else if (message_type == 3) {
        current_message = await ctx.api.sendDocument(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 4) {
        current_message = await ctx.api.sendPhoto(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 5) {
        current_message = await ctx.api.sendAudio(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 6) {
        current_message = await ctx.api.sendVoice(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 7) {
        current_message = await ctx.api.sendVideo(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 8) {
        current_message = await ctx.api.sendVideoNote(ctx.chat.id, file, {caption: text, parse_mode: parseMode, reply_markup: keyboard});
    }

    return current_message;    
}

async function sendWelcomeNoformat(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, reply_id: any) {
    if (message_type == 0) {
        await ctx.reply(text, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 1) {
        await ctx.reply(text, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 2) {
        await ctx.api.sendSticker(ctx.chat.id, file, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 3) {
        await ctx.api.sendDocument(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 4) {
        await ctx.api.sendPhoto(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 5) {
        await ctx.api.sendAudio(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 6) {
        await ctx.api.sendVoice(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 7) {
        await ctx.api.sendVideo(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 8) {
        await ctx.api.sendVideoNote(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}});
    }
}

async function sendGoodbye(ctx: any, message_type: number, custom_leave: string | null | undefined, parseMode: string) {
    if (message_type == 0) {
        await ctx.reply(custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 1) {
        await ctx.reply(custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 2) {
        await ctx.api.sendSticker(ctx.chat.id, custom_leave);
    }
    else if (message_type == 3) {
        await ctx.api.sendDocument(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 4) {
        await ctx.api.sendPhoto(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 5) {
        await ctx.api.sendAudio(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 6) {
        await ctx.api.sendVoice(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 7) {
        await ctx.api.sendVideo(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
    else if (message_type == 8) {
        await ctx.api.sendVideoNote(ctx.chat.id, custom_leave, {parse_mode: parseMode});
    }
}

async function sendGoodbyeNoformat(ctx: any, message_type: number, custom_leave: string | null | undefined, reply_id: any) {
    if (message_type == 0) {
        await ctx.reply(custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 1) {
        await ctx.reply(custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 2) {
        await ctx.api.sendSticker(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 3) {
        await ctx.api.sendDocument(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 4) {
        await ctx.api.sendPhoto(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 5) {
        await ctx.api.sendAudio(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 6) {
        await ctx.api.sendVoice(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 7) {
        await ctx.api.sendVideo(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
    else if (message_type == 8) {
        await ctx.api.sendVideoNote(ctx.chat.id, custom_leave, {reply_parameters: {message_id: reply_id}});
    }
}

async function resetWelcome(ctx: any) {
    let reset = await reset_welcome(ctx.chat.id);
    let reset_buttons = await reset_greet_buttons(ctx.chat.id);
    if (reset) {
        await ctx.reply("Welcome message has been reset to default!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
    else {
        await ctx.reply("An error occurred while trying to reset the welcome message.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}

async function resetGoodbye(ctx: any) {
    let reset = await reset_goodbye(ctx.chat.id);
    if (reset) {
        await ctx.reply("Goodbye message has been reset to default!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
    else {
        await ctx.reply("An error occurred while trying to reset the goodbye message.", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}


function createGreetButtonsMenu() {
    let currentButtons: any[] = [];

    const greetButtons = new Menu("greet-buttons");

    greetButtons.dynamic(() => {
        const range = new MenuRange();
        currentButtons.forEach(button => {
            if (!button.same_line) {
                range.row();
            }
            range.url(button.name, button.url);
        });
        return range;
    });

    return {
        menu: greetButtons,
        setButtons: (buttons: any[]) => {
            currentButtons = buttons;
        },
        clearButtons: () => {
            currentButtons = [];
        }
    };
}

const { menu: greetButtonsMenu, setButtons, clearButtons } = createGreetButtonsMenu();
bot.use(greetButtonsMenu);  

composer.on("chat_member", async (ctx: any, next) => {
    clearButtons();

    if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
        return await next();
    }
    
    let oldStatus = ctx.chatMember.old_chat_member.status;
    let newStatus = ctx.chatMember.new_chat_member.status;
    
    let chat = ctx.update.chat_member.chat;
    
    if ((oldStatus === "left" || oldStatus === "kicked" ) && (newStatus === "member" || newStatus === "restricted" || newStatus === "administrator")) {

        let greet = await get_welcome(ctx.chat.id);
        let greet_buttons = await get_greet_urls(ctx.chat.id);
    
        let should_welcome = greet?.should_welcome;
        let custom_content = greet?.custom_content;
        let custom_welcome = greet?.custom_welcome;
        let welcome_type = Number(greet?.welcome_type);
        let clean_welcome = greet?.clean_welcome;
        let previous_welcome = greet?.previous_welcome;
        let parseMode = "MarkdownV2";
        let keyboard;

        let user = ctx.chatMember.new_chat_member.user;

        if (should_welcome) {

            if (user.is_bot && user.id !== ctx.me.id) {
                await ctx.reply("Another bot...!? Am I not enough for you?", {parse_mode: "HTML"});
            } 
            else {

                let message;
                
                if (greet_buttons && greet_buttons.length > 0) {
                    setButtons(greet_buttons);
                    keyboard = greetButtonsMenu;
                } 
                else {
                    keyboard = undefined;
                } 
            
                if (custom_welcome) {
                    let memberCount = await ctx.api.getChatMemberCount(ctx.chat.id);           
                    message = messageFillings(custom_welcome, user, chat, memberCount)
                    message = await escapeMarkdownV2(message)
                }
            
                if (!custom_content && !custom_welcome) {
                    await ctx.reply(`Welcome, new member ${user.first_name}!`);
                }
                else {
                    let current_message = await sendWelcome(ctx, welcome_type, message, custom_content, parseMode, keyboard);   
                
                    if (clean_welcome) {
                        await ctx.api.deleteMessage(ctx.chat.id, Number(previous_welcome)) 
                        await set_clean_welcome(ctx.chat.id, current_message.message_id);
                    }
                
                }
            }
        }
    }

    if ((oldStatus === "member" || oldStatus === "restricted" || oldStatus === "administrator") && (newStatus === "left" || newStatus === "kicked")) {
        let goodbye = await get_goodbye(ctx.chat.id);
        let should_goodbye = goodbye?.should_goodbye;
        let custom_leave = goodbye?.custom_leave;
        let leave_type = Number(goodbye?.leave_type);
        let parseMode = "MarkdownV2";
        let user = ctx.chatMember.old_chat_member.user;
        if (should_goodbye) {
            if (user.is_bot && user.id !== ctx.me.id) {
                await ctx.reply("That bot was useless anyways, nicely done.", {parse_mode: "HTML"});
            } 
            else {
                if (custom_leave) {
                    let memberCount = await ctx.api.getChatMemberCount(ctx.chat.id);           
                    let filledMessage = messageFillings(custom_leave, user, chat, memberCount)
                    filledMessage = await escapeMarkdownV2(custom_leave)
                    await sendGoodbye(ctx, leave_type, filledMessage, parseMode);
                }
                else {
                    await ctx.reply(`See you again, ${user.first_name}! (<tg-spoiler>maybe never</tg-spoiler>)`, {parse_mode: "HTML"})
                }
            }
        }
    }
    
    await next();
});

// when the bot is added to a chat
const added_to_chat_text = "Thank you for adding me to the group!\n<i>(Ensure that I've been made an <b>admin</b> & have <b>all the permissions.</b>)</i>\n\nExplore my functionalities by using the button below.";
const help_inlinekeyboard = new InlineKeyboard()
    .url("Usage Guide", `https://telegram.me/${constants.BOT_USERNAME}?start=help_me_im_dumb`)

composer.on("my_chat_member", async (ctx: any, next) => {
    let oldStatus = ctx.update.my_chat_member.old_chat_member.status;
    let newStatus = ctx.update.my_chat_member.new_chat_member.status;
    let chat = ctx.update.my_chat_member.chat;
    let from = ctx.update.my_chat_member.from;

    
    let getCurrentTime = () => {
        return new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    };

    let getCurrentDate = () => {
        return new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // bot is added
    if ((oldStatus === "left" || oldStatus === "kicked") && (newStatus === "member" || newStatus === "administrator")) {
        let log_message = (
            `${ctx.me.first_name}\n` + 
            `\#ADDED on ${getCurrentTime()}, ${getCurrentDate()}\n\n` +
            `• Chat Title: <b>${chat.title}</b>\n` +
            `• Chat Type: <code>${chat.type}</code>\n` +
            `• Chat ID: <code>${chat.id}</code>\n`
        );

        try {
            const memberCount = await ctx.api.getChatMemberCount(chat.id);
            log_message += `• Chat Members: <code>${memberCount}</code>\n`;
        } 
        catch (error) {
            console.error("Error getting member count:", error);
            log_message += `• Chat Members: <code>Unable to retrieve</code>\n`;
        }

        log_message += `• Invited By: <a href="tg://user?id=${from.id}">${from.first_name}</a>\n`;

        if (chat.username) {
            log_message += `• Invite Link: <a href="https://telegram.me/${chat.username}">${chat.username}</a>\n`;
        } 
        else {
            log_message += `• Link: Group's private\n`;
        }

        await ctx.api.sendAnimation(chat.id, constants.ADDED_TO_CHAT_GIF, {
            caption: added_to_chat_text, 
            reply_markup: help_inlinekeyboard, 
            parse_mode: "HTML"
        });

        channel_log(log_message);
        await register_chat(chat.id, chat.title); // todo: make this standalone later
    }

    // bot was removed 
    else if ((oldStatus === "member" || oldStatus === "administrator") && (newStatus === "left" || newStatus === "kicked")) {
        let log_message = (
            `${ctx.me.first_name}\n` + 
            `\#REMOVED on ${getCurrentTime()}, ${getCurrentDate()}\n\n` +
            `• Chat Title: <b>${chat.title}</b>\n` +
            `• Chat Type: <code>${chat.type}</code>\n` +
            `• Chat ID: <code>${chat.id}</code>\n` +
            `• Removed By: <a href="tg://user?id=${from.id}">${from.first_name}</a>\n`
        );

        if (chat.username) {
            log_message += `• Invite Link: <a href="https://telegram.me/${chat.username}">${chat.username}</a>\n`;
        } else {
            log_message += `• Link: Group's private\n`;
        }
        channel_log(log_message);
    }
    await next();
});

composer.chatType(["supergroup", "group"]).command("welcome", elevatedUsersOnly((async (ctx: any) => {
    clearButtons();
    let args = ctx.match.toLowerCase();

    if (args) {;
        if (args == "on" || args == "yes") {
            await welcomeSwitch(ctx, ctx.chat.id, true);
        }
        else if (args == "off" || args == "no") {
            await welcomeSwitch(ctx, ctx.chat.id, false);
        }
        else {
            await ctx.reply("Invalid argument. Please use /welcome <code>on</code> or /welcome <code>off</code>.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
    }
    else {
        let greet = await get_welcome(ctx.chat.id);
        let greet_buttons = await get_greet_urls(ctx.chat.id);

        let should_welcome = greet?.should_welcome;
        let custom_content: string | null | undefined = greet?.custom_content;
        let custom_welcome: string | null | undefined = greet?.custom_welcome;
        let welcome_type = Number(greet?.welcome_type);
        let clean_welcome = greet?.clean_welcome;

        let current_config_message = "<b>Current welcome message configuration</b>:\n\n";

        if (should_welcome) {
            current_config_message += `• Welcome message is <b>enabled</b>\n`;
        }
        else {
            current_config_message += `• Welcome message is <b>disabled</b>\n`;
        }

        if (clean_welcome) {
            current_config_message += `• Deleting old welcome messages is <b>enabled</b>\n`;
        }
        else {
            current_config_message += `• Deleting old welcome messages is <b>disabled</b>\n`;
        }

        current_config_message += `\nCurrent welcome message in raw format:`;

        await ctx.reply(current_config_message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});


        if (greet_buttons && greet_buttons.length > 0) {
            custom_welcome += "\n"
            for (let button of greet_buttons) {
                custom_welcome += `[${button.name}](buttonurl://${button.url}`;
                if (button.same_line) {
                    custom_welcome += ":same)\n";
                }
                else {
                    custom_welcome += ")\n";
                }
            }
        }   
        
        if (custom_welcome || custom_content) {
            await sendWelcomeNoformat(ctx, welcome_type, custom_welcome, custom_content, ctx.message.message_id);
        } else {
            await ctx.reply("Welcome, new member {first}!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("goodbye", elevatedUsersOnly((async (ctx: any) => {
    clearButtons();
    let args = ctx.match.toLowerCase();

    if (args) {;
        if (args == "on" || args == "yes") {
            await goodbyeSwitch(ctx, ctx.chat.id, true);
        }
        else if (args == "off" || args == "no") {
            await goodbyeSwitch(ctx, ctx.chat.id, false);
        }
        else {
            await ctx.reply("Invalid argument. Please use /goodbye <code>on</code> or /goodbye <code>off</code>.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
    }
    else {
        let greet = await get_goodbye(ctx.chat.id);


        let should_goodbye = greet?.should_goodbye;
        let custom_leave = greet?.custom_leave;
        let leave_type = Number(greet?.leave_type);

        let current_config_message = "<b>Current goodbye message configuration</b>:\n\n";

        if (should_goodbye) {
            current_config_message += `• Goodbye message is <b>enabled</b>\n`;
        }
        else {
            current_config_message += `• Goodbye message is <b>disabled</b>\n`;
        }

        if (custom_leave) {
            current_config_message += `• Custom goodbye message is <b>added</b>\n`;
        }
        else {
            current_config_message += `• <b>No</b> custom goodbye message is set\n`;
        }

        current_config_message += `\nMembers are currently farewelled with:`;
 
        await ctx.reply(current_config_message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
        
        if (custom_leave) {
            await sendGoodbyeNoformat(ctx, leave_type, custom_leave, ctx.message.message_id);
        }
        else {
            await ctx.reply("See you again, {first}! (||maybe never||)", {reply_parameters: {message_id: ctx.message.message_id}})
        }   
    }
})));

composer.chatType(["supergroup", "group"]).command("setwelcome", elevatedUsersOnly((async (ctx: any) => {
    clearButtons(); 
    let custom_welcome;  
    if (ctx.message.reply_to_message) {
        custom_welcome = ctx.message.reply_to_message.text;
        if (ctx.message.reply_to_message.caption) {
            custom_welcome = ctx.message.reply_to_message.caption;
        }   
        let result = await extractButtons(custom_welcome);
        let text = result.text;
        
        if (text == "" && ctx.match) {
            text = ctx.match;
        }

        if (ctx.message.reply_to_message.reply_markup) {
            let inlineKeyboard = ctx.message.reply_to_message.reply_markup.inline_keyboard;
            let buttons = iterateInlineKeyboard(inlineKeyboard);
            await saveGreetButtons(ctx, buttons);
            await saveWelcome(ctx, text);
        }
        else if (result.buttons.length != 0) {
            await saveGreetButtons(ctx, result.buttons);
            await saveWelcome(ctx, text);
        }
        else {
            await reset_greet_buttons(ctx.chat.id);
            await saveWelcome(ctx, text);
        }
    }
    else {
        let args = ctx.match;
        if (!args) {
            await ctx.reply("Please provide some content for your new welcome message!\n\n(<i>Example: /setwelcome Welcome to the group {firstname}!</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            let result = await extractButtons(args);
            let text = result.text;

            if (result.buttons.length != 0) {
                await saveGreetButtons(ctx, result.buttons);
                await saveWelcome(ctx, text);
            }
            else {
                await saveWelcome(ctx, text);
            }
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("setgoodbye", elevatedUsersOnly((async (ctx: any) => {
    let custom_leave;  
    if (ctx.message.reply_to_message) {
        custom_leave = ctx.message.reply_to_message.text;
        if (ctx.message.reply_to_message.caption) {
            custom_leave = ctx.message.reply_to_message.caption;
        }   
        let result = await extractButtons(custom_leave);
        let text = result.text;
        await saveGoodbye(ctx, text);
    }
    else {
        let args = ctx.match;
        if (!args) {
            await ctx.reply("Please provide some content for your new goodbye message!\n\n(<i>Example: /setgoodbye Why did you leave us {firstname}?</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else {
            let result = await extractButtons(args);
            let text = result.text;
            await saveGoodbye(ctx, text);
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("resetwelcome", elevatedUsersOnly((async (ctx: any) => {
    await resetWelcome(ctx);
})));

composer.chatType(["supergroup", "group"]).command("resetgoodbye", elevatedUsersOnly((async (ctx: any) => {
    await resetGoodbye(ctx);
})));

composer.chatType(["supergroup", "group"]).command("cleanwelcome", elevatedUsersOnly((async (ctx: any) => {
    let args = ctx.match.toLowerCase();
    if (args) {;
        if (args == "on" || args == "yes") {
            await cleanWelcomeSwitch(ctx, ctx.chat.id, true);
        }
        else if (args == "off" || args == "no") {
            await cleanWelcomeSwitch(ctx, ctx.chat.id, false);
        }
        else {
            await ctx.reply("Invalid argument. Please use /cleanwelcome <code>on</code> or /cleanwelcome <code>off</code>.", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
    }
    else {
        let welcome = await get_welcome(ctx.chat.id);
        let clean_welcome = welcome?.clean_welcome;

        let current_config_message = "";
        
        if (clean_welcome) {
            current_config_message += `Cleaning old welcome messages is <b>enabled</b>\n`;
        }
        else {
            current_config_message += `Cleaning old welcome messages is <b>disabled</b>\n`;
        }

        current_config_message += "\nUse /cleanwelcome <code>on</code> or /cleanwelcome <code>off</code> to <b>enable</b> or <b>disable</b> deleting old welcome messages respectively."

        await ctx.reply(current_config_message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    }
})));


composer.chatType(["supergroup", "group"]).command("welcomehelp", ((async (ctx: any) => {
    await ctx.reply("It's a long message, try to send this in my DM!", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});

})));

composer.chatType("private").command("welcomehelp", ((async (ctx: any) => {
    let welcome_help: string = `
Your group's welcome/goodbye messages can be personalised in multiple ways. If you want the messages to be individually generated, like the default welcome message is, you can use <b>these</b> variables:

- <code>{first}</code>: this represents the user's <b>first</b> name
- <code>{last}</code>: this represents the user's <b>last</b> name. Defaults to <b>first name</b> if user has no last name.
- <code>{fullname}</code>: this represents the user's <b>full</b> name. Defaults to <b>first name</b> if user has no last name.
- <code>{username}</code>: this represents the user's <b>username</b>. Defaults to a <b>mention</b> of the user's first name if has no username.
- <code>{mention}</code>: this simply <b>mentions</b> a user - tagging them with their first name.
- <code>{id}</code>: this represents the user's <b>id</b>
- <code>{count}</code>: this represents the user's <b>member number</b>.
- <code>{chatname}</code>: this represents the <b>current chat name</b>.

Each variable MUST be surrounded by <code>{}</code> to be replaced.

Welcome messages also support markdown, so you can make any elements bold/italic/code/links. Buttons are also supported, so you can make your welcomes look awesome with some nice intro buttons.

To create a button linking to your rules, use this: <code>[Rules](buttonurl://t.me/${bot.botInfo.username}?start=group_id)</code>. Simply replace <code>group_id</code> with your group's id, which can be obtained via /id, and you're good to go. Note that group ids are usually preceded by a <code>-</code> sign; this is required, so please don't remove it.

You can even set images/gifs/videos/voice messages as the welcome message by replying to the desired media, and calling <code>/setwelcome</code>.
`;
    await ctx.api.sendMessage(ctx.chat.id, welcome_help, { parse_mode: "HTML"});

})));

export default composer;