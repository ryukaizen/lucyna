import { prisma } from "./index";

export async function get_chats_count() {
    let chats = await prisma.chats.count();
    return chats;
};


export async function get_chat(id: string) {
    let chat = await prisma.chats.findUnique({
        where: {
            chat_id: id,
        }
    });
    return chat;
};

export async function register_chat(id: string, chat_name: string) {
    try {
        let chat = await prisma.chats.upsert({
            where: {
                chat_id: id,
            },
            update: {
                chat_name: chat_name,
            },
            create: {
                chat_id: id,
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