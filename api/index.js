// Vercel serverless entry point for the Nexora backend.
//
// The Express app is defined in backend/server.js (which exports it without
// calling app.listen() when running on Vercel). We ensure the database
// connection is established (and cached) before handling each request.
import app from "../backend/server.js";
import { connectDB } from "../backend/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ success: false, message: "Database connection failed" })
    );
    return;
  }
  return app(req, res);
}
