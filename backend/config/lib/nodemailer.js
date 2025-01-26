import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// transporter to send emails
export const transporter = nodemailer.createTransport({
  service: "Gmail", // You can change this to another service provider if needed
  auth: {
    user: process.env.EMAIL_USER, // Your email address from environment variables
    pass: process.env.EMAIL_PASS, // Your email password from environment variables
  },
});
