import { personal, group } from "../bot"

personal.command("start", async(ctx) => {
    await ctx.reply("ALIVE")

});

group.command("start", async(ctx) => {
    await ctx.reply("ALIVE")
})

