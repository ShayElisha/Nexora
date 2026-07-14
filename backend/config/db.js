import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Cache the connection across serverless / Fluid invocations.
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    const message =
      "MongoDB URI not found. Set MONGO_URI (or MONGODB_URI) in environment variables.";
    console.error(`❌ ${message}`);
    // Never process.exit on Vercel / production — that kills the whole service
    // and surfaces as FUNCTION_INVOCATION_FAILED / opaque 404s to the client.
    throw new Error(message);
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
    throw error;
  }

  return cached.conn;
};

export const isDbConnected = () =>
  mongoose.connection.readyState === 1 || Boolean(cached.conn);
