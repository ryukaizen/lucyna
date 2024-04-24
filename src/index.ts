import { bot, adapter }from "./bot";
import constants from "./config"
import { gramjs } from './utility';
import { logger, channel_log } from "./logger"
import { Composer, Context } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { autoRetry } from "@grammyjs/auto-retry";
import { chatMembers } from "@grammyjs/chat-members";
import { hydrateFiles } from '@grammyjs/files';
import { LogLevel } from 'telegram/extensions/Logger';

import {
    admin_plugin, 
    antiflood_plugin,
    ban_plugin,
    filter_plugin,
    misc_plugin,
    mute_plugin,
    purge_plugin,
    report_plugin,
    rule_plugin,
    start_plugin,
    test_plugin,
    users_plugin,
    warn_plugin,
    welcome_plugin 
} from './modules';

const composer = new Composer();

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

composer.use(admin_plugin);
composer.use(antiflood_plugin);
composer.use(ban_plugin);
composer.use(filter_plugin);
composer.use(misc_plugin);
composer.use(mute_plugin);
composer.use(purge_plugin);
composer.use(report_plugin);
composer.use(rule_plugin);
composer.use(start_plugin);
composer.use(test_plugin);
composer.use(users_plugin);
composer.use(warn_plugin);
composer.use(welcome_plugin);

bot.use(composer);

(async function () {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    await gramjs.setLogLevel(LogLevel.NONE)
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
        `• Inline Mode: ${bot.botInfo.supports_inline_queries ? `Enabled` : `Disabled`}\n\n`
    );
    console.log(bot_info);
    channel_log(bot_info);
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