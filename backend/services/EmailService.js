import dotenv from "dotenv";
import { transporter } from "../config/lib/nodemailer.js";

dotenv.config();

/**
 * שליחת מייל כללי
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  cc,
  bcc,
  attachments,
  companyId,
}) => {
  try {
    const emailData = {
      from: process.env.EMAIL_USER,
      to,
      subject,
    };

    // תוכן המייל
    if (html) {
      emailData.html = html;
    }
    if (text) {
      emailData.text = text;
    }

    // נמענים נוספים
    if (cc) {
      emailData.cc = cc;
    }
    if (bcc) {
      emailData.bcc = bcc;
    }

    // קבצים מצורפים
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }

    const info = await transporter.sendMail(emailData);
    console.log(`✉️ Email sent to ${to}: ${subject}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * שליחת מייל תזכורת
 */
export const sendReminderEmail = async ({
  to,
  subject,
  reminderType,
  data,
  companyId,
}) => {
  const templates = {
    delivery_late: `
      <h2>תזכורת: משלוח באיחור</h2>
      <p>שלום,</p>
      <p>הזמנת רכש <strong>${data.PurchaseOrder}</strong> הייתה אמורה להגיע ב-${data.deliveryDate}.</p>
      <p>נא לעדכן על מצב המשלוח.</p>
      <p>תודה,<br>צוות ${data.companyName || "Nexora"}</p>
    `,
    payment_due: `
      <h2>תזכורת תשלום</h2>
      <p>שלום,</p>
      <p>התשלום עבור חשבונית מספר <strong>${data.invoiceNumber}</strong> בסכום <strong>${data.amount}</strong> ${data.currency || "ILS"} מגיע ב-${data.dueDate}.</p>
      <p>אנא וודא שהתשלום יבוצע במועד.</p>
      <p>תודה,<br>צוות ${data.companyName || "Nexora"}</p>
    `,
    task_overdue: `
      <h2>משימה באיחור</h2>
      <p>שלום ${data.assigneeName},</p>
      <p>המשימה "<strong>${data.taskTitle}</strong>" הייתה אמורה להיות מושלמת ב-${data.dueDate}.</p>
      <p>נא לטפל בנושא בהקדם.</p>
      <p>תודה,<br>צוות ${data.companyName || "Nexora"}</p>
    `,
    order_shipped: `
      <h2>ההזמנה שלך נשלחה! 📦</h2>
      <p>שלום ${data.customerName},</p>
      <p>ההזמנה שלך (מספר <strong>${data.orderNumber}</strong>) נשלחה!</p>
      ${data.trackingNumber ? `<p>מספר מעקב: <strong>${data.trackingNumber}</strong></p>` : ""}
      <p>תאריך אספקה משוער: ${data.estimatedDelivery}</p>
      <p>תודה על הרכישה!</p>
    `,
  };

  const html = templates[reminderType] || data.customTemplate;

  return await sendEmail({
    to,
    subject,
    html,
    companyId,
  });
};

export default {
  sendEmail,
  sendReminderEmail,
};

