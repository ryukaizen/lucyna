import { bot } from "../bot";
import os from 'os';
import si from 'systeminformation';
import { superusersOnly } from "../helpers/helper_func";
import { Composer } from "grammy";

const composer = new Composer(); 


const markdown_help: string = `
Markdown is a very powerful formatting tool supported by telegram. {} has some enhancements, to make sure that \\
saved messages are correctly parsed, and to allow you to create buttons.

- <code>_italic_</code>: wrapping text with '_' will produce italic text
- <code>*bold*</code>: wrapping text with '*' will produce bold text
- <code>\`code\`</code>: wrapping text with '\`' will produce monospaced text, also known as 'code'
- <code>~strike~</code> wrapping text with '~' will produce strikethrough text
- <code>--underline--</code> wrapping text with '--' will produce underline text
- <code>[sometext](someURL)</code>: this will create a link - the message will just show <code>sometext</code>, \\
and tapping on it will open the page at <code>someURL</code>.
EG: <code>[test](example.com)</code>
- <code>[buttontext](buttonurl:someURL)</code>: this is a special enhancement to allow users to have telegram \\
buttons in their markdown. <code>buttontext</code> will be what is displayed on the button, and <code>someurl</code> \\
will be the url which is opened.
EG: <code>[This is a button](buttonurl:example.com)</code>

If you want multiple buttons on the same line, use :same, as such:
<code>[one](buttonurl://example.com)
[two](buttonurl://google.com:same)</code>
This will create two buttons on a single line, instead of one button per line.

Keep in mind that your message <b>MUST</b> contain some text other than just a button!
`;

composer.chatType("private").command("markdownhelp", async (ctx: any) => {
    await ctx.api.sendMessage(ctx.chat.id, markdown_help, {parse_mode: "HTML"});
});

composer.chatType(["supergroup", "group"]).command("markdownhelp", async (ctx: any) => {
    await ctx.reply("Use that command in my DM!", {reply_to_message_id: ctx.message.message_id});
});


composer.command("ping", (async (ctx: any, next) => {
    let start = Date.now();
    await ctx.api.sendDice(ctx.chat.id, {emoji: "🎰"});
    let end = Date.now();
    await next();
    let time = end - start;
    await ctx.reply(
        `Response time: ${time}ms`
    );
}));

composer.command("sysinfo", superusersOnly(async (ctx: any) => {
    let cpu = await si.cpu();
    let osys = await si.osInfo();
    let mem = await si.mem();
    let disk = await si.diskLayout();
    let network: any = await si.networkInterfaces();
    let gpu = await si.graphics();
    let shell = await si.shell();
    let kernel = await (await si.osInfo()).kernel;
    let uptime = await si.time().uptime;

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatTime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days} days, ${hours} hours, ${minutes} minutes`;
    };

    let sysinfo = (
        `${os.userInfo().username}@${os.hostname}\n\n` +
        `• OS: <code>${osys.distro} ${osys.release} ${osys.arch}</code>\n` +
        `• Memory: <code>${formatBytes(mem.available)} / ${formatBytes(mem.total)}</code>\n` +
        `• Disk: <code>${disk[0].name} ${formatBytes(disk[0].size)}</code>\n` +
        `• CPU: <code>${cpu.manufacturer} ${cpu.brand} ${cpu.speed}GHz</code>\n` +
        // `• GPU: <code>${gpu.controllers[0].model}</code>\n` +
        `• Network: <code>${network[0].iface}</code>\n` +
        `• Shell: <code>${shell}</code>\n` +
        `• Kernel: <code>${kernel}</code>\n` +
        `• Uptime: <code>${formatTime(uptime)}</code>\n`
    );
    await ctx.reply(sysinfo, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});
}));
        
export default composer;