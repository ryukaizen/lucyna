import { prisma } from "./index";

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
  
type LockType = typeof LOCK_TYPES[number];


function isValidLockType(arg: string): arg is LockType {
    return LOCK_TYPES.includes(arg as LockType);
}


export async function get_all_locks(chat_id: string) {
    try {
        return await prisma.locks.findUnique({
            where: { 
                chat_id: chat_id 
            }
        });
    } 
    catch (error) {
        console.error("Error getting locks:", error);
        return null;
    }
  }

export async function set_all_locks(chat_id: string, value: boolean) {
    try {
        let updateData = { 
            audio: value,
            bot: value,
            button: value,
            contact: value,
            document: value,
            emojigame: value,
            forward: value,
            game: value,
            gif: value,
            info: value,
            inline: value,
            invite: value,
            location: value,
            manage_topics: value,
            media: value,
            messages: value,
            other: value,
            photo: value,
            pin: value,
            poll: value,
            rtl: value,
            sticker: value,
            url: value,
            video: value,
            video_note: value,
            voice: value,
            web_page_preview: value
        };

        let existingLocks = await prisma.locks.findUnique({
            where: { 
                chat_id: chat_id 
            }
        });

        if (existingLocks) {
            await prisma.locks.update({
                where: { 
                    chat_id: chat_id 
                },
                data: updateData
            });
        } 
        else {
            await prisma.locks.create({
                data: { 
                    chat_id: chat_id, 
                    ...updateData 
                }
            });
        }

    } 
    catch (error) {
      console.error("Error setting all locks:", error);
    
    }
}

export async function set_lock(chat_id: string, value: boolean, lock_type: string) {
    try {
        if (!isValidLockType(lock_type)) {
            console.error(`Invalid lock type: ${lock_type}`);
            return false; 
        }

        await prisma.locks.upsert({
            where: { chat_id: chat_id },
            update: { [lock_type]: value },
            create: { chat_id: chat_id, [lock_type]: value }
        });
        return true; 
    } catch (error) {
        console.error("Error setting lock:", error);
        return false; 
    }
}