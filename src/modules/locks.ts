import { Composer } from "grammy";
import { adminCanRestrictUsers, botCanRestrictUsers } from "../helpers/helper_func";

const composer = new Composer();

composer.chatType(["supergroup", "group"]).command("locktypes", adminCanRestrictUsers(botCanRestrictUsers((async (ctx: any) => {
   
}))));

// composer.chatType(["supergroup", "group"]).command("lock", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
// })));

// composer.chatType(["supergroup", "group"]).command("unlock", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
// })));

// composer.chatType(["supergroup", "group"]).command("locks", adminCanRestrictUsers(botCanRestrictUsers(async (ctx: any) => {
// })));

export default composer;