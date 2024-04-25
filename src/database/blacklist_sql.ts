import { prisma } from ".";

export async function get_blacklist(chatId: string) {
    let blacklist = await prisma.blacklist.findFirst({
        where: {
            chat_id: chatId.toString()
        }
    })
    return blacklist;
}
