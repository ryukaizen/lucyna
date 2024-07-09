import { prisma } from "./index";

export async function get_greet_urls(chatId: string) {
    let greet_buttons = await prisma.welcome_urls.findMany({
        where: {
            chat_id: chatId.toString(),
        },
        orderBy: {
            id: 'asc',
        }
    });
    return greet_buttons;
}

export async function set_greet_urls(chatId: string, name: string, url: string, sameLine: boolean) {
    try {
 
        const existingUrl = await prisma.welcome_urls.findFirst({
            where: {
                chat_id: chatId.toString(),
                name: name
            }
        });

        let welcomeUrl;

        if (existingUrl) {

            welcomeUrl = await prisma.welcome_urls.update({
                where: {
                    id_chat_id: {
                        id: existingUrl.id,
                        chat_id: chatId.toString(),
                    }
                },
                data: {
                    url: url,
                    same_line: sameLine
                }
            });
        } else {

            welcomeUrl = await prisma.welcome_urls.create({
                data: {
                    chat_id: chatId.toString(),
                    name: name,
                    url: url,
                    same_line: sameLine
                }
            });
        }
        
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function reset_greet_buttons(chatId: string) {
    await prisma.welcome_urls.deleteMany({
        where: {
            chat_id: chatId.toString()
        }
    });
}