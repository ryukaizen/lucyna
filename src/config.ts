import * as dotenv from 'dotenv'
import { cleanEnv, str } from "envalid";

dotenv.config({ path: `${__dirname}/../.env` })

const constants = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ["trace", "debug", "info", "warn", "error", "fatal", "silent"], default: "info"
    }),
    LOG_CHANNEL: str(),
    BOT_TOKEN: str(),
    BOT_USERNAME: str(),
    MONGO_URL: str(),
});

export default constants;