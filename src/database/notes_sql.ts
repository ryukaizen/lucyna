import { prisma } from "./index";

export async function get_note(chatId: string, name: string) {
    let note = await prisma.notes.findFirst({
        where: {
            chat_id: chatId.toString(),
            name: name,
        }
    });
    return note;
};

export async function save_note(chatId: string, name: string, value: string | null, msgtype: number, file: string | null) {
    try {
        let note = await prisma.notes.upsert({
            where: {
                chat_id_name: {chat_id: chatId.toString(), name: name}
            },
            update: {
                value: value,
                msgtype: msgtype,
                file: file,
            },
            create: {
                chat_id: chatId.toString(),
                name: name,
                value: value,
                msgtype: msgtype,
                file: file,
                is_reply: false,
                has_buttons: false
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function get_all_chat_notes(chatId: string) {
    let notes = await prisma.notes.findMany({
        where: {
            chat_id: chatId.toString(),
        }
    });
    return notes;
}

export async function clear_note(chatId: string, name: string) {
    try {
        await prisma.notes.delete({
            where: {
                chat_id_name: {chat_id: chatId.toString(), name: name}
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function remove_all_chat_notes(chatId: string) {
    try {
        await prisma.notes.deleteMany({
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