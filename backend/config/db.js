import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection across serverless invocations (Vercel reuses the
// module scope between warm invocations, so we avoid opening a new
// connection on every request).
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export const connectDB = async () => {
  // Try MONGO_URI first, fallback to MONGODB_URI
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("❌ MongoDB URI not found in environment variables");
    console.error("Please set MONGO_URI or MONGODB_URI in .env file");
    // In serverless we must not kill the process; surface the error instead.
    if (process.env.VERCEL) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    process.exit(1);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri.trim(), {
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        console.log(
          `✅ MongoDb Connected: ${mongooseInstance.connection.host}`
        );
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.log(`❌ Error connecting to MongoDb: ${error.message}`);
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }

  return cached.conn;
};
