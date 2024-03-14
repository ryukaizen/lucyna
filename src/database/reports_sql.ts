import { prisma } from "./index";

export async function get_report_settings(chatId: string) {
    let report_settings = await prisma.chat_report_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return report_settings;
}

export async function set_report_settings(chatId: string, shouldReport: boolean) {
    try {
        let report_settings = await prisma.chat_report_settings.upsert({
            where: {
                chat_id: chatId
            },
            update: {
                should_report: shouldReport
            },
            create: {
                chat_id: chatId,
                should_report: true, // default to enabled
            }
        })
        return true;
    }
    catch (e) {
        console.error(e)
        return false;
    }
}