import constants from "../config";

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
}

// ==================== USER STUFF ====================

export function ownerOnly(handler: any) {
    return async (ctx: any) => {
        let user = await ctx.getAuthor();
        if (ctx.from.id == constants.OWNER_ID || user.status == "creator") {
            await handler(ctx);
        }
        else {
            await ctx.reply("Only owner of this chat can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function ownerOnlyCallback(handler: any) {
    return async (ctx: any) => {
        let user = await ctx.getAuthor();
        if (ctx.from.id == constants.OWNER_ID || user.status == "creator") {
            await handler(ctx);
        }
        else {
            await ctx.answerCallbackQuery({ text: "Only owner of this chat can use this button!"});
        }
    };
}

export function superusersOnly(handler: any) {
    return async (ctx: any) => {
        if (constants.SUPERUSERS.includes(ctx.from.id) || ctx.from.id == constants.OWNER_ID) {
            await handler(ctx);
        }
        else {
            await ctx.reply("Only superusers can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
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
            await ctx.answerCallbackQuery({ text: "Only admins can use this button!"});
        }
    };

}

export function samePersonCallbackOnly(handler: any) {
    return async (ctx: any) => {
        if (ctx.callbackQuery.message.reply_to_message?.from?.id == ctx.callbackQuery?.from?.id) {
            await handler(ctx);
        }
        else {
            await ctx.answerCallbackQuery({ text: "You can't use this button!"});
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
export async function checkElevatedUserFrom(ctx: any, user_info: any) {
    let user = await ctx.api.getChatMember(ctx.chat.id, user_info.user.id)
    if (user_info.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(user_info.user.id) == true || user.status == "creator" || user.status == "administrator") {
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

// future use maybe
export async function isUserInChat(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.api.getChatMember(chat_id, user_id);
    if (user.status == "member" || user.status == "restricted" || user.status == "creator" || user.status == "administrator") {
        return true;
    }
    else {
        return false;
    }

}

export async function isUserRestricted(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.api.getChatMember(chat_id, user_id);
    if (user.status == "restricted") {
        return true;
    }
    else {
        return false;
    }
}

export async function isUserBanned(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.api.getChatMember(chat_id, user_id);
    if (user.status == "kicked") {
        return true;
    }
    else {
        return false;
    }
}
// ====================================================

// ==================== BOT STUFF ====================
export function canRestrictUsers(hander: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_restrict_members == true) {
                await hander(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to ban users!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function canRestrictUsersCallback(hander: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_restrict_members == true) {
                await hander(ctx);
            }
            else {
                await ctx.answerCallbackQuery("I don't have enough admin rights to ban users!");
            }  
        }
        else {
            await ctx.answerCallbackQuery("I need to be admin for this!");
        }
    }
}

export function canDeleteMessages(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_delete_messages == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to delete messages!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function canPinMessages(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_pin_messages == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to pin messages!", {reply_parameters: {message_id: ctx.message.message_id}});     
            }
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function canInviteUsers(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_invite_users == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to generate invitelinks!", {reply_parameters: {message_id: ctx.message.message_id}});     
            }
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function canPromoteMembers(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_promote_members == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to promote members!", {reply_parameters: {message_id: ctx.message.message_id}});     
            }
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function canChangeInfo(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
            if (bot_info.can_change_info == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("I don't have enough admin rights to change group information!", {reply_parameters: {message_id: ctx.message.message_id}}); 
            }
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}})
        }
    }
}
// ====================================================

export async function extract_time(ctx: any, time_val: string): Promise<string | number> {
    const units = ["m", "h", "d"];
    const timeUnits = time_val.split(/\s+/); // Split the time_val by whitespace
    
    let totalTime = 0;

    for (const timeUnit of timeUnits) {
        const unit = timeUnit.slice(-1);
        const time_num = timeUnit.slice(0, -1);
        
        if (!/^\d+$/.test(time_num) || !units.includes(unit)) {
            await ctx.reply("Invalid time amount specified.", {reply_parameters: {message_id: ctx.message.message_id}});
            return "";
        }
        switch (unit) {
            case "m":
                totalTime += parseInt(time_num) * 60;
                break;
            case "h":
                totalTime += parseInt(time_num) * 60 * 60;
                break;
            case "d":
                totalTime += parseInt(time_num) * 24 * 60 * 60;
                break;
            default:
                await ctx.reply("Invalid time type specified. Expected m, h, or d.", {reply_parameters: {message_id: ctx.message.message_id}});
                return "";
        }
    }
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return currentTime + totalTime;
}

export function convertUnixTime(unixTime: number): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDifference = unixTime - currentTime;

    if (timeDifference < 60) {
        return `${timeDifference} second(s)`;
    } else if (timeDifference < 3600) {
        return `${Math.floor(timeDifference / 60)} minute(s)`;
    } else if (timeDifference < 86400) {
        return `${Math.floor(timeDifference / 3600)} hour(s)`;
    } else {
        return `${Math.floor(timeDifference / 86400)} day(s)`;
    }
}