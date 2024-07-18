import { prisma } from "./index";

export async function get_blacklist_settings(chatId: string) {
    let blacklist_settings = await prisma.blacklist_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return blacklist_settings;
}

export async function set_blacklist_settings(chatId: string, blacklist_type: bigint, value: string) {
    try {
        let blacklist_settings = await prisma.blacklist_settings.upsert({
            where: {
                chat_id: chatId.toString()
            },
            update: {
                blacklist_type: blacklist_type,
                value: value
            },
            create: {
                chat_id: chatId.toString(),
                blacklist_type: blacklist_type,
                value: value
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}