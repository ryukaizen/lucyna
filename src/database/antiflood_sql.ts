import { prisma } from ".";

export async function get_flood(chatId: string) {
    let flood = await prisma.antiflood.findFirst({
        where: {
            chat_id: chatId.toString()
        }
    })
    return flood;
}

export async function get_flood_settings(chatId: string) {
    let flood_settings = await prisma.antiflood_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return flood_settings;
}

export async function set_flood(chat_id: string, count: bigint, limit: bigint) {
    try {
        let flood = await prisma.antiflood.upsert({
            where: {
            chat_id: chat_id,
            },
            update: {
                count: count,
                limit: limit
            },
            create: {
                chat_id: chat_id,
                count: count,
                limit: limit
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}

export async function set_flood_settings(chat_id: string, flood_type: bigint, value: string = "0") {
    try {
        let flood_settings = await prisma.antiflood_settings.upsert({
            where: {
                chat_id: chat_id
            },
            update: {
                flood_type: flood_type,
                value: value
            },
            create: {
                chat_id: chat_id,
                flood_type: flood_type,
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

export async function update_flood(chat_id: string, count: bigint) {
    try {
        let flood = await prisma.antiflood.upsert({
            where: {
            chat_id: chat_id,
            },
            update: {
                count: count,
            },
            create: {
                chat_id: chat_id,
                count: count,
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}