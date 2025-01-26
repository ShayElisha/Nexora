import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDb Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error connecting to MongoDb: ${error.message}`);
    process.exit(1); // process code 1 code means exit with failure, 0 means success
  }
};
