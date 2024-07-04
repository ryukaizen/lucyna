import { prisma } from "./index";

export async function get_note_urls(chatId: string, name: string) {
    let note_buttons = await prisma.note_urls.findMany({
        where: {
            chat_id: chatId.toString(),
            note_name: name,
        },
        orderBy: {
            id: 'asc',
        }
    });
    return note_buttons;
};

export async function set_note_urls(chatId: string, noteName: string, name: string, url: string, sameLine: boolean) {
    try {
        let note_urls = await prisma.note_urls.findFirst({
            where: {
                chat_id: chatId.toString(),
                note_name: noteName,
                name: name
            }
        });

        if (note_urls) {
            await prisma.note_urls.update({
                where: {
                    id_chat_id_note_name: {
                        id: note_urls.id,
                        chat_id: chatId.toString(),
                        note_name: noteName
                    }
                },
                data: {
                    url: url,
                    same_line: sameLine
                }
            });
        } 
        else {
            await prisma.note_urls.create({
                data: {
                    chat_id: chatId.toString(),
                    note_name: noteName,
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