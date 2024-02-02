import constants from "../config";

export function typingAction(handler: any) {
    return async (ctx: any) => {
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        await handler(ctx);
    };
}

export function ownerOnlyCommand(handler: any) {
    return async (ctx: any) => {
        if (ctx.from.id == constants.OWNER_ID) {
            await handler(ctx);
        }
    };
}
