import constants from "../config";
import { gramjs, gramJsApi } from "../utility";
import { promisify } from 'util';

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
            return;
        }
    };
}

export function elevatedUsersOnly(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator" || chatMember.status == "administrator") {
            await handler(ctx);
        } 
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    };
}

export function elevatedUsersCallbackOnly(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator" || chatMember.status == "administrator") {
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

export async function isUserAdmin(ctx: any, user_id: any) {
    let user = await ctx.chatMembers.getChatMember(ctx.chat.id, user_id)
    if (user_id == constants.OWNER_ID || constants.SUPERUSERS.includes(user_id) || user.status == "creator" || user.status == "administrator" || user_id == "1087968824") {
        return true;
    }
    else {
        return false;
    }
}

export async function isUserCreator(ctx: any, user_id: number) {
    let user = await ctx.chatMembers.getChatMember(ctx.chat.id, user_id);
    if (user.status == "creator") {
        return true;
    }
    else {
        return false;
    }
}

// future use maybe
export async function isUserInChat(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.chatMembers.getChatMember(chat_id, user_id);
    if (user.status == "member" || user.status == "restricted" || user.status == "creator" || user.status == "administrator") {
        return true;
    }
    else {
        return false;
    }
}

export async function isUserRestricted(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.chatMembers.getChatMember(chat_id, user_id);
    if (user.status == "restricted") {
        return true;
    }
    else {
        return false;
    }
}

export async function isUserBanned(ctx: any, chat_id: string, user_id: number) {
    let user = await ctx.chatMembers.getChatMember(chat_id, user_id);
    if (user.status == "kicked") {
        return true;
    }
    else {
        return false;
    }
}
// ====================================================

// ============== ANONYMOUS ADMIN CHECK ===============
// const anonCheckButton = new Menu("anonkeyboard")  
// bot.use(anonCheckButton);

// async function anonymousAdminCheck(ctx: any) {
//     await ctx.api.sendMessage(ctx.chat.id, "Due to being anonymous, you need to pass the admin check before using this command.", {reply_markup: anonCheckButton, reply_parameters: {message_id: ctx.message.message_id}});
// }
// ====================================================

// ==================== ADMIN STUFF ====================
export function adminCanRestrictUsers(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_restrict_members == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to restrict / derestrict users!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };
}

export function adminCanRestrictUsersCallback(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator" ) {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_restrict_members == true) {
                await handler(ctx);
            }
            else {
                await ctx.answerCallbackQuery({ text: "You don't have enough rights to restrict / derestrict users!"}).catch((GrammyError: any) => {return})
            }  
        }
        else {
            await ctx.answerCallbackQuery({ text: "Only admins can use this button!"}).catch((GrammyError: any) => {return})
        }
    };
}

export function adminCanDeleteMessages(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_delete_messages == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to delete messages!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };
}

export function adminCanPinMessages(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_pin_messages == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to pin / unpin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };
}

export function adminCanInviteUsers(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_invite_users == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to use invitelinks!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };
}

export function adminCanPromoteUsers(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_promote_members == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to promote / demote members!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };
}

export function adminCanChangeInfo(handler: any) {
    return async (ctx: any) => {
        const chatMember = await ctx.chatMembers.getChatMember();
        if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator") {
            await handler(ctx);
        }
        else if (chatMember.user.id == "1087968824") {
            await handler(ctx);
        }
        else if (chatMember.status == "administrator") {
            if (chatMember.can_change_info == true) {
                await handler(ctx);
            }
            else {
                await ctx.reply("You don't have enough rights to change group information!", {reply_parameters: {message_id: ctx.message.message_id}});
            }  
        }
        else {
            await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});

        }
    };  
}

// ====================================================

// ==================== BOT STUFF ====================
export function isBotAdmin(hander: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
        if (bot_info.status == "administrator") {
                await hander(ctx);
        }
        else {
            await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
}

export function botCanRestrictUsers(hander: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanRestrictUsersCallback(hander: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanDeleteMessages(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanPinMessages(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanInviteUsers(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanPromoteMembers(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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

export function botCanChangeInfo(handler: any) {
    return async (ctx: any) => {
        let bot_id = ctx.me.id;
        let chat_id = ctx.chat.id;
        let bot_info = await ctx.chatMembers.getChatMember(chat_id, bot_id);
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
// ===================================================================

// ===================== MISCELLANEOUS STUFF =========================

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
}

async function usernameExtractor(args: string) {
    let regex = /@([a-zA-Z][a-zA-Z0-9]{4,})/g;
    let username;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(args)) !== null) {
        username = match[1];
    }
    return username;
}

async function userIdExtractor(args: string) {
    let regex = /(\b\d{9,10}\b)/g; // filter out 9 or 10 digit integers
    let user_id;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(args)) !== null) {
        user_id = match[1];
    }
    return user_id;
}

export async function getUserInstance(user: any) {
    let _user = user?.users?.[0];
    if (_user?.className === "User") {
        return _user;
    }
    else {
        return undefined;
    }
}

export async function getUserFullInstance(user: any) {
    let _user = user;
    if (_user?.fullUser.className === "UserFull") {
        return _user;
    }
    else {
        return undefined;
    }
}

export async function resolveUserhandle(userhandle: string) {
    try {
        const user = await gramjs.invoke(
            new gramJsApi.users.GetFullUser({
            id: userhandle,
            })
        );
        return user;
    }
    catch (ValueError) {
        return undefined;
    } 
        
}

export async function datacenterLocation(dcId: number | string) {
    let datacenter = dcId.toString();
    if (datacenter == "1" || datacenter == "3") {
        return `Miami, Florida, USA (<code>DC ${datacenter}</code>)`;
    }
    else if (datacenter == "2" || datacenter == "4") {
        return `Amsterdam, Netherlands, Europe (<code>DC ${datacenter}</code>)`;
    }
    else if (datacenter == "5") {
        return `Singapore, Asia (<code>DC ${datacenter}</code>)`;
    }
}

export async function extract_time(ctx: any, time_val: string) {
    const units = ["m", "h", "d"];
    const timeUnits = time_val.match(/\d+[dhm]/g); // Match any combination of digits followed by 'd', 'h', or 'm'
    
    let totalTime = 0;

    if (!timeUnits || timeUnits.some(unit => {
        const time_num = unit.slice(0, -1);
        const unitType = unit.slice(-1);
        return !/^\d+$/.test(time_num) || !units.includes(unitType);
    })) {
        await ctx.reply("Invalid time amount specified.", {reply_parameters: {message_id: ctx.message.message_id}});
        return false;
    }

    for (const timeUnit of timeUnits) {
        const unit = timeUnit.slice(-1);
        const time_num = timeUnit.slice(0, -1);
        
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
                return false;
        }
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return totalTime ? currentTime + totalTime : false;
}

export function convertUnixTime(unixTime: number): string {
    const timeDifference = unixTime - Math.floor(Date.now() / 1000);

    const days = Math.floor(timeDifference / 86400);
    const hours = Math.floor((timeDifference % 86400) / 3600);
    const minutes = Math.floor((timeDifference % 3600) / 60);
    const seconds = timeDifference % 60;

    let result = "";
    if (days) result += `${days} day(s) `;
    if (hours) result += `${hours} hour(s) `;
    if (minutes) result += `${minutes} minute(s) `;
    if (seconds) result += `${seconds} second(s)`;

    return result.trim();
}

export const sleep = promisify(setTimeout);

export async function format_json(json: any) {
    return JSON.stringify(json, null, 2);
}