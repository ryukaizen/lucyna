import { logger } from "../logger"
import mongoose from "mongoose"

export const connectDB = async(uri : string)=>{
  try {
      const connection = await mongoose.connect(uri)
      const db = mongoose.connection
      db.once('open', () => {
        logger.info(`MongoDB connection established --> ${connection.connection.host}`)
      })     
  } catch (error) {
      logger.error(`Error connecting to database: ${error}`)
      // process.exit(1)
  }
}

export const disconnectDB = async()=>{
  await mongoose.disconnect()
}