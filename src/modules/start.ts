import { bot } from "../bot"
import constants from "../config"
import { Menu } from "@grammyjs/menu";
import { Composer, InlineKeyboard } from "grammy";
import { get_rules } from "../database/rules_sql"
import { get_users_count, register_user } from "../database/users_sql";
import { get_chats_count } from "../database/chats_sql";

const composer = new Composer();

const greets: string[] = [
    "That's what she said,", "Sir, this is a Wendy's,", "At your service,", "Hi!", "Hello!", "Hey!", "Hey there!", "Hiya!", "Greetings!", "Howdy!", "G'day!", "Salutations!", "What's up?", "How's it going?", "Wassup?",
    "Well, hello!", "Hola!", "Bonjour!", "Ciao!", "Namaste!", "Hi there!", "Howdy-do!", "Greetings and salutations!", "Hiya there!", "Aloha!", "Yo!",
    "How's it going?", "What's the good word?", "Well, hi!", "How are you doing?", "What's new?", "How's everything?", "What's the buzz?", 
    "What's cracking?", "What's happening?", "How are you today?", "Bazinga!", "D'oh!", "Pivot!", "This is the way,", "Wubba lubba dub dub!", "Booyah!", "Let's make some chaos,",
    "Cheers, my love!", "Reporting in,", "I'm ready! How 'bout you?", "I would have been your daddy,", "I'm your huckleberry,", "I'm your biggest fan,", "I'm your destiny,",
    "Hey! Listen!", "Hasta la vista, baby,", "I'm Batman,", "I'm the king of the world!", "I'm the one who knocks,", "I'm the one who walks,", "I'm the one who waits,", "I'm the one who runs,",
    "I'm the one who lifts,", "I'm the one who cooks,", "What're you gonna do?", "A man must have a code,", "Sheeeeeit,", "Say my name,", "Tread lightly,", "Hold the door!",
    "You win or you die,", "Oh my God!", "Well, well, well, how the turntables...", "Better call", "The game is on,", "Hey dawg!", "Sup homie!", "Yo brah!", "Need something?", "What's it?",
    "What da dog doin?", "Konnichiwa,", "Hajimemashite", "Yoroshiku,", "Ogenki desu ka?", "Genki desu,", "They don't know me son,", "I'm a straight up G,", "Who's gonna carry the boats?", "Who's gonna carry the logs?",
    "What color is your Bugatti?" // hahaha this is so good
];

const start_text = `I happen to be your all-in-one bot for effortless community engagement and entertainment.`;

const help_text = `
☑️ Things I can do:
- Manage your Telegram group
- <s>Provide anime & movies</s> (Coming soon)
- <s>Guess, waifu-harem & group games</s> (Coming soon)
- <s>Music, news & AI tools</s> (Coming soon)
\n❌ Things I CANNOT do:
- Teach your cat to dance
- Do your homework
- Help you get a new girlfriend or boyfriend
- Make you rich
\nReport to @Ryukaizen if I act clumsy.`;

const module_help = {
    admin: `
👮 <b>Admin</b>

<b>Admins Only</b>
- /pin - Silently pins the message replied to
  • Add 'loud' or 'notify' to give notifications to users
- /unpin - Unpins the currently pinned message
- /invitelink - Fetches group's invite link
- /promote - Promotes the user replied to
- /demote - Demotes the user replied to
- /title &lt;title here&gt; - Sets a custom title for an admin that the bot promoted
- /setgpic | /setgpfp - Sets image replied to as the group's profile picture
- /delgpic | /delgpfp - Removes current group's profile picture
- /setgtitle &lt;group's name&gt; - Sets group's name
- /setgdesc | /setdescription &lt;description&gt; - Sets group's description
- /setsticker | /setgsticker - Sets group's sticker pack
- /delsticker | /delgsticker - Removes group's sticker pack

<b>Owner Only</b>
- /unpinall - Unpins all the pinned messages at once
`,
    
      anilist: `
🇯🇵 <b>AniList</b>

- /anime &lt;anime name&gt; - Fetches anime information from anilist.co
`,

  antiflood: `
🌊 <b>Antiflood</b>

- /flood | /antiflood - Get current flood control configuration
- /floodmode | /antifloodmode - Get current mode of action to be taken once user hits flood

<b>Admins Only</b>
- /setflood | /setantiflood &lt;int/'no'/'off'&gt; - Enables or disables flood control
  • Example: /setflood 10
- /setfloodmode | /setantifloodmode &lt;ban/kick/mute/tban/tmute&gt; &lt;value&gt; - Action to perform when user has exceeded flood limit

<i>Note: Value must be filled for tban and tmute (e.g., 5m = 5 minutes, 6h = 6 hours, 3d = 3 days)</i>
`,
    
    bans: `
🚫 <b>Bans</b>

<b>Members Only</b>
- /kickme - Removes the user who sent this command from the group
- /banme - Bans the user who sent this command from the group

<b>Admins Only</b>
- /ban &lt;userhandle&gt; - Bans a user (via handle or reply)
- /unban &lt;userhandle&gt; - Unbans a user (via handle or reply)
- /dban - Deletes the message replied to and bans the sender
- /sban | /pew - Silently bans the user using reply or userhandle
- /tban | /tempban - Temporarily bans the user
- /kick - Removes the user from the group
- /dkick - Deletes the message replied to and removes the user from the group
`,
    
      blacklists: `
⛔ <b>Blacklists</b>

<b>Admins Only</b>
- /blacklist - View the current blacklisted words
- /addblacklist &lt;triggers&gt; - Add a trigger to the blacklist
- /unblacklist | /rmblacklist - Remove triggers from the blacklist
- /blacklistmode | /setblacklistmode &lt;off/del/warn/ban/kick/mute/tban/tmute&gt; - Action to perform when someone sends blacklisted words
- /blsticker - View the current blacklisted sticker packs
- /addblsticker &lt;sticker link&gt; - Add the sticker trigger to the blacklist
- /unblsticker | /rmblsticker &lt;sticker link&gt; - Remove triggers from blacklist
- /blstickermode &lt;ban/tban/mute/tmute&gt; - Sets up a default action for blacklisted stickers

<b>Owner Only</b>
- /unblacklistall | /rmblacklistall - Unblacklist all the blacklisted words from the group
- /unblstickerall | /rmblstickerall - Unblacklist all the blacklisted sticker packs from the group

<i>Note: &lt;sticker link&gt; can be https://t.me/addstickers/&lt;sticker&gt; or just &lt;sticker&gt; or reply to the sticker message.</i>
`,
    
    cleanservice: `
🧹 <b>Cleanservice</b>

<b>Admins Only</b>
- /cleanservice &lt;on/off&gt; - Deletes Telegram's welcome/left service messages

<i>Example: user joined chat, user left chat.</i>
`,
    
    extras: `
🎉 <b>Extras</b>

- /date - Shows today's date, timezone and relevant info
- /ud &lt;word&gt; - Fetches meaning of the provided word from Urban Dictionary

<i>Note: Urban Dictionary definitions shouldn't be taken seriously as they can be trollish.</i>
`,
    
    filters: `
🔍 <b>Filters</b>

- /filters | /listfilters - List all active filters set in the chat

<b>Admins Only</b>
- /filter | /addfilter &lt;keyword&gt; &lt;reply message&gt; - Add a filter to this chat
- /stop | /stopfilter &lt;filter keyword&gt; - Stop that filter

<b>Owner Only</b>
- /stopall | /stopallfilters - Stop all the filters for this chat
`,

    fun: `
😄 <b>Fun</b>

<b>Admins Only</b>
- /echo &lt;message&gt; - Echo the message back
`,
    
    greetings: `
👋 <b>Greetings</b>

<b>Admins Only</b>
- /welcome &lt;on/off&gt; - Enable/disable welcome messages
- /welcome - Shows current welcome settings
- /setwelcome &lt;sometext&gt; - Set a custom welcome message
- /resetwelcome - Reset to the default welcome message
- /goodbye - Same usage and args as /welcome
- /setgoodbye &lt;sometext&gt; - Set a custom goodbye message
- /resetgoodbye - Reset to the default goodbye message
- /cleanwelcome &lt;on/off&gt; - On new member, try to delete the previous welcome message to avoid spamming the chat

- /welcomehelp - Shows the markdown help for welcome messages

<i>Note: If used replying to media, uses that media for welcome/goodbye messages.</i>
`,
    
    locks: `
🔒 <b>Locks</b>

<b>Admins Only</b>
- /lock &lt;type&gt; - Lock items of a certain type (not available in private)
- /unlock &lt;type&gt; - Unlock items of a certain type (not available in private)
- /locktypes - Lists all possible lock types
- /locks | /currentlocks - The current list of locked items in this chat
- /lockall - Lock everything
- /unlockall - Unlock everything

<i>Note:
- Unlocking permission 'info' will allow members (non-admins) to change the group information, such as the description or the group name
- Unlocking permission 'pin' will allow members (non-admins) to pin a message in a group</i>
`,
    
    mutes: `
🔇 <b>Mutes</b>

<b>Admins Only</b>
- /mute &lt;userhandle&gt; - Silences a user. Can also be used as a reply
- /unmute &lt;userhandle&gt; - Unmutes a user. Can also be used as a reply
- /tmute | /tempmute &lt;userhandle&gt; x(m/h/d) - Mutes a user for x time
- /smute | /pss - Silently mutes the user
- /dmute | /delmute - Deletes the message replied to, then mutes the sender of that message

<i>Note: For /tmute, 'm' = minutes, 'h' = hours, 'd' = days</i>
`,
    
    notes: `
📝 <b>Notes</b>

- /notes | /saved - List all saved notes in this chat
- /get | /getnote &lt;notename&gt; - Get the note with this notename

<b>Admins Only</b>
- /save &lt;notename&gt; &lt;notedata&gt; - Saves notedata as a note with name notename
- /clear &lt;notename&gt; - Clear note with this name

<b>Owner Only</b>
- /rmallnotes | /clearallnotes - Removes all notes from the group

<i>Note: A button can be added to a note by using standard markdown link syntax - the link should just be prepended with a 'buttonurl://' section, as such: [somelink](buttonurl://example.com). Check /markdownhelp for more info.</i>
`,
    
    purges: `
🗑️ <b>Purges</b>

<b>Admins Only</b>
- /del - Deletes the message you replied to
- /purge - Deletes all messages between this and the replied to message
`,
    
    reports: `
🚨 <b>Reports</b>

<b>Members Only</b>
- /report | @admins &lt;reason&gt; - Reply to a message to report it to admins

<b>Admins Only</b>
- /reports &lt;on/off&gt; - Change report setting, or view current status
`,
    
    rules: `
📜 <b>Rules</b>

- /rule | /rules - Get the rules for this chat

<b>Admins Only</b>
- /setrules | /addrules &lt;your rules here&gt; - Set the rules for this chat
- /resetrules | /rmrules - Remove the rules for this chat
`,
    
    users: `
👥 <b>Users</b>

- /info - Get information about a user
- /id - Get the current group id. If used by replying to a message, gets that user's id
`,
    
    warns: `
⚠️ <b>Warns</b>

- /warns &lt;userhandle&gt; - Get a user's number, and reason, of warns

<b>Admins Only</b>
- /warn &lt;userhandle&gt; - Warn a user. After 3 warns, the user will be banned from the group
- /unwarn | /rmwarn - Remove a warn from user 
- /dwarn | /delwarn - Delete the message replied to and warn the sender of that message
- /resetwarns | /rmwarns - Reset all the warns for the user
- /warnmode &lt;ban/kick/mute/tban/tmute&gt; &lt;value&gt; - Action to perform when the user exceeds warn limits
- /warnlimit &lt;num&gt; - Set the warning limit
- /warnfilters | /warnlist - List all the warn filters
- /addwarn &lt;keyword&gt; - Set a warning filter on a certain keyword
- /nowarn - Remove a warning filter on a certain keyword

<b>Owner Only</b>
- /resetallwarns - Remove all the warns for everyone in the chat
- /resetallwarnfilters - Remove all the warn filters for the chat
`
};

const helpButton = new InlineKeyboard()
  .url("Please help me!", `https://telegram.me/${constants.BOT_USERNAME}?start=help_me_im_dumb`)

const understoodButton = new InlineKeyboard()
  .text("🗑 Understood!", "understood")

composer.callbackQuery("understood", async(ctx: any) => {
    await ctx.answerCallbackQuery({ text: "Great then!"});
    await ctx.deleteMessage();
});

//--- Parent menu
const start_menu = new Menu("start-menu", { onMenuOutdated: "Menu updated, try now." })
    .url("Add to Chat", `https://telegram.me/${constants.BOT_USERNAME}?startgroup=new&admin=change_info+post_messages+edit_messages+delete_messages+restrict_members+invite_users+pin_messages+manage_topics+promote_members+manage_video_chats+manage_chat`)    
    .submenu("Usage Guide", "help-submenu", (ctx) => 
        ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"}))
//---

//--- Parent menu submenus
const help_submenu = new Menu("help-submenu", { onMenuOutdated: "Menu updated, try now." })
    .submenu("Group Management", "group-management-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: "Use the buttons to know each module's usage instructions.", parse_mode: "HTML"})).row()
    // .submenu("Games and Quizzes", "games-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()
    // .submenu("Anime and Manga", "anime-manga-submenu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row()    
    .back("◀️ Menu", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: `${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.\n\n${start_text}`, parse_mode: "HTML"}))
    // .submenu("More ▶️", "help-submenu-2", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"}))
//---

//--- Help submenu submenus
const group_management_submenu = new Menu("group-management-submenu", { onMenuOutdated: "Menu updated, try now." })
    .text("Admin", (ctx) => ctx.reply(module_help.admin, { reply_markup: understoodButton, parse_mode: "HTML" }))
    // .text("AFK", (ctx) => ctx.reply(module_help.afk, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("AniList", (ctx) => ctx.reply(module_help.anilist, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Antiflood", (ctx) => ctx.reply(module_help.antiflood, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    // .text("Antispam", (ctx) => ctx.reply(module_help.antiflood, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Bans", (ctx) => ctx.reply(module_help.bans, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Blacklists", (ctx) => ctx.reply(module_help.blacklists, { reply_markup: understoodButton, parse_mode: "HTML" }))
    // .text("Bluetext", (ctx) => ctx.reply(module_help.bluetext, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Cleanservice", (ctx) => ctx.reply(module_help.cleanservice, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    // .text("Connection", (ctx) => ctx.reply(module_help.connection, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    // .text("Disabling", (ctx) => ctx.reply(module_help.disabling, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Extras", (ctx) => ctx.reply(module_help.extras, { reply_markup: understoodButton, parse_mode: "HTML" }))
    // .text("Federations", (ctx) => ctx.reply(module_help.federations, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Filters", (ctx) => ctx.reply(module_help.filters, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Fun", (ctx) => ctx.reply(module_help.fun, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Greetings", (ctx) => ctx.reply(module_help.greetings, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Locks", (ctx) => ctx.reply(module_help.locks, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Mutes", (ctx) => ctx.reply(module_help.mutes, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Notes", (ctx) => ctx.reply(module_help.notes, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Purges", (ctx) => ctx.reply(module_help.purges, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Reports", (ctx) => ctx.reply(module_help.reports, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    .text("Rules", (ctx) => ctx.reply(module_help.rules, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Users", (ctx) => ctx.reply(module_help.users, { reply_markup: understoodButton, parse_mode: "HTML" }))
    .text("Warns", (ctx) => ctx.reply(module_help.warns, { reply_markup: understoodButton, parse_mode: "HTML" })).row()
    // .text("Zombies", (ctx) => ctx.reply(module_help.admin, { reply_markup: understoodButton, parse_mode: "HTML" }))

    .back("◀️ Go Back", (ctx) => ctx.editMessageMedia({type: "animation", media: constants.START_GIF, caption: help_text, parse_mode: "HTML"})).row();


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

composer.chatType("private").command("start", (async(ctx: any) => { 
    let users = await get_users_count();
    let chats = await get_chats_count();
    let users_chats_count_message = `Currently serving <code>${users}</code> users across <code>${chats}</code> chats.`
    let pm_start_text: string = (`${greets[Math.floor(Math.random() * greets.length)]} ${ctx.from?.first_name}.\n\n${start_text}\n\n${users_chats_count_message}`);
    let payload = ctx.match;

    // payload from the help button
    if (payload == "help_me_im_dumb"){
        await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: help_text, reply_markup: help_submenu, parse_mode: "HTML"});    
    }

    // payload from the rules button
    else if (payload.startsWith("rules")) {
        let chatId = payload.split("_")[1];
        let getchat_object = await ctx.api.getChat(chatId);
        let chat_title = getchat_object.title;
        let rules = await get_rules(chatId);

        if (rules == null || rules == undefined ) {
            // in case user clicks on already sent button but there are no rules
            await ctx.api.sendMessage(ctx.chat.id, "The moderators of the group have not set rules (on this bot) as of now. However, this might not mean that the group doesn't have any rules!\n\n<i>Tip: Try informing the moderators on this issue, be a good one ;)</i>", {parse_mode: "HTML"});
        }
        else {
            let rules_message = `Rules for <b>${chat_title}</b> are:\n\n${rules}`
            await ctx.api.sendMessage(ctx.chat.id, rules_message, {parse_mode: "HTML"});
        }
    }   

    // if no payload, send the start message
    else {
        await ctx.react("🎉");
        await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: pm_start_text, reply_markup: start_menu, parse_mode: "HTML"});
    }

    let username = null;
    if (ctx.from.username) {
        username = ctx.from.username;
    }
    await register_user(ctx.from.id, username); //todo: make this standalone
}));

composer.chatType(["supergroup", "group"]).command("start", (async(ctx: any) => {
    let grp_start_text: string = `${greets[Math.floor(Math.random() * greets.length)]} <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a>.`;    
    let payload = ctx.match;
    if (payload == "new") {
        return;
    }
    else {
        await ctx.api.sendMessage(ctx.chat.id, grp_start_text, {parse_mode: "HTML"});
    }

    let username = null;
    if (ctx.from.username) {
        username = ctx.from.username;
    }
    await register_user(ctx.from.id, username); //todo: make this standalone
}));

composer.chatType("private").command("help", (async(ctx: any) => {
    await ctx.api.sendAnimation(ctx.chat.id, constants.START_GIF, {caption: help_text, reply_markup: help_submenu, parse_mode: "HTML"});
}));

composer.chatType(["supergroup", "group"]).command("help", (async(ctx: any) => {
    await ctx.reply("Need help?", {reply_parameters: {message_id: ctx.message.message_id}, reply_markup: helpButton, parse_mode: "HTML"});
}));

export default composer;