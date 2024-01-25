import bot from "../bot"
import constants from "../config"
import { Menu } from "@grammyjs/menu";
import { typingAction } from "../helpers/helper_func";

const greets: string[] = [
    "Hi!", "Hello!", "Hey!", "Hey there!", "Hiya!", "Greetings!", "Howdy!", "G'day!", "Salutations!", "What's up?", "How's it going?", "Wassup?", "Hi, there!",
    "Well, hello!", "Hola!", "Bonjour!", "Ciao!", "Namaste!", "Hi there!", "Howdy-do!", "Greetings and salutations!", "Hiya there!", "Aloha!", "Yo!",
    "How's it going?", "What's the good word?", "Well, hi!", "How are you doing?", "What's new?", "How's everything?", "What's the buzz?", 
    "What's cracking?", "How's life treating you?", "What's happening?", "How are you today?"    
];

const start_text = `\nThis is the start menu.`;

const start_menu = new Menu("start-menu", { onMenuOutdated: "Content updated, try now." })
    .url("Add to Chat", `http://t.me/${constants.BOT_USERNAME}?startgroup=new&admin=change_info+post_messages+edit_messages+delete_messages+restrict_members+invite_users+pin_messages+manage_topics+promote_members+manage_video_chats+manage_chat`)    
    .submenu("Usage Guide", "help-menu", (ctx) => ctx.editMessageText(help_text));

const help_text = `This is the help menu.`;

// todo: Turn this into dynamic menu
const help_menu = new Menu("help-menu", { onMenuOutdated: "Content updated, try now." })
    .url("Read the Docs", "something.com").row()
    .text("Button 1", (ctx) => ctx.reply("something.com")).row()
    .text("Button 2", (ctx) => ctx.reply("something.com")).row()
    .text("Button 3", (ctx) => ctx.reply(`Blah Blah`)).row()
    .back("Back", (ctx) => ctx.editMessageText(`${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.${start_text}`)).row();

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