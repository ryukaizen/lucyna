import * as dotenv from 'dotenv'
import { cleanEnv, str, port } from "envalid";

dotenv.config({ path: `${__dirname}/../.env` })

const constants = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ["trace", "debug", "info", "warn", "error", "fatal", "silent"], default: "info"
    }),
    LOG_CHANNEL: str(),
    BOT_TOKEN: str(),
    BOT_USERNAME: str(),
    OWNER_ID: str(),
    SUPERUSERS: str(),
    START_GIF: str(),
    ADDED_TO_CHAT_GIF: str(),
    DATABASE_URL: str(),
    REDIS_CACHE_URL: str(),
    GRAMJS_API_ID: str(),
    GRAMJS_API_HASH: str(),
    GRAMJS_STRING_SESSION: str()
});

export default constants;