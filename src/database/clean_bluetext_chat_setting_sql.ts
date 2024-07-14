import { prisma } from "./index";

export async function get_clean_bluetext(chatId: string) {
    let setting = await prisma.cleaner_bluetext_chat_setting.findUnique({
        where: {
            chat_id: chatId
        }
    });
    return setting;
}

export async function set_clean_bluetext(chatId: string, cleanBluetext: boolean) {
    try {
        let clean_bluetext = await prisma.cleaner_bluetext_chat_setting.upsert({
            where: {
                chat_id: chatId
            },
            update: {
                is_enable: cleanBluetext
            },
            create: {
                chat_id: chatId,
                is_enable: cleanBluetext,
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;
    }
}