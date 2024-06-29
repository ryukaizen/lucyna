import { Composer } from "grammy";
import { get_all_chat_notes, get_note, get_note_buttons, save_note } from "../database/notes_sql";
import { escapeMarkdownV2, format_json } from "../helpers/helper_func"; 
import { Menu, MenuRange } from "@grammyjs/menu";
import { bot } from "../bot";

const composer = new Composer();

enum MessageTypes {
    TEXT = 0,
    BUTTON_TEXT = 1,
    STICKER = 2,
    DOCUMENT = 3,
    PHOTO = 4,
    AUDIO = 5,
    VOICE = 6,
    VIDEO = 7,
    VIDEO_NOTE = 8
}

async function saveNote(captionedcmd: boolean, ctx: any, note_name: string, value: string | null = null, is_reply: boolean = false, has_buttons: boolean = false) {
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
        caption = message.caption;
    }
    else {
        caption = value;
    }
    
    if (message.text) {
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.TEXT, null, is_reply, has_buttons)
    }
    else if (message.sticker) {
        let file = message.sticker?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.STICKER, file, is_reply, has_buttons)
    }
    else if (message.document) {
        let file = message.document.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.DOCUMENT, file, is_reply, has_buttons)
    }
    else if (message.photo) {
        let file = message.photo?.slice(-1)[0]?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.PHOTO, file, is_reply, has_buttons)
    }
    else if (message.audio) {
        let file = message.audio?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.AUDIO, file, is_reply, has_buttons)
    }
    else if (message.voice) {
        let file = message.voice?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VOICE, file, is_reply, has_buttons)
    }
    else if (message.video || message.animation) {
        let file = message.video?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VIDEO, file, is_reply, has_buttons)
    }
    else if (message.video_note) {
        let file = message.video_note?.file_id;
        noted = await save_note(ctx.chat.id, note_name, caption, MessageTypes.VIDEO_NOTE, file, is_reply, has_buttons)
    }


    if (noted) {
        await ctx.reply("Note saved successfully!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
    else {
        await ctx.reply("Couldn't save the note for some reason!", {reply_parameters: {message_id: ctx.message.message_id}})
    
    }
}

async function sendNote(ctx: any, message_type: number, text: string | null | undefined, file: string | null | undefined, reply_id: any, parseMode: string, keyboard: any) {
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
        await ctx.reply("Unknown message type!")
    }

}

let noteButtons = new Menu("notebuttons", {onMenuOutdated: "Buttons updated!"})
bot.use(noteButtons)


composer.chatType("supergroup" || "group").on("message").hears(/^#[^\s#]+(?:\s|$)/, async (ctx: any) => {
    if (ctx.message.text.startsWith('#')) {
        let name = ctx.message.text.slice(1).toLowerCase()
        let note = await get_note(ctx.chat.id, name);
        let note_buttons = await get_note_buttons(ctx.chat.id, name);
        let text = note?.value;
        let file = note?.file;
        let message_type = Number(note?.msgtype);
        let parseMode = "MarkdownV2";
        let reply_id; 
        let keyboard;

        if (text) {
            text = await escapeMarkdownV2(text);
        }

        if (ctx.message?.reply_to_message) {
            reply_id = ctx.message.reply_to_message.message_id;
        }
        else {
            reply_id = ctx.message.message_id;
        }

        if (note_buttons.length > 0) {
            noteButtons.dynamic(() => {
                const range = new MenuRange();
                note_buttons.forEach(button => {
                    range.url(button.name, button.url);
                    if (!button.same_line) {
                        range.row();
                    }
                });
                return range;
            });
        }

        keyboard = noteButtons;
        
        await sendNote(ctx, message_type, text, file, reply_id, parseMode, keyboard);

        
    }
});

composer.chatType("supergroup" || "group").command(["get", "getnote"], (async (ctx: any) => {
    let name = ctx.match.toLowerCase();
    if (name) {
        let note = await get_note(ctx.chat.id, name);
        let note_buttons = await get_note_buttons(ctx.chat.id, name);
        let text = note?.value;
        let file = note?.file;
        let message_type = Number(note?.msgtype);
        let parseMode = "MarkdownV2";
        let reply_id; 
        let keyboard;

        if (text) {
            text = await escapeMarkdownV2(text);
        }

        if (ctx.message?.reply_to_message) {
            reply_id = ctx.message.reply_to_message.message_id;
        }
        else {
            reply_id = ctx.message.message_id;
        }

        if (note_buttons) {
            noteButtons.dynamic(() => {
                const range = new MenuRange();
                note_buttons.forEach(button => {
                    range.url(button.name, button.url);
                    if (!button.same_line) {
                        range.row();
                    }
                });
                return range;
            });
        }
        
        keyboard = noteButtons;

        await sendNote(ctx, message_type, text, file, reply_id, parseMode, keyboard);     
    }
    else {
        await ctx.reply("Please give me a note name to fetch!", {reply_parameters: {message_id: ctx.message.message_id}})
    }
}));

composer.chatType("supergroup" || "group").command("save", (async (ctx: any) => {
    let args = ctx.match;
    let split_args = args.split(" ");
    let note_name = split_args[0].toLowerCase();
    let value = split_args.slice(1).join(" ");

    if (ctx.message.reply_to_message) {
        if (!note_name) {
            await ctx.reply("Please provide a note name!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            if (value) {
                await saveNote(true, ctx, note_name, value)
            }
            else {
                await saveNote(true, ctx, note_name)
            }
        }
    }
    else {
        let args = ctx.match;
        let split_args = args.split(" ");
        let note_name = split_args[0].toLowerCase();
        let value = split_args.slice(1).join(" ");
        if (!value) {
            await ctx.reply("Please provide some content for the note!\n\n(Example: <i>/save mynotename hello this is my note!</i>)", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        }
        else if (!note_name) {
            await ctx.reply("Please give me a note name to save!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else {
            await saveNote(ctx, note_name, value)
        }
    }
}));

// this one's only for media messages containing "/save notename" in their captions
composer.chatType("supergroup" || "group").on("message").hears(/^\/save\b/, (async (ctx: any) => {
    if (ctx.message.caption) {
        const regex = /^\/save\s+(\w+)(?:\s+(.*))?$/;
        const match = (ctx.message.caption).match(regex);
        let note_name = match ? match[1].toLowerCase() : '';
        let value = match ? match[2] : '';
        if (!note_name) {
            await ctx.reply("Please provide a note name!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (value) {
            await saveNote(false, ctx, note_name, value);
        } 
        else {
            await saveNote(false, ctx, note_name);
        }
    }
}));


composer.chatType("supergroup" || "group").command(["notes", "saved"], (async (ctx: any) => {
    let notes = await get_all_chat_notes(ctx.chat.id);
    let message;
    if (notes.length > 0) {
        let note_names = notes.map(note => note.name);
        message = `Notes saved in <b>${ctx.message.chat.title}</b>:\n\n${note_names.map((note, index) => `${index + 1}. <code>${note}</code>`).join("\n")}`;
    }
    else {
        message = "No notes saved in this chat yet!";
    }
    await ctx.reply(message, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}));


// composer.chatType("supergroup" || "group").command("clear", (async (ctx: any) => {

// }));

// composer.chatType("supergroup" || "group").command("rmallnotes", (async (ctx: any) => {

// }));

export default composer;