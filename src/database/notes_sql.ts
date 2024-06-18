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