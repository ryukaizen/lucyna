import { prisma } from "./index";

export async function get_blsticker_settings(chatId: string) {
    let blsticker_settings = await prisma.blsticker_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return blsticker_settings;
}

export async function set_blsticker_settings(chatId: string, blacklist_type: bigint, value: string) {
    try {
        let blsticker_settings = await prisma.blsticker_settings.upsert({
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