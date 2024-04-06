import { bot } from "../bot";

bot.chatType("supergroup" || "group").command("test", (async (ctx: any) => {
    await ctx.api.sendMessage(ctx.chat?.id, "test")
}))