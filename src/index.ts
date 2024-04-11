import fs from 'fs/promises';
import { bot, adapter }from "./bot";
import constants from "./config"
import { autoRetry } from "@grammyjs/auto-retry";
import { Context } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { chatMembers } from "@grammyjs/chat-members";
import { hydrateFiles } from '@grammyjs/files';
import { logger } from "./logger"
import { channel_log } from "./logger";
import { gramjs } from './utility';

// Initialize grammY runner
const runner = run(bot, { 
    runner: { 
        fetch: { 
            allowed_updates: ["message", "edited_message", "callback_query", "chat_member"] 
        } 
    } 
});
const constraints = (ctx: Context) => [String(ctx.chat?.id), String(ctx.from?.id)]

bot.api.config.use(autoRetry({
    maxRetryAttempts: 1, 
    maxDelaySeconds: 5, 
}));
bot.use(sequentialize(constraints))
bot.use(chatMembers(adapter, { 
    enableAggressiveStorage: true, 
    enableCaching: true, 
    keepLeftChatMembers: true 
}));
bot.api.config.use(hydrateFiles(bot.token));

const ALL_MODULES: string[] = [];

(async function () {
    const modules = await fs.readdir("./dist/modules");
    for (const file of modules) {
        if (file.match(/.*\.(js)$/)) {
            await import(`./modules/${file}`);
            ALL_MODULES.push(`${file.replace(/\.[^\/.]+$/, "").toUpperCase()}`);
        }
    }
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    await gramjs.start({botAuthToken: constants.BOT_TOKEN});  
})();

bot.init().then(async() => {
    let currentTime = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    let bot_info = (
        `${bot.botInfo.first_name}\n` + 
        `\#LAUNCHED on ${currentTime}, ${new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}\n\n` +
        `• Username: @${bot.botInfo.username}\n` +
        `• Bot ID: ${bot.botInfo.id}\n` +
        `• Allow Groups: ${bot.botInfo.can_join_groups ? `Enabled` : `Disabled`}\n` +
        `• Privacy Mode: ${bot.botInfo.can_read_all_group_messages ? `Disabled` : `Enabled`}\n` +
        `• Inline Mode: ${bot.botInfo.supports_inline_queries ? `Enabled` : `Disabled`}\n`
    );
    
    console.log(bot_info + `\nLoaded modules: [ ${ALL_MODULES.join(", ")} ]\n`);
    channel_log(bot_info + `\nLoaded modules: [ <code>${ALL_MODULES.join(", ")}</code> ]`);
});

async function exitSignal(signal: String) {
    runner.isRunning() && runner.stop();
    logger.info(`${signal} - Exiting...`);
}

process.once('SIGINT', () => {
    exitSignal('SIGINT');
});
process.once('SIGTERM', () => {
    exitSignal('SIGTERM');
});