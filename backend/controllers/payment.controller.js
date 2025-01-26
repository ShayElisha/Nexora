import Stripe from "stripe";
import dotenv from "dotenv";
import { plans } from "../config/lib/payment.js";
import Payment from "../models/payment.model.js";
import Company from "../models/companies.model.js";
import jwt from "jsonwebtoken";
// TODO: add notify before end plan
import axios from "axios";
import fs from "fs";
import path from "path";
import {
  sendCombinedWelcomeInvoiceEmail,
  sendSubscriptionEndingEmail,
} from "../emails/emailService.js";
import cron from "node-cron";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

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

/**
 * Unified function to handle payment creation, saving details, and sending emails.
 */
export const handlePayment = async (req, res) => {
  try {
    const { plan_name, duration, sessionId } = req.body;

    // Step 1: Validate the selected plan
    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not found" });
    }

    // Step 2: Extract and verify JWT token
    const token = req.cookies["company_jwt"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // Step 3: Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    let session;

    // If no sessionId is provided, create a new Stripe Checkout session
    if (!sessionId) {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.plan_id,
            quantity: 1,
          },
        ],
        customer: company.stripeCustomerId || undefined, // Attach existing customer if available
        success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          companyId: companyId,
          companyName: company.name,
          planName: plan_name,
          duration: duration,
        },
      });

      return res.status(200).json({ success: true, session });
    }

    // Step 4: If sessionId exists, process the payment
    session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Stripe session not found" });
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    if (session.payment_status === "paid") {
      // Save payment details
      const payment = new Payment({
        sessionId,
        companyId,
        stripeCustomerId: company.stripeCustomerId,
        amount: session.amount_total / 100,
        currency: session.currency,
        planName: plan_name,
        startDate: new Date(),
        endDate: new Date(subscription.current_period_end * 1000),
      });

      await payment.save();

      // Update company subscription details
      company.subscription.plan = plan_name;
      company.subscription.paymentStatus = "Paid";
      company.subscription.subscriptionId = subscription.id;
      await company.save();

      // Get the invoice PDF URL
      const invoicePdfUrl = await getInvoicePdfUrl(subscription.latest_invoice);

      // Generate invoice data
      const invoiceData = {
        companyId,
        planName: plan_name,
        amount: session.amount_total / 100,
        currency: session.currency,
        paymentDate: new Date(),
        invoicePdfUrl,
      };

      // Send welcome email with the invoice attached
      await sendCombinedWelcomeInvoiceEmail(company.email, company.name, {
        ...invoiceData,
        invoiceId: subscription.latest_invoice,
      });

      return res.status(200).json({
        success: true,
        message: "Payment saved successfully and email sent.",
        payment,
        company,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed." });
    }
  } catch (err) {
    console.error("Error handling payment:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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

/**
 * Update plan for a company (Stripe + MongoDB)
 * - This updates the subscription item to the new price on Stripe
 * - Then updates your DB accordingly
 */
export const updateCompanyPlan = async (req, res) => {
  try {
    const { plan_name, duration } = req.body;
    const companyId = req.user.companyId;

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Retrieve the current plan for the company
    const currentPlan = company.subscription.plan;
    if (currentPlan === plan_name) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this plan",
      });
    }

    // Find the corresponding plan details in your local 'plans' array
    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not found" });
    }

    // Retrieve the Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(
      company.subscription.subscriptionId
    );
    if (!subscription) {
      return res
        .status(400)
        .json({ success: false, message: "Stripe subscription not found" });
    }

    // Typically, there's one item in the subscription, so we grab the first item
    const subscriptionItemId = subscription.items.data[0].id;

    // Update the subscription item on Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        proration_behavior: "create_prorations", // or "none", or as you see fit
        items: [
          {
            id: subscriptionItemId,
            price: plan.plan_id,
          },
        ],
      }
    );

    // Update the company record in MongoDB
    company.subscription.plan = plan_name;
    // Optionally also update subscription endDate if needed
    await company.save();

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
    });
  } catch (error) {
    console.log("Error in updateCompanyPlan controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating company plan",
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

    // שליפת כל המנויים הפעילים מ-Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
    });

    subscriptions.data.forEach((subscription) => {
      const endDate = new Date(subscription.current_period_end * 1000);
    });

    // סינון מנויים שתאריך הסיום שלהם בטווח 7 ימים מהיום
    const subscriptionsEndingSoon = subscriptions.data.filter(
      (subscription) => {
        const endDate = new Date(subscription.current_period_end * 1000);
        return endDate >= today && endDate <= oneWeekLater; // בטווח שבוע
      }
    );

    if (subscriptionsEndingSoon.length === 0) {
      return;
    }

    subscriptionsEndingSoon.forEach((subscription) => {
      const endDate = new Date(subscription.current_period_end * 1000);
    });

    // שליחת מייל לכל מנוי שסיום המנוי שלו בטווח 7 ימים
    for (const subscription of subscriptionsEndingSoon) {
      const customer = await stripe.customers.retrieve(subscription.customer); // שליפת פרטי הלקוח
      const email = customer.email;
      const companyName =
        customer.metadata.companyName ||
        customer.business_name ||
        "Unknown Company";

      // לוג אם שם החברה לא נמצא
      if (companyName === "Unknown Company") {
        console.warn(
          `Warning: Company name not found for customer ${customer.id}. Using fallback.`
        );
      }

      const name = customer.name || "Customer"; // שם הלקוח

      console.log(
        `Processing subscription for company: ${companyName}, Customer: ${name}, Email: ${email}`
      );

      try {
        await sendSubscriptionEndingEmail(email, companyName, name);
        console.log(`Notification email sent to ${email}`);
      } catch (emailError) {
        console.error(
          `Failed to send notification email to ${email}: ${emailError.message}`
        );
      }
    }

    console.log("Finished processing subscriptions.");
  } catch (error) {
    console.error("Error in subscription ending check:", error.message);
  }
};

cron.schedule("*/1 * * * *", async () => {
  await checkAndNotifySubscriptionsEndingSoon();
});
