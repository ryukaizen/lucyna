import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import { bot } from "../bot";
import { Composer, InlineKeyboard, InputFile } from "grammy";
import { grammyErrorLog } from "../logger";
import { 
    adminCanPinMessages,
    adminCanInviteUsers,
    adminCanPromoteUsers,
    adminCanChangeInfo,
    botCanInviteUsers, 
    botCanPinMessages, 
    botCanPromoteMembers,
    botCanChangeInfo,
    elevatedUsersOnly, 
    samePersonCallbackOnly, 
    isBotAdmin,
    resolveUserhandle,
    getUserInstance,
    isUserAdmin,
    isUserCreator
} from "../helpers/helper_func";

const composer = new Composer();

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

async function pin(ctx: any) {
    if (ctx.message.reply_to_message != undefined) {
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
    else {
        await ctx.reply("Reply to a message to pin it.", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}

async function unpin(ctx: any) {
    if (ctx.message.reply_to_message != undefined) {
        await ctx.api.unpinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id)
            .then(ctx.reply("Unpinned the message successfully!", {reply_parameters: {message_id: ctx.message.message_id}}))
            .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")}); 
    }
    else {
        await ctx.api.unpinChatMessage(ctx.chat.id)
            .then(ctx.reply("Unpinned the most recent pinned message!", {reply_parameters: {message_id: ctx.message.message_id}}))
            .catch((GrammyError: any) => {ctx.reply("Failed to unpin message: invalid message / message probably does not exist.")});   
    }
}

async function unpinall(ctx: any) {
    await ctx.api.unpinAllChatMessages(ctx.chat.id)
    .then(ctx.editMessageText("Unpinned all the messages successfully!"))
    .catch((GrammyError: any) => {ctx.editMessageText("Failed to unpin messages: invalid message / message probably does not exist.")});
// let confirmUnpin = new InlineKeyboard()
    // .text("Yes", "yes-unpin")
    // .text("No", "no-unpin");
// await ctx.api.sendMessage(ctx.chat.id, "Are you sure you want to unpin <b>ALL the pinned messages</b> in this chat?\n\n<i>This action cannot be undone.</i>", {reply_markup: confirmUnpin, reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"}); 
}

async function invitelink(ctx: any) {
    let invitelink = await ctx.api.exportChatInviteLink(ctx.chat.id) 
    await ctx.reply(`New invitelink: ${invitelink}`, {reply_parameters: {message_id: ctx.message.message_id}});
}

async function promoteUser(ctx: any, user_id: number | string, first_name: string) {
    await ctx.api.promoteChatMember(ctx.chat.id, user_id, promote)
    .then(() => {
        ctx.reply(`Promoted <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
        {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to promote the user, they can be promoted manually.");
        grammyErrorLog(ctx, GrammyError);
    });
}

async function demoteUser(ctx: any, user_id: number | string, first_name: string) {
    await ctx.api.promoteChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id, demote)
    .then(() => {
        ctx.reply(`Demoted <a href="tg://user?id=${user_id}">${first_name}</a> (<code>${user_id}</code>) by <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>!`, 
        {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to demote the user, they can be demoted manually.");
        grammyErrorLog(ctx, GrammyError);
    });
} 

async function title(ctx: any, user_id: number | string, first_name: string, admin_title: string) {
    let title_string = admin_title.substring(0, 16)
    await ctx.api.setChatAdministratorCustomTitle(ctx.chat.id, user_id, title_string)
    .then(() => {
        ctx.reply(`Custom title for admin <a href="tg://user?id=${ctx.message.reply_to_message.from.id}">${ctx.message.reply_to_message.from.first_name}</a> (<code>${ctx.message.reply_to_message.from.id}</code>) is set to <code>${title_string}</code>!`, 
        {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to set admin title, it can be done manually.", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

async function setGroupPic(ctx: any, file_id: string) {
    let file = await ctx.api.getFile(file_id);
    let file_path = await file.download();

    if (ctx.message.reply_to_message.sticker) {
        const resizedFilePath = path.join(__dirname, 'resized-photo.jpg');
        await sharp(file_path)
            .resize({ width: 512, height: 512, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile(resizedFilePath);
        file_path = resizedFilePath;
    }

    const fileObject = new InputFile(file_path)
    await ctx.api.setChatPhoto(ctx.chat.id, fileObject)
    .then(() => {
        ctx.reply("Group profile picture updated successfully!", {reply_parameters: {message_id: ctx.message.message_id}});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to update group profile picture, make sure the image size is not too big.", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

async function removeGroupPic(ctx: any) {
    await ctx.api.deleteChatPhoto(ctx.chat.id)
    .then(() => {
        ctx.reply("Group profile picture deleted successfully!", {reply_parameters: {message_id: ctx.message.message_id}});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to delete group profile picture.", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

async function setGroupTitle(ctx:any, title: string) {
    let title_string = title.substring(1, 128)
    await ctx.api.setChatTitle(ctx.chat.id, title_string)
    .then(() => {
        ctx.reply(`Group title is set to <code>${title_string}</code>!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to set group title, it can be done manually.", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

async function setGroupDesc(ctx: any, desc: string) {
    let desc_string = desc.substring(0, 255)
    await ctx.api.setChatDescription(ctx.chat.id, desc_string)
    .then(() => {
        ctx.reply(`Successfully set group description!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to set group description, it can be done manually.", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

async function setGroupSticker(ctx: any) {
    if (ctx.message.reply_to_message) {
        await ctx.api.setChatTitle(ctx.chat.id, ctx.message.reply_to_message.sticker.set_name)
        .then(() => {
            ctx.reply(`Group stickerpack is set to <code>${ctx.message.reply_to_message.sticker.set_name}</code>!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
        })
        .catch((GrammyError: any) => {
            ctx.reply("Failed to set group stickerpack!", {reply_parameters: {message_id: ctx.message.message_id}});
            grammyErrorLog(ctx, GrammyError);
        });
    }
    else {
        await ctx.reply("You need to reply to some sticker to set chat sticker set!", {reply_parameters: {message_id: ctx.message.message_id}});
    }
}

async function removeGroupSticker(ctx: any) {
    await ctx.api.deleteChatStickerSet(ctx.chat.id)
    .then(() => {
        ctx.reply("Removed group's stickerpack for everyone!", {reply_parameters: {message_id: ctx.message.message_id}});
    })
    .catch((GrammyError: any) => {
        ctx.reply("Failed to remove group stickerpack!", {reply_parameters: {message_id: ctx.message.message_id}});
        grammyErrorLog(ctx, GrammyError);
    });
}

composer.chatType(["supergroup", "group"]).command("pin", adminCanPinMessages(botCanPinMessages(async(ctx: any) => {
    await pin(ctx)
})));

composer.chatType(["supergroup", "group"]).command("unpin", adminCanPinMessages(botCanPinMessages(async(ctx: any) => {
    await unpin(ctx);
})));

composer.chatType(["supergroup", "group"]).command("unpinall", adminCanPinMessages(botCanPinMessages(async(ctx: any) => {
    await unpinall(ctx);
})));
    
composer.chatType(["supergroup", "group"]).command("invitelink", adminCanInviteUsers(botCanInviteUsers(async(ctx: any) => {
    await invitelink(ctx);
})));

composer.chatType(["supergroup", "group"]).command("promote", adminCanPromoteUsers(botCanPromoteMembers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("I already am an admin, good sir/ma'am.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("You already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == "1087968824") {
            await ctx.reply("Cannot promote anonymous admin, they already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserCreator(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Nuh huh, it's the owner of the chat!", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("They already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else {
            await promoteUser(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
            if (ctx.match) {
                await ctx.api.setChatAdministratorCustomTitle(ctx.chat.id, ctx.message.reply_to_message.from.id, ctx.match);
 
            }
        }   
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    await ctx.reply("I already am an admin, good sir/ma'am.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("You already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == 1087968824) {
                    await ctx.reply("Cannot promote anonymous admin, they already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserCreator(ctx, user_id)) {
                    await ctx.reply("Nuh huh, it's the owner of the chat!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    await ctx.reply("They already are an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else {
                    await promoteUser(ctx, user_id, userInstance.firstName);
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }       
        else {        
            await ctx.reply("Please type the user ID next to /promote command or reply to a message with /promote command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("demote", adminCanPromoteUsers(botCanPromoteMembers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
            await ctx.reply("Heyy noooo!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
            await ctx.reply("Ask an admin who promoted you!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (ctx.message.reply_to_message.from.id == "1087968824") {
            await ctx.reply("Cannot demote anonymous admin this way! Do it manually.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserCreator(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Nuh huh, it's the owner of the chat!", {reply_parameters: {message_id: ctx.message.message_id}});   
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
            await demoteUser(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name);
        }
        else {
            await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});
        }   
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (user_id == bot.botInfo.id) {
                    await ctx.reply("Heyy noooo!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == ctx.from.id) {
                    await ctx.reply("Ask the admin who promoted you!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (user_id == 1087968824) {
                    await ctx.reply("Cannot demote anonymous admin this way! Do it manually.", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserCreator(ctx, user_id)) {
                    await ctx.reply("Nuh huh, it's the owner of the chat!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
                else if (await isUserAdmin(ctx, user_id)) {
                    await demoteUser(ctx, user_id, userInstance.firstName);
                }
                else {
                    await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }       
        else {        
            await ctx.reply("Please type the user ID next to /demote command or reply to a message with /demote command.", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));

composer.chatType(["supergroup", "group"]).command("title", adminCanPromoteUsers(botCanPromoteMembers(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        if (await isUserCreator(ctx, ctx.message.reply_to_message.from.id)) {
            await ctx.reply("Only owners can change their title themselves, that too manually!", {reply_parameters: {message_id: ctx.message.message_id}});
        }
        else if (await isUserAdmin(ctx, ctx.message.reply_to_message.from.id)) {
                if (ctx.match) {
                   await title(ctx, ctx.message.reply_to_message.from.id, ctx.message.reply_to_message.from.first_name, ctx.match); 
                }
                else {
                    await ctx.reply("Did you forget to provide the title?", {reply_parameters: {message_id: ctx.message.message_id}});
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
            let userhandle = split_args[0];
            let admin_title = split_args[1];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userInstance = await getUserInstance(user);
                let user_id = Number(user?.fullUser?.id)
                if (await isUserCreator(ctx, user_id)) {
                    await ctx.reply("Only owners can change their title themselves, that too manually!", {reply_parameters: {message_id: ctx.message.message_id}});
                }
                else if (await isUserAdmin(ctx, user_id)) {
                   await title(ctx, user_id, userInstance.firstName, admin_title); 
                }
                else {
                    await ctx.reply("They are NOT an admin!", {reply_parameters: {message_id: ctx.message.message_id}});   
                }
            }
            else {
                await ctx.reply("The provided user ID seems to be invalid!", {reply_parameters: {message_id: ctx.message.message_id}});
            }
        }       
        else {        
            await ctx.reply("Please type the new admin title next to /title command as a reply to a message, or /title <user handle> <admin title>", {reply_parameters: {message_id: ctx.message.message_id}});
        }
    }
})));


composer.chatType(["supergroup", "group"]).command(["setgpic", "setgpfp"], adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let pic_id: string;
        let sticker_id: string;
        if (ctx.message.reply_to_message.photo) {
            pic_id = ctx.message.reply_to_message.photo[2].file_id;
            await setGroupPic(ctx, pic_id)
        }
        else if (ctx.message.reply_to_message.document) {
            pic_id = ctx.message.reply_to_message.document.file_id;
            await setGroupPic(ctx, pic_id)
        }
        else if (ctx.message.reply_to_message.sticker) {
            if (ctx.message.reply_to_message.sticker.is_animated == false && ctx.message.reply_to_message.sticker.is_video == false) {
                sticker_id = ctx.message.reply_to_message.sticker.file_id;
                await setGroupPic(ctx, sticker_id)
            }
            else {
                await ctx.reply("Only static stickers are supported for group profile picture!", {reply_parameters: {message_id: ctx.message.message_id}})
            }
        }
        else {
            await ctx.reply("You can only set an image as chat profile picture!", {reply_parameters: {message_id: ctx.message.message_id}})
        }
    }
    else {        
        await ctx.reply("Please reply to an image with /setgpic command to set it as a profile picture for this group.", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));

composer.chatType(["supergroup", "group"]).command(["delgpic", "delgpfp", "rmgpic", "rmgpfp"], adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    await removeGroupPic(ctx);
})));

composer.chatType(["supergroup", "group"]).command("setgtitle", adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    if (ctx.match) {
        await setGroupTitle(ctx, ctx.match)
    }
    else if (ctx.message.reply_to_message) {
        await setGroupTitle(ctx, ctx.message.reply_to_message.text)
    }
    else {
        await ctx.reply("Did you forget to provide the title?", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));

composer.chatType(["supergroup", "group"]).command(["setgdesc", "setdescription"], adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    if (ctx.match) {
        await setGroupDesc(ctx, ctx.match)
    }
    else if (ctx.message.reply_to_message) {
        await setGroupDesc(ctx, ctx.message.reply_to_message.text)
    }
    else {
        await ctx.reply("Did you forget to provide the title?", {reply_parameters: {message_id: ctx.message.message_id}});
    }
})));

composer.chatType(["supergroup", "group"]).command(["setgsticker", "setsticker"], adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    await setGroupSticker(ctx);
})));

composer.chatType(["supergroup", "group"]).command(["delgsticker", "delsticker", "rmgsticker", "rmsticker"], adminCanChangeInfo(botCanChangeInfo(async (ctx: any) => {
    await removeGroupSticker(ctx);
})));

// composer.chatType(["supergroup", "group"]).command(["admincache", "reload"], elevatedUsersOnly(isBotAdmin(async (ctx: any) => {

// })));

// composer.callbackQuery("yes-unpin", samePersonCallbackOnly(async(ctx: any) => {
//         await ctx.api.unpinAllChatMessages(ctx.chat.id)
//             .then(ctx.editMessageText("Unpinned all the messages successfully!"))
//             .catch((GrammyError: any) => {ctx.editMessageText("Failed to unpin messages: invalid message / message probably does not exist.")});
// }));
   
// composer.callbackQuery("no-unpin", samePersonCallbackOnly(async(ctx: any) => {
//         await ctx.editMessageText("Okay fine. Tell me when you change your mind!", { parse_mode: "HTML" });
// }));

export default composer;