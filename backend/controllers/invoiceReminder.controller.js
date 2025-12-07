import Invoice from "../models/invoice.model.js";
import Company from "../models/companies.model.js";
import Customer from "../models/customers.model.js";
import { transporter } from "../config/lib/nodemailer.js";
import { createPaymentInvoiceEmail } from "../emails/emailHandlers.js";

/**
 * Send reminder email for unpaid invoice
 */
const sendInvoiceReminderEmail = async (invoice, reminderType = "reminder") => {
  try {
    // Populate invoice if not already populated
    let populatedInvoice = invoice;
    if (!invoice.companyId?.name) {
      populatedInvoice = await Invoice.findById(invoice._id)
        .populate("customerId", "name email phone address")
        .populate("companyId", "name email phone address logo");
    }

    const company = populatedInvoice.companyId;
    const customer = populatedInvoice.customerId;

    // Determine recipient email - send to customer if exists, otherwise company
    let recipientEmail = null;
    let recipientName = null;

    if (customer && customer.email) {
      // Customer invoice - send to customer
      recipientEmail = customer.email;
      recipientName = customer.name;
    } else if (company && company.email) {
      // Company invoice - send to company
      recipientEmail = company.email;
      recipientName = company.name;
    }

    if (!recipientEmail) {
      console.warn(`⚠️ No email found for invoice ${invoice.invoiceNumber}, skipping reminder email`);
      return false;
    }

    const daysOverdue = invoice.dueDate 
      ? Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
      : 0;

    console.log(`📧 Sending ${reminderType} email to ${recipientEmail} for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`);

    // Generate PDF URL
    const baseUrl = process.env.NEXORA_API_URL || process.env.API_URL || "http://localhost:5000";
    const pdfUrl = invoice.pdfUrl || `${baseUrl}/api/invoices/${invoice._id}/pdf`;

    // Get logo URL
    const logoUrl = company?.logo 
      ? (company.logo.startsWith('http') ? company.logo : `${process.env.FRONTEND_URL || "http://localhost:5173"}${company.logo}`)
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/assets/logo.png`;

    // Create email HTML (reuse payment invoice template)
    const emailHTML = createPaymentInvoiceEmail(recipientName || company?.name || "Customer", invoice, pdfUrl, logoUrl);

    // Determine subject based on reminder type and days overdue
    let subject = `Nexora - Invoice Reminder: ${invoice.invoiceNumber}`;
    if (daysOverdue > 0) {
      subject = `Nexora - Overdue Invoice Reminder: ${invoice.invoiceNumber} (${daysOverdue} days overdue)`;
    } else if (daysOverdue === 0) {
      subject = `Nexora - Invoice Payment Due Today: ${invoice.invoiceNumber}`;
    } else {
      const daysUntilDue = Math.abs(daysOverdue);
      subject = `Nexora - Invoice Payment Reminder: ${invoice.invoiceNumber} (Due in ${daysUntilDue} days)`;
    }

    // Prepare email data
    const emailData = {
      from: process.env.EMAIL_USER || `Nexora <${process.env.EMAIL_FROM || 'noreply@nexora.com'}>`,
      to: recipientEmail,
      subject: subject,
      html: emailHTML,
    };

    // Add PDF attachment if PDF URL exists
    if (invoice.pdfUrl) {
      // PDF is already in Cloudinary, we can reference it
      // For now, we'll include the link in the email
      console.log(`📎 PDF available at: ${invoice.pdfUrl}`);
    }

    // Send email
    const info = await transporter.sendMail(emailData);
    console.log(`✅ Reminder email sent successfully to ${recipientEmail}`);
    console.log(`📧 Email message ID: ${info.messageId}`);

    // Update invoice with reminder info
    await Invoice.findByIdAndUpdate(invoice._id, {
      $inc: { remindersSent: 1 },
      $set: { lastReminderDate: new Date() },
      $push: {
        emailHistory: {
          sentAt: new Date(),
          recipient: recipientEmail,
          status: 'sent',
          messageId: info.messageId,
          type: 'reminder',
        },
      },
    });

    return true;
  } catch (error) {
    console.error("❌ Error sending invoice reminder email:", error);
    console.error("❌ Error message:", error.message);
    
    // Update email history with failed status
    try {
      await Invoice.findByIdAndUpdate(invoice._id, {
        $push: {
          emailHistory: {
            sentAt: new Date(),
            recipient: recipientEmail || 'unknown',
            status: 'failed',
            messageId: null,
            type: 'reminder',
          },
        },
      });
    } catch (updateError) {
      console.error("Error updating email history:", updateError);
    }
    
    return false;
  }
};

/**
 * Send reminders for unpaid invoices
 * - 7 days before due date
 * - On due date
 * - 3 days after due date
 * - Weekly for overdue invoices
 */
export const sendInvoiceReminders = async () => {
  try {
    console.log("📧 Sending invoice reminders...");
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let remindersSent = 0;

    // Find invoices that need reminders
    // 1. Invoices due in 7 days (first reminder)
    const invoicesDueSoon = await Invoice.find({
      status: { $nin: ["Paid", "Cancelled"] },
      paymentStatus: { $ne: "Paid" },
      dueDate: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
      // Only send if no reminder sent in last 7 days
      $or: [
        { lastReminderDate: { $exists: false } },
        { lastReminderDate: { $lt: sevenDaysAgo } },
      ],
    })
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");

    for (const invoice of invoicesDueSoon) {
      const sent = await sendInvoiceReminderEmail(invoice, "due_soon");
      if (sent) remindersSent++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 2. Invoices due today
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const invoicesDueToday = await Invoice.find({
      status: { $nin: ["Paid", "Cancelled"] },
      paymentStatus: { $ne: "Paid" },
      dueDate: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      // Only send if no reminder sent today
      $or: [
        { lastReminderDate: { $exists: false } },
        { lastReminderDate: { $lt: todayStart } },
      ],
    })
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");

    for (const invoice of invoicesDueToday) {
      const sent = await sendInvoiceReminderEmail(invoice, "due_today");
      if (sent) remindersSent++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Invoices overdue by 3 days
    const invoicesOverdue3Days = await Invoice.find({
      status: { $in: ["Overdue", "Sent"] },
      paymentStatus: { $ne: "Paid" },
      dueDate: {
        $gte: threeDaysAgo,
        $lt: now,
      },
      // Only send if no reminder sent in last 7 days
      $or: [
        { lastReminderDate: { $exists: false } },
        { lastReminderDate: { $lt: sevenDaysAgo } },
      ],
    })
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");

    for (const invoice of invoicesOverdue3Days) {
      const sent = await sendInvoiceReminderEmail(invoice, "overdue_3_days");
      if (sent) remindersSent++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Weekly reminders for invoices overdue more than 7 days
    const invoicesOverdueWeekly = await Invoice.find({
      status: "Overdue",
      paymentStatus: { $ne: "Paid" },
      dueDate: { $lt: sevenDaysAgo },
      // Only send if no reminder sent in last 7 days
      $or: [
        { lastReminderDate: { $exists: false } },
        { lastReminderDate: { $lt: sevenDaysAgo } },
      ],
    })
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");

    for (const invoice of invoicesOverdueWeekly) {
      const sent = await sendInvoiceReminderEmail(invoice, "overdue_weekly");
      if (sent) remindersSent++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Sent ${remindersSent} invoice reminder emails`);
    return remindersSent;
  } catch (error) {
    console.error("❌ Error sending invoice reminders:", error);
    return 0;
  }
};

