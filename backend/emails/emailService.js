import dotenv from "dotenv";
import { transporter } from "../config/lib/nodemailer.js";
import {
  createCompanyRegistrationEmail,
  createRegistrationEmployee,
  createCompanyApprovalEmail,
  createCombinedWelcomeInvoiceEmail,
  createSubscriptionEndingEmail,
  createProcurementEmail,
  createProcurementUpdateEmail,
} from "./emailHandlers.js";

// Load environment variables
dotenv.config();

export const sendCompanyRegistrationEmail = async (
  email,
  companyName,
  owner
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email, // Recipient's email address
      subject: "Company Registration Confirmation", // Subject of the email
      html: createCompanyRegistrationEmail(companyName, owner), // HTML content of the email
      category: "ERP Notifications", // Optional but helps categorize
    };

    const info = await transporter.sendMail(emailData);
    console.log("Email sent: " + info.response);
  } catch (error) {
    throw error;
  }
};
export const sendCompanyApprovalEmail = async (
  email,
  companyName,
  profileUrl
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Company Has Been Approved - UnLinked",
      html: createCompanyApprovalEmail(companyName, profileUrl),
    };

    const info = await transporter.sendMail(emailData);
    console.log("Company approval email sent: " + info.response);
  } catch (error) {
    console.error("Error sending company approval email:", error);
    throw error;
  }
};
export const SendRegistrationEmployee = async (
  email,
  companyName,
  profileUrl
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Company Has Been Approved - UnLinked",
      html: createRegistrationEmployee(companyName, profileUrl),
    };

    const info = await transporter.sendMail(emailData);
    console.log("Company approval email sent: " + info.response);
  } catch (error) {
    console.error("Error sending company approval email:", error);
    throw error;
  }
};
export const sendCombinedWelcomeInvoiceEmail = async (
  email,
  companyName,
  invoice
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to UnLinked & Invoice Details",
      html: createCombinedWelcomeInvoiceEmail(companyName, invoice),
    };

    const info = await transporter.sendMail(emailData);
    console.log("Welcome & Invoice Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending welcome & invoice email:", error);
    throw error;
  }
};

export const sendSubscriptionEndingEmail = async (email, companyName, name) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Subscription is Ending Soon - UnLinked",
      html: createSubscriptionEndingEmail(companyName, name),
    };

    const info = await transporter.sendMail(emailData);
    console.log("Subscription ending email sent: " + info.response);
  } catch (error) {
    console.error("Error sending subscription ending email:", error);
    throw error;
  }
};

export const sendProcurementEmailWithPDF = async (
  email,
  supplierName,
  companyName,
  purchaseOrderUrl,
  pdfBuffer
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Purchase Order from ${companyName}`,
      html: createProcurementEmail(supplierName, companyName, purchaseOrderUrl),
      attachments: [
        {
          filename: "PurchaseOrder.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(emailData);
    console.log("Procurement email sent with PDF: " + info.response);
  } catch (error) {
    console.error("Error sending procurement email with PDF:", error);
    throw error;
  }
};

export const sendProcurementUpdateEmail = async (
  email,
  supplierName,
  companyName,
  purchaseOrderUrl
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Purchase Order Update from ${companyName}`,
      html: createProcurementUpdateEmail(
        supplierName,
        companyName,
        purchaseOrderUrl
      ),
    };

    const info = await transporter.sendMail(emailData);
    console.log("Procurement update email sent: " + info.response);
  } catch (error) {
    console.error("Error sending procurement update email:", error);
    throw error;
  }
};
