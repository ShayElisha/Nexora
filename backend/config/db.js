import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    // Try MONGO_URI first, fallback to MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ MongoDB URI not found in environment variables");
      console.error("Please set MONGO_URI or MONGODB_URI in .env file");
      process.exit(1);
    }
    
    const conn = await mongoose.connect(mongoUri.trim());
    console.log(`✅ MongoDb Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ Error connecting to MongoDb: ${error.message}`);
    process.exit(1); // process code 1 code means exit with failure, 0 means success
  }
};
