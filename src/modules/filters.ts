import { Composer, InlineKeyboard } from "grammy";
import { get_filter, set_filter, get_all_chat_filters, stop_filter, stop_all_chat_filters} from "../database/filters_sql";
import { get_filter_urls, set_filter_urls } from "../database/filter_urls_sql";
import { escapeMarkdownV2, extractButtons, iterateInlineKeyboard, format_json, ownerOnly, ownerOnlyCallback, MessageTypes } from "../helpers/helper_func"; 
import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../bot";

const composer = new Composer();

// THIS CODE NEEDS TO BE UPDATED, ALSO BEFORE THAT THE SCHEMA NEEDS TO BE UPDATED FOR NEW DB STRUCTURE, CURRENTLY USING WHAT AKENO WAS USING
// has_buttons, and BUTTON_TEXT message type are not being used in the current implementation
async function setFilter(captionedcmd: boolean, ctx: any, keyword: string, reply: string | null = null) {
    let message;
    let filtered;
    let caption;
    if (ctx.message.reply_to_message) {
        message = ctx.message.reply_to_message;
    }
    else {
        message = ctx.message;
    }
    if (message.caption && captionedcmd) {
        let text = await extractButtons(message.caption);
        caption = text.text.replace(/^\/save\s*/, '') // remove the command from the caption
    }
    else {
        caption = reply;
    } 
    if (message.text) {
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.TEXT, null)
    }
    else if (message.sticker) {
        let file = message.sticker?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.STICKER, file)
    }
    else if (message.document) {
        let file = message.document.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.DOCUMENT, file)
    }
    else if (message.photo) {
        let file = message.photo?.slice(-1)[0]?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.PHOTO, file)
    }
    else if (message.audio) {
        let file = message.audio?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.AUDIO, file)
    }
    else if (message.voice) {
        let file = message.voice?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.VOICE, file)
    }
    else if (message.video || message.animation) {
        let file = message.video?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.VIDEO, file)
    }
    else if (message.video_note) {
        let file = message.video_note?.file_id;
        filtered = await set_filter(ctx.chat.id, keyword, caption, MessageTypes.VIDEO_NOTE, file)
    }

    if (filtered) {
        await ctx.reply(`Trigger set as <code>${keyword}</code>!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("Couldn't set the trigger for some reason!", {reply_parameters: {message_id: ctx.message.message_id}})
    
    }
}

async function setFilterButtons(ctx: any, keyword: string, buttons: any) {
    for (let button of buttons) {
        await set_filter_urls(ctx.chat.id, keyword, button.name, button.url, button.same_line)
    }

}

async function sendFilter(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, reply_id: any, parseMode: string, keyboard: any, handlertype: string) {
    if (message_type == 0) {
        await ctx.reply(text, {reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 1) {
        await ctx.reply(text, {reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 2) {
        await ctx.api.sendSticker(ctx.chat.id, file, {reply_parameters: {message_id: reply_id}, reply_markup: keyboard});
    }
    else if (message_type == 3) {
        await ctx.api.sendDocument(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 4) {
        await ctx.api.sendPhoto(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 5) {
        await ctx.api.sendAudio(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 6) {
        await ctx.api.sendVoice(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 7) {
        await ctx.api.sendVideo(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
    else if (message_type == 8) {
        await ctx.api.sendVideoNote(ctx.chat.id, file, {caption: text, reply_parameters: {message_id: reply_id}, parse_mode: parseMode, reply_markup: keyboard});
    }
}

async function stopFilter(ctx: any, keyword: string) {
    let cleared = await stop_filter(ctx.chat.id, keyword);
    if (cleared) {
        await ctx.reply("Stopped filtering the provided trigger!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
    else {
        await ctx.reply(`Couldn't stop the filter for trigger "<code>${keyword}</code>" for some reason!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
}

async function stopAllFilters(ctx: any) {
    let confirmReset = new InlineKeyboard()
    .text("Yes", "yes-stop-all-chat-filters")
    .text("No", "no-dont-stop-all-chat-filters")

    await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to <b>REMOVE ALL THE FILTER TRIGGERS</b> from this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});     
}


function createFilterButtonsMenu() {
    let currentButtons: any[] = [];

    const filterButtons = new Menu("filter-buttons");

    filterButtons.dynamic(() => {
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
        menu: filterButtons,
        setButtons: (buttons: any[]) => {
            currentButtons = buttons;
        },
        clearButtons: () => {
            currentButtons = [];
        }
    };
}

const { menu: filterButtonsMenu, setButtons, clearButtons } = createFilterButtonsMenu();
bot.use(filterButtonsMenu);

composer.chatType(["supergroup", "group"]).on(["message"], async (ctx: any, next) => {
    clearButtons();
    let trigger_message = ctx.message.text || "";
    let all_filters = await get_all_chat_filters(ctx.chat.id.toString());

    all_filters.sort((a, b) => b.keyword.length - a.keyword.length);

    let matched_keywords = all_filters
        .map(filter => ({
            keyword: filter.keyword,
            position: trigger_message.toLowerCase().indexOf(filter.keyword.toLowerCase())
        }))
        .filter(match => {
            if (match.position === -1) return false;

            let word_boundary_before = match.position === 0 || !/\w/.test(trigger_message[match.position - 1]);
            
            let word_boundary_after = match.position + match.keyword.length === trigger_message.length || !/\w/.test(trigger_message[match.position + match.keyword.length]);
            
            let exact_match = word_boundary_before && word_boundary_after;
            
            let is_part_of_longer_match = all_filters.some(f => 
                f.keyword.length > match.keyword.length &&
                f.keyword.toLowerCase().includes(match.keyword.toLowerCase()) &&
                trigger_message.toLowerCase().indexOf(f.keyword.toLowerCase()) !== -1
            );

            return exact_match && !is_part_of_longer_match;
        })
        .sort((a, b) => a.position - b.position);
    
    if (matched_keywords.length > 0) {
        let first_match_keyword = matched_keywords[0].keyword;
        let filter = await get_filter(ctx.chat.id, first_match_keyword);
 
        if (filter) {
            let filter_buttons = await get_filter_urls(ctx.chat.id, filter.keyword);
            let text = filter?.reply;
            let file = filter?.file;
            let message_type = Number(filter?.msgtype);
            let parseMode = "MarkdownV2";
            let handlertype = "regex";
            let reply_id; 
            let keyboard;
            
            if (ctx.message?.reply_to_message) {
                reply_id = ctx.message.reply_to_message.message_id;
            }
            else {
                reply_id = ctx.message.message_id;
            }

            if (filter_buttons && filter_buttons.length > 0) {
                setButtons(filter_buttons);
                keyboard = filterButtonsMenu;
            } 
            else {
                keyboard = undefined;
            }
    
            if (text) {
                text = await escapeMarkdownV2(text);
            }
            
            await sendFilter(ctx, message_type, text, file, reply_id, parseMode, keyboard, handlertype);     
        }
    }        
    await next();
}); 

composer.chatType(["supergroup", "group"]).command(["filter", "addfilter"], (async (ctx: any) => {
    if (ctx.message.reply_to_message) {
        let keyword = ctx.match;
        if (!keyword) {
            await ctx.reply("Please provide a trigger keyword first!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            let reply = ctx.message.reply_to_message.text;
            if (ctx.message.reply_to_message.caption) {
                reply = ctx.message.reply_to_message.caption;
            }   
            let result = await extractButtons(reply);
            let text = result.text;

            if (text.length == 0) {
                text = keyword;
            }

            if (ctx.message.reply_to_message.reply_markup) {
                let inlineKeyboard = ctx.message.reply_to_message.reply_markup.inline_keyboard;
                let buttons = iterateInlineKeyboard(inlineKeyboard);
                await setFilterButtons(ctx, keyword, buttons);
                await setFilter(true, ctx, keyword, text);
            }
            else if (result.buttons.length != 0) {
                await setFilterButtons(ctx, keyword, result.buttons);
                await setFilter(true, ctx, keyword, text);
            }
            else {
                await setFilter(true, ctx, keyword, reply);
            }
        }
    }
    else {
        let args = ctx.match;
        let split_args = args.split(" ");
        let keyword = split_args[0].toLowerCase();
        let reply = split_args.slice(1).join(" ");
        if (!reply) {
            await ctx.reply("Please provide some content for your filter trigger!\n\n(<i>Example: /filter apple I do like apples!</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else if (!keyword) {
            await ctx.reply("Please provide a trigger keyword first!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            let result = await extractButtons(reply);
            if (result.buttons.length != 0) {
                await setFilterButtons(ctx, keyword, result.buttons);
                await setFilter(false, ctx, keyword, result.text);
            }
            else {
                await setFilter(false, ctx, keyword, reply);
            }
        }
    }
}));

// this one's only for media messages containing "/filter trigger" in their captions
composer.chatType(["supergroup", "group"]).on("message").hears([/^\/filter\b/, /^\/addfilter\b/], (async (ctx: any, next) => {
    if (ctx.message.caption) {
        let caption = ctx.message.caption.split(" ");
        let keyword = caption[1].toLowerCase();
        let reply = caption.slice(2).join(" ");
        let result = await extractButtons(reply);
        let text = result.text;

        if (result.buttons.length != 0) {
            await setFilterButtons(ctx, keyword, result.buttons);
            await setFilter(true, ctx, keyword, text);
        }
        else {
            await setFilter(true, ctx, keyword, reply);
        }
    }
    await next();
}));

composer.chatType(["supergroup", "group"]).command(["filters", "listfilters"], (async (ctx: any) => {
    let filters = await get_all_chat_filters(ctx.chat.id);
    let message;
    if (filters.length > 0) {
        let filter_triggers = filters.map(filter => filter.keyword);
        message = `Filters set in <b>${ctx.message.chat.title}</b>:\n\n${filter_triggers.map((filter, index) => `${index + 1}. <code>${filter}</code>`).join("\n")}`;
    }
    else {
        message = "There are <b>NO</b> filter triggers set in this chat yet!";
    }
    await ctx.reply(message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}));

composer.chatType(["supergroup", "group"]).command(["stop", "stopfilter", "delfilter"], (async (ctx: any) => {
    let args = ctx.match;
    let keyword = args.toLowerCase();

    if (!keyword) {
        await ctx.reply("Please provide the trigger keyword that you want to stop!\n\n<i>To list group's filters, send /filters</i>", {reply_parameters: {message_id: ctx.message.message_id}, parseMode: "HTML"});
    }
    else {
        await stopFilter(ctx, keyword);
    }
}));

composer.chatType(["supergroup", "group"]).command(["stopall", "stopallfilters"], ownerOnly(async (ctx: any) => {
    await stopAllFilters(ctx);
}));

composer.callbackQuery("yes-stop-all-chat-filters", ownerOnlyCallback(async(ctx: any) => {
    let resetted = await stop_all_chat_filters(ctx.chat.id.toString()) 
    if (resetted == true) {
        await ctx.editMessageText("All filter triggers in this chat have been stopped!", { parse_mode: "HTML" });
    }
    else {
        await ctx.editMessageText("Failed to remove all filter triggers of this chat!", { parse_mode: "HTML" });
    }
}));

composer.callbackQuery("no-dont-stop-all-chat-filters", ownerOnlyCallback(async(ctx: any) => {
    await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
}));

export default composer;