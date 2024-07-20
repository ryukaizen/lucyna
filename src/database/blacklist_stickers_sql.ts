import { prisma } from "./index";

export async function is_blsticker(chatId: string, trigger: string) {
    try {
        const blacklistedSticker = await prisma.blacklist_stickers.findUnique({
            where: {
                chat_id_trigger: {
                    chat_id: chatId,
                    trigger: trigger
                }
            }
        });
        return !!blacklistedSticker; // Returns true if the sticker is found, false otherwise
    } catch (e) {
        console.error("Error checking blacklisted sticker:", e);
        return false;
    }
}

export async function get_blsticker(chatId: string) {
    let blsticker = await prisma.blacklist_stickers.findFirst({
        where: {
            chat_id: chatId.toString(),
        }
    });
    return blsticker;
}

export async function get_all_blsticker(chatId: string) {
    let blsticker = await prisma.blacklist_stickers.findMany({
        where: {
            chat_id: chatId.toString(),
        }
    });
    return blsticker
}

export async function set_blsticker(chatId: string, trigger: string) {
    try {
        let blsticker = await prisma.blacklist_stickers.upsert({
            where: {
                chat_id_trigger: {chat_id: chatId.toString(), trigger: trigger}
            },
            update: {
                trigger: trigger
            },
            create: {
                chat_id: chatId.toString(),
                trigger: trigger
            }
        })
        return blsticker;
    }
    catch (e) {
        console.error(e)
        return false;
    }
}


export async function del_blsticker(chatId: string, trigger: string) {
    try {
        await prisma.blacklist_stickers.delete({
            where: {
                chat_id_trigger: {chat_id: chatId.toString(), trigger: trigger}
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}

export async function del_all_blsticker(chatId: string) {
    try {
        let blsticker = await prisma.blacklist_stickers.deleteMany({
            where: {
                chat_id: chatId.toString()
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}