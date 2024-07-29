import { prisma } from "./index";

export async function get_chats_count() {
    let chats = await prisma.chats.count();
    return chats;
};


export async function get_chat(chat_id: string) {
    let chat = await prisma.chats.findUnique({
        where: {
            chat_id: chat_id.toString(),
        }
    });
    return chat;
};

export async function register_chat(chat_id: string, chat_name: string) {
    try {
        let chat = await prisma.chats.upsert({
            where: {
                chat_id: chat_id.toString(),
            },
            update: {
                chat_name: chat_name,
            },
            create: {
                chat_id: chat_id.toString(),
                chat_name: chat_name,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
};