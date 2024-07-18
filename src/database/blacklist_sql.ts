import { prisma } from "./index";

export async function get_blacklist(chatId: string) {
    let blacklist = await prisma.blacklist.findMany({
        where: {
            chat_id: chatId.toString()
        }
    })
    return blacklist;
}

export async function set_blacklist(chatId: string, trigger: string) {
    try {
        let blacklist = await prisma.blacklist.upsert({
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
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}

export async function reset_blacklist(chatId: string, trigger: string) {
    try {
        await prisma.blacklist.delete({
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

export async function reset_all_blacklist(chatId: string) {
    try {
        await prisma.blacklist.deleteMany({
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