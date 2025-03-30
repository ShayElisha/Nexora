import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const chatController = {
  async handleChat(req, res) {
    const { message } = req.body;
    const token = req.cookies["auth_token"];

    if (!token) return res.status(401).json({ reply: "לא מורשה" });

    let companyId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      companyId = new mongoose.Types.ObjectId(decoded.companyId);
    } catch (error) {
      return res.status(401).json({ reply: "טוקן לא תקין" });
    }

    if (!message) return res.status(400).json({ reply: "אנא שלח הודעה" });

    try {
      const requestBody = { message, companyId: companyId.toString() };
      console.log("Request body being sent:", requestBody);
      const response = await axios.post(
        "http://localhost:8000/chat",
        requestBody,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Cookie: `auth_token=${token}`,
          },
        }
      );
      console.log("Received response from Python:", response.data);
      const reply = response.data.reply;
      res.json({ reply });
    } catch (error) {
      console.error("שגיאה בצ'אט:", error.message);
      console.error(
        "Full error details:",
        error.response ? error.response.data : error
      );
      return res
        .status(500)
        .json({ reply: "שגיאה בתקשורת עם השרת: " + error.message });
    }
  },
};

export default chatController;
