import bot from "../bot"
import constants from "../config"
import { prisma } from "../database"
import { Menu } from "@grammyjs/menu";
import { InlineKeyboard } from "grammy";
import { typingAction } from "../helpers/helper_func";

const greets: string[] = [
    "That's what she said,", "Sir, this is a Wendy's,", "At your service,", "Hi!", "Hello!", "Hey!", "Hey there!", "Hiya!", "Greetings!", "Howdy!", "G'day!", "Salutations!", "What's up?", "How's it going?", "Wassup?",
    "Well, hello!", "Hola!", "Bonjour!", "Ciao!", "Namaste!", "Hi there!", "Howdy-do!", "Greetings and salutations!", "Hiya there!", "Aloha!", "Yo!",
    "How's it going?", "What's the good word?", "Well, hi!", "How are you doing?", "What's new?", "How's everything?", "What's the buzz?", 
    "What's cracking?", "What's happening?", "How are you today?", "Bazinga!", "D'oh!", "Pivot!", "This is the way,", "Wubba lubba dub dub!", "Booyah!", "Let's make some chaos,",
    "Cheers, my love!", "Reporting in,", "I'm ready! How 'bout you?", "I would have been your daddy,", "I'm your huckleberry,", "I'm your biggest fan,", "I'm your destiny,",
    "Hey! Listen!", "Hasta la vista, baby,", "I'm Batman,", "I'm the Doctor,", "I'm the king of the world!", "I'm the one who knocks,", "I'm the one who walks,", "I'm the one who waits,", "I'm the one who runs,",
    "I'm the one who lifts,", "I'm the one who cooks,", "What're you gonna do?", "A man must have a code,", "Sheeeeeit,", "Say my name,", "Tread lightly,", "Lando!", "Hold the door!",
    "You win or you die,", "Oh my God!", "Well, well, well, how the turntables...", "Better call", "The game is on,", "Hey dawg!", "Sup homie!", "Yo brah!", "Need something?", "What's it?",
    "What da dog doin?", "Konnichiwa,", "Hajimemashite", "Yoroshiku,", "Ogenki desu ka?", "Genki desu,", "They don't know me son,", "I'm a straight up G,", "Who's gonna carry the boats?", "Who's gonna carry the logs?",
    "What color is your Bugatti?" // hahaha this is so good
];

const start_text = `\n\nI happen to be your all-in-one bot for effortless community engagement and entertainment.`;

const help_text = `
☑️ Things I can do:
- Manage your Telegram group
- Provide anime & movies
- Guess, waifu-harem & group games
- Music, news & AI tools
\n❌ Things I CANNOT do:
- Teach your cat to dance
- Do your homework
- Help you get a new girlfriend or boyfriend
- Make you rich
\nReport to @Ryukaizen if I act clumsy.`;

const helpButton = new InlineKeyboard()
  .url("Please help me!", `http://telegram.me/${constants.BOT_USERNAME}?start=help_me_im_dumb`)

//--- Parent menu
const start_menu = new Menu("start-menu", { onMenuOutdated: "Menu updated, try now." })
    .url("Add to Chat", `http://telegram.me/${constants.BOT_USERNAME}?startgroup=new&admin=change_info+post_messages+edit_messages+delete_messages+restrict_members+invite_users+pin_messages+manage_topics+promote_members+manage_video_chats+manage_chat`)    
    .submenu("Usage Guide", "help-submenu", (ctx) => 
        ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"}))
//---

//--- Parent menu submenus
const help_submenu = new Menu("help-submenu", { onMenuOutdated: "Menu updated, try now." })
    .submenu("Anime and Manga", "anime-manga-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()    
    .submenu("Games and Quizzes", "games-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .submenu("Group Management", "group-management-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .back("◀️ Menu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: `${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.${start_text}`, parse_mode: "HTML"}))
    .submenu("More ▶️", "help-submenu-2", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"}))
//---

//--- Help submenu submenus
const anime_manga_submenu = new Menu("anime-manga-submenu", { onMenuOutdated: "Menu updated, try now." })
    .submenu("AniList", "anilist-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();

const games_submenu = new Menu("games-submenu", { onMenuOutdated: "Menu updated, try now." })
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();
   
const group_management_submenu = new Menu("group-management-submenu", { onMenuOutdated: "Menu updated, try now." })
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();

const help_submenu_2 = new Menu("help-submenu-2", { onMenuOutdated: "Menu updated, try now." })
    .submenu("AI features", "ai-features-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .submenu("Music", "music-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .submenu("News and Feeds", "news-feeds-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"}));
//---    

//--- Help submenu 2 submenus
const ai_features_submenu = new Menu("ai-features-submenu", { onMenuOutdated: "Menu updated, try now." })
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();

const music_submenu = new Menu("music-submenu", { onMenuOutdated: "Menu updated, try now." }) 
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();

const news_feeds_submenu = new Menu("news-feeds-submenu", { onMenuOutdated: "Menu updated, try now." })
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply("Coming soon")).row()
    .text("Coming soon", (ctx) => ctx.reply(`Coming soon`)).row()
    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();
//---    

start_menu.register(help_submenu);
  
help_submenu.register(anime_manga_submenu);
help_submenu.register(games_submenu);
help_submenu.register(group_management_submenu);
help_submenu.register(help_submenu_2); 

help_submenu_2.register(ai_features_submenu);
help_submenu_2.register(music_submenu);
help_submenu_2.register(news_feeds_submenu);

bot.use(start_menu);  

bot.chatType("private").command("start", (async(ctx: any) => { 
    let pm_start_text: string = (`${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.${start_text}`);
    let payload = ctx.match;
    if (payload == "help_me_im_dumb"){
        await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: help_text, reply_markup: help_submenu, parse_mode: "HTML"});    
    }
    else {
        await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: pm_start_text, reply_markup: start_menu, parse_mode: "HTML"});
    }
}));

bot.chatType("supergroup" || "group").command("start", (async(ctx: any) => {
    let grp_start_text: string = `${greets[Math.floor(Math.random() * greets.length)]} <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a>`;    
    await ctx.api.sendMessage(ctx.chat.id, grp_start_text, {parse_mode: "HTML"});
}));

bot.chatType("private").command("help", typingAction(async(ctx: any) => {
    await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: help_text, reply_markup: help_submenu, parse_mode: "HTML"});
}));

bot.chatType("supergroup" || "group").command("help", typingAction(async(ctx: any) => {
    await ctx.reply("Need help?", {reply_parameters: {message_id: ctx.message.message_id}, reply_markup: helpButton, parse_mode: "HTML"});
}));