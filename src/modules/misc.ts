import bot from "../bot";

bot.command("ping", (async (ctx: any) => {
    let start = Date.now();
    await ctx.api.sendDice(ctx.chat.id, {emoji: "🎰"});
    let end = Date.now();
    let time = end - start;
    await ctx.reply(`Response time: ${time}ms`);
}));
