import { prisma } from "./index"

export async function get_warn_numbers(chatId: string, userId: bigint) {
    let warn_numbers = await prisma.warns.findFirst({
        where: {
            chat_id: chatId.toString(),
            user_id: userId
        }
    })
    return warn_numbers;
}

export async function get_warn_settings(chatId: string) {
    let warn_settings = await prisma.warn_settings.findUnique({
        where: {
            chat_id: chatId.toString()
        }
    })
    return warn_settings;
}

export async function set_warn_numbers(chatId: string, userId: bigint, numWarns: bigint, reasons: string[]) {
    let warn_numbers = await prisma.warns.upsert({
        where: {
          chat_id: chatId,
          user_id: userId,
          user_id_chat_id: {user_id: userId, chat_id: chatId}
        },
        update: {
            num_warns: numWarns,
            reasons: reasons
        },
        create: {
            chat_id: chatId,
            user_id: userId,
        }
    })
}

export async function set_warn_settings(chatId: string, warnLimit: bigint, softWarn: boolean) {
    let warn_settings =  await prisma.warn_settings.upsert({
        where: {
            chat_id: chatId
        },
        update: {
            warn_limit: warnLimit,
            soft_warn: softWarn
        },
        create: {
            chat_id: chatId,
            warn_limit: 3, // default is 3
            soft_warn: false // ban instead of kick
        }
    })
}
