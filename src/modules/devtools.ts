import { Composer, InlineKeyboard } from "grammy";
import { superusersOnly } from "../helpers/helper_func";
import { grammyErrorLog } from "../logger";
import { get_all_users } from "../database/users_sql";

const composer = new Composer();

composer.chatType(["supergroup", "group", "private"]).command("snipe", superusersOnly(async (ctx: any) => {
    let args = ctx.match;
    let split_args = args.split(" ");
    let chat_id = split_args[0];
    let text = split_args.slice(1).join(" ");

    if (chat_id && text) {
        await ctx.api.sendMessage(chat_id, text, {parse_mode: "HTML"})
        .then(() => {
            ctx.reply(`Succcc-cess!`, {reply_parameters: {message_id: ctx.message.message_id}, parse_mode: "HTML"});   
        })
        .catch((GrammyError: any) => {
            ctx.reply("Lmao error. Check logs dawg.");
            grammyErrorLog(ctx, GrammyError);
        })
    }
}));

const keyboard = new InlineKeyboard()
.text("Cancel Broadcast", "cancel_broadcast");

composer.command("broadcast", superusersOnly(async (ctx: any) => {
    let RATE_LIMIT = 5; // messages per second
    let STATUS_UPDATE_INTERVAL = 5000; // 5 seconds

    let message = ctx.match;
    if (!message) {
        await ctx.reply("Please provide a message to broadcast.");
        return;
    }

    let users = await get_all_users();
    let success_count = 0;
    let fail_count = 0;
    let last_status_update = 0;
    
    let status_message = await ctx.reply(
        `Broadcasting to <code>${users.length}</code> users. This may take a while...`,
        { reply_markup: keyboard, parse_mode: "HTML" }
    );

    let update_status = async (force = false) => {
        let now = Date.now();
        if (force || now - last_status_update >= STATUS_UPDATE_INTERVAL) {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                status_message.message_id,
                `Broadcasting: ${success_count + fail_count}/${users.length}\nSuccess: ${success_count}\nFailed: ${fail_count}`,
                { reply_markup: keyboard }
            );
            last_status_update = now;
        }
    };

    let broadcast_queue = async () => {
        let batch_size = Math.min(RATE_LIMIT, users.length);
        let batch = users.splice(0, batch_size);
        let batch_start = Date.now();

        for (let user_id of batch) {
            try {
                await ctx.api.sendMessage(user_id, message);
                success_count++;
            } catch (error) {
                console.error(`Failed to send message to user ${user_id}:`, error);
                fail_count++;
            }

        await update_status();

        let batch_duration = Date.now() - batch_start;
        let delay_before_next_batch = Math.max(0, 1000 - batch_duration);

        if (users.length > 0) {
            setTimeout(broadcast_queue, delay_before_next_batch);
        } else {
            await update_status(true);
            await ctx.api.editMessageText(
                ctx.chat!.id,
                status_message.message_id,
                `Broadcast complete.\nSuccess: ${success_count}\nFailed: ${fail_count}`
            );
        }
    };

    broadcast_queue();
}
}));


export default composer;