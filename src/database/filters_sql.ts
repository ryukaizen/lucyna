import { prisma } from "./index";

export async function get_filter(chatId: string, keyword: string) {
    let filter = await prisma.filters.findFirst({
        where: {
            chat_id: chatId.toString(),
            keyword: keyword,
        }
    });
    return filter;
};

export async function set_filter(chatId: string, keyword: string, reply: string | null, msgtype: number, file: string | null) {
    try {
        let filter = await prisma.filters.upsert({
            where: {
                chat_id_keyword: {chat_id: chatId.toString(), keyword: keyword}
            },
            update: {
                reply: reply,
                msgtype: msgtype,
                file: file,
            },
            create: {
                chat_id: chatId.toString(),
                keyword: keyword,
                reply: reply,
                msgtype: msgtype,
                file: file,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function get_all_chat_filters(chatId: string) {
    let filters = await prisma.filters.findMany({
        where: {
            chat_id: chatId.toString(),
        }
    });
    return filters;
}

export async function stop_filter(chatId: string, keyword: string) {
    try {
        await prisma.filters.delete({
            where: {
                chat_id_keyword: {chat_id: chatId.toString(), keyword: keyword}
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function stop_all_chat_filters(chatId: string) {
    try {
        await prisma.filters.deleteMany({
            where: {
                chat_id: chatId.toString(),
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}