import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Logger } from "telegram/extensions"
import constants from "./config";

const logger = new Logger()
const stringSession = constants.GRAMJS_STRING_SESSION; 
const apiId = constants.GRAMJS_API_ID;
const apiHash = constants.GRAMJS_API_HASH;

export const gramjs = new TelegramClient(new StringSession(stringSession), Number(apiId), apiHash, { connectionRetries: 7, baseLogger: logger });
export const gramJsApi = Api;