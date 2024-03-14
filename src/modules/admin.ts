import bot from "../bot";
import { InlineKeyboard } from "grammy";
import { logger, channel_log } from "../logger";
import { 
    canInviteUsers, 
    canPinMessages, 
    canPromoteMembers,
    checkElevatedUser,
    checkElevatedUserFrom,
    elevatedUsersOnly, 
    samePersonCallbackOnly, 
    userInfo
} from "../helpers/helper_func";

const promote = {
    can_manage_chat: true,
    can_delete_messages: true,
    can_manage_video_chats: true,
    can_restrict_members: true,
    can_change_info: true,
    can_invite_users: true,
    can_post_stories: true,
    can_edit_stories: true,
    can_delete_stories: true,
    can_pin_messages: true
}

const demote = {
    can_manage_chat: false,
    can_delete_messages: false,
    can_manage_video_chats: false,
    can_restrict_members: false,
    can_change_info: false,
    can_invite_users: false,
    can_post_stories: false,
    can_edit_stories: false,
    can_delete_stories: false,
    can_pin_messages: false
}

bot.chatType("supergroup" || "group").command("pin", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to pin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message == undefined) {
            await ctx.reply("Reply to a message to pin it.", {reply_parameters: {message_id: ctx.message.message_id}});
            return;
        }

        if (ctx.match == "silent" || ctx.match == "quiet" || ctx.match == "noalert") {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: true});
        }
        else if (ctx.match == "alert" || ctx.match == "loud") {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: false});
        }
        else {
            await ctx.api.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id, {disable_notification: true});   
        }
    }
})));

bot.chatType("supergroup" || "group").command("unpin", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to unpin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message == undefined) {
            await ctx.api.unpinChatMessage(ctx.chat.id)
                .then(ctx.reply("Unpinned the most recent pinned message!", {reply_parameters: {message_id: ctx.message.message_id}}))
                .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")});
        }
        else {
            await ctx.api.unpinChatMessage(ctx.chat.id, {message_id: ctx.message.reply_to_message.message_id})
                .then(ctx.reply("Unpinned the message successfully!", {reply_parameters: {message_id: ctx.message.message_id}}))
                .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")});
        }
    }
})));

bot.chatType("supergroup" || "group").command("unpinall", elevatedUsersOnly(canPinMessages(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_pin_messages == false) {
        await ctx.reply("You don't have enough rights to unpin messages!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        await ctx.api.unpinAllChatMessages(ctx.chat.id)
            .then(ctx.editMessageText("Unpinned all the messages successfully!"))
            .catch((GrammyError: any) => {ctx.editMessageText("Failed to unpin messages: invalid message / message probably does not exist.")});
        // let confirmUnpin = new InlineKeyboard()
            // .text("Yes", "yes-unpin")
            // .text("No", "no-unpin");

        // await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to unpin <b>ALL the pinned messages</b> in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmUnpin, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
    }
})));
    
// bot.callbackQuery("yes-unpin", samePersonCallbackOnly(async(ctx: any) => {
//         await ctx.api.unpinAllChatMessages(ctx.chat.id)
//             .then(ctx.editMessageText("Unpinned all the messages successfully!"))
//             .catch((GrammyError: any) => {ctx.editMessageText("Failed to unpin messages: invalid message / message probably does not exist.")});
// }));
    
// bot.callbackQuery("no-unpin", samePersonCallbackOnly(async(ctx: any) => {
//         await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
// }));

bot.chatType("supergroup" || "group").command("invitelink", elevatedUsersOnly(canInviteUsers(async(ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_invite_users == false) {
        await ctx.reply("You don't have enough rights to use invitelinks!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        let invitelink = await ctx.api.exportChatInviteLink(ctx.chat.id) 
        await ctx.reply(`New invitelink: ${invitelink}`, {reply_parameters: {message_id: ctx.message.message_id}})
    }
})));

bot.chatType("supergroup" || "group").command("promote", elevatedUsersOnly(canPromoteMembers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_promote_members == false) {
        await ctx.reply("You don't have enough rights to promote members!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("I already am an admin, good sir/ma'am.", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("You already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.reply("They already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
            }
            else {
                await ctx.api.promoteChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, promote)
                .then(() => {
                    ctx.reply(`Promoted <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
                    {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   

                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to promote the user, they can be promoted manually.");
                    logger.error(`${GrammyError}`);
                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                });
            }   
        }
        else {
            let args = ctx.match;
            if (args) {
                let split_args = args.split(" ");
                let user_id = split_args[0];
                let user_info =  await ctx.getChatMember(user_id)
                    .catch((GrammyError: any) => {
                        return;
                    });
                if (user_info != undefined) {
                    if (user_info.user.id == bot.botInfo.id) {
                        await ctx.reply("I already am an admin, good sir/ma'am.", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("You already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.reply("They already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                    else {
                        await ctx.api.promoteChatMember(ctx.chat.id, user_info.user.id, promote)
                        .then(() => {
                            ctx.reply(`Promoted <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
                            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to promote the user, they can be promoted manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the user ID next to /promote command or reply to a message with /promote command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
})));

bot.chatType("supergroup" || "group").command("demote", elevatedUsersOnly(canPromoteMembers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_promote_members == false) {
        await ctx.reply("You don't have enough rights to demote members!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("Heyy noooo!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("Ask an admin who promoted you!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
            else if (await checkElevatedUser(ctx) == true) {
                await ctx.api.promoteChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, demote)
                .then(() => {
                    ctx.reply(`Demoted <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
                    {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   

                })
                .catch((GrammyError: any) => {
                    ctx.reply("Failed to demote the user, they can be demoted manually.");
                    logger.error(`${GrammyError}`);
                    channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                });
            }
            else {
                await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});

            }   
        }
        else {
            let args = ctx.match;
            if (args) {
                let split_args = args.split(" ");
                let user_id = split_args[0];
                let user_info =  await ctx.getChatMember(user_id)
                    .catch((GrammyError: any) => {
                        return;
                    });
                if (user_info != undefined) {
                    if (user_info.user.id == bot.botInfo.id) {
                        await ctx.reply("Heyy noooo!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (user_info.user.id == ctx.from.id) {
                        await ctx.reply("Ask the admin who promoted you!", {reply_parameters: {message_id: ctx.message.message_id}});
                        return;
                    }
                    else if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.api.promoteChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, demote)
                        .then(() => {
                            ctx.reply(`Demoted <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
                            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
        
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to demote the user, they can be demoted manually.");
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                    else {
                        await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   

                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the user ID next to /demote command or reply to a message with /demote command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
})));

bot.chatType("supergroup" || "group").command("title", elevatedUsersOnly(canPromoteMembers(async (ctx: any) => {
    let user_info = await userInfo(ctx);
    if (user_info.can_promote_members == false) {
        await ctx.reply("You don't have enough rights to set custom admin title!", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (await checkElevatedUser(ctx) == true) {
                    if (ctx.match) {
                        let title_string = ctx.match.substring(0, 16)
                        await ctx.api.setChatAdministratorCustomTitle(ctx.chat.id, ctx.message.reply_to_message.from.id, title_string)
                        .then(() => {
                            ctx.reply(`Custom title for admin <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) is set to <code>${title_string}</code>!`, 
                            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to set admin title, it can be done manually.", {reply_parameters: {message_id: ctx.message.message_id}});
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                    else {
                        await ctx.reply("Did you forget to provide me the title?", {reply_parameters: {message_id: ctx.message.message_id}});
                    }
            }
            else {
                await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});

            }   
        }
        else {
            let args = ctx.match;
            if (args) {
                let split_args = args.split(" ");
                let user_id = split_args[0];
                let title_string = split_args[1].substring(0, 16)
                let user_info =  await ctx.getChatMember(user_id)
                    .catch((GrammyError: any) => {
                        return;
                    });
                if (user_info != undefined) {
                    if (await checkElevatedUserFrom(ctx, user_info) == true) {
                        await ctx.api.promoteChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, demote)
                        .then(() => {
                            ctx.reply(`Custom title for admin <a href="tg://user?id=${user_info.user.id}">${user_info.user.first_name}</a> (<code>${user_info.user.id}</code>) is set to <code>${title_string}</code>!`, 
                            {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
                        })
                        .catch((GrammyError: any) => {
                            ctx.reply("Failed to set admin title, it can be done manually.", {reply_parameters: {message_id: ctx.message.message_id}});
                            logger.error(`${GrammyError}`);
                            channel_log(`${GrammyError}\n\n` + `Timestamp: ${new Date().toLocaleString()}\n\n` + `Update object:\n${JSON.stringify(ctx.update,  null, 2)}`)
                        });
                    }
                    else {
                        await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
                    }
                }
                else {
                    await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }       
            else {        
                await ctx.reply("Please type the new admin title next to /title command as a reply to a message, or /title <user handle> <admin title>", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
})));