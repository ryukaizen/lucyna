import {
  Composer as LibComposer,
  Context,
  type HearsMiddleware,
  Middleware,
  NextFunction,
} from "grammy";
import {
  ChatTypeContext,
  HearsContext,
  MaybeArray,
  StringWithSuggestions,
} from "grammy/out/context";
import { Chat } from "grammy/types";

type MaybePromise<T> = T | Promise<T>;

function pass<C extends Context>(_ctx: C, next: NextFunction) {
  return next();
};

class Composer<C extends Context> extends LibComposer<C> {
  hears(
    trigger: MaybeArray<string | RegExp>,
    ...middleware: Array<HearsMiddleware<C>>
  ): Composer<HearsContext<C>> {
    return this.filter(Context.has.text(trigger), ...middleware);
  }

  /**
   * Registers middleware that will be executed when a specified command is found.
   * Supports custom command prefixes and multiple command triggers.
   * ```ts
   * // Reacts to /start commands with default prefixes ("/" and "!")
   * bot.onCommand('start', ctx => { ... })
   * // Reacts to /help commands with custom prefixes
   * bot.onCommand({ command: 'help', prefixes: ['#', '!', '/'] }, ctx => { ... })
   * // Reacts to both /start and /help commands
   * bot.onCommand(['start', 'help'], ctx => { ... })
   * ```
   * **Custom prefixes**: This method allows you to specify custom prefixes for your commands.
   * By default, it listens for commands starting with `/` and `!`, but you can supply
   * any array of strings as prefixes. For instance:
   * ```ts
   * bot.onCommand({ command: 'start', prefixes: ['#', '$'] }, ctx => {
   *   // Reacts to "#start" or "$start" commands
   * })
   * ```
   *
   * **Multiple commands**: You can register multiple commands at once by passing an array.
   * ```ts
   * bot.onCommand(['start', 'help'], ctx => {
   *   // Reacts to both "/start" and "/help" commands
   * })
   * ```
   * The rest of the message (excluding the command, and trimmed) is provided
   * via `ctx.match`.
   *
   * > **Did you know?** You can use deep linking
   * > (https://core.telegram.org/bots/features#deep-linking) to let users
   * > start your bot with a custom payload. For example, you can send someone
   * > the link https://t.me/name-of-your-bot?start=custom-payload and register a
   * > start command handler on your bot with grammY. As soon as the user
   * > starts your bot, you will receive `custom-payload` in the `ctx.match`
   * > property!
   * > ```ts
   * > bot.onCommand('start', ctx => {
   * >   const payload = ctx.match // will be 'custom-payload'
   * > })
   * > ```
   *
   * Note that commands are not matched in captions or in the middle of the
   * text.
   * ```ts
   * bot.onCommand('start', ctx => { ... })
   * // ... does not match:
   * // A message saying: “some text /start some more text”
   * // A photo message with the caption “/start”
   * ```
   *
   * If you need more flexibility in matching your commands (such as more complex
   * regex matching or custom prefix behavior), you can continue using this
   * `onCommand` method or check out additional plugins for command handling.
   *
   * @param handler - Can be a string, an array of strings, or an object that contains:
   *   - `command`: The string(s) representing the command to look for.
   *   - `prefixes`: Optional, an array of prefixes (e.g., `['/', '#']`) that will be used to detect the command. Defaults to `["/", "!"]`.
   * @param middleware The middleware to register
   */
  onCommand(
    handler:
      | {
          command: MaybeArray<StringWithSuggestions<string>>;
          prefixes?: string[];
        }
      | MaybeArray<StringWithSuggestions<string>>,
    ...middleware: Array<HearsMiddleware<C>>
  ): Composer<HearsContext<C>> {
    let commandStr: string;
    let prefixes = ["/", "!"];
    if (typeof handler === "object" && !Array.isArray(handler)) {
      if (Array.isArray(handler.command)) {
        commandStr = handler.command.join("|");
      } else {
        commandStr = handler.command;
      }
      prefixes = handler.prefixes ? handler.prefixes : prefixes;
    } else {
      commandStr = Array.isArray(handler) ? handler.join("|") : handler;
    }

    const prefixStr = prefixes.map((prefix: any) => `\\${prefix}`).join("|");
    const regex = new RegExp(`^(?:${prefixStr})(${commandStr})(?:\\s|$)`, "i");
    return this.hears(regex, ...middleware);
  }

  /**
   * Registers some middleware for certain chat types only. For example, you
   * can use this method to only receive updates from private chats. The four
   * chat types are `"channel"`, `"supergroup"`, `"group"`, and `"private"`.
   * This is especially useful when combined with other filtering logic. For
   * example, this is how can you respond to `/start` commands only from
   * private chats:
   * ```ts
   * bot.onChat("private").command("start", ctx => { ... })
   * ```
   *
   * Naturally, you can also use this method on its own.
   * ```ts
   * // Private chats only
   * bot.onChat("private", ctx => { ... });
   * // Channels only
   * bot.onChat("channel", ctx => { ... });
   * ```
   *
   * You can pass an array of chat types if you want your middleware to run
   * for any of several provided chat types.
   * ```ts
   * // Groups and supergroups only
   * bot.oChat(["group", "supergroup"], ctx => { ... });
   * ```
   * [Remember](https://grammy.dev/guide/context#shortcuts) also that you
   * can access the chat type via `ctx.chat.type`.
   *
   * @param chatType The chat type
   * @param middleware The middleware to register
   */
  onChat<T extends Chat["type"]>(
    chatType: MaybeArray<T>,
    ...middleware: Array<Middleware<ChatTypeContext<C, T>>>
  ): Composer<ChatTypeContext<C, T>> {
    return this.filter(Context.has.chatType(chatType), ...middleware);
  }

  filter<D extends C>(
    predicate: (ctx: C) => ctx is D,
    ...middleware: Array<Middleware<D>>
  ): Composer<D>;
  filter(
    predicate: (ctx: C) => MaybePromise<boolean>,
    ...middleware: Array<Middleware<C>>
  ): Composer<C>;
  filter(
    predicate: (ctx: C) => MaybePromise<boolean>,
    ...middleware: Array<Middleware<C>>
  ): Composer<C> {
    const composer = new Composer(...middleware);
    this.branch(predicate, composer, pass);
    return composer;
  }
};

export { Composer };