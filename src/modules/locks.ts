import { Composer } from "grammy";
import { Menu } from "@grammyjs/menu";
import { adminCanRestrictUsers, botCanRestrictUsers, format_json } from "../helpers/helper_func";
import { get_all_locks, set_all_locks, set_lock } from "../database/locks_sql";
import { bot } from "../bot";

const composer = new Composer();

const lockTypesMenu = new Menu("lock-types-menu", { onMenuOutdated: "Menu updated, try now." });
bot.use(lockTypesMenu)

const LOCK_TYPES = [
    "audio",
    "bot",
    "button",
    "contact",
    "document",
    "emojigame",
    "forward",
    "game",
    "gif",
    "info",
    "inline",
    "invite",
    "location",
    "manage_topics",
    "media",
    "messages",
    "other",
    "photo",
    "pin",
    "poll",
    "rtl",
    "sticker",
    "url",
    "video",
    "video_note",
    "voice",
    "web_page_preview"
] as const;

function getLockTypeDescription(lockType: string): string {
    const descriptions: { [key: string]: string } = {
        all: "/lock all\n\nLock all message types to prevent users from sending any type of message.",
        audio: "/lock audio\n\nLock audio messages to prevent users from sharing voice notes and music files.",
        bot: "/lock bot\n\nLock the addition of bots to the group to maintain control over bot interactions.",
        button: "/lock button\n\nLock inline buttons to prevent users from sending interactive messages with buttons.",
        contact: "/lock contact\n\nLock the sharing of contacts to protect user privacy.",
        document: "/lock document\n\nLock document sharing to prevent users from sending files such as PDFs or Word documents.",
        emojigame: "/lock emojigame\n\nLock game emojis to restrict emojis used in games.",
        forward: "/lock forward\n\nLock message forwarding to prevent users from forwarding messages from other chats.",
        game: "/lock game\n\nLock games to restrict users from playing games within the chat.",
        gif: "/lock gif\n\nLock GIFs to prevent users from sending animated images.",
        info: "/lock info\n\nLock group information changes.",
        inline: "/lock inline\n\nLock inline queries to restrict the use of inline bots.",
        location: "/lock location\n\nLock locations to prevent users from sharing their geographic locations.",
        media: "/lock media\n\nLock media messages to prevent users from sending photos, videos, and other media files.",
        messages: "/lock messages\n\nLock text messages to prevent users from sending any text-based messages.",
        other: "/lock other\n\nLock other types of messages including stickers, GIFs, games, and inline bot results.",
        photo: "/lock photo\n\nLock photos to restrict users from sending images.",
        pin: "/lock pin\n\nLock the ability to pin messages.",
        poll: "/lock poll\n\nLock polls to prevent the creation of polls within the group.",
        rtl: "/lock rtl\n\nLock right-to-left messages to prevent messages in right-to-left scripts.",
        sticker: "/lock sticker\n\nLock stickers to prevent the use of sticker packs.",
        url: "/lock url\n\nLock URLs to restrict the sharing of web links.",
        video: "/lock video\n\nLock videos to prevent users from sharing video files.",
        voice: "/lock voice\n\nLock voice messages to prevent the sending of voice recordings.",
        
        // new lock types
        video_note: "/lock video_note\n\nLock video note messages to prevent users from sending round video messages.",
        web_page_preview: "/lock web_page_preview\n\nLock web page previews to prevent automatic expansion of shared links.",
        invite: "/lock invite\n\nLock the ability to invite new users to the group.",
        manage_topics: "/lock manage_topics\n\nLock the ability to create, edit, or delete forum topics in the group."
    };
    return descriptions[lockType] || `Lock ${lockType} messages to restrict their use within the group.`;
}

for (let i = 0; i < LOCK_TYPES.length; i += 3) {
    lockTypesMenu.row();
    for (let j = 0; j < 3 && i + j < LOCK_TYPES.length; j++) {
    
        const lockType = LOCK_TYPES[i + j];
        
        lockTypesMenu.text(lockType, async (ctx) => {
            const description = getLockTypeDescription(lockType);
            await ctx.answerCallbackQuery({ text: description, show_alert: true });
        });
    }
}

type LockType = typeof LOCK_TYPES[number];

interface LockSettings {
    [lockType: string]: boolean;
}

const TELEGRAM_PERMISSIONS: { [key in LockType]?: string } = {
    messages: "can_send_messages",
    audio: "can_send_audios",
    document: "can_send_documents",
    photo: "can_send_photos",
    video: "can_send_videos",
    video_note: "can_send_video_notes",
    voice: "can_send_voice_notes",
    poll: "can_send_polls",
    other: "can_send_other_messages",
    web_page_preview: "can_add_web_page_previews",
    info: "can_change_info",
    invite: "can_invite_users",
    pin: "can_pin_messages",
    manage_topics: "can_manage_topics"
};

const lockPermissions = {
    can_send_messages: false,
    can_send_audios: false,
    can_send_documents: false,
    can_send_photos: false,
    can_send_videos: false,
    can_send_video_notes: false,
    can_send_voice_notes: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
    can_manage_topics: false
};

const unlockPermissions = {
    can_send_messages: true,
    can_send_audios: true,
    can_send_documents: true,
    can_send_photos: true,
    can_send_videos: true,
    can_send_video_notes: true,
    can_send_voice_notes: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
    can_manage_topics: true
};

const lockCache: { [chatId: string]: LockSettings | null } = {};

function isValidLockType(arg: string): arg is LockType {
    return LOCK_TYPES.includes(arg as LockType);
}

async function updateCacheForChat(chatId: string) {
    const locks = await get_all_locks(chatId);
    if (locks) {
        const { chat_id, ...lockSettings } = locks;
        lockCache[chatId] = lockSettings;
    } else {
        lockCache[chatId] = null;
    }
}

function getCachedLocks(chatId: string): LockSettings | null {
    return lockCache[chatId];
}

async function applyLocks(chatId: string, locksToApply: LockType[], lock: boolean, ctx: any) {
    try {
        const chat = await ctx.api.getChat(chatId);
        const currentPermissions = {...chat.permissions};

        let hasChanges = false;
        const updatedPermissions = {...currentPermissions};

        for (const lockType of locksToApply) {
            switch(lockType) {
                case 'messages':
                    if (currentPermissions.can_send_messages !== !lock) {
                        updatedPermissions.can_send_messages = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_audios !== !lock) {
                        updatedPermissions.can_send_audios = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_documents !== !lock) {
                        updatedPermissions.can_send_documents = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_photos !== !lock) {
                        updatedPermissions.can_send_photos = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_videos !== !lock) {
                        updatedPermissions.can_send_videos = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_video_notes !== !lock) {
                        updatedPermissions.can_send_video_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_voice_notes !== !lock) {
                        updatedPermissions.can_send_voice_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_polls !== !lock) {
                        updatedPermissions.can_send_polls = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_other_messages !== !lock) {
                        updatedPermissions.can_send_other_messages = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_add_web_page_previews !== !lock) {
                        updatedPermissions.can_add_web_page_previews = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'audio':
                case 'voice':
                case 'video_note':
                    if (currentPermissions.can_send_other_messages !== !lock) {
                        updatedPermissions.can_send_other_messages = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_audios !== !lock) {
                        updatedPermissions.can_send_audios = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_voice_notes !== !lock) {
                        updatedPermissions.can_send_voice_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_video_notes !== !lock) {
                        updatedPermissions.can_send_video_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_add_web_page_previews !== !lock) {
                        updatedPermissions.can_add_web_page_previews = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'document':
                    if (currentPermissions.can_send_documents !== !lock) {
                        updatedPermissions.can_send_documents = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'photo':
                    if (currentPermissions.can_send_photos !== !lock) {
                        updatedPermissions.can_send_photos = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'video':
                    if (currentPermissions.can_send_videos !== !lock) {
                        updatedPermissions.can_send_videos = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'poll':
                    if (currentPermissions.can_send_polls !== !lock) {
                        updatedPermissions.can_send_polls = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'sticker':
                case 'gif':
                case 'other':
                    if (currentPermissions.can_send_other_messages !== !lock) {
                        updatedPermissions.can_send_other_messages = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'web_page_preview':
                    if (currentPermissions.can_add_web_page_previews !== !lock) {
                        updatedPermissions.can_add_web_page_previews = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'info':
                    if (currentPermissions.can_change_info !== !lock) {
                        updatedPermissions.can_change_info = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'invite':
                    if (currentPermissions.can_invite_users !== !lock) {
                        updatedPermissions.can_invite_users = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'pin':
                    if (currentPermissions.can_pin_messages !== !lock) {
                        updatedPermissions.can_pin_messages = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'manage_topics':
                    if (currentPermissions.can_manage_topics !== !lock) {
                        updatedPermissions.can_manage_topics = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'media':
                    if (currentPermissions.can_send_photos !== !lock) {
                        updatedPermissions.can_send_photos = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_videos !== !lock) {
                        updatedPermissions.can_send_videos = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_video_notes !== !lock) {
                        updatedPermissions.can_send_video_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_audios !== !lock) {
                        updatedPermissions.can_send_audios = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_documents !== !lock) {
                        updatedPermissions.can_send_documents = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_voice_notes !== !lock) {
                        updatedPermissions.can_send_voice_notes = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_send_other_messages !== !lock) {
                        updatedPermissions.can_send_other_messages = !lock;
                        hasChanges = true;
                    }
                    if (currentPermissions.can_add_web_page_previews !== !lock) {
                        updatedPermissions.can_add_web_page_previews = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'bot':
                    if (currentPermissions.can_invite_users !== !lock) {
                        updatedPermissions.can_invite_users = !lock;
                        hasChanges = true;
                    }
                    break;
                case 'game':
                case 'emojigame':
                case 'forward':
                case 'location':
                case 'contact':
                case 'url':
                case 'inline':
                case 'button':
                case 'rtl':
                    // these don't directly correspond to telegram permissions
                    // but we still set the lock in the db
                    break;
            }

            await set_lock(chatId, lock, lockType);
        }

        if (hasChanges) {
            await ctx.api.setChatPermissions(chatId, updatedPermissions);
        }
        await updateCacheForChat(chatId);
    } catch (error) {
        console.error("Error in applyLocks:", error);
        throw error;
    }
}

composer.chatType(["supergroup", "group"]).on(["message", "edited_message"], async (ctx: any, next) => {
    const chatId = ctx.chat.id.toString();
    let locks = getCachedLocks(chatId);

    if (!locks) {
        await updateCacheForChat(chatId);
        locks = getCachedLocks(chatId);
    }

    if (!locks) {
        await next();
        return;
    }

    let message = ctx.message || ctx.edited_message;

    let deleteAndReturn = async () => {
        await ctx.deleteMessage().catch(() => {})
    };

    if (locks.game && message.game) return await deleteAndReturn();
    if (locks.emojigame && message.dice) return await deleteAndReturn();
    if (locks.forward && (message.forward_from || message.forward_from_chat)) return await deleteAndReturn();
    if (locks.location && (message.location || message.venue)) return await deleteAndReturn();
    if (locks.contact && message.contact) return await deleteAndReturn();
    if (locks.url && message.text && /https?:\/\/\S+/i.test(message.text)) return await deleteAndReturn();
    if (locks.inline && message.via_bot) return await deleteAndReturn();
    if (locks.button && (message.reply_markup?.inline_keyboard || message.reply_markup?.keyboard)) return await deleteAndReturn();
    if (locks.rtl && message.text && /[\u0590-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(message.text)) return await deleteAndReturn();

    await next();
});

composer.chatType(["supergroup", "group"]).command("locktypes", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    await ctx.reply("Available lock types:", { reply_markup: lockTypesMenu, reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
})));

composer.chatType(["supergroup", "group"]).command(["currentlocks", "locks"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    let chatId = ctx.chat.id.toString();
    let locks = await get_all_locks(chatId);    
    let chat = await ctx.api.getChat(chatId);

    let currentPermissions = chat.permissions;
    let permissionsMessage = "<b>Current chat permissions:</b>\n";
    for (let [permission, isEnabled] of Object.entries(currentPermissions)) {
        let status = isEnabled ? "Yes" : "No";
        permissionsMessage += `- <i>${permission.replace(/_/g, ' ')}:</i> ${status}\n`;
    }

    let message = "";

    if (!locks) {
        message += "No locks have been set for this chat.\n\n";
        message += permissionsMessage;
        await ctx.reply(message, { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
        return;
    }   
    
    let lockedItems = Object.entries(locks)
      .filter(([key, value]) => key !== "chat_id" && value === true)
      .map(([key]) => `• ${key}`)
      .join("\n");  
    
    if (lockedItems.length === 0) {
        message += "No items are currently locked in this chat.\n\n";
        message += permissionsMessage;

        await ctx.reply(message, { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
        return;
    }   
    
    message = `Currently locked items in this chat:\n\n${lockedItems}\n\n`; 
    message += permissionsMessage;
    
    await ctx.reply(message, { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
})));

composer.chatType(["supergroup", "group"]).command("lock", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    const chatId = ctx.chat!.id.toString();
    let args = ctx.match.split(/[\s\n]+/).filter((arg: string | any[]) => arg.length > 0);
    
    if (args.length === 0) {
        await ctx.reply("Please specify one or more lock types. Usage: /lock [lockType1] [lockType2] ...", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
        return;
    }

    if (args.includes("all")) {
        await set_all_locks(chatId, true);
        await ctx.api.setChatPermissions(chatId, lockPermissions).catch(() => {})
    } 
    else {
        const validLockTypes = args.filter(isValidLockType).map((arg: string) => arg.toLowerCase() as LockType);
        await applyLocks(chatId, validLockTypes, true, ctx);
    }
    await updateCacheForChat(chatId);
    await ctx.reply(`Locked the following for this chat: \n<code>- ${args.join("\n- ")}</code>`, { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
})));

composer.chatType(["supergroup", "group"]).command("unlock", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    const chatId = ctx.chat!.id.toString();
    let args = ctx.match.split(/[\s\n]+/).filter((arg: string | any[]) => arg.length > 0);
    
    if (args.length === 0) {
        await ctx.reply("Please specify one or more lock types to unlock. Usage: /unlock [lockType1] [lockType2] ...", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
        return;
    }

    if (args.includes("all")) {
        await set_all_locks(chatId, false);
        await ctx.api.setChatPermissions(chatId, unlockPermissions).catch(() => {})
        
    } else {
        const validLockTypes = args.filter(isValidLockType).map((arg: string) => arg.toLowerCase() as LockType);
        await applyLocks(chatId, validLockTypes, false, ctx);
    }
    await updateCacheForChat(chatId);
    await ctx.reply(`Unlocked the following for this chat: \n<code>- ${args.join("\n- ")}</code>`, { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
})));

composer.chatType(["supergroup", "group"]).command("lockall", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    let chatId = ctx.chat.id.toString();
  
    try {
        await set_all_locks(chatId, true);
        await ctx.api.setChatPermissions(chatId, lockPermissions);
        await updateCacheForChat(chatId);
        await ctx.reply("All items have been locked for this chat.", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
    } 
    catch (error) {
        console.error(error);
        await ctx.reply("An error occurred while locking all items for this chat.", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
    }
})));
  
composer.chatType(["supergroup", "group"]).command("unlockall", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
    let chatId = ctx.chat.id.toString();
  
    try {
        await set_all_locks(chatId, false);
        await ctx.api.setChatPermissions(chatId, unlockPermissions);
        await updateCacheForChat(chatId);
        await ctx.reply("All items have been unlocked for this chat.", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
    } 
    catch (error) {
        console.error(error);
        await ctx.reply("An error occurred while unlocking all items for this chat.", { reply_to_message_id: ctx.message?.message_id, parse_mode: "HTML" });
    }
})));

export default composer;