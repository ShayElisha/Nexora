import Stripe from "stripe";
import dotenv from "dotenv";
import { plans } from "../config/lib/payment.js";
import Payment from "../models/payment.model.js";
import Company from "../models/companies.model.js";
import Invoice from "../models/invoice.model.js";
import Notification from "../models/notification.model.js";
import jwt from "jsonwebtoken";
// TODO: add notify before end plan
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  sendCombinedWelcomeInvoiceEmail,
  sendSubscriptionEndingEmail,
} from "../emails/emailService.js";
import { transporter } from "../config/lib/nodemailer.js";
import { createPaymentInvoiceEmail } from "../emails/emailHandlers.js";
import puppeteer from "puppeteer";
import cron from "node-cron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY_TEST 
  ? new Stripe(process.env.STRIPE_SECRET_KEY_TEST)
  : null;

/**
 * Helper function: Get Invoice PDF URL from Stripe
 */
export const getInvoicePdfUrl = async (invoiceId) => {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.invoice_pdf; // URL של ה-PDF
  } catch (error) {
    console.error("Error retrieving invoice PDF:", error.message);
    throw error;
  }
};

/**
 * Generate invoice number for company
 */
const generateInvoiceNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Find the last invoice for this company in this year
  const lastInvoice = await Invoice.findOne({
    companyId,
    invoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ invoiceNumber: -1 })
    .select("invoiceNumber");

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(
      lastInvoice.invoiceNumber.replace(prefix, "")
    );
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

/**
 * Create invoice from payment automatically
 */
const createInvoiceFromPayment = async (payment, company, duration) => {
  try {
    console.log(`📝 Creating invoice from payment: ${payment._id}, company: ${company._id}`);
    
    if (!payment || !company) {
      throw new Error("Payment and company are required to create invoice");
    }
    
    const planName = payment.planName || company.subscription?.plan || "Basic";
    const planDuration = duration || company.subscription?.duration || "Monthly";
    
    // Use actual payment amount
    const invoiceAmount = payment.amount || 0;
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(company._id);
    
    // Create invoice item
    const invoiceItem = {
      description: `${planName} Plan - ${planDuration} Subscription`,
      quantity: 1,
      unitPrice: invoiceAmount,
      discount: 0,
      taxRate: 0,
      total: invoiceAmount,
    };
    
    // Create invoice
    const invoice = new Invoice({
      companyId: company._id,
      invoiceNumber,
      customerId: null, // Company invoice, no customer
      orderId: null,
      issueDate: payment.paymentDate || new Date(),
      dueDate: payment.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [invoiceItem],
      globalDiscount: {
        type: "percentage",
        value: 0,
      },
      taxRate: 0,
      notes: `Subscription invoice for ${planName} Plan - ${planDuration}. Payment ID: ${payment._id}${payment.isRecurring ? ` - Recurring Payment (Period ${payment.periodNumber})` : ''}`,
      paymentTerms: "Paid",
      createdBy: null, // Automatic creation
      status: "Paid",
      paymentStatus: "Paid",
      paidAmount: invoiceAmount,
      paymentDate: payment.paymentDate || new Date(),
      currency: payment.currency || "USD",
    });
    
    await invoice.save();
    console.log(`✅ Invoice ${invoiceNumber} (${invoice._id}) created automatically from payment ${payment._id}`);
    
    // Reload invoice to get calculated fields
    const savedInvoice = await Invoice.findById(invoice._id)
      .populate("companyId", "name email phone address logo");
    
    return savedInvoice || invoice;
  } catch (error) {
    console.error("❌ Error creating invoice from payment:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Generate HTML template for invoice (helper function for payment controller)
 */
const generateInvoiceHTMLForPayment = async (invoice) => {
  const company = invoice.companyId;
  const logo = company?.logo || "";
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #ddd; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .company-info { flex: 1; }
    .company-logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .invoice-number { font-size: 18px; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals-section { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${logo ? `<img src="${logo}" alt="Company Logo" class="company-logo" />` : ""}
        <h2>${company?.name || "Company Name"}</h2>
        ${company?.email ? `<p>Email: ${company.email}</p>` : ""}
        ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ""}
      </div>
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 20px;">
          <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items?.map(item => `
          <tr>
            <td>${item.description || ""}</td>
            <td class="text-right">${item.quantity || 1}</td>
            <td class="text-right">${invoice.currency || "USD"} ${item.unitPrice?.toFixed(2) || "0.00"}</td>
            <td class="text-right">${invoice.currency || "USD"} ${item.total?.toFixed(2) || "0.00"}</td>
          </tr>
        `).join("") || ""}
      </tbody>
    </table>
    <div class="totals-section">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${invoice.currency || "USD"} ${invoice.subtotal?.toFixed(2) || "0.00"}</span>
      </div>
      <div class="totals-row total">
        <span>Total:</span>
        <span>${invoice.currency || "USD"} ${invoice.totalAmount?.toFixed(2) || "0.00"}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send payment invoice email with PDF attachment
 */
const sendPaymentInvoiceEmail = async (company, invoice) => {
  try {
    console.log(`📧 Sending invoice email to ${company.email} for invoice ${invoice.invoiceNumber}`);
    
    if (!company.email) {
      console.warn(`⚠️ Company ${company.name} has no email address, skipping email send`);
      return;
    }
    
    // Generate PDF buffer
    let pdfBuffer = null;
    try {
      const html = await generateInvoiceHTMLForPayment(invoice);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await browser.close();
      console.log(`✅ PDF buffer generated successfully (${pdfBuffer.length} bytes)`);
    } catch (pdfError) {
      console.error("❌ Error generating PDF buffer, sending email without attachment:", pdfError.message);
    }
    
    // Generate PDF URL (still include in email as backup)
    const baseUrl = process.env.NEXORA_API_URL || process.env.API_URL || "http://localhost:5000";
    const pdfUrl = `${baseUrl}/api/invoices/${invoice._id}/pdf`;
    
    // Get logo URL from company or use default
    const logoUrl = company.logo 
      ? (company.logo.startsWith('http') ? company.logo : `${process.env.FRONTEND_URL || "http://localhost:5173"}${company.logo}`)
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/assets/logo.png`;
    
    // Create email HTML
    const emailHTML = createPaymentInvoiceEmail(company.name, invoice, pdfUrl, logoUrl);
    
    // Prepare email data with PDF attachment if available
    const emailData = {
      from: process.env.EMAIL_USER || `Nexora <${process.env.EMAIL_FROM || 'noreply@nexora.com'}>`,
      to: company.email,
      subject: `Nexora - Invoice ${invoice.invoiceNumber}`,
      html: emailHTML,
    };

    // Add PDF attachment if buffer is available
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
      console.log(`📎 PDF attachment added to email`);
    }
    
    const info = await transporter.sendMail(emailData);
    console.log(`✅ Invoice email sent successfully to ${company.email}`);
    console.log(`📧 Email message ID: ${info.messageId}`);
    
  } catch (error) {
    console.error("❌ Error sending payment invoice email:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    // Don't throw - email failure shouldn't break the payment flow
  }
};

export const getAllPlans = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createPaymentSession = async (req, res) => {
  try {
    const { plan_name, duration } = req.body;

    console.log("Payment request body:", req.body);
    console.log("User from request:", req.user);
    
    if (!plan_name || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing plan details",
        error: "Plan name and duration are required"
      });
    }

    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res.status(400).json({ 
        success: false, 
        message: "Plan not found",
        error: `No plan found with name "${plan_name}" and duration "${duration}"`
      });
    }

    // Get company ID from the authenticated user or company token
    let companyId = req.user?.companyId;
    
    // If no user, try to get companyId from cookies (auth_token or company_jwt)
    if (!companyId) {
      const token = req.cookies["auth_token"] || req.cookies["company_jwt"];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          companyId = decoded.companyId;
          console.log("Company ID from cookie token:", companyId);
        } catch (error) {
          console.error("Error decoding cookie token:", error.message);
        }
      }
    }
    
    console.log("Final companyId:", companyId);
    
    if (!companyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Company ID not found",
        error: "Please ensure you are logged in with a valid company account"
      });
    }

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found",
        error: `No company found with ID: ${companyId}`
      });
    }

    // Create a new Stripe Checkout session
    // IMPORTANT: subscription_data.metadata ensures metadata is passed to subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.plan_id, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment/completed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing-plans`,
      metadata: {
        companyId: companyId.toString(),
        companyName: company.name,
        planName: plan_name,
        duration: duration,
      },
      subscription_data: {
        metadata: {
          companyId: companyId.toString(),
          planName: plan_name,
          duration: duration,
        },
      },
    });

    console.log("Payment session created successfully:", session.id);
    return res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("Error creating payment session:", err.message);
    console.error("Full error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: err.message
    });
  }
};

export const savePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID is required",
        error: "Missing session ID in request"
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid session",
        error: "Could not retrieve session from Stripe"
      });
    }
    
    if (!session.subscription) {
      return res.status(400).json({ 
        success: false, 
        message: "No subscription in session",
        error: "Payment session does not contain subscription information"
      });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    const {
      companyId,
      planName,
      duration,
      isUpgradeFlow,
      originalSubscriptionId,
    } = session.metadata;

    // IMPORTANT: Update subscription metadata if not already set
    // This ensures webhooks can find the companyId
    if (!subscription.metadata?.companyId && companyId) {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          companyId: companyId.toString(),
          planName: planName || subscription.metadata?.planName,
          duration: duration || subscription.metadata?.duration,
        },
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed yet" });
    }

    if (isUpgradeFlow === "true" && originalSubscriptionId) {
      // Handle subscription update
      // Update the existing subscription in Stripe (if needed)
      await stripe.subscriptions.update(originalSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: plans.find(
              (p) => p.plan_name === planName && p.duration === duration
            ).plan_id,
          },
        ],
        proration_behavior: "create_prorations",
      });

      // Update Company model
      company.subscription.plan = planName;
      company.subscription.duration = duration;
      company.subscription.subscriptionId = originalSubscriptionId; // Keep the original subscription ID
      await company.save();

      // Create a new Payment record for the update
      const payment = new Payment({
        sessionId,
        companyId,
        amount: session.amount_total / 100,
        currency: session.currency,
        planName,
        paymentDate: new Date(),
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        invoiceId: subscription.latest_invoice,
        subscriptionId: subscription.id,
        paymentIntentId: session.payment_intent,
        isRecurring: false, // This is an upgrade, not a recurring payment
        periodNumber: 1,
        paymentStatus: 'succeeded',
        refunded: false,
      });

      await payment.save();

      // Create invoice automatically and send email
      try {
        console.log(`📝 Creating invoice automatically for payment: ${payment._id}`);
        const invoice = await createInvoiceFromPayment(payment, company, duration);
        console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
        
        // Send email with invoice
        await sendPaymentInvoiceEmail(company, invoice);
      } catch (invoiceError) {
        console.error("❌ Error creating invoice/sending email (payment still saved):", invoiceError.message);
        // Don't fail the payment if invoice creation fails
      }

      return res.status(200).json({
        success: true,
        message: "Subscription updated and payment recorded successfully",
        payment,
        company,
      });
    } else {
      // Handle new subscription (existing logic)
      const payment = new Payment({
        sessionId,
        companyId,
        amount: session.amount_total / 100,
        currency: session.currency,
        planName,
        paymentDate: new Date(),
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        invoiceId: subscription.latest_invoice,
        subscriptionId: subscription.id,
        paymentIntentId: session.payment_intent,
        isRecurring: false, // First payment is not recurring
        periodNumber: 1, // First payment
        paymentStatus: 'succeeded',
        refunded: false,
      });

      await payment.save();

      company.subscription = {
        plan: planName,
        paymentStatus: "Paid",
        subscriptionId: subscription.id,
        duration,
      };
      await company.save();

      // Create invoice automatically and send email
      try {
        console.log(`📝 Creating invoice automatically for payment: ${payment._id}`);
        const invoice = await createInvoiceFromPayment(payment, company, duration);
        console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
        
        // Send email with invoice
        await sendPaymentInvoiceEmail(company, invoice);
      } catch (invoiceError) {
        console.error("❌ Error creating invoice/sending email (payment still saved):", invoiceError.message);
        // Don't fail the payment if invoice creation fails
      }

      return res.status(200).json({
        success: true,
        message: "New subscription payment saved successfully",
        payment,
        company,
      });
    }
  } catch (err) {
    console.error("Error saving payment:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get invoices for a company
export const getCompanyInvoices = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Retrieve all invoices from Stripe for this customer
    const invoices = await stripe.invoices.list({
      customer: company.stripeCustomerId,
    });

    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.log("Error in getCompanyInvoices controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error getting company invoices",
      error: error.message,
    });
  }
};

export const updateCompanyPlan = async (req, res) => {
  try {
    const { plan_name, duration } = req.body;
    
    if (!plan_name || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: "Plan name and duration are required",
        error: "Missing required fields"
      });
    }
    
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Company ID not found",
        error: "Please ensure you are logged in"
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found",
        error: `No company found with ID: ${companyId}`
      });
    }

    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not found" });
    }

    if (
      company.subscription.plan === plan_name &&
      company.subscription.duration === duration
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this plan and duration",
      });
    }

    // Check if there's an existing subscription and if it's valid
    let existingSubscription = null;
    if (company.subscription.subscriptionId) {
      try {
        existingSubscription = await stripe.subscriptions.retrieve(
          company.subscription.subscriptionId
        );
      } catch (error) {
        console.log("Existing subscription not found or invalid:", error.message);
        // If subscription doesn't exist, we'll create a new one
        existingSubscription = null;
      }
    }

    let updatedSubscription;

    if (existingSubscription && existingSubscription.status === 'active') {
      // Update existing active subscription
      if (!existingSubscription.items.data || existingSubscription.items.data.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No subscription items found to update",
        });
      }

      updatedSubscription = await stripe.subscriptions.update(
        company.subscription.subscriptionId,
        {
          items: [
            {
              id: existingSubscription.items.data[0].id,
              price: plan.plan_id,
            },
          ],
          proration_behavior: "create_prorations",
          metadata: {
            companyId: companyId.toString(),
            planName: plan_name,
            duration: duration,
            isUpgradeFlow: "true",
          },
        }
      );
    } else {
      // Create new subscription (no existing subscription or it's invalid)
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.name,
        metadata: {
          companyId: companyId.toString(),
        },
      });

      updatedSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.plan_id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          companyId: companyId.toString(),
          planName: plan_name,
          duration: duration,
          isUpgradeFlow: "true",
        },
      });
    }

    // Update Company model
    company.subscription.plan = plan_name;
    company.subscription.subscriptionId = updatedSubscription.id;
    company.subscription.paymentStatus = "Paid";
    await company.save();

    // For subscription updates, we don't need to create a new Payment record
    // The original payment record remains valid
    // We only update the company's subscription details

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: {
        planName: plan_name,
        duration: duration,
        subscriptionId: updatedSubscription.id,
      },
    });
  } catch (error) {
    console.error("Error in updateCompanyPlan:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subscription",
      error: error.message,
    });
  }
};
/**
 * Cancel subscription for a company
 * - If within 7 business days of creation => immediately cancel (and optionally refund)
 * - Otherwise => cancel at period end
 */
export const cancelCompanySubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      company.subscription.subscriptionId
    );
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Stripe subscription not found",
      });
    }

    // 7-business-day logic:
    // We'll approximate 7 business days as 7 * 24 hours from current_period_start
    const subscriptionStartMs = subscription.current_period_start * 1000; // epoch -> ms
    const nowMs = Date.now();
    const differenceInDays =
      (nowMs - subscriptionStartMs) / (1000 * 60 * 60 * 24);

    if (differenceInDays <= 7) {
      // If within 7 days => immediate cancellation
      // Optionally create a refund if you want to automatically refund
      const refund = await stripe.refunds.create({
        payment_intent: subscription.latest_invoice.payment_intent,
      });
      // e.g., find the last invoice or payment_intent, then call stripe.refunds.create(...)
      await stripe.subscriptions.del(subscription.id);

      // Update your DB subscription info if desired
      company.subscription.paymentStatus = "Canceled";
      await company.save();

      return res.status(200).json({
        success: true,
        message: "Subscription canceled and refunded.",
        refund: refund,
      });
    } else {
      // Otherwise => schedule cancellation at period end
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.id,
        {
          cancel_at_period_end: true,
        }
      );

      // Update your DB subscription info if desired
      company.subscription.paymentStatus = "Pending Cancel";
      await company.save();

      return res.status(200).json({
        success: true,
        message: "Subscription will end at period end.",
        subscription: updatedSubscription,
      });
    }
  } catch (error) {
    console.log(
      "Error in cancelCompanySubscription controller:",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "Error canceling company subscription",
      error: error.message,
    });
  }
};

/**
 * Resume subscription for a company
 * - Unpause if previously paused
 * - Also remove `cancel_at_period_end` if it was set
 */
export const resumeCompanySubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      company.subscription.subscriptionId
    );
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Stripe subscription not found",
      });
    }

    // To truly resume a paused/canceled subscription:
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        pause_collection: null, // unsets pause
        cancel_at_period_end: false, // ensures it doesn't cancel at the end of the period
      }
    );

    company.subscription.paymentStatus = "Paid"; // or "Active"
    await company.save();

    return res.status(200).json({
      success: true,
      message: "Subscription resumed successfully",
    });
  } catch (error) {
    console.log(
      "Error in resumeCompanySubscription controller:",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "Error resuming company subscription",
      error: error.message,
    });
  }
};

/**
 * Pause subscription for a company
 * - Use Stripe's pause_collection
 */
export const pauseCompanySubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      company.subscription.subscriptionId
    );
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Stripe subscription not found",
      });
    }

    // Properly pause with 'void' or 'mark_uncollectible' behavior
    // 'void' means no further invoices will be generated or attempts to collect payment
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        pause_collection: {
          behavior: "void",
        },
      }
    );

    company.subscription.paymentStatus = "Paused";
    await company.save();

    return res.status(200).json({
      success: true,
      message: "Subscription paused successfully",
    });
  } catch (error) {
    console.log("Error in pauseCompanySubscription controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error pausing company subscription",
      error: error.message,
    });
  }
};

const checkAndNotifySubscriptionsEndingSoon = async () => {
  try {
    console.log("Starting subscription ending check...");

    const today = new Date();
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 7 ימים במילישניות

    // שליפת כל המנויים הפעילים מ-Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
    });

    // סינון מנויים שתאריך הסיום שלהם בטווח 7 ימים מהיום
    const subscriptionsEndingSoon = subscriptions.data.filter(
      (subscription) => {
        const endDate = new Date(subscription.current_period_end * 1000);
        return endDate >= today && endDate <= oneWeekLater; // בטווח שבוע
      }
    );

    if (subscriptionsEndingSoon.length === 0) {
      console.log("No subscriptions ending soon found.");
      return;
    }

    // שליחת מייל לכל מנוי שסיום המנוי שלו בטווח 7 ימים
    for (const subscription of subscriptionsEndingSoon) {
      const endDate = new Date(subscription.current_period_end * 1000);
      const customer = await stripe.customers.retrieve(subscription.customer); // שליפת פרטי הלקוח
      const email = customer.email;
      const companyName =
        customer.metadata.companyName ||
        customer.business_name ||
        "Unknown Company";
      const name = customer.name || "Customer"; // שם הלקוח

      // לוג אם שם החברה לא נמצא
      if (companyName === "Unknown Company") {
        console.warn(
          `Warning: Company name not found for customer ${customer.id}. Using fallback.`
        );
      }

      console.log(
        `Processing subscription for company: ${companyName}, Customer: ${name}, Email: ${email}`
      );

      // יצירת הודעה ייחודית עבור המנוי
      const message = `Reminder: Your subscription for ${companyName} is ending soon on ${endDate.toLocaleDateString()}.`;

      // בדיקה אם כבר נשלחה התראה דומה ב-7 הימים האחרונים
      const existingNotification = await Notification.findOne({
        companyId: customer.metadata.companyId || "unknown", // הנחה שיש companyId ב-metadata
        employeeId: customer.id, // משתמש ב-customer ID כתחליף ל-employeeId
        content: message,
        type: "SubscriptionReminder",
        createdAt: { $gte: new Date(today - oneWeekInMs) }, // ב-7 הימים האחרונים
      });

      if (!existingNotification) {
        try {
          // שליחת המייל
          await sendSubscriptionEndingEmail(email, companyName, name);
          console.log(`Notification email sent to ${email}`);

          // שמירת ההתראה ב-DB כדי למנוע כפילות
          const notification = new Notification({
            companyId: customer.metadata.companyId || "unknown",
            content: message,
            type: "SubscriptionReminder",
            employeeId: customer.id, // שימוש ב-customer ID כמזהה
          });
          await notification.save();
        } catch (emailError) {
          console.error(
            `Failed to send notification email to ${email}: ${emailError.message}`
          );
        }
      } else {
        console.log(
          `Notification already sent to ${email} within the last 7 days. Skipping.`
        );
      }
    }

    console.log("Finished processing subscriptions.");
  } catch (error) {
    console.error("Error in subscription ending check:", error.message);
  }
};

// תזמון הרצה כל שעה
cron.schedule("0 * * * *", async () => {
  await checkAndNotifySubscriptionsEndingSoon();
});

/**
 * Handle Stripe Webhook Events
 * This is critical for tracking recurring payments
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      case 'invoice.created':
        // Optional: Log invoice creation
        console.log('Invoice created:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful payment (including recurring payments)
 */
const handleSuccessfulPayment = async (invoice) => {
  try {
    if (!invoice.subscription) {
      console.log('Invoice has no subscription, skipping');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const companyId = subscription.metadata?.companyId;

    if (!companyId) {
      console.error('No companyId in subscription metadata');
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`Company not found: ${companyId}`);
      return;
    }

    // Check if this is a recurring payment (not the first one)
    const existingPayments = await Payment.find({ 
      subscriptionId: subscription.id 
    }).sort({ periodNumber: -1 });

    const isRecurring = existingPayments.length > 0;
    const periodNumber = isRecurring 
      ? existingPayments[0].periodNumber + 1 
      : 1;

    // Check if payment already exists (prevent duplicates)
    const existingPayment = await Payment.findOne({ invoiceId: invoice.id });
    if (existingPayment) {
      console.log(`Payment for invoice ${invoice.id} already exists`);
      return;
    }

    // Create payment record
    const payment = new Payment({
      sessionId: `webhook_${invoice.id}_${Date.now()}`,
      companyId,
      amount: invoice.amount_paid / 100, // Convert cents to dollars
      currency: invoice.currency,
      planName: subscription.metadata?.planName || company.subscription?.plan,
      paymentDate: new Date(invoice.created * 1000),
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      paymentIntentId: invoice.payment_intent,
      isRecurring,
      periodNumber,
      paymentStatus: 'succeeded',
      refunded: false,
    });

    await payment.save();

    // Update company subscription status
    company.subscription.paymentStatus = 'Paid';
    company.subscription.endDate = new Date(subscription.current_period_end * 1000);
    await company.save();

    // Create invoice automatically and send email
    try {
      console.log(`📝 Creating invoice automatically for recurring payment: ${payment._id}`);
      const duration = subscription.metadata?.duration || company.subscription?.duration || "Monthly";
      const invoice = await createInvoiceFromPayment(payment, company, duration);
      console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
      
      // Send email with invoice
      await sendPaymentInvoiceEmail(company, invoice);
    } catch (invoiceError) {
      console.error("❌ Error creating invoice/sending email (payment still saved):", invoiceError.message);
      // Don't fail the payment if invoice creation fails
    }

    console.log(`Payment recorded: ${payment._id} for company ${companyId}, period ${periodNumber}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handleFailedPayment = async (invoice) => {
  try {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const companyId = subscription.metadata?.companyId;

    if (!companyId) {
      console.error('No companyId in subscription metadata');
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`Company not found: ${companyId}`);
      return;
    }

    // Update company subscription status
    company.subscription.paymentStatus = 'Failed';
    company.subscription.lastPaymentAttempt = new Date();
    company.subscription.failedAttempts = (company.subscription.failedAttempts || 0) + 1;
    await company.save();

    // Send notification email
    try {
      const { sendPaymentFailedEmail } = await import('../emails/emailService.js');
      await sendPaymentFailedEmail(
        company.email,
        company.name,
        invoice.amount_due / 100,
        invoice.hosted_invoice_url
      );
    } catch (emailError) {
      console.error('Error sending payment failed email:', emailError);
    }

    console.log(`Payment failed for company ${companyId}, invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};

/**
 * Handle subscription update
 */
const handleSubscriptionUpdate = async (subscription) => {
  try {
    const companyId = subscription.metadata?.companyId;
    if (!companyId) {
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`Company not found: ${companyId}`);
      return;
    }

    // Update subscription details
    if (subscription.status === 'active') {
      company.subscription.paymentStatus = 'Paid';
    } else if (subscription.status === 'past_due') {
      company.subscription.paymentStatus = 'Failed';
    } else if (subscription.status === 'canceled') {
      company.subscription.paymentStatus = 'Canceled';
    } else if (subscription.status === 'paused') {
      company.subscription.paymentStatus = 'Paused';
    }

    company.subscription.endDate = new Date(subscription.current_period_end * 1000);
    await company.save();

    console.log(`Subscription updated for company ${companyId}: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
};

/**
 * Handle subscription cancellation
 */
const handleSubscriptionCancellation = async (subscription) => {
  try {
    const companyId = subscription.metadata?.companyId;
    if (!companyId) {
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      console.error(`Company not found: ${companyId}`);
      return;
    }

    company.subscription.paymentStatus = 'Canceled';
    await company.save();

    console.log(`Subscription canceled for company ${companyId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
};

/**
 * Sync all subscriptions with Stripe (daily job)
 */
export const syncSubscriptionsWithStripe = async () => {
  try {
    console.log('Starting subscription sync with Stripe...');
    
    const companies = await Company.find({ 
      'subscription.subscriptionId': { $exists: true, $ne: null } 
    });

    let synced = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          company.subscription.subscriptionId
        );

        // Update payment status based on Stripe status
        if (subscription.status === 'active') {
          company.subscription.paymentStatus = 'Paid';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          company.subscription.paymentStatus = 'Failed';
        } else if (subscription.status === 'canceled') {
          company.subscription.paymentStatus = 'Canceled';
        } else if (subscription.status === 'paused') {
          company.subscription.paymentStatus = 'Paused';
        }

        // Update end date
        company.subscription.endDate = new Date(subscription.current_period_end * 1000);
        await company.save();

        synced++;
      } catch (error) {
        console.error(`Error syncing company ${company._id}:`, error.message);
        errors++;
      }
    }

    console.log(`Subscription sync completed: ${synced} synced, ${errors} errors`);
  } catch (error) {
    console.error('Error in syncSubscriptionsWithStripe:', error);
  }
};

// Schedule daily sync at 2 AM
cron.schedule("0 2 * * *", async () => {
  await syncSubscriptionsWithStripe();
});

export const updateCompanyPlanFromAdmin = async (req, res) => {
  try {
    const { plan_name, duration, companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    if (!company.subscription.subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No existing subscription found for this company",
      });
    }

    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not found" });
    }

    if (
      company.subscription.plan === plan_name &&
      company.subscription.duration === duration
    ) {
      return res.status(400).json({
        success: false,
        message: "Company is already subscribed to this plan and duration",
      });
    }

    const subscription = await stripe.subscriptions.retrieve(
      company.subscription.subscriptionId
    );

    if (!subscription.items.data || subscription.items.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No subscription items found to update",
      });
    }

    // Update the subscription directly
    const updatedSubscription = await stripe.subscriptions.update(
      company.subscription.subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: plan.plan_id,
          },
        ],
        proration_behavior: "create_prorations",
        metadata: {
          companyId: companyId.toString(),
          planName: plan_name,
          duration: duration,
          isUpgradeFlow: "true",
        },
      }
    );

    // Update Company model
    company.subscription.plan = plan_name;
    company.subscription.duration = duration;
    await company.save();

    // Calculate prorated amount (if any)
    const latestInvoice = await stripe.invoices.retrieve(
      updatedSubscription.latest_invoice
    );
    const amountPaid = latestInvoice.amount_paid / 100; // Convert cents to dollars

    // Create a new Payment record
    const payment = new Payment({
      sessionId: `admin_update_${updatedSubscription.id}_${Date.now()}`, // Unique ID since no Checkout session
      companyId,
      amount: amountPaid,
      currency: latestInvoice.currency,
      planName: plan_name,
      paymentDate: new Date(),
      startDate: new Date(updatedSubscription.current_period_start * 1000),
      endDate: new Date(updatedSubscription.current_period_end * 1000),
      invoiceId: latestInvoice.id,
      subscriptionId: updatedSubscription.id,
      paymentIntentId: latestInvoice.payment_intent,
      isRecurring: false, // Admin update, not recurring
      periodNumber: 1,
      paymentStatus: 'succeeded',
      refunded: false,
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully from admin",
      data: {
        planName: plan_name,
        duration: duration,
        subscriptionId: updatedSubscription.id,
        payment,
        company: {
          _id: company._id,
          name: company.name,
          subscription: company.subscription
        }
      },
    });
  } catch (error) {
    console.error("Error in updateCompanyPlanFromAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating subscription from admin",
      error: error.message,
    });
  }
};

/**
 * Retry payment for failed subscription
 */
export const retryPayment = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    // Try to get companyId from cookies if not in user
    if (!companyId) {
      const token = req.cookies["auth_token"] || req.cookies["company_jwt"];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          companyId = decoded.companyId;
        } catch (error) {
          console.error("Error decoding token in retryPayment:", error.message);
        }
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company ID not found",
        error: "Please ensure you are logged in with a valid company account"
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check if payment actually failed
    if (company.subscription.paymentStatus !== 'Failed') {
      return res.status(400).json({
        success: false,
        message: "No failed payment to retry",
        error: `Current payment status: ${company.subscription.paymentStatus}`
      });
    }

    // Get plan details from company or request body
    const { plan_name, duration } = req.body;
    const planName = plan_name || company.subscription.plan || "Basic";
    const planDuration = duration || "Monthly";

    // Check if there's an existing subscription in Stripe
    if (company.subscription.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          company.subscription.subscriptionId
        );
        
        // If subscription exists and has open invoice, try to pay it
        if (subscription.latest_invoice) {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
          
          if (invoice.status === 'open' || invoice.status === 'past_due') {
            // Create new checkout session for retry
            const plan = plans.find(
              (p) => p.plan_name === planName && p.duration === planDuration
            );
            
            if (!plan) {
              return res.status(400).json({
                success: false,
                message: "Plan not found",
                error: `No plan found with name "${planName}" and duration "${planDuration}"`
              });
            }

            const session = await stripe.checkout.sessions.create({
              mode: "subscription",
              payment_method_types: ["card"],
              line_items: [{ price: plan.plan_id, quantity: 1 }],
              success_url: `${process.env.CLIENT_URL}/payment/completed?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${process.env.CLIENT_URL}/pricing-plans?retry=true`,
              customer: subscription.customer,
              subscription_data: {
                metadata: {
                  companyId: companyId.toString(),
                  planName: planName,
                  duration: planDuration,
                  isRetry: "true",
                },
              },
              metadata: {
                companyId: companyId.toString(),
                companyName: company.name,
                planName: planName,
                duration: planDuration,
                isRetry: "true",
              },
            });

            return res.status(200).json({
              success: true,
              session,
              message: "Payment retry session created"
            });
          }
        }
      } catch (stripeError) {
        // If subscription doesn't exist or is invalid, create new one
        console.log("Existing subscription not valid, creating new:", stripeError.message);
      }
    }

    // Create new payment session (same as createPaymentSession)
    const plan = plans.find(
      (p) => p.plan_name === planName && p.duration === planDuration
    );
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan not found",
        error: `No plan found with name "${planName}" and duration "${planDuration}"`
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.plan_id, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment/completed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing-plans?retry=true`,
      metadata: {
        companyId: companyId.toString(),
        companyName: company.name,
        planName: planName,
        duration: planDuration,
        isRetry: "true",
      },
      subscription_data: {
        metadata: {
          companyId: companyId.toString(),
          planName: planName,
          duration: planDuration,
          isRetry: "true",
        },
      },
    });

    console.log("Retry payment session created successfully:", session.id);
    return res.status(200).json({
      success: true,
      session,
      message: "Payment retry session created"
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrying payment",
      error: error.message
    });
  }
};

export const getLatestPayment = async (req, res) => {
  try {
    let companyId;
    
    // If params is "current", get from token
    if (req.params.companyId === "current") {
      companyId = req.user?.companyId;
      console.log("Getting payment for current company from middleware:", companyId);
    } else {
      // Get companyId from authenticated user or URL params
      companyId = req.user?.companyId || req.params.companyId;
    }
    
    // If still no companyId, try to decode from cookies
    if (!companyId) {
      const token = req.cookies["auth_token"] || req.cookies["company_jwt"];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          companyId = decoded.companyId;
          console.log("Company ID from cookie in getLatestPayment:", companyId);
        } catch (error) {
          console.error("Error decoding token in getLatestPayment:", error.message);
        }
      }
    }
    
    if (!companyId) {
      console.log("No company ID found. Cookies:", Object.keys(req.cookies));
      return res.status(400).json({ 
        success: false, 
        message: "Company ID is required",
        error: "Could not identify company from request. Please ensure you are logged in."
      });
    }
    
    console.log("Final company ID for payment fetch:", companyId);
    
    // Get the company's current subscription info
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found" 
      });
    }

    // Get the latest payment record
    const payment = await Payment.findOne({ companyId })
      .sort({ paymentDate: -1 }) // Latest payment first
      .exec();
    
    if (!payment) {
      return res.status(200).json({ 
        success: true, 
        payment: null,
        currentPlan: company.subscription?.plan || "Free"
      });
    }

    // Return payment with current subscription info from company
    return res.status(200).json({ 
      success: true, 
      payment: {
        ...payment.toObject(),
        planName: company.subscription?.plan || payment.planName,
        paymentStatus: company.subscription?.paymentStatus || "Pending"
      }
    });
  } catch (error) {
    console.error("Error fetching latest payment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get all payments for SuperAdmin (all companies)
 * This endpoint allows SuperAdmin to view all payment transactions
 */
export const getAllPaymentsForSuperAdmin = async (req, res) => {
  try {
    const {
      companyId,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    // Filter by company if specified
    if (companyId) {
      query.companyId = companyId;
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate("companyId", "name email phone address logo")
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Payment.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching all payments for SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};
