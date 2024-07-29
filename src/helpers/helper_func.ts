import constants from "../config";
import { gramjs, gramJsApi } from "../utility";
import { promisify } from 'util';

// ==================== USER STUFF ====================
export function ownerOnly(handler: any) {
    return async (ctx: any) => {
        try {
            let user = await ctx.getAuthor();
            if (ctx.from.id == constants.OWNER_ID || user.status == "creator") {
                await handler(ctx);
            }
            else {
                await ctx.reply("Only owner of this chat can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
        catch (error) {
            return;
        }
    }
}

export function ownerOnlyCallback(handler: any) {
    return async (ctx: any) => {
        try {
            let user = await ctx.getAuthor();
            if (ctx.from.id == constants.OWNER_ID || user.status == "creator") {
                await handler(ctx);
            }
            else {
                await ctx.answerCallbackQuery({ text: "Only owner of this chat can use this button!"});
            }
        }
        catch (error) {
            return;
        }
    };
}

export function superusersOnly(handler: any) {
    return async (ctx: any) => {
        try {
            if (constants.SUPERUSERS.includes(ctx.from.id) || ctx.from.id == constants.OWNER_ID) {
                await handler(ctx);
            }
            else {
                return;
            }
        }
        catch (error) {
            return;
        }
    };
}

export function elevatedUsersOnly(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
            if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator" || chatMember.status == "administrator") {
                await handler(ctx);
            } 
            else {
                await ctx.reply("Only admins can use this command.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
        catch (error) {
            return;
        }
    };
}

export function elevatedUsersCallbackOnly(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
            if (chatMember.user.id == constants.OWNER_ID || constants.SUPERUSERS.includes(chatMember.user.id) || chatMember.status == "creator" || chatMember.status == "administrator") {
                await handler(ctx);
            } 
            else {
                await ctx.answerCallbackQuery({ text: "Only admins can use this button!"});
            }
        }
        catch (error) {
            return;
        }
    };
}

export function samePersonCallbackOnly(handler: any) {
    return async (ctx: any) => {
        try {
            if (ctx.callbackQuery.message.reply_to_message?.from?.id == ctx.callbackQuery?.from?.id) {
                await handler(ctx);
            }
            else {
                await ctx.answerCallbackQuery({ text: "You can't use this button!"});
            }
        }
        catch (error) {
            return;
        }
    };
}

export async function isUserAdmin(ctx: any, user_id: any) {
    try {
        let user = await ctx.api.getChatMember(ctx.chat.id, user_id)
        if (user_id == constants.OWNER_ID || constants.SUPERUSERS.includes(user_id) || user.status == "creator" || user.status == "administrator" || user_id == "1087968824") {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        return false;
    }
}

export async function isUserCreator(ctx: any, user_id: number) {
    try {
        let user = await ctx.api.getChatMember(ctx.chat.id, user_id);
        if (user.status == "creator") {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        return false;
    }
}

// future use maybe
export async function isUserInChat(ctx: any, chat_id: string, user_id: number) {
    try {
        let user = await ctx.api.getChatMember(chat_id, user_id);
        if (user.status == "member" || user.status == "restricted" || user.status == "creator" || user.status == "administrator") {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        return false;
    }
}

export async function isUserRestricted(ctx: any, chat_id: string, user_id: number) {
    try {
        let user = await ctx.api.getChatMember(chat_id, user_id);
        if (user.status == "restricted") {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        return false;
    }
}

export async function isUserBanned(ctx: any, chat_id: string, user_id: number) {
    try {
        let user = await ctx.api.getChatMember(chat_id, user_id);
        if (user.status == "kicked") {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
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
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };
}

export function adminCanRestrictUsersCallback(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };
}

export function adminCanDeleteMessages(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };
}

export function adminCanPinMessages(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };
}

export function adminCanInviteUsers(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };
}

export function adminCanPromoteUsers(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) { 
            return;
        }
    };
}

export function adminCanChangeInfo(handler: any) {
    return async (ctx: any) => {
        try {
            const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
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
        }
        catch (error) {
            return;
        }
    };  
}

// ====================================================

// ==================== BOT STUFF ====================
export function isBotAdmin(hander: any) {
    return async (ctx: any) => {
        try {
            let bot_id = ctx.me.id;
            let chat_id = ctx.chat.id;
            let bot_info = await ctx.api.getChatMember(chat_id, bot_id);
            if (bot_info.status == "administrator") {
                    await hander(ctx);
            }
            else {
                await ctx.reply("I need to be admin for this!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }
        catch (error) {
            return;
        }
    }
}

export function botCanRestrictUsers(hander: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanRestrictUsersCallback(hander: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanDeleteMessages(handler: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanPinMessages(handler: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanInviteUsers(handler: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanPromoteMembers(handler: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}

export function botCanChangeInfo(handler: any) {
    return async (ctx: any) => {
        try {
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
        catch (error) {
            return;
        }
    }
}
// ===================================================================

// ================ OTHER HELPING FUNCTIONS STUFF ====================

export enum MessageTypes {
    TEXT = 0,
    BUTTON_TEXT = 1,
    STICKER = 2,
    DOCUMENT = 3,
    PHOTO = 4,
    AUDIO = 5,
    VOICE = 6,
    VIDEO = 7,
    VIDEO_NOTE = 8
}

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
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

export function escapeMarkdownV2(text: string): string {
    const specialCharacters = '_[]()~`>#+=|{}.!-';
    let escaped = '';
    let inCode = false;
    let inPre = false;
    let inBlockQuote = false;
    let formattingStack: string[] = [];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1] || '';
        const prevChar = text[i - 1] || '';

        if (char === '`' && nextChar === '`' && prevChar === '`' && !inCode) {
            inPre = !inPre;
            escaped += '```';
            i += 2;
            continue;
        }

        if (char === '`' && !inPre) {
            inCode = !inCode;
            escaped += '`';
            continue;
        }

        if (inCode || inPre) {
            escaped += char;
            continue;
        }

        if (char === '>' && (i === 0 || prevChar === '\n')) {
            inBlockQuote = true;
            escaped += '>';
            continue;
        }

        if (inBlockQuote && char === '\n') {
            inBlockQuote = false;
        }

        if (inBlockQuote) {
            escaped += char;
            continue;
        }

        if (char === '*' || char === '_' || char === '~' || char === '|') {
            const formattingChar = char === '|' ? '||' : char;
            if (formattingStack[formattingStack.length - 1] === formattingChar) {
                formattingStack.pop();
            } else {
                formattingStack.push(formattingChar);
            }
            escaped += char;
            continue;
        }

        if (char === '[' && text.indexOf('](', i) !== -1) {
            const closeBracket = text.indexOf('](', i);
            const closeParenthesis = text.indexOf(')', closeBracket);
            if (closeParenthesis !== -1) {
                escaped += text.slice(i, closeParenthesis + 1);
                i = closeParenthesis;
                continue;
            }
        }

        if (specialCharacters.includes(char)) {
            escaped += '\\';
        }

        escaped += char;
    }

    return escaped;
}

export async function extractButtons(text: string | undefined) {
    if (!text) {
        return { text: '', buttons: [] };
    }

    const buttonRegex = /\[([^\]]+)\]\(buttonurl:(?:\/\/)?([^)]+?)(?::same)?\)/g;
    let match;
    let buttons: { name: string; url: string; same_line: boolean }[] = [];
    let lastIndex = 0;
    let newText = '';

    while ((match = buttonRegex.exec(text)) !== null) {
        newText += text.slice(lastIndex, match.index);
        lastIndex = buttonRegex.lastIndex;

        const [fullMatch, name, url] = match;
        const same_line = fullMatch.endsWith(':same)');
        const cleanedUrl = url.startsWith('//') ? url.slice(2) : url;

        buttons.push({ name, url: cleanedUrl, same_line });
    }

    newText += text.slice(lastIndex);
    newText = newText.trim();

    return { text: newText, buttons };
}

export function iterateInlineKeyboard(inlineKeyboard: any[][]) {
    let iteratedButtons = [];
    
    for (let i = 0; i < inlineKeyboard.length; i++) {

        let row = inlineKeyboard[i];

        for (let j = 0; j < row.length; j++) {

            let button = row[j];

            iteratedButtons.push({
                name: button.text,
                url: button.url,
                same_line: j !== 0  
            });
        }
    }

    return iteratedButtons;
}

export function messageFillings(text: string, user: any, chat: any, memberCount: number): string {
    
    const replacements: { [key: string]: string } = {
        '{first}': user?.first_name || '',
        '{last}': user?.last_name || '',
        '{fullname}': `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        '{username}': user?.username ? `@${user.username}` : (user?.first_name ? `[${user.first_name}](tg://user?id=${user?.id})` : ''),
        '{mention}': user?.first_name && user?.id ? `[${user.first_name}](tg://user?id=${user.id})` : '',
        '{id}': user?.id?.toString() || '',
        '{count}': memberCount?.toString() || '',
        '{chatname}': chat?.title || ''
    };

    Object.keys(replacements).forEach(key => {
        const regex = new RegExp(escapeRegExp(key), 'g');
        text = text.replace(regex, replacements[key]);
    });

    return text;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}