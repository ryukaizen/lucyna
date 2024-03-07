import { prisma } from "./index"

export async function get_rules(chatId: string) {
    let rules = await prisma.rules.findUnique({
        where: {
        chat_id: chatId,
        }
    });
    return rules?.rules;
}