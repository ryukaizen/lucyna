import bot from "../bot"
import constants from "../config"
import { Menu } from "@grammyjs/menu";

const greets: string[] = [
    "Hi!", "Hello!", "Hey!", "Hey there!", "Hiya!", "Greetings!", "Howdy!", "G'day!", "Salutations!", "What's up?", "How's it going?", "Wassup?", "Hi, there!",
    "Well, hello!", "Hola!", "Bonjour!", "Ciao!", "Namaste!", "Hi there!", "Howdy-do!", "Greetings and salutations!", "Hiya there!", "Aloha!", "Yo!",
    "How's it going?", "What's the good word?", "Well, hi!", "How are you doing?", "What's new?", "How's everything?", "What's the buzz?", 
    "What's cracking?", "How's life treating you?", "What's happening?", "How are you today?"    
];

const menu = new Menu("start-menu")
    .url("Add me to your group!", `http://t.me/${constants.BOT_USERNAME}?startgroup=new&admin=change_info+post_messages+edit_messages+delete_messages+restrict_members+invite_users+pin_messages+manage_topics+promote_members+manage_video_chats+manage_chat`)    
    .row()
    .text("Help & instructions", (ctx) => ctx.reply("Bro wants help from a bot 💀"));

bot.use(menu);  

bot.chatType("private").command("start", async(ctx) => {
    let pm_start_text: string = (`Hey ${ctx.from?.first_name}, I'm ${bot.botInfo.first_name}, happy to have you!`);
    await ctx.api.sendMessage(ctx.chat.id, pm_start_text, {reply_markup: menu});
});

bot.chatType("supergroup" || "group").command("start", async(ctx) => {
    let hello_greet: string = `${greets[Math.floor(Math.random() * greets.length)]} <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a>`;    
    await ctx.api.sendMessage(ctx.chat.id, hello_greet, {parse_mode: "HTML"});
});