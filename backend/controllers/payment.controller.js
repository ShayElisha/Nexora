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

export const createPaymentSession = async (req, res) => {
  try {
    const { plan_name, duration } = req.body;

    console.log(req.body);
    if (!plan_name || !duration) {
      return res
        .status(400)
        .json({ success: false, message: "Missing plan details" });
    }

    const plan = plans.find(
      (_plan) => _plan.plan_name === plan_name && _plan.duration === duration
    );
    if (!plan) {
      return res
        .status(400)
        .json({ success: false, message: "Plan not found" });
    }

    // Extract and verify JWT token
    const token = req.cookies["company_jwt"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Create a new Stripe Checkout session (without stripeCustomerId)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.plan_id, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment/completed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancelled?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        companyId: companyId,
        companyName: company.name,
        planName: plan_name,
        duration: duration,
      },
    });

    return res.status(200).json({ success: true, session });
  } catch (err) {
    console.error("Error creating payment session:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const savePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.subscription) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid session data" });
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
        refunded: false,
      });

      await payment.save();

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
        startDate: new Date(),
        endDate: new Date(subscription.current_period_end * 1000),
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
    const companyId = req.user.companyId;

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
        message: "You are already subscribed to this plan and duration",
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
      sessionId: `update_${updatedSubscription.id}_${Date.now()}`, // Unique ID since no Checkout session
      companyId,
      amount: amountPaid,
      currency: latestInvoice.currency,
      planName: plan_name,
      paymentDate: new Date(),
      startDate: new Date(updatedSubscription.current_period_start * 1000),
      endDate: new Date(updatedSubscription.current_period_end * 1000),
      refunded: false,
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: {
        planName: plan_name,
        duration: duration,
        subscriptionId: updatedSubscription.id,
        payment,
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
export const getLatestPayment = async (req, res) => {
  try {
    const { companyId } = req.params;
    const payment = await Payment.findOne({ companyId })
      .sort({ paymentDate: -1 }) // Latest payment first
      .exec();
    if (!payment) {
      return res.status(200).json({ success: true, payment: null });
    }
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error("Error fetching latest payment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
