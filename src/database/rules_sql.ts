import { prisma } from "./index"

export async function get_rules(chatId: string) {
    let rules = await prisma.rules.findUnique({
        where: {
        chat_id: chatId,
        }
    });
    return rules?.rules;
};

export async function set_rules(chatId: string, rulesText: string) {
    try {
        let rules = await prisma.rules.upsert({
            where: {
                chat_id: chatId,
            },
            update: {
                rules: rulesText,
            },
            create: {
                chat_id: chatId,
                rules: rulesText,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
};

export async function reset_rules(chatId: string) {
    try {
        let resetRules = await prisma.rules.delete({
            where: {
                chat_id: chatId,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }

}