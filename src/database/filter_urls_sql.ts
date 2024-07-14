import { prisma } from "./index";

export async function get_filter_urls(chatId: string, keyword: string) {
    let filter_buttons = await prisma.filter_urls.findMany({
        where: {
            chat_id: chatId.toString(),
            keyword: keyword,
        },
        orderBy: {
            id: 'asc',
        }
    });
    return filter_buttons;
};

export async function set_filter_urls(chatId: string, keyword: string, name: string, url: string, sameLine: boolean) {
    try {
        let filter_urls = await prisma.filter_urls.findFirst({
            where: {
                chat_id: chatId.toString(),
                keyword: keyword,
                name: name
            }
        });

        if (filter_urls) {
            await prisma.filter_urls.update({
                where: {
                    id_chat_id_keyword: {
                        id: filter_urls.id,
                        chat_id: chatId.toString(),
                        keyword: keyword
                    }
                },
                data: {
                    url: url,
                    same_line: sameLine
                }
            });
        } 
        else {
            await prisma.filter_urls.create({
                data: {
                    chat_id: chatId.toString(),
                    keyword: keyword,
                    name: name,
                    url: url,
                    same_line: sameLine,
                }
            });
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}