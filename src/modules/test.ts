import { bot } from "../bot";
import { MyContext } from "../bot";
import { Composer } from "grammy";

const composer = new Composer();
// 
composer.chatType("supergroup" || "group").command("test", (async (ctx: any) => {
    await ctx.api.sendMessage(ctx.chat?.id, "test")
}));

export default composer;
// 

// bot.command("test", (async (ctx: any) => {
    // await ctx.api.sendMessage(ctx.chat?.id, "test")
// }))
// 