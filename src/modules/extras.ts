import { Composer } from "grammy";
import axios from "axios";

const composer = new Composer();

composer.command("date", (async (ctx: any) => {
    let now = new Date();
    
    let options: Intl.DateTimeFormatOptions = {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };

    let detailedDate = now.toLocaleDateString('en-US', options);
    let timestamp = now.toISOString();

    let startOfYear = new Date(now.getFullYear(), 0, 1);
    let dayOfYear = Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000);
    let weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

    let dateMessage = `
        <b>Today is:</b> ${detailedDate}
<b>Timestamp:</b> ${timestamp}
<b>Week Number:</b> ${weekNumber}
<b>Day of the Year:</b> ${dayOfYear}
<b>Timezone:</b> ${Intl.DateTimeFormat().resolvedOptions().timeZone}
<b>UTC Offset:</b> ${now.getTimezoneOffset() / -60} hours
    `;

    await ctx.reply(dateMessage, { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
}));

composer.command("ud", async (ctx: any) => {
    let text = ctx.match.toLowerCase();

    if (!text) {
        await ctx.reply("Please enter keywords to search!",  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        return;
    }

    if (text === "sheetal") {
        await ctx.reply("<tg-spoiler><i>More than just a dream.</i></tg-spoiler>\n\nhttps://www.youtube.com/watch?v=Z4mbxaa3XL8",  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        return;
    }

    try {
        let response = await axios.get(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(text)}`);
        let results = response.data;

        if (results.list && results.list.length > 0) {
            let replyText = `<b>Word:</b> ${text}\n<b>Definition:</b> ${results.list[0].definition}`;
            replyText += `\n\n<i>Example: ${results.list[0].example}</i>`;

            replyText = replyText.replace(/[\[\]]/g, "");

            if (replyText.length >= 4096) {
                replyText = replyText.slice(0, 4096);
            }

            await ctx.reply(replyText,  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        } 
        else {
            await ctx.reply(`<b>Word:</b> ${text}\nResults: Sorry could not find any matching results!`,  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
        }
    } 
    catch (error) {
        console.error("Error fetching Urban Dictionary definition:", error);
        await ctx.reply("An error occurred while fetching the definition. Please try again later.",  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
    }
});

export default composer;