import { prisma } from "./index";

// will merge them as a single func later
export async function get_welcome(chatId: string) {
    let welcome = await prisma.welcome_pref.findFirst({
        where: {
            chat_id: chatId.toString()
        }
    });
    return welcome;
}

export async function get_goodbye(chatId: string) {
    let goodbye = await prisma.welcome_pref.findFirst({
        where: {
            chat_id: chatId.toString()
        }
    });
    return goodbye;
}

// --------

export async function set_welcome_switch(chatId: string, shouldWelcome: boolean) {
    try {
        let welcome = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString()
            },
            update: {
                should_welcome: shouldWelcome,
            },
            create: {
                chat_id: chatId.toString(),
                should_welcome: true,
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    
    }
}

export async function set_goodbye_switch(chatId: string, shouldGoodbye: boolean) {
    try {
        let goodbye = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString()
            },
            update: {
                should_goodbye: shouldGoodbye,
            },
            create: {
                chat_id: chatId.toString(),
                should_goodbye: true,
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    
    }
}

export async function set_clean_welcome_switch(chatId: string, clean_welcome: boolean) {
    try {
        let welcome = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                clean_welcome: clean_welcome,
            },
            create: {
                chat_id: chatId.toString(),
                clean_welcome: clean_welcome,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function set_welcome(chatId: string, custom_content: string | null, custom_welcome: string | null, welcome_type: number) {
    try {
        let welcome = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                custom_content: custom_content,
                custom_welcome: custom_welcome,
                welcome_type: welcome_type,
            },
            create: {
                chat_id: chatId.toString(),
                custom_content: custom_content,
                custom_welcome: custom_welcome,
                welcome_type: welcome_type,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function set_goodbye(chatId: string, custom_leave: string | null, leave_type: number) {
    try {
        let goodbye = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                custom_leave: custom_leave,
                leave_type: leave_type,
            },
            create: {
                chat_id: chatId.toString(),
                custom_leave: custom_leave,
                leave_type: leave_type,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}

export async function set_clean_welcome(chatId: string, previous_welcome: bigint) {
    try {
        let clean_welcome = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                previous_welcome: previous_welcome,
            },
            create: {
                chat_id: chatId.toString(),
                previous_welcome: previous_welcome,
            }
        });
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}


export async function reset_welcome(chatId: string, ) {
    try {
        let reset_welcome = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                custom_content: null,
                custom_welcome: null,
                welcome_type: null,
            },
            create: {
                chat_id: chatId.toString(),
                custom_content: null,
                custom_welcome: null,
                welcome_type: null,
            }
        });
    
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}    

export async function reset_goodbye(chatId: string) {
    try {
        let reset_goodbye = await prisma.welcome_pref.upsert({
            where: {
                chat_id: chatId.toString(),
            },
            update: {
                custom_leave: null,
                leave_type: null,
            },
            create: {
                chat_id: chatId.toString(),
                custom_leave: null,
                leave_type: null,
            }
        });
    
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
}
