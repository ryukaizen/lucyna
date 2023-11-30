import fs from 'fs/promises';
import bot from "./bot";
import constants from "./config";
import { run } from "@grammyjs/runner";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { logger } from "./logger"
import { channel_log } from "./logger";
import { connectDB, disconnectDB } from "./database";

// Connect to the database  
connectDB(constants.MONGO_URL);

// Initialize grammY runner
const runner = run(bot);

// Flood control plugin
const throttler = apiThrottler();
bot.api.config.use(throttler);

var ALL_MODULES: string[] = [];

(async function () {
    const modules = await fs.readdir("./dist/modules");
    for (const file of modules) {
        if (file.match(/.*\.(js)$/)) {
            await import(`./modules/${file}`);
            ALL_MODULES.push(`${file.replace(/\.[^\/.]+$/, "").toUpperCase()}`);
        }
    }

    await bot.api.deleteWebhook({ drop_pending_updates: true });    
})();

bot.init().then(async() => {
    var bot_info = (
        `${bot.botInfo.first_name}\n` + 
        `\#LAUNCHED on ${new Date().toLocaleString()}\n\n` +
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
    disconnectDB()
    .catch(() => logger.warn(`[${signal}] - Exiting without closing MongoDB connection!`));
    runner.isRunning() && runner.stop();
    logger.info(`${signal} - Exiting...`);
}

process.once('SIGINT', () => {
    exitSignal('SIGINT');
});
process.once('SIGTERM', () => {
    exitSignal('SIGTERM');
});