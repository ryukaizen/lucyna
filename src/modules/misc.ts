import bot from "../bot";
import os from 'os';
import si from 'systeminformation';
import { superusersOnly } from "../helpers/helper_func";

bot.command("ping", superusersOnly(async (ctx: any) => {
    let start = Date.now();
    await ctx.api.sendDice(ctx.chat.id, {emoji: "🎰"});
    let end = Date.now();
    let time = end - start;
    await ctx.reply(
        `Response time: ${time}ms`
    );
}));

bot.chatType("supergroup" || "group").command("sysinfo", superusersOnly(async (ctx: any) => {
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
        