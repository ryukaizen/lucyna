import { Composer } from "grammy";
import { get_blacklist } from "../database/blacklist_sql";
import { adminCanRestrictUsers, botCanRestrictUsers } from "../helpers/helper_func";

const composer = new Composer();

async function blacklist(ctx: any) {
    let blacklist = await get_blacklist(ctx.match.toString());
    let filter_list = `Current blacklisted words in <b>${ctx.chat.title}</b>:\n`;

    // for (let trigger in blacklist) {
    //     
    // }
    
}

// composer.chatType("supergroup" || "group").command(["blacklist", "blacklists"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
//     await blacklist(ctx);
// })));

// composer.chatType("supergroup" || "group").command("addblacklist", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
//     
// })));

// composer.chatType("supergroup" || "group").command(["unblacklist", "rmblacklist"], adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
//     
// })));

// composer.chatType("supergroup" || "group").command("blacklistmode", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
//     
// })));

// composer.on(["message", "edited_message"], (async (ctx: any, next) => {
//         
// }));

export default composer;