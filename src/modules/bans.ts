import bot from "../bot";
import { checkElevatedUser, entityExtractor, elevatedUsersOnly, userInfo } from "../helpers/helper_func";

bot.chatType("supergroup" || "group").command("ban", elevatedUsersOnly(async (ctx: any) => {
    const user_info = await userInfo(ctx);
    if (user_info.user.can_restrict_members == false) {
        await ctx.reply("You do not have rights to ban users.", {reply_parameters: {message_id: ctx.message.message_id}});
        return;
    }
    else {
        if (ctx.message.reply_to_message != undefined) {
            if (ctx.message.reply_to_message.from.id == bot.botInfo.id) {
                await ctx.reply("Imagine making me ban myself...", {reply_parameters: {message_id: ctx.message.message_id}});
                return;    
            }
            else if (ctx.message.reply_to_message.from.id == ctx.from.id) {
                await ctx.reply("Imagine trying to ban yourself...", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
            else if (await checkElevatedUser(ctx) == false) {
                await ctx.reply("Whoops, can't ban elevated users!", {reply_parameters: {message_id: ctx.message.message_id}}); 
                return;   
            }
            else {
                let ban_message = `User has been banned!\n`;
                if (ctx.match) {
                    let ban_reason = ctx.match;
                    ban_message += `Reason: ${ban_reason}`;
                }
                try {
                  await ctx.api.banChatMember(ctx.chat.id, ctx.message.reply_to_message.from.id);
                }
                catch (error) {
                  await ctx.reply("Failed to ban user")
                }
                finally {
                  await ctx.reply(ban_message);
                }
              }
            }
 
        else {
            if (ctx.match) {
                const userids = await entityExtractor(ctx);
                if (Object.keys(userids).length == 1) {
                  try {
                    await ctx.api.banChatMember(ctx.chat.id, userids[0]);
                  }
                  catch (error){
                    await ctx.reply("Failed to ban user: Invalid user ID / username");
                  }
                  finally {
                    await ctx.reply("User has been banned!")
                  }
                }
                else if (Object.keys(userids).length > 1) {
                    await ctx.reply("Bulk banning users...")
                    for (let i = 0; i < userids.length; i++) {
                      try {
                            await ctx.api.banChatMember(ctx.chat.id, userids[i]);
                      }
                      catch (error) {
                        // return for now
                        return;
                      }
                      finally {
                        // future pr: make object of banned users then print all those at once
                        await ctx.reply("Users banned successfully!")
                      }
                      
                    }
                }
                else {
                    await ctx.reply("Failed to ban: Invalid or no user IDs / usernames!", {reply_parameters: {message_id: ctx.message.message_id}});
                    return;
                }
            }
                    
            else {        
                await ctx.reply("Please type the user id or username next to /ban command or reply to a message with /ban command.", {reply_parameters: {message_id: ctx.message.message_id}});
                return;
            }
        }
    }
}));