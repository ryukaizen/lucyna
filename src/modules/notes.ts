import { Composer, InlineKeyboard } from "grammy";
import { clear_note, get_all_chat_notes, get_note, remove_all_chat_notes, save_note } from "../database/notes_sql";
import { get_note_urls, set_note_urls } from "../database/note_urls_sql";
import { escapeMarkdownV2, extractButtons, iterateInlineKeyboard, format_json, ownerOnly, ownerOnlyCallback, MessageTypes } from "../helpers/helper_func"; 
import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../bot";

const composer = new Composer();

// THIS CODE NEEDS TO BE UPDATED, ALSO BEFORE THAT THE SCHEMA NEEDS TO BE UPDATED FOR NEW DB STRUCTURE, CURRENTLY USING WHAT AKENO WAS USING
// has_buttons, and BUTTON_TEXT message type are not being used in the current implementation
async function saveNote(captionedcmd: boolean, ctx: any, note_name: string, value: string | null = null) {
    let message;
    let noted;
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
        caption = value;
    } 
    if (message.text) {
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.TEXT, null)
    }
    else if (message.sticker) {
        let file = message.sticker?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.STICKER, file)
    }
    else if (message.document) {
        let file = message.document.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.DOCUMENT, file)
    }
    else if (message.photo) {
        let file = message.photo?.slice(-1)[0]?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.PHOTO, file)
    }
    else if (message.audio) {
        let file = message.audio?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.AUDIO, file)
    }
    else if (message.voice) {
        let file = message.voice?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VOICE, file)
    }
    else if (message.video || message.animation) {
        let file = message.video?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VIDEO, file)
    }
    else if (message.video_note) {
        let file = message.video_note?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VIDEO_NOTE, file)
    }

    if (noted) {
        await ctx.reply(`Note saved as <code>${note_name}</code>!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
    else {
        await ctx.reply("Couldn't save the note for some reason!", {reply_parameters: {message_id: ctx.message.message_id}})
    
    }
}

async function saveNoteButtons(ctx: any, note_name: string, buttons: any) {
    for (let button of buttons) {
        await set_note_urls(ctx.chat.id, note_name, button.name, button.url, button.same_line)
    }

}

async function sendNote(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, reply_id: any, parseMode: string, keyboard: any, handlertype: string) {
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
    else {
        if (handlertype == "command") {
            await ctx.reply("This note does not exist!", {reply_parameters: {message_id: ctx.message.message_id}})
        }
    }
}

async function sendNoteNoformat(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, reply_id: any, handlertype: string) {
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
    else {
        if (handlertype == "command") {
            await ctx.reply("This note does not exist!", {reply_parameters: {message_id: ctx.message.message_id}})
        }
    }
}

async function clearNote(ctx: any, note_name: string) {
    let cleared = await clear_note(ctx.chat.id, note_name);
    if (cleared) {
        await ctx.reply("Note cleared successfully!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
    else {
        await ctx.reply(`Couldn't clear the note (<code>${note_name}</code>) for some reason!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
    }
}

async function removeallnotes(ctx: any) {
    let confirmReset = new InlineKeyboard()
    .text("Yes", "yes-remove-all-chat-notes")
    .text("No", "no-dont-remove-all-chat-notes")

    await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to <b>REMOVE ALL THE NOTES</b> from this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmReset, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});     
}


function createNoteButtonsMenu() {
    let currentButtons: any[] = [];

    const noteButtons = new Menu("note-buttons");

    noteButtons.dynamic(() => {
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
        menu: noteButtons,
        setButtons: (buttons: any[]) => {
            currentButtons = buttons;
        },
        clearButtons: () => {
            currentButtons = [];
        }
    };
}

const { menu: noteButtonsMenu, setButtons, clearButtons } = createNoteButtonsMenu();
bot.use(noteButtonsMenu);

composer.chatType(["supergroup", "group"]).on("message").hears(/^#[^\s#]+(?:\s|$)/, async (ctx: any, next) => {
    clearButtons();
    if (ctx.message.text.startsWith('#')) {
        let args = ctx.message.text.slice(1).toLowerCase().split(" ")
        let name = args[0]
        let noformat = args[1];
        let note = await get_note(ctx.chat.id, name);
        let note_buttons = await get_note_urls(ctx.chat.id, name);
        let text = note?.value;
        let file = note?.file;
        let message_type = Number(note?.msgtype);
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

        if (noformat == "noformat") {
            if (note_buttons && note_buttons.length > 0) {
                text += "\n"
                for (let button of note_buttons) {
                    text += `[${button.name}](buttonurl://${button.url}`;
                    if (button.same_line) {
                        text += ":same)\n";
                    }
                    else {
                        text += ")\n";
                }
            }

            await sendNoteNoformat(ctx, message_type, text, file, reply_id, handlertype);     
            }
        }
        else {

            if (note_buttons && note_buttons.length > 0) {
                setButtons(note_buttons);
                keyboard = noteButtonsMenu;
            } 
            else {
                keyboard = undefined;
            }
        
            if (text) {
                text = await escapeMarkdownV2(text);
            }
            await sendNote(ctx, message_type, text, file, reply_id, parseMode, keyboard, handlertype);     
        }        
    }
    await next();
});

composer.chatType(["supergroup", "group"]).command(["get", "getnote"], (async (ctx: any) => {
    clearButtons();
    let args = ctx.match.toLowerCase().split(" ");
    let name = args[0]
    let noformat = args[1];
    if (name) {
        let note = await get_note(ctx.chat.id, name);
        let note_buttons = await get_note_urls(ctx.chat.id, name);
        let text = note?.value;
        let file = note?.file;
        let message_type = Number(note?.msgtype);
        let parseMode = "MarkdownV2";
        let handlertype = "command";
        let reply_id; 
        let keyboard;

        if (ctx.message?.reply_to_message) {
            reply_id = ctx.message.reply_to_message.message_id;
        }
        else {
            reply_id = ctx.message.message_id;
        }

        if (noformat == "noformat") {

            if (note_buttons && note_buttons.length > 0) {
                text += "\n"
                for (let button of note_buttons) {
                    text += `[${button.name}](buttonurl://${button.url}`;
                    if (button.same_line) {
                        text += ":same)\n";
                    }
                    else {
                        text += ")\n";
                }
            }

            await sendNoteNoformat(ctx, message_type, text, file, reply_id, handlertype);     
            }
        }
        else {

            if (note_buttons && note_buttons.length > 0) {
                setButtons(note_buttons);
                keyboard = noteButtonsMenu;
            } 
            else {
                keyboard = undefined;
            }
            
            if (text) {
                text = await escapeMarkdownV2(text);
            }

            await sendNote(ctx, message_type, text, file, reply_id, parseMode, keyboard, handlertype);     
        }        
    }
    else {
        await ctx.reply("Please give me a note name to fetch!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}));

composer.chatType(["supergroup", "group"]).command("save", (async (ctx: any) => {
    let args = ctx.match;
    let split_args = args.split(" ");
    let note_name = split_args[0].toLowerCase();

    if (ctx.message.reply_to_message) {
        if (!note_name) {
            await ctx.reply("Please provide a note name!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            let value = ctx.message.reply_to_message.text;
            if (ctx.message.reply_to_message.caption) {
                value = ctx.message.reply_to_message.caption;
            }   
            let result = await extractButtons(value);
            let text = result.text;

            if (text.length == 0) {
                text = note_name;
            }

            if (ctx.message.reply_to_message.reply_markup) {
                let inlineKeyboard = ctx.message.reply_to_message.reply_markup.inline_keyboard;
                let buttons = iterateInlineKeyboard(inlineKeyboard);
                await saveNoteButtons(ctx, note_name, buttons);
                await saveNote(true, ctx, note_name, text);
            }
            else if (result.buttons.length != 0) {
                await saveNoteButtons(ctx, note_name, result.buttons);
                await saveNote(true, ctx, note_name, text);
            }
            else {
                await saveNote(true, ctx, note_name, value);
            }
        }
    }
    else {
        let args = ctx.match;
        let split_args = args.split(" ");
        let note_name = split_args[0].toLowerCase();
        let value = split_args.slice(1).join(" ");
        if (!value) {
            await ctx.reply("Please provide some content for the note!\n\n(<i>Example: /save mynotename hello this is my note!</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else if (!note_name) {
            await ctx.reply("Please give me a note name to save!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            let result = await extractButtons(value);
            if (result.buttons.length != 0) {
                await saveNoteButtons(ctx, note_name, result.buttons);
                await saveNote(false, ctx, note_name, result.text);
            }
            else {
                await saveNote(false, ctx, note_name, value);
            }
        }
    }
}));

// this one's only for media messages containing "/save notename" in their captions
// TODO: use message:caption filter
composer.chatType(["supergroup", "group"]).on("message").hears(/^\/save\b/, (async (ctx: any, next) => {
    if (ctx.message.caption) {
        let note = ctx.message.caption.split(" ");
        let note_name = note[1].toLowerCase();
        let value = note.slice(2).join(" ");
        let result = await extractButtons(value);
        let text = result.text;

        if (result.buttons.length != 0) {
            await saveNoteButtons(ctx, note_name, result.buttons);
            await saveNote(true, ctx, note_name, text);
        }
        else {
            await saveNote(true, ctx, note_name, value);
        }
    }
    await next();
}));

composer.chatType(["supergroup", "group"]).command(["notes", "saved"], (async (ctx: any) => {
    let notes = await get_all_chat_notes(ctx.chat.id);
    let message;
    if (notes.length > 0) {
        let note_names = notes.map(note => note.name);
        message = `Notes saved in <b>${ctx.message.chat.title}</b>:\n\n${note_names.map((note, index) => `${index + 1}. <code>${note}</code>`).join("\n")}\n\nSend /get notename, or #notename to retrieve one of these notes.`;
    }
    else {
        message = "No notes saved in this chat yet!";
    }
    await ctx.reply(message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}));

composer.chatType(["supergroup", "group"]).command("clear", (async (ctx: any) => {
    let args = ctx.match;
    let note_name = args.toLowerCase();

    if (args.startsWith('#')) {
        note_name = note_name.slice(1);
    }

    if (!note_name) {
        await ctx.reply("Please give me a note name to clear!\n\n<i>To list group's notes, send /notes</i>", {reply_parameters: {message_id: ctx.message.message_id}, parseMode: "HTML"});
    }
    else {
        await clearNote(ctx, note_name);
    }
}));

composer.chatType(["supergroup", "group"]).command(["rmallnotes", "clearallnotes"], ownerOnly(async (ctx: any) => {
    await removeallnotes(ctx);
}));

composer.callbackQuery("yes-remove-all-chat-notes", ownerOnlyCallback(async(ctx: any) => {
    let resetted = await remove_all_chat_notes(ctx.chat.id.toString()) 
    if (resetted == true) {
        await ctx.editMessageText("All notes in this chat have been cleared!", { parse_mode: "HTML" });
    }
    else {
        await ctx.editMessageText("Failed to reset all warnings of this chat!", { parse_mode: "HTML" });
    }
}));

composer.callbackQuery("no-dont-remove-all-chat-notes", ownerOnlyCallback(async(ctx: any) => {
    await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
}));

export default composer;