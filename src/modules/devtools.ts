import { Composer } from "grammy";
import { superusersOnly } from "../helpers/helper_func";
import { grammyErrorLog } from "../logger";

const composer = new Composer();

composer.chatType(["supergroup", "group", "private"]).command("snipe", superusersOnly(async (ctx: any) => {
    let args = ctx.match;
    let split_args = args.split(" ");
    let chat_id = split_args[0];
    let text = split_args.slice(1).join(" ");

    if (chat_id && text) {
        await ctx.api.sendMessage(chat_id, text, {parse_mode: "HTML"})
        .then(() => {
            ctx.reply(`Succcc-cess!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        })
        .catch((GrammyError: any) => {
            ctx.reply("Lmao error. Check logs dawg.");
            grammyErrorLog(ctx, GrammyError);
        })
    }
}));

export default composer;
