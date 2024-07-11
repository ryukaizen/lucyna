import { prisma } from "./index";

export async function get_clean_service(chatId: string) {
    let clean_service = await prisma.clean_service.findUnique({
        where: {
            chat_id: chatId
        }
    })
    return clean_service;
}

export async function set_clean_service(chatId: string, cleanService: boolean) {
    try {
        let clean_service = await prisma.clean_service.upsert({
            where: {
                chat_id: chatId
            },
            update: {
                clean_service: cleanService
            },
            create: {
                chat_id: chatId,
                clean_service: cleanService,
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;
    }
}