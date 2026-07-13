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
  createProcurementDiscrepancyEmail,
  createPaymentFailedEmail,
  createSupplierInvoiceEmail,
  createBirthdayEmail,
  createMonthlyCashFlowSummary,
  createProcurementCancellationEmail,
  createWeeklySummaryEmail,
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
export const sendProcurementDiscrepancyEmail = async (
  email,
  supplierName,
  companyName,
  orderNumber,
  discrepancies
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Discrepancy in Purchase Order ${orderNumber}`,
      html: createProcurementDiscrepancyEmail(
        supplierName,
        companyName,
        orderNumber,
        discrepancies
      ),
      category: "ERP Notifications", // Optional category
    };

    const info = await transporter.sendMail(emailData);
    console.log("Procurement discrepancy email sent: " + info.response);
  } catch (error) {
    console.error("Error sending procurement discrepancy email:", error);
    throw error;
  }
};

export const sendPaymentFailedEmail = async (
  email,
  companyName,
  amount,
  invoiceUrl
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Payment Failed - Action Required",
      html: createPaymentFailedEmail(companyName, amount, invoiceUrl),
      category: "Payment Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Payment failed email sent: " + info.response);
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    throw error;
  }
};

export const sendSupplierInvoiceEmail = async (
  email,
  supplierName,
  companyName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  totalAmount,
  currency,
  invoiceUrl
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invoice ${invoiceNumber} from ${companyName}`,
      html: createSupplierInvoiceEmail(
        supplierName,
        companyName,
        invoiceNumber,
        invoiceDate,
        dueDate,
        totalAmount,
        currency,
        invoiceUrl
      ),
      category: "Procurement Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Supplier invoice email sent: " + info.response);
  } catch (error) {
    console.error("Error sending supplier invoice email:", error);
    throw error;
  }
};

/**
 * שליחת ברכת יום הולדת
 */
export const sendBirthdayEmail = async (
  email,
  employeeName,
  companyName,
  profileImageUrl = null
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `יום הולדת שמח! 🎉 - ${companyName}`,
      html: createBirthdayEmail(employeeName, companyName, profileImageUrl),
      category: "HR Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Birthday email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending birthday email:", error);
    throw error;
  }
};

/**
 * שליחת סיכום תזרים מזומנים חודשי
 */
export const sendMonthlyCashFlowSummary = async (
  email,
  companyName,
  month,
  year,
  cashFlowData,
  baseCurrency = "ILS"
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `סיכום תזרים מזומנים חודשי - ${month}/${year} - ${companyName}`,
      html: createMonthlyCashFlowSummary(companyName, month, year, cashFlowData, baseCurrency),
      category: "Finance Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Monthly cash flow summary email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending monthly cash flow summary email:", error);
    throw error;
  }
};

/**
 * שליחת הודעה על ביטול הזמנה לספק
 */
export const sendProcurementCancellationEmail = async (
  email,
  supplierName,
  companyName,
  orderNumber,
  orderDate,
  cancellationReason = null
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `ביטול הזמנת רכש #${orderNumber} - ${companyName}`,
      html: createProcurementCancellationEmail(
        supplierName,
        companyName,
        orderNumber,
        orderDate,
        cancellationReason
      ),
      category: "Procurement Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Procurement cancellation email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending procurement cancellation email:", error);
    throw error;
  }
};

/**
 * שליחת סיכום שבועי
 */
export const sendWeeklySummaryEmail = async (
  email,
  companyName,
  weekStart,
  weekEnd,
  summaryData
) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `סיכום שבועי - ${companyName}`,
      html: createWeeklySummaryEmail(companyName, weekStart, weekEnd, summaryData),
      category: "System Notifications",
    };

    const info = await transporter.sendMail(emailData);
    console.log("Weekly summary email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending weekly summary email:", error);
    throw error;
  }
};
