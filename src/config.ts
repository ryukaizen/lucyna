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
    DB_HOST: str(),
    DB_PORT: port(),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASS: str(),
});

export default constants;