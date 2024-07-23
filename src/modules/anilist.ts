import { Composer, InlineKeyboard } from "grammy";
import axios from "axios";

const composer = new Composer();

const API_URL = 'https://graphql.anilist.co';

async function fetchAnimeDetails(animeName: string) {
    let query = `
        query ($search: String) {
            Media(search: $search, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                description
                siteUrl
                coverImage {
                    large
                }
            }
        }
    `;

    let variables = {
        search: animeName
    };

    try {
        let response = await axios.post(API_URL, { query, variables });
        return response.data.data.Media;
    } catch (error) {
        console.error('Error fetching anime details:', error);
        return null;
    }
}

composer.command("anime", (async (ctx: any) => {
    let search = ctx.message?.text?.split(' ').slice(1).join(' ');
    if (!search) {
        return ctx.reply('Please provide an anime name. Usage: /anime <anime name>');
    }

    let animeDetails = await fetchAnimeDetails(search);
    if (!animeDetails) {
        return ctx.reply('Anime not found');
    }

    let { title, description, siteUrl, coverImage } = animeDetails;
    let message = `
*🎬 ${title.romaji}* (${title.native})
*English:* ${title.english}
*Description:* ${description}
[More Info](${siteUrl})`;

    let keyboard = new InlineKeyboard().url("View on AniList", siteUrl);

    if (coverImage) {
        return ctx.replyWithPhoto(coverImage.large, {
            caption: message,
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    } else {
        return ctx.reply(message, { parse_mode: "Markdown", reply_markup: keyboard });
    }
}));

export default composer;
