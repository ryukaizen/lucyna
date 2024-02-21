import constants from "../config";
import { prisma } from "../database";

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
}

export function elevatedUsersOnly(handler: any) {
    return async (ctx: any) => {
        let user = await ctx.getAuthor();
        if (ctx.from.id == constants.OWNER_ID || constants.SUPERUSERS.includes(ctx.from.id)) {
            await handler(ctx);
        }
        else if (user.status == "creator" || user.status == "administrator") {
            await handler(ctx);
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    };
}

export async function checkElevatedUser(ctx: any) {
    // fetch user status
    let user = await ctx.api.getChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
    if (ctx.from.id == constants.OWNER_ID || constants.SUPERUSERS.includes(ctx.from.id) || user.user.status == "creator" || user.user.status == "administrator") {
        return true;
    }
    else {
        return false;
    }
}

export async function userInfo(ctx: any) {
    const user_info = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    return user_info;
}

// for future uses in other modules ----------------
export async function usernameExtractor(ctx: any) {
    let args = ctx.match;
    let regex = /@([^\s]+)/g;
    let usernames: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(args)) !== null) {
        usernames.push(match[1]);
    }

    return usernames;
}

export async function userIdExtractor(ctx: any) {
    let args = ctx.match;
    let regex = /(\d+)/g;
    let user_ids: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(args)) !== null) {
        user_ids.push(match[1]);
    }

    return user_ids;
}
// ------------------------------------------------

export async function entityExtractor(ctx: any) {
    interface Entity {
        offset: number;
        length: number;
        type: string;
        text: string;
    }

    let entities: Entity[] = await ctx.entities();

    let user_ids: string[] = []; 
    let usernames: string[] = [];
    let args = ctx.match;

    let i = 0;
    while (i < entities.length) {
        const entity = entities[i];
        // bot api treats 10 digit integers as phone_number, 
        // and then you realize, user IDs are also 10 digit integers :p
        
        let nine_digit_regex = /(\d{9})/g;
        let match: RegExpExecArray | null;

        while ((match = nine_digit_regex.exec(args)) !== null) {
            user_ids.push(match[1]);
        }   

        if (entity.type === 'phone_number') {
          user_ids.push(entity.text);
        }
        if (entity.type === 'mention') {
          usernames.push(entity.text);
        }
        i++;
    }

    // match 'n convert usernames to user_ids (something that Paul's Rose bot does, maybe)
    if (Object.keys(usernames).length > 0) {
        let regex = /@([^\s]+)/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(usernames.join(" "))) !== null) {
            usernames.push(match[1]);
        }
        for (let i = 0; i < usernames.length; i++) {
            let user = await prisma.users.findFirst({
                where: {
                    username: usernames[i],
                }
            })
            if (user != null) { 
            user_ids.push(`${user?.user_id}`)
            }
        }
    } 
    return user_ids;
}