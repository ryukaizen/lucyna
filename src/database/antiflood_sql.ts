import { prisma } from "./index";

export async function get_flood(chatId: string) {
    let flood = await prisma.antiflood.findFirst({
        where: {
            chat_id: chatId.toString()
        }
    })
    return flood;
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

export async function update_flood(chat_id: string, count: bigint, user_id: number | null) {
    try {
        let flood = await prisma.antiflood.update({
            where: { 
                chat_id: chat_id 
            },
            data: { 
                count: count, 
                user_id: user_id 
            }
        });
        return true;
    }
    catch (e) {
        console.error(e)
        return false;    
    }
}