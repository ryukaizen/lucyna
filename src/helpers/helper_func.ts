import constants from "../config";

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
}

export function superusersOnly(handler: any) {
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