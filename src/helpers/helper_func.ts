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

export function elevatedUsersCallbackOnly(handler: any) {
    return async (ctx: any) => {
        let user = await ctx.getAuthor();
        if (ctx.from.id == constants.OWNER_ID || constants.SUPERUSERS.includes(ctx.from.id)) {
            await handler(ctx);
        }
        else if (user.status == "creator" || user.status == "administrator") {
            await handler(ctx);
        }
        else {
            await ctx.answerCallbackQuery({ text: "Only admins can use this command!"});
        }
    };

}

// for reply_to_message
export async function checkElevatedUser(ctx: any) {
    // fetch user status
    let user = await ctx.api.getChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id)
    if (ctx.message.reply_to_message.from.id == constants.OWNER_ID || constants.SUPERUSERS.includes(ctx.message.reply_to_message.from.id) == true || user.status == "creator" || user.status == "administrator") {
        return true;
    }
    else {
        return false;
    }
}

// for general stuff
export async function checkElevatedUserFrom(ctx: any) {
    let user = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id)
    if (ctx.from.id == constants.OWNER_ID || constants.SUPERUSERS.includes(ctx.from.id) == true || user.status == "creator" || user.status == "administrator") {
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
    let regex = /(\b\d{9,10}\b)/g; // filter out 9 or 10 digit integers
    let user_ids: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(args)) !== null) {
        user_ids.push(match[1]);
    }
    return user_ids;
}