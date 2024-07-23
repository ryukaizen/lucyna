import { Composer } from "grammy";
import { isUserAdmin } from "../helpers/helper_func";

const composer = new Composer();

composer.chatType(["supergroup", "group"]).command("echo", (async (ctx: any) => {
    if (ctx.message.reply_to_message) {
        let status = await isUserAdmin(ctx, ctx.from.id);
        if (status) {
            await ctx.reply(ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption, {parse_mode: "HTML"});
        }
    }
    else {
        if (ctx.match.length > 0) {
            let status = await isUserAdmin(ctx, ctx.from.id);
            if (status) {
                await ctx.reply(ctx.match, {parse_mode: "HTML"});
            }
        }
    }
}));

export default composer;