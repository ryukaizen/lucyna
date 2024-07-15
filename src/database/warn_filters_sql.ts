import { prisma } from "./index";

export async function get_warn_filter(chatId: string, keyword: string) {
    let warn_filter = await prisma.warn_filters.findFirst({
        where: {
            chat_id: chatId.toString(),
            keyword: keyword,
        }
    });
    return warn_filter;
}

export async function get_all_warn_filters(chatId: string) {
    let warn_filters = await prisma.warn_filters.findMany({
        where: {
            chat_id: chatId.toString(),
        },
        orderBy: {
            keyword: 'asc',
        }
    });
    return warn_filters;
}

export async function set_warn_filter(chatId: string, keyword: string, reply: string) {
    try {
        let warn_filters = await prisma.warn_filters.findFirst({
            where: {
                chat_id: chatId.toString(),
            }
        });

        if (warn_filters) {
            await prisma.warn_filters.update({
                where: {
                    chat_id_keyword: {
                        chat_id: chatId.toString(),
                        keyword: keyword
                    }
                },
                data: {
                    reply: reply,
                }
            });
        } 
        else {
            await prisma.warn_filters.create({
                data: {
                    chat_id: chatId.toString(),
                    keyword: keyword,
                    reply: reply,
                }
            });
        }
        return true;
    } 
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function reset_warn_filter(chatId: string, keyword: string) {
    try {
        await prisma.warn_filters.deleteMany({
            where: {
                chat_id: chatId.toString(),
                keyword: keyword,
            }
        });
        return true;
    } 
    catch (e) {
        console.error(e);
        return false;
    }

}

export async function reset_all_warn_filters(chatId: string) {
    try {
        await prisma.warn_filters.deleteMany({
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