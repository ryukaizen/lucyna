import { Client } from 'pg'
import { logger } from "../logger"
import constants from "../config"

export const database_client = new Client({
  host: constants.DB_HOST,
  port: constants.DB_PORT,
  database: constants.DB_NAME,
  user: constants.DB_USER,
  password: constants.DB_PASS,

});

export const connectDB = async() => {
  try {
      await database_client.connect()
      logger.info(`PostgreSQL connection established --> ${database_client.host}`)
  } catch (error) {
      logger.error(`while connecting to database: ${error}`)
      process.exit(1)
  }
}

export const disconnectDB = async() => {
    await database_client.end()
    logger.info(`PostgreSQL connection closed --> ${database_client.host}`)  
  }
