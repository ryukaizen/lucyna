import bot, { personal, group } from "../bot"

personal.command("p", async(ctx) => {
    await bot.api.sendMessage(ctx.chat.id, "test")
});

group.command("start", async(ctx) => {
    await ctx.reply("ALIVE")
})