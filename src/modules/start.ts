import bot from "../bot"
import constants from "../config"
import { Menu } from "@grammyjs/menu";
import { typingAction } from "../helpers/helper_func";

const greets: string[] = [
    "That's what she said,", "Hi!", "Hello!", "Hey!", "Hey there!", "Hiya!", "Greetings!", "Howdy!", "G'day!", "Salutations!", "What's up?", "How's it going?", "Wassup?",
    "Well, hello!", "Hola!", "Bonjour!", "Ciao!", "Namaste!", "Hi there!", "Howdy-do!", "Greetings and salutations!", "Hiya there!", "Aloha!", "Yo!",
    "How's it going?", "What's the good word?", "Well, hi!", "How are you doing?", "What's new?", "How's everything?", "What's the buzz?", 
    "What's cracking?", "What's happening?", "How are you today?", "Bazinga!", "D'oh!", "Wakanda forever!", "Pivot!", "This is the way,", "Wubba lubba dub dub!", "Booyah!", "Let's make some chaos,",
    "Cheers, love!", "Reporting in,", "I'm ready! How 'bout you?", "I would have been your daddy,", "I'm your huckleberry,", "I'm your worst nightmare,", "I'm your biggest fan,", "I'm your density,",
    "Hey! Listen!", "Hasta la vista, baby,", "I'm Batman,", "I'm the Doctor,", "I'm the king of the world!", "I'm the one who knocks,", "I'm the one who walks,", "I'm the one who waits,", "I'm the one who runs,",
    "I'm the one who lifts,", "I'm the one who cooks,", "What're you gonna do?", "A man must have a code,", "Sheeeeeit,", "Say my name,", "Tread lightly,", "Lando!", "Hold the door!",
    "You win or you die,", "Oh my God!", "Well, well, well, how the turntables...", "Better call", "The game is on,", "I can bring you in warm, or I can bring you in cold,"
];

const start_text = `\nThis is the start menu.`;

const start_menu = new Menu("start-menu", { onMenuOutdated: "Menu updated, try now." })
    .url("Add to Chat", `http://t.me/${constants.BOT_USERNAME}?startgroup=new&admin=change_info+post_messages+edit_messages+delete_messages+restrict_members+invite_users+pin_messages+manage_topics+promote_members+manage_video_chats+manage_chat`)    
    .submenu("Usage Guide", "help-menu", (ctx) => ctx.editMessageText(help_text));

const help_text = `This is the help menu.`;

const help_menu = new Menu("help-menu", { onMenuOutdated: "Menu updated, try now." })
    .submenu("Group Management", "group-management-menu", (ctx) => ctx.editMessageText("Other Menu")).row()
    .submenu("Anime & Manga", "anime-manga-menu", (ctx) => ctx.editMessageText("Other Menu")).row()
    .submenu("Games", "games-menu", (ctx) => ctx.editMessageText("Other Menu")).row()
    .back("◀️", (ctx) => ctx.editMessageText(`${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.${start_text}`))
    .submenu("▶️", "help-menu-2", (ctx) => ctx.editMessageText("Other Menu"))

//--- This should be dynamic
const group_management_menu = new Menu("group-management-menu", { onMenuOutdated: "Menu updated, try now." })
    .text("Button 1", (ctx) => ctx.reply("something.com")).row()
    .text("Button 2", (ctx) => ctx.reply("something.com")).row()
    .text("Button 3", (ctx) => ctx.reply(`Blah Blah`)).row()
    .back("◀️", (ctx) => ctx.editMessageText(help_text)).row();
//---

const anime_manga_menu = new Menu("anime-manga-menu", { onMenuOutdated: "Menu updated, try now." })
    .text("Button 1", (ctx) => ctx.reply("something.com")).row()
    .text("Button 2", (ctx) => ctx.reply("something.com")).row()
    .text("Button 3", (ctx) => ctx.reply(`Blah Blah`)).row()
    .back("◀️", (ctx) => ctx.editMessageText(help_text)).row();

const games_menu = new Menu("games-menu", { onMenuOutdated: "Menu updated, try now." })
    .text("Button 1", (ctx) => ctx.reply("something.com")).row()
    .text("Button 2", (ctx) => ctx.reply("something.com")).row()
    .text("Button 3", (ctx) => ctx.reply(`Blah Blah`)).row()
    .back("◀️", (ctx) => ctx.editMessageText(help_text)).row();

const help_menu_2 = new Menu("help-menu-2", { onMenuOutdated: "Menu updated, try now." })
    .text("Button 1", (ctx) => ctx.reply("something.com")).row()
    .text("Button 2", (ctx) => ctx.reply("something.com")).row()
    .text("Button 3", (ctx) => ctx.reply(`Blah Blah`)).row()
    .back("◀️", (ctx) => ctx.editMessageText(help_text)).row();
        
help_menu.register(group_management_menu);
help_menu.register(anime_manga_menu);
help_menu.register(games_menu);
help_menu.register(help_menu_2);

start_menu.register(help_menu);

bot.use(start_menu);  

bot.chatType("private").command("start", typingAction(async(ctx: any) => { 
    let pm_start_text: string = (`${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.${start_text}`);
    await ctx.api.sendMessage(ctx.chat.id, pm_start_text, {reply_markup: start_menu});
}));

bot.chatType("supergroup" || "group").command("start", typingAction(async(ctx: any) => {
    let grp_start_text: string = `${greets[Math.floor(Math.random() * greets.length)]} <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a>`;    
    await ctx.api.sendMessage(ctx.chat.id, grp_start_text, {parse_mode: "HTML"});
}));

bot.chatType("private").command("help", typingAction(async(ctx: any) => {
    await ctx.api.sendMessage(ctx.chat.id, help_text, {reply_markup: help_menu});
}));

bot.chatType("supergroup" || "group").command("help", typingAction(async(ctx: any) => {
    await ctx.api.sendMessage(ctx.chat.id, "group help", {parse_mode: "HTML"});
}));