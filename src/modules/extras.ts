import { Composer } from "grammy";
//import { translate } from '@vitalets/google-translate-api';
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

// composer.command("weather", async (ctx: any) => {
//     let location = ctx.message.text.split(" ").slice(1).join(" ");

//     if (!location) {
//         await ctx.reply("Please enter a location to get the weather!",  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
//         return;
//     }

//     try {
//         let response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
//         let data = response.data;

//         let weatherMessage = `
// <b>Location:</b> ${data.name}, ${data.sys.country}
// <b>Weather:</b> ${data.weather[0].description}
// <b>Temperature:</b> ${data.main.temp}°C
// <b>Feels Like:</b> ${data.main.feels_like}°C
// <b>Humidity:</b> ${data.main.humidity}%
// <b>Wind Speed:</b> ${data.wind.speed} m/s
// <b>Visibility:</b> ${data.visibility} meters
// <b>Cloudiness:</b> ${data.clouds.all}%
// <b>Sunrise:</b> ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
// <b>Sunset:</b> ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}
//         `;

//         await ctx.reply(weatherMessage, { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
//     }
//     catch (error) {
//         console.error("Error fetching weather data:", error);
//         await ctx.reply("An error occurred while fetching the weather data. Please try again later.",  { reply_to_message_id: ctx.message.message_id, parse_mode: "HTML" });
//     }
// });

// const isValidLangCode = (code: string) => {
//     const validCodes = ['en', 'hi', 'ru', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ar', 'it', 'pt', 'tr', 'nl', 'sv', 'pl', 'da', 'fi', 'no'];
//     return validCodes.includes(code);
// };
  
 
// composer.command(['tr', 'tl', 'translate'], async (ctx: any) => {
//     let args = ctx.match;
//     let reply_to_message = ctx.message.reply_to_message.text;
//     let text_to_translate = '';

//     if (!args && !reply_to_message) {
//         await ctx.reply('Please provide text to translate. You can reply to a message or provide text as an argument.');
//         return;
//     }

//     if (reply_to_message) {
//         text_to_translate = reply_to_message;
//     }
//     else {
//         text_to_translate = args;
//     }

//     let sourceLang = 'auto';
//     let targetLang = 'en';
  
//     let langMatch = args.match(/^([\w-]+)\s+([\w-]+)\s+(.*)$/);
//     if (langMatch) {
//       sourceLang = langMatch[1].trim();
//       targetLang = langMatch[2].trim();
//       text_to_translate = langMatch[3].trim();
//     }
  
//     if (!isValidLangCode(targetLang) || (sourceLang !== 'auto' && !isValidLangCode(sourceLang))) {
//       await ctx.reply('Invalid language code(s) provided. Please check and try again.');
//       return;
//     }
  
//     if (!text_to_translate) {
//       await ctx.reply('No text provided for translation. Please reply to a message or provide text as an argument.');
//       return;
//     }
  
//     try {
//         let { text } = await translate(text_to_translate, { from: sourceLang, to: targetLang });
//         await ctx.reply(`Translated text: ${text}`);
//     } 
//     catch (error) {
//       console.error('Translation error:', error);
//       await ctx.reply('An error occurred during translation. Please try again later.');
//     }
// });


export default composer;