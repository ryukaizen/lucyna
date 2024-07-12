import { gramjs, gramJsApi } from "../utility";
import { resolveUserhandle, getUserInstance, getUserFullInstance, datacenterLocation } from "../helpers/helper_func"
import { Composer } from "grammy";

const composer = new Composer();

// TODO: SEND PROFILE PICTURE AS DOCUMENT IN GROUP CHATS (userInfoPublic)
async function userInfoPublic(ctx: any, user_id: string) {
    let user = await resolveUserhandle(user_id);
    let userfull = await getUserFullInstance(user);
    let userinstance = await getUserInstance(user);
    
    let photos = await gramjs.invoke(new gramJsApi.photos.GetUserPhotos({
        userId: userinstance.id,
        offset:0,
        limit:1,
    }));

    // Name
    let message_body = `<b>Name</b>: ${userinstance.firstName} `;
    if (userinstance.lastName) {
        message_body += userinstance.lastName;
    };
    
    // Username
    if (userinstance.username) {
        message_body += `\n<b>Username</b>: @${userinstance.username}`;
    };

    // Multiple usernames (for rich kids)
    if (userinstance.usernames) {
        message_body += `\n<b>Usernames</b>:`;
        userinstance.usernames.forEach(async(user: any) => message_body += (`\n - @${user.username}`))
    }

    // User ID
    message_body += `\n<b>ID</b>: <code>${userinstance.id}</code>`;

    // User bio
    if (userfull.fullUser.about) {
        message_body += `\n<b>Bio</b>: <code>${userfull.fullUser.about}</code>`;
    };
    
    
    // Datacenter
    if (userinstance.photo != null) {
        let datacenter = await datacenterLocation(userinstance.photo.dcId);;
        message_body += `\n<b>Datacenter</b>: ${datacenter}`;
    };

    // if (userinstance.phone) {
    //     message_body += `\n<b>Phone</b>: +${userinstance.phone}`;
    // };

    // Premium status
    let premium_status;
    if (userinstance.premium) {
        premium_status = "🌟 Premium Account";
    }
    else {
        premium_status = "Non-Premium Account";
    }
    message_body += `\n<b>Premium</b>: ${premium_status}`;

    // Profile picture count
    let photos_string = JSON.stringify(photos);
    let regex = /"count"\s*:\s*(\d+)/;
    let match = photos_string.match(regex);
    if (match && match[1]) {
        let count = parseInt(match[1]);
            message_body += `\n<b>Profile Photo Count</b>: <code>${count}</code>`;
    } 

    // User mention
    message_body += `\n<b>Permalink</b>: <a href="tg://user?id=${userinstance.id}">User Profile</a>`;

    await gramjs.sendMessage(ctx.chat.id, {
        file:photos.photos[0], message: message_body, parseMode: "html"
    });
}
 
async function userInfoPrivate(ctx: any, user_id: string) {
    let user = await resolveUserhandle(user_id);
    let userfull = await getUserFullInstance(user);
    let userinstance = await getUserInstance(user);
    
    let photos = await gramjs.invoke(new gramJsApi.photos.GetUserPhotos({
        userId: userinstance.id,
        offset:0,
        limit:1,
    }));

    // Name
    let message_body = `<b>Name</b>: ${userinstance.firstName} `;
    if (userinstance.lastName) {
        message_body += userinstance.lastName;
    };
    
    // Username
    if (userinstance.username) {
        message_body += `\n<b>Username</b>: @${userinstance.username}`;
    };

    // Multiple usernames (for rich kids)
    if (userinstance.usernames) {
        message_body += `\n<b>Usernames</b>:`;
        userinstance.usernames.forEach(async(user: any) => message_body += (`\n - @${user.username}`))
    }

    // User ID
    message_body += `\n<b>ID</b>: <code>${userinstance.id}</code>`;
    
    // User bio
    if (userfull.fullUser.about) {
        message_body += `\n<b>Bio</b>: ${userfull.fullUser.about}`;
    };

    // Datacenter
    if (userinstance.photo != null) {
        let datacenter = await datacenterLocation(userinstance.photo.dcId);;
        message_body += `\n<b>Datacenter</b>: ${datacenter}`;
    };

    // Phone no. (Only to be shown in bot's DM)
    if (userinstance.phone) {
        message_body += `\n<b>Phone</b>: +${userinstance.phone}`;
    };

    // Premium status
    let premium_status;
    if (userinstance.premium) {
        premium_status = "🌟 Premium Account";
    }
    else {
        premium_status = "Non-Premium Account";
    }
    message_body += `\n<b>Premium</b>: ${premium_status}`;

    // Profile picture count
    let photos_string = JSON.stringify(photos);
    let regex = /"count"\s*:\s*(\d+)/;
    let match = photos_string.match(regex);
    if (match && match[1]) {
        let count = parseInt(match[1]);
            message_body += `\n<b>Profile Photo Count</b>: <code>${count}</code>`;
    }   
    
    // User mention
    message_body += `\n<b>Permalink</b>: <a href="tg://user?id=${userinstance.id}">User Profile</a>`;

    await gramjs.sendMessage(ctx.chat.id, {
        file:photos.photos[0], message: message_body, parseMode: "html"
    });
}

async function fetchId(ctx: any) {
    let chat_id = ctx.chat.id;
    let message_id = ctx.message.message_id;
    let user_id = ctx.from.id;
    let response = (
        `<b>Your ID :</b> <code>${user_id}</code>` +
        `<b>\nChat ID :</b> <code>${chat_id}</code>`
    );
    if (ctx.message.reply_to_message != undefined) {
        let replied_to_user_id = ctx.message.reply_to_message.from.id;
        let replied_to_message_id = ctx.message.reply_to_message.message_id;

        if (ctx.message.reply_to_message.forward_origin) {
            if (ctx.message.reply_to_message?.forward_origin?.type == "user") {
                replied_to_user_id = ctx.message.reply_to_message?.forward_origin?.sender_user?.id
                response += `\n<b>Replied user's ID :</b> <code>${replied_to_user_id}</code>`;
            }
            else if (ctx.message.reply_to_message?.forward_origin?.type == "chat") {
                replied_to_user_id = ctx.message.reply_to_message?.forward_origin?.sender_chat?.id
                response += `\n<b>Replied chat's ID :</b> <code>${replied_to_user_id}</code>`;
            }
            else if (ctx.message.reply_to_message?.forward_origin?.type == "channel") {
                replied_to_user_id = ctx.message.reply_to_message?.forward_origin?.chat?.id
                response += `\n<b>Replied channel's ID :</b> <code>${replied_to_user_id}</code>`;
            }
            else {
                response += `\n<b>Replied user's ID :</b> hidden <b>(forward privacy)</b>`;
            }
        }

        response += `\n<b>Replied message ID :</b> <code>${replied_to_message_id}</code>`;
   
    }
    else {
        response += `<b>\nMessage ID :</b> <code>${message_id}</code>` 
    }

    if (ctx.match) {
        let user = await resolveUserhandle(ctx.match);
        if (user != undefined) {
            let userInstance = await getUserInstance(user);
            let user_id = Number(user?.fullUser?.id)
            response = `\n<b>${userInstance.firstName}'s ID is:</b> <code>${user_id}</code>`;
        }

    }
    await ctx.api.sendMessage(ctx.chat.id, response, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}

composer.chatType(["supergroup", "group"]).command("info", (async (ctx: any) => {
    if (ctx.message.reply_to_message) {
        let user_id = ctx.message.reply_to_message.from.id;
        if (ctx.message.reply_to_message?.forward_origin) {
            if (ctx.message.reply_to_message?.forward_origin?.type == "user") {
                await userInfoPublic(ctx, ctx.message.reply_to_message?.forward_origin?.sender_user?.id);
            }
            else if (ctx.message.reply_to_message?.forward_origin?.type == "chat") {
                await userInfoPublic(ctx, ctx.message.reply_to_message?.forward_origin?.sender_chat?.id);
            }
            else if (ctx.message.reply_to_message?.forward_origin?.type == "channel") {
                await userInfoPublic(ctx, ctx.message.reply_to_message?.forward_origin?.chat?.id)
                
            }
            else if (ctx.message.reply_to_message?.forward_origin?.type == "hidden_user") {
                await ctx.reply(`The original sender (${ctx.message.reply_to_message?.forward_origin?.sender_user_name}) of that message has forward privacy enabled >_<`, {reply_parameters: {message_id: ctx.message.message_id}})
            }
        }
        else {
            await userInfoPublic(ctx, user_id)
        }
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {})
            if (user) {
                let userinstance = await getUserInstance(user);
                await userInfoPublic(ctx, userinstance.id);
            }
            else {
                await ctx.reply("Couldn't find entity for the given user-handle.\n\n<i>Tip: Consider providing their username instead for better results.</i>", {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"})
            }
        }
        else {
            let user_id = ctx.from.id;
            await userInfoPublic(ctx, user_id);
        }
    }
}));

composer.chatType(["supergroup", "group"]).command("id", (async (ctx: any) => {
    await fetchId(ctx);
}));

composer.chatType("private").command("info", (async (ctx: any) => {
    if (ctx.message.reply_to_message != undefined) {
        let user_id = ctx.message.reply_to_message.from.id;
        await userInfoPrivate(ctx, user_id);
    }
    else {
        let args = ctx.match;
        if (args) {
            let split_args = args.split(" ");
            let userhandle = split_args[0];
            let user =  await resolveUserhandle(userhandle).catch(() => {});
            if (user != undefined) {
                let userinstance = await getUserInstance(user);
                await userInfoPrivate(ctx, userinstance.id);
            }
        }
        else {
            let user_id = ctx.from.id;
            await userInfoPrivate(ctx, user_id);
        }
    }
}));

composer.chatType("private").command("id", (async (ctx: any) => {
    await fetchId(ctx);
}));

export default composer;