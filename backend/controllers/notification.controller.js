// backend/controllers/notification.controller.js
// מרכז כל פונקציות ההתראות במערכת
import Procurement from "../models/procurement.model.js";
import Notification from "../models/notification.model.js";
import Budget from "../models/budget.model.js";
import Event from "../models/events.model.js";
import Company from "../models/companies.model.js";
import Employee from "../models/employees.model.js";
import Inventory from "../models/inventory.model.js";
import Task from "../models/tasks.model.js";
import Project from "../models/project.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Finance from "../models/finance.model.js";
import ProcurementProposal from "../models/ProcurementProposal.model.js";
import PerformanceReview from "../models/performanceReview.model.js";
import Lead from "../models/Lead.model.js";
import ProductionOrder from "../models/ProductionOrder.model.js";
import Warehouse from "../models/warehouse.model.js";
import Shift from "../models/Shifts.model.js";
import Salary from "../models/Salary.model.js";
import Invoice from "../models/invoice.model.js";
import Suppliers from "../models/suppliers.model.js";
import Customer from "../models/customers.model.js";
import Activity from "../models/Activity.model.js";
import jwt from "jsonwebtoken";
import cron from "node-cron";

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * יצירת התראה
 */
const createNotification = async ({
  companyId,
  employeeId,
  title,
  content,
  type = "Info",
  category,
  priority = "medium",
  relatedEntity = null,
  actionUrl = null,
  actionLabel = null,
  metadata = null,
  PurchaseOrder = null,
}) => {
  try {
    const notification = new Notification({
      companyId,
      employeeId,
      title,
      content,
      type,
      category,
      priority,
      relatedEntity,
      actionUrl,
      actionLabel,
      metadata,
      PurchaseOrder,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * התראות לכל Admins & Managers
 */
export const notifyAdminsAndManagers = async ({
  companyId,
  title,
  content,
  type = "Info",
  category,
  priority = "medium",
  relatedEntity = null,
  actionUrl = null,
  actionLabel = null,
  metadata = null,
  dedupe = null,
}) => {
  const adminsAndManagers = await Employee.find({
    companyId,
    role: { $in: ["Admin", "Manager"] },
    status: "active",
  }).select("_id");

  const notifications = [];
  for (const employee of adminsAndManagers) {
    if (dedupe?.enabled) {
      const skip = await shouldSkipNotification({
        companyId,
        employeeId: employee._id,
        category,
        title: dedupe.titleOverride || title,
        relatedEntity: dedupe.relatedEntityOverride || relatedEntity,
        hours: dedupe.hours ?? 24,
      });

      if (skip) {
        continue;
      }
    }

    const notification = await createNotification({
      companyId,
      employeeId: employee._id,
      title,
      content,
      type,
      category,
      priority,
      relatedEntity,
      actionUrl,
      actionLabel,
      metadata,
    });
    notifications.push(notification);
  }
  return notifications;
};

/**
 * התראות רק ל-Admins
 */
const notifyAdmins = async ({
  companyId,
  title,
  content,
  type = "Info",
  category,
  priority = "medium",
  relatedEntity = null,
  actionUrl = null,
  actionLabel = null,
  metadata = null,
  dedupe = null,
}) => {
  const admins = await Employee.find({
    companyId,
    role: "Admin",
    status: "active",
  }).select("_id");

  const notifications = [];
  for (const admin of admins) {
    if (dedupe?.enabled) {
      const skip = await shouldSkipNotification({
        companyId,
        employeeId: admin._id,
        category,
        title: dedupe.titleOverride || title,
        relatedEntity: dedupe.relatedEntityOverride || relatedEntity,
        hours: dedupe.hours ?? 24,
      });

      if (skip) {
        continue;
      }
    }

    const notification = await createNotification({
      companyId,
      employeeId: admin._id,
      title,
      content,
      type,
      category,
      priority,
      relatedEntity,
      actionUrl,
      actionLabel,
      metadata,
    });
    notifications.push(notification);
  }
  return notifications;
};

/**
 * בדיקת כפילויות גנרית להתראות
 */
const shouldSkipNotification = async ({
  companyId,
  employeeId = null,
  category,
  title = null,
  relatedEntity = null,
  hours = 24,
}) => {
  const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000);
  const query = {
    companyId,
    category,
    createdAt: { $gte: timeWindow },
  };

  if (employeeId) {
    query.employeeId = employeeId;
  }

  if (title) {
    query.title = title;
  }

  if (relatedEntity?.entityId) {
    query["relatedEntity.entityId"] = relatedEntity.entityId;
  }

  if (relatedEntity?.entityType) {
    query["relatedEntity.entityType"] = relatedEntity.entityType;
  }

  const existing = await Notification.findOne(query);
  return Boolean(existing);
};

// ========================
// EXISTING FUNCTIONS (IMPROVED)
// ========================

/**
 * בדיקת חתימות ממתינות (IMPROVED)
 */
const checkPendingSignaturesLogic = async (companyId) => {
  try {
    const now = new Date();
    const procurements = await Procurement.find({
      status: { $ne: "completed" },
      companyId: companyId,
    });

    const notifications = [];

    for (const procurement of procurements) {
      const { currentSignerIndex, signers, PurchaseOrder } = procurement;
      const currentSigner = signers.find(
        (signer) => signer.order === currentSignerIndex
      );
      
      if (!currentSigner || currentSigner.hasSigned) continue;

      const timeSinceLastTurn =
        now - new Date(currentSigner.timeStamp || procurement.createdAt);
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (timeSinceLastTurn >= oneDayInMs) {
        const isDuplicate = await shouldSkipNotification({
          companyId,
          employeeId: currentSigner.employeeId,
          category: "procurement",
          title: "⏰ תזכורת: חתימה ממתינה",
          relatedEntity: {
            entityType: "PurchaseOrder",
            entityId: PurchaseOrder,
          },
          hours: 24,
        });

        if (!isDuplicate) {
          const notification = await createNotification({
            companyId,
            employeeId: currentSigner.employeeId,
            title: "⏰ תזכורת: חתימה ממתינה",
            content: `הזמנת רכש ${PurchaseOrder} ממתינה לחתימתך מעל 24 שעות`,
            type: "Reminder",
            category: "procurement",
            priority: "high",
            relatedEntity: {
              entityType: "PurchaseOrder",
              entityId: PurchaseOrder,
            },
            actionUrl: `/dashboard/procurement`,
            actionLabel: "צפה בהזמנה",
            PurchaseOrder, // לתאימות לאחור
          });

          notifications.push(notification);
          currentSigner.timeStamp = now;
          await procurement.save();
        } 
      } 
    }

    return notifications;
  } catch (error) {
    console.error("Error checking pending signatures:", error);
    throw error;
  }
};

// HTTP controller to check pending signatures
export const checkPendingSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];
 

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;

  try {
    const notifications = await checkPendingSignaturesLogic(companyId);

    res.status(200).json({
      success: true,
      message: "Notifications created for pending signatures",
      notifications,
    });
  } catch (error) {
    console.error("Error in checkPendingSignatures:", error);
    res.status(500).json({
      success: false,
      message: "Error checking pending signatures",
      error: error.message,
    });
  }
};

// HTTP controller to get admin notifications
export const getAdminNotifications = async (req, res) => {
  const token = req.cookies["auth_token"];


  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("Unauthorized: Invalid token", err.message);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;

  try {
    const notifications = await Notification.find({
      companyId: companyId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin notifications",
      error: error.message,
    });
  }
};

// פונקציה נפרדת ללוגיקה עסקית לבדיקה של חתימות תקציב
const checkPendingBudgetSignaturesLogic = async (companyId) => {
  try {
    const now = new Date();


    const budgets = await Budget.find({
      status: { $ne: "Approved" },
      companyId: companyId,
    });

    const notifications = [];
    const oneDayInMs = 60 * 1000 * 60 * 24; // 24 hours in milliseconds

    for (const budget of budgets) {
      const { currentSignerIndex, signers, departmentOrProjectName } = budget;

      const currentSigner = signers.find(
        (signer) => signer.order === currentSignerIndex
      );
      if (!currentSigner || currentSigner.hasSigned) {
        continue;
      }

      const timeSinceLastTurn =
        now - new Date(currentSigner.timeStamp || budget.createdAt);
     

      if (timeSinceLastTurn >= oneDayInMs) {
        // Check for existing notification in the last 24 hours
        const existingNotification = await Notification.findOne({
          companyId: companyId,
          employeeId: currentSigner.employeeId,
          budgetName: departmentOrProjectName,
          type: "Reminder",
          createdAt: { $gte: new Date(now - oneDayInMs) },
        });
        console.log(
          `Existing notification check for budget ${departmentOrProjectName}:`,
          existingNotification
        );

        if (!existingNotification) {
          const message = `The signer ${currentSigner.name} has not signed the budget for ${departmentOrProjectName} after 24 hours.`;

          const notification = new Notification({
            companyId: companyId,
            content: message,
            type: "Reminder",
            employeeId: currentSigner.employeeId,
            budgetName: departmentOrProjectName,
          });

          await notification.save();
          notifications.push(notification);

          // Reset timestamp to prevent repeated notifications
          currentSigner.timeStamp = now;
          await budget.save();

        }
      } 
    }

    return notifications;
  } catch (error) {
    console.error("Error checking pending budget signatures:", error);
    throw error;
  }
};

// HTTP controller to check pending budget signatures
export const checkPendingBudgetSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];


  if (!token) {
    console.log("Unauthorized: No token provided");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("Unauthorized: Invalid token", err.message);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;

  try {
    const notifications = await checkPendingBudgetSignaturesLogic(companyId);

    res.status(200).json({
      success: true,
      message: "Notifications created for pending budget signatures",
      notifications,
    });
  } catch (error) {
    console.error("Error in checkPendingBudgetSignatures:", error);
    res.status(500).json({
      success: false,
      message: "Error checking pending budget signatures",
      error: error.message,
    });
  }
};

cron.schedule("*/1 * * * *", async () => {
  try {
    const companies = await Company.find(); // קבלת כל החברות

    for (const company of companies) {
      const companyId = company._id;

      try {
        const procurementNotifications = await checkPendingSignaturesLogic(
          companyId
        );

        const budgetNotifications = await checkPendingBudgetSignaturesLogic(
          companyId
        );
      } catch (error) {
        console.error(`Error in company ${companyId} cron job:`, error);
      }
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

export const deleteNotification = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId; // מזהה החברה מהטוקן
    const { notificationId } = req.body; // מזהה ההודעה למחיקה

    const notification = await Notification.findOne({
      _id: notificationId,
      companyId: companyId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found or you do not have permission to delete it",
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};
export const markNotificationAsRead = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const { notificationId } = req.body;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, companyId: companyId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};
export const markNotificationAsReadAll = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;

    // ✅ עדכון כל ההתראות של החברה לסימון כנקראו
    const result = await Notification.updateMany(
      { companyId: companyId, isRead: false }, // רק ההתראות שלא נקראו
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
};

cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const result = await Notification.deleteMany({
      expirationDate: { $lt: now },
    });
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error);
  }
});
const reminderEventsLogic = async (companyId) => {
  try {
    // הגדרת הזמנים לצורך השוואות
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000; // 2 שעות במילישניות
    const oneDay = 24 * 60 * 60 * 1000; // 24 שעות במילישניות

    // שליפת האירועים של החברה הרצויה
    const events = await Event.find({ companyId });
    const notifications = [];

    // מעבר על כל אירוע
    for (const event of events) {
      // נבנה אובייקט Date שמגלם את התאריך והשעה של האירוע
      const startDateTime = new Date(event.startDate);

      // אם יש ערך בשדה startTime (פורמט "HH:MM"), נמיר ונגדיר על האובייקט
      if (event.startTime) {
        const [hour, minute] = event.startTime.split(":").map(Number);
        startDateTime.setHours(hour, minute, 0, 0);
      }

      // מחשבים כמה זמן נשאר עד תחילת האירוע
      const timeUntilStart = startDateTime - now;

      // אם האירוע כבר התחיל או עבר (timeUntilStart <= 0) - לא שולחים תזכורת
      if (timeUntilStart <= 0) {
        continue;
      }

      let message;

      if (event.eventType === "meeting") {
        if (timeUntilStart < twoHours && !event.twoHoursReminderSent) {
          message = `Reminder: There is a meeting in under two hours (Event: "${event.title}").`;
          event.twoHoursReminderSent = true;
        } else if (timeUntilStart < oneDay && !event.dayReminderSent) {
          message = `Reminder: There is a meeting in under one day (Event: "${event.title}").`;
          event.dayReminderSent = true;
        }
      } else if (event.eventType === "holiday") {
        if (timeUntilStart < oneDay && !event.dayReminderSent) {
          message = `Reminder: A holiday starts in under one day (Event: "${event.title}").`;
          event.dayReminderSent = true;
        }
      } else {
        if (timeUntilStart < twoHours && !event.twoHoursReminderSent) {
          message = `Reminder: Your event "${event.title}" starts in under two hours.`;
          event.twoHoursReminderSent = true;
        } else if (timeUntilStart < oneDay && !event.dayReminderSent) {
          message = `Reminder: Your event "${event.title}" starts in under 24 hours.`;
          event.dayReminderSent = true;
        }
      }

      if (message) {
        const notification = new Notification({
          companyId,
          content: message,
          type: "Reminder",
          employeeId: event.createdBy,
        });

        await notification.save();
        notifications.push(notification);
        await event.save();
      }
    }

    return notifications;
  } catch (error) {
    console.error("Error in reminderEventsLogic:", error);
    throw error;
  }
};

// בקר (Controller) - אם תרצה להפעיל את הלוגיקה ידנית דרך קריאת API
export const reminderEventsController = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const notifications = await reminderEventsLogic(companyId);

    return res.status(200).json({
      success: true,
      message: "Event reminders created",
      data: notifications,
    });
  } catch (error) {
    console.error("Error creating event reminders:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating event reminders",
      error: error.message,
    });
  }
};

cron.schedule("*/1 * * * *", async () => {
  try {
    const companies = await Company.find();

    for (const company of companies) {
      const companyId = company._id.toString();
      try {
        const eventNotifications = await reminderEventsLogic(companyId);
      } catch (error) {
        console.error(
          `Error creating event notifications for company ${companyId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in event reminders cron job:", error);
  }
});

export const checkDateProjectForCompany = async (companyId) => {
  try {
    // Set the boundaries for today's date (from 00:00 to 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Find projects that have a startDate within today
    const projects = await Project.find({
      companyId,
      startDate: { $gte: startOfToday, $lte: endOfToday },
    });

    if (projects.length === 0) {
      return;
    }

    // Iterate over projects and update status if needed
    for (const project of projects) {
      if (project.status !== "Active") {
        project.status = "Active";
        await project.save();

        // Create a Notification for the project start
        const notificationMessage = `Project "${project.name}" has started.`;
        const notification = new Notification({
          companyId,
          content: notificationMessage,
          type: "Project Started",
          projectId: project._id,
        });
        await notification.save();
      }
    }
  } catch (error) {
    console.error("Error in checkDateProjectForCompany:", error);
  }
};

// ========================
// NEW NOTIFICATION FUNCTIONS
// ========================

/**
 * בדיקת הצעות רכש ממתינות
 */
export const checkPendingProcurementProposals = async () => {
  try {
    console.log("🔍 Checking pending procurement proposals...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const pendingProposals = await ProcurementProposal.find({
        companyId: company._id,
        status: "pending",
      });

      for (const proposal of pendingProposals) {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(proposal.createdAt)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation >= 3) {
          const isDuplicate = await shouldSkipNotification({
            companyId: company._id,
            employeeId: proposal.createdBy,
            category: "procurement",
            title: "📋 הצעת רכש ממתינה",
            relatedEntity: {
              entityType: "ProcurementProposal",
              entityId: proposal._id.toString(),
            },
            hours: 72,
          });

          if (!isDuplicate) {
            await notifyAdmins({
              companyId: company._id,
              title: "📋 הצעת רכש ממתינה",
              content: `הצעת רכש ממתינה לאישור ${daysSinceCreation} ימים`,
              type: "Warning",
              category: "procurement",
              priority: "medium",
              relatedEntity: {
                entityType: "ProcurementProposal",
                entityId: proposal._id.toString(),
              },
              actionUrl: `/dashboard/ProcurementProposalsList`,
              actionLabel: "צפה בהצעה",
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} pending proposal notifications`);
  } catch (error) {
    console.error("❌ Error in checkPendingProcurementProposals:", error);
  }
};

/**
 * בדיקת הזמנות רכש שעברו תאריך אספקה
 */
export const checkOverdueDeliveries = async () => {
  try {
    console.log("🔍 Checking overdue deliveries...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const overdueOrders = await Procurement.find({
        companyId: company._id,
        orderStatus: { $nin: ["Delivered", "Cancelled"] },
        deliveryDate: { $lt: new Date() },
      });

      for (const order of overdueOrders) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 1000) / 24
        );

        const isDuplicate = await shouldSkipNotification({
          companyId: company._id,
          employeeId:
            order.createdBy ||
            (await Employee.findOne({ companyId: company._id, role: "Admin" }))?._id,
          category: "procurement",
          title: "🚨 איחור באספקה",
          relatedEntity: {
            entityType: "PurchaseOrder",
            entityId: order.PurchaseOrder,
          },
          hours: 72,
        });

        if (!isDuplicate && daysOverdue >= 1) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "🚨 איחור באספקה",
            content: `הזמנת רכש ${order.PurchaseOrder} מאחרת ${daysOverdue} ימים`,
            type: "Urgent",
            category: "procurement",
            priority: "high",
            relatedEntity: {
              entityType: "PurchaseOrder",
              entityId: order.PurchaseOrder,
            },
            actionUrl: `/dashboard/procurement`,
            actionLabel: "צפה בהזמנה",
            PurchaseOrder: order.PurchaseOrder,
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} overdue delivery notifications`);
  } catch (error) {
    console.error("❌ Error in checkOverdueDeliveries:", error);
  }
};

/**
 * בדיקת תקציבים
 */
export const checkBudgetAlerts = async () => {
  try {
    console.log("🔍 Checking budget alerts...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const budgets = await Budget.find({ companyId: company._id });

      for (const budget of budgets) {
        const usagePercent = (budget.spent / budget.allocatedAmount) * 100;

        if (usagePercent >= 100) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "🔴 תקציב חרג!",
            content: `תקציב "${budget.name}" חרג ב-${Math.round(usagePercent - 100)}%`,
            type: "Error",
            category: "finance",
            priority: "critical",
            relatedEntity: {
              entityType: "Budget",
              entityId: budget._id.toString(),
            },
            actionUrl: `/dashboard/finance/budget-details/${budget._id}`,
            actionLabel: "צפה בתקציב",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        } else if (usagePercent >= 80) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⚠️ אזהרת תקציב",
            content: `תקציב "${budget.name}" בשימוש של ${Math.round(usagePercent)}%`,
            type: "Warning",
            category: "finance",
            priority: "high",
            relatedEntity: {
              entityType: "Budget",
              entityId: budget._id.toString(),
            },
            actionUrl: `/dashboard/finance/budget-details/${budget._id}`,
            actionLabel: "צפה בתקציב",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} budget alert notifications`);
  } catch (error) {
    console.error("❌ Error in checkBudgetAlerts:", error);
  }
};

/**
 * בדיקת חשבוניות שלא שולמו (Finance records)
 */
export const checkOverdueInvoices = async () => {
  try {
    console.log("🔍 Checking overdue invoices (Finance)...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const overdueInvoices = await Finance.find({
        companyId: company._id,
        transactionType: "Expense",
        paymentStatus: { $ne: "paid" },
        transactionDate: { $lt: thirtyDaysAgo },
      });

      if (overdueInvoices.length > 0) {
        const totalAmount = overdueInvoices.reduce(
          (sum, inv) => sum + inv.transactionAmount,
          0
        );

        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "💸 חשבוניות שלא שולמו",
          content: `יש ${overdueInvoices.length} חשבוניות שלא שולמו מעל 30 יום, סה"כ ₪${totalAmount.toLocaleString()}`,
          type: "Warning",
          category: "finance",
          priority: "high",
          actionUrl: `/dashboard/finance`,
          actionLabel: "צפה בחשבוניות",
          metadata: { invoiceCount: overdueInvoices.length, totalAmount },
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} overdue invoice notifications`);
  } catch (error) {
    console.error("❌ Error in checkOverdueInvoices:", error);
  }
};

/**
 * עדכון אוטומטי של סטטוס Overdue לחשבוניות
 */
export const updateOverdueInvoiceStatus = async () => {
  try {
    console.log("🔄 Updating overdue invoice statuses...");
    
    // Import Invoice model dynamically to avoid circular dependency
    const { default: Invoice } = await import("../models/invoice.model.js");
    
    const overdueCount = await Invoice.updateMany(
      {
        status: { $nin: ["Paid", "Cancelled", "Overdue"] }, // Only update if not already overdue/paid/cancelled
        dueDate: { $lt: new Date() },
        paymentStatus: { $ne: "Paid" },
      },
      {
        $set: { status: "Overdue" },
      }
    );
    
    console.log(`✅ Updated ${overdueCount.modifiedCount} invoices to Overdue status`);
    return overdueCount.modifiedCount;
  } catch (error) {
    console.error("❌ Error updating overdue invoice statuses:", error);
    return 0;
  }
};

/**
 * בדיקת מלאי נמוך - התראה נפרדת לכל מוצר
 */
export const checkLowInventory = async () => {
  try {
    console.log("🔍 Checking low inventory...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const lowStockItems = await Inventory.find({
        companyId: company._id,
        $expr: { $lte: ["$quantity", "$minStockLevel"] },
      }).populate("productId");

      // יצירת התראה נפרדת לכל מוצר
      for (const item of lowStockItems) {
        const product = item.productId;
        if (!product) continue;

        const targetEmployee =
          (await Employee.findOne({ companyId: company._id, role: "Admin" }))?._id ||
          (await Employee.findOne({ companyId: company._id }))?._id;

        const isDuplicate = await shouldSkipNotification({
          companyId: company._id,
          employeeId: targetEmployee,
          category: "inventory",
          title: "📦 התראת מלאי נמוך",
          relatedEntity: {
            entityType: "Inventory",
            entityId: item._id.toString(),
          },
          hours: 24,
        });

        if (!isDuplicate) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📦 התראת מלאי נמוך",
            content: `המוצר "${product.productName}" במלאי נמוך: ${item.quantity} יחידות (מינימום: ${item.minStockLevel})`,
            type: "Warning",
            category: "inventory",
            priority: "high",
            relatedEntity: {
              entityType: "Inventory",
              entityId: item._id.toString(),
            },
            actionUrl: `/dashboard/products`,
            actionLabel: "צפה במלאי",
            metadata: {
              products: [
                {
                  productId: product._id,
                  productName: product.productName,
                  quantity: item.quantity,
                  minStockLevel: item.minStockLevel,
                  reorderQuantity: item.reorderQuantity || 10,
                  sku: product.sku,
                  category: product.category,
                  unitPrice: product.unitPrice,
                  supplierId: product.supplierId,
                },
              ],
            },
            PurchaseOrder: "Inventory", // לתאימות לאחור
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} low inventory notifications`);
  } catch (error) {
    console.error("❌ Error in checkLowInventory:", error);
  }
};

/**
 * בדיקת מוצרים שעומדים לפוג
 */
export const checkExpiringProducts = async () => {
  try {
    console.log("🔍 Checking expiring products...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expiringItems = await Inventory.find({
        companyId: company._id,
        expirationDate: { $lte: thirtyDaysFromNow, $gt: new Date() },
      }).populate("productId");

      if (expiringItems.length > 0) {
        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "⏳ מוצרים שעומדים לפוג",
          content: `${expiringItems.length} מוצרים יפוגו תוך 30 יום`,
          type: "Warning",
          category: "inventory",
          priority: "medium",
          actionUrl: `/dashboard/products`,
          actionLabel: "צפה במוצרים",
          metadata: { itemCount: expiringItems.length },
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} expiring product notifications`);
  } catch (error) {
    console.error("❌ Error in checkExpiringProducts:", error);
  }
};

/**
 * בדיקת משימות שמתקרבות לדדליין
 */
export const checkTaskDeadlines = async () => {
  try {
    console.log("🔍 Checking task deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      const upcomingTasks = await Task.find({
        companyId: company._id,
        status: { $ne: "completed" },
        endDate: { $lte: twoDaysFromNow, $gt: new Date() },
      });

      for (const task of upcomingTasks) {
        if (task.assignedTo) {
          const skipReminder = await shouldSkipNotification({
            companyId: company._id,
            employeeId: task.assignedTo,
            category: "tasks",
            title: "⏰ משימה מתקרבת לדדליין",
            relatedEntity: {
              entityType: "Task",
              entityId: task._id.toString(),
            },
            hours: 12,
          });

          if (skipReminder) {
            continue;
          }

          await createNotification({
            companyId: company._id,
            employeeId: task.assignedTo,
            title: "⏰ משימה מתקרבת לדדליין",
            content: `המשימה "${task.taskName}" תסתיים בעוד יומיים`,
            type: "Reminder",
            category: "tasks",
            priority: "high",
            relatedEntity: {
              entityType: "Task",
              entityId: task._id.toString(),
            },
            actionUrl: `/dashboard/tasks`,
            actionLabel: "צפה במשימה",
          });
          totalNotifications++;
        }
      }

      const overdueTasks = await Task.find({
        companyId: company._id,
        status: { $ne: "completed" },
        endDate: { $lt: new Date() },
      });

      if (overdueTasks.length > 0) {
        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "🔴 משימות שעברו דדליין",
          content: `יש ${overdueTasks.length} משימות שעברו את הדדליין`,
          type: "Urgent",
          category: "tasks",
          priority: "critical",
          actionUrl: `/dashboard/tasks`,
          actionLabel: "צפה במשימות",
          metadata: { taskCount: overdueTasks.length },
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} task deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkTaskDeadlines:", error);
  }
};

/**
 * בדיקת פרויקטים שמתקרבים לדדליין
 */
export const checkProjectDeadlines = async () => {
  try {
    console.log("🔍 Checking project deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const upcomingProjects = await Project.find({
        companyId: company._id,
        status: { $in: ["active", "in-progress"] },
        endDate: { $lte: sevenDaysFromNow, $gt: new Date() },
      });

      for (const project of upcomingProjects) {
        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "⏰ פרויקט מתקרב לדדליין",
          content: `הפרויקט "${project.projectName}" יסתיים בעוד 7 ימים`,
          type: "Reminder",
          category: "projects",
          priority: "high",
          relatedEntity: {
            entityType: "Project",
            entityId: project._id.toString(),
          },
          actionUrl: `/dashboard/projects`,
          actionLabel: "צפה בפרויקט",
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }

      const overdueProjects = await Project.find({
        companyId: company._id,
        status: { $in: ["active", "in-progress"] },
        endDate: { $lt: new Date() },
      });

      if (overdueProjects.length > 0) {
        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "🔴 פרויקטים שעברו דדליין",
          content: `יש ${overdueProjects.length} פרויקטים שעברו את הדדליין`,
          type: "Urgent",
          category: "projects",
          priority: "critical",
          actionUrl: `/dashboard/projects`,
          actionLabel: "צפה בפרויקטים",
          metadata: { projectCount: overdueProjects.length },
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} project deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkProjectDeadlines:", error);
  }
};

/**
 * בדיקת הזמנות לקוחות
 */
export const checkCustomerOrders = async () => {
  try {
    console.log("🔍 Checking customer orders...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const pendingOrders = await CustomerOrder.find({
        companyId: company._id,
        status: "Pending",
        createdAt: { $lt: threeDaysAgo },
      });

      if (pendingOrders.length > 0) {
        await notifyAdminsAndManagers({
          companyId: company._id,
          title: "🛒 הזמנות ממתינות",
          content: `יש ${pendingOrders.length} הזמנות ממתינות מעל 3 ימים`,
          type: "Warning",
          category: "customers",
          priority: "medium",
          actionUrl: `/dashboard/Customers/Orders`,
          actionLabel: "צפה בהזמנות",
          metadata: { orderCount: pendingOrders.length },
          dedupe: {
            enabled: true,
            hours: 24,
          },
        });
        totalNotifications++;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newOrders = await CustomerOrder.find({
        companyId: company._id,
        createdAt: { $gte: today },
      });

      if (newOrders.length > 0) {
        await notifyAdmins({
          companyId: company._id,
          title: "🎉 הזמנות חדשות",
          content: `התקבלו ${newOrders.length} הזמנות חדשות היום`,
          type: "Info",
          category: "customers",
          priority: "medium",
          actionUrl: `/dashboard/Customers/Orders`,
          actionLabel: "צפה בהזמנות",
          dedupe: {
            enabled: true,
            hours: 12,
          },
        });
        totalNotifications++;
      }
    }
    console.log(`✅ Created ${totalNotifications} customer order notifications`);
  } catch (error) {
    console.error("❌ Error in checkCustomerOrders:", error);
  }
};

/**
 * בדיקת ביקורות ביצועים
 */
export const checkUpcomingPerformanceReviews = async () => {
  try {
    console.log("🔍 Checking upcoming performance reviews...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const upcomingReviews = await PerformanceReview.find({
        companyId: company._id,
        reviewDate: { $lte: sevenDaysFromNow, $gt: new Date() },
      });

      for (const review of upcomingReviews) {
        if (review.reviewedBy) {
          const skipReviewReminder = await shouldSkipNotification({
            companyId: company._id,
            employeeId: review.reviewedBy,
            category: "hr",
            title: "📝 תזכורת: ביקורת ביצועים",
            relatedEntity: {
              entityType: "Employee",
              entityId: review.employeeId?.toString(),
            },
            hours: 24,
          });

          if (skipReviewReminder) {
            continue;
          }

          await createNotification({
            companyId: company._id,
            employeeId: review.reviewedBy,
            title: "📝 תזכורת: ביקורת ביצועים",
            content: `יש לבצע ביקורת ביצועים בעוד שבוע`,
            type: "Reminder",
            category: "hr",
            priority: "medium",
            relatedEntity: {
              entityType: "Employee",
              entityId: review.employeeId?.toString(),
            },
            actionUrl: `/dashboard/performance-reviews`,
            actionLabel: "צפה בביקורות",
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} performance review notifications`);
  } catch (error) {
    console.error("❌ Error in checkUpcomingPerformanceReviews:", error);
  }
};

/**
 * בדיקת אירועים קרובים (IMPROVED)
 */
export const checkUpcomingEvents = async () => {
  try {
    console.log("🔍 Checking upcoming events...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const now = new Date();
      const twoHours = 2 * 60 * 60 * 1000;
      const oneDay = 24 * 60 * 60 * 1000;

      const upcomingEvents = await Event.find({
        companyId: company._id,
        eventDate: { $gt: now },
      });

      for (const event of upcomingEvents) {
        const timeUntilStart = new Date(event.eventDate) - now;
        if (timeUntilStart <= 0) continue;

        let message,
          shouldNotify = false;

        if (event.eventType === "meeting") {
          if (timeUntilStart < twoHours && !event.twoHoursReminderSent) {
            message = `הפגישה "${event.title}" מתחילה בעוד פחות משעתיים`;
            event.twoHoursReminderSent = true;
            shouldNotify = true;
          } else if (timeUntilStart < oneDay && !event.dayReminderSent) {
            message = `הפגישה "${event.title}" מתחילה מחר`;
            event.dayReminderSent = true;
            shouldNotify = true;
          }
        } else if (event.eventType === "holiday") {
          if (timeUntilStart < oneDay && !event.dayReminderSent) {
            message = `חג "${event.title}" מתחיל מחר`;
            event.dayReminderSent = true;
            shouldNotify = true;
          }
        } else {
          if (timeUntilStart < twoHours && !event.twoHoursReminderSent) {
            message = `האירוע "${event.title}" מתחיל בעוד שעתיים`;
            event.twoHoursReminderSent = true;
            shouldNotify = true;
          } else if (timeUntilStart < oneDay && !event.dayReminderSent) {
            message = `האירוע "${event.title}" מתחיל מחר`;
            event.dayReminderSent = true;
            shouldNotify = true;
          }
        }

        if (shouldNotify) {
          await createNotification({
            companyId: company._id,
            employeeId: event.createdBy,
            title: "📅 תזכורת אירוע",
            content: message,
            type: "Reminder",
            category: "system",
            priority: "medium",
            relatedEntity: {
              entityType: "Event",
              entityId: event._id.toString(),
            },
            actionUrl: `/dashboard/Events`,
            actionLabel: "צפה באירועים",
          });
          totalNotifications++;
          await event.save();
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} event notifications`);
  } catch (error) {
    console.error("❌ Error in checkUpcomingEvents:", error);
  }
};

/**
 * מחיקת התראות שפג תוקפן
 */
export const cleanupExpiredNotifications = async () => {
  try {
    console.log("🧹 Cleaning up expired notifications...");
    const result = await Notification.deleteMany({
      expirationDate: { $lt: new Date() },
    });
    console.log(`🗑️  Deleted ${result.deletedCount} expired notifications`);
  } catch (error) {
    console.error("❌ Error in cleanupExpiredNotifications:", error);
  }
};

/**
 * דוח שבועי למנהלים
 */
export const sendWeeklyReports = async () => {
  try {
    console.log("📊 Sending weekly reports...");
    const companies = await Company.find();

    for (const company of companies) {
      await notifyAdminsAndManagers({
        companyId: company._id,
        title: "📊 דוח שבועי",
        content: "דוח סיכום שבועי זמין לצפייה בדשבורד",
        type: "Info",
        category: "system",
        priority: "low",
        actionUrl: `/dashboard`,
        actionLabel: "צפה בדוח",
      });
    }
    console.log("✅ Weekly reports sent");
  } catch (error) {
    console.error("❌ Error in sendWeeklyReports:", error);
  }
};

/**
 * בדיקת מועדי תשלום קרובים
 */
/**
 * בדיקת רשומות פיננסיות עם מועד תשלום קרוב (3 ימים או פחות)
 * רצה כל יום ב-8:00 בבוקר
 */
export const checkUpcomingPaymentDueDates = async () => {
  try {
    console.log("💰 Checking upcoming payment due dates (3 days or less)...");
    const companies = await Company.find();

    for (const company of companies) {
      const companyId = company._id;
      
      // תאריך היום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // תאריך בעוד 3 ימים
      const in3Days = new Date(today);
      in3Days.setDate(in3Days.getDate() + 3);
      
      // מציאת רשומות פיננסיות עם מועד תשלום קרוב (3 ימים או פחות)
      const upcomingPayments = await Finance.find({
        companyId,
        transactionStatus: "Pending",
        dueDate: {
          $gte: today,
          $lte: in3Days,
        },
        paymentReminderSent: false,
      }).populate("partyId");

      for (const payment of upcomingPayments) {
        if (!payment.dueDate) {
          console.log(`⚠️ Payment ${payment._id} has no dueDate, skipping...`);
          continue;
        }

        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        // בודק רק אם נשארו 3 ימים או פחות
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          const priority = daysUntilDue === 0 ? "critical" : "high";
          const title = daysUntilDue === 0 
            ? `🚨 מועד תשלום היום!`
            : `⚠️ מועד תשלום קרוב - ${daysUntilDue} ימים`;
          
          const content = `רשומה פיננסית בסך ${payment.transactionAmount} ${payment.transactionCurrency} תפוג בעוד ${daysUntilDue} ימים (${dueDate.toLocaleDateString("he-IL")})\n` +
            `תנאי תשלום: ${payment.paymentTerms || "לא צוין"}\n` +
            `קטגוריה: ${payment.category}\n` +
            `תיאור: ${payment.transactionDescription || "ללא תיאור"}`;
          
          // שליחת התראה למנהלים ואדמינים
          await notifyAdminsAndManagers({
            companyId,
            title,
            content,
            type: "Warning",
            category: "finance",
            priority,
            actionUrl: `/dashboard/finance`,
            actionLabel: "צפה ברשומה",
            relatedEntity: {
              entityType: "Finance",
              entityId: payment._id.toString(),
            },
          });
          
          // סימון שהתראה נשלחה
          payment.paymentReminderSent = true;
          await payment.save();
          
          console.log(`✅ Sent reminder for payment ${payment._id} (${daysUntilDue} days until due)`);
        }
      }
      
      if (upcomingPayments.length > 0) {
        console.log(`✅ Found ${upcomingPayments.length} upcoming payments for company ${companyId}`);
      }
    }
    
    console.log("✅ Payment due date check completed");
  } catch (error) {
    console.error("❌ Error in checkUpcomingPaymentDueDates:", error);
  }
};

/**
 * בדיקת רשומות פיננסיות שפג תוקפן (Overdue Payments)
 * רצה כל יום ב-8:00 בבוקר
 */
export const checkOverduePayments = async () => {
  try {
    console.log("🚨 Checking overdue payments...");
    const companies = await Company.find();

    for (const company of companies) {
      const companyId = company._id;
      
      // תאריך היום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // מציאת רשומות פיננסיות שפג תוקפן (dueDate < today)
      const overduePayments = await Finance.find({
        companyId,
        transactionStatus: "Pending",
        dueDate: {
          $lt: today,
        },
      }).populate("partyId");

      for (const payment of overduePayments) {
        if (!payment.dueDate) {
          continue;
        }

        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        
        // שליחת התראה למנהלים ואדמינים
        const priority = daysOverdue > 30 ? "critical" : daysOverdue > 14 ? "high" : "medium";
        const title = `🚨 תשלום שפג תוקפו - ${daysOverdue} ימים`;
        
        const content = `רשומה פיננסית בסך ${payment.transactionAmount} ${payment.transactionCurrency} פגה לפני ${daysOverdue} ימים (${dueDate.toLocaleDateString("he-IL")})\n` +
          `תנאי תשלום: ${payment.paymentTerms || "לא צוין"}\n` +
          `קטגוריה: ${payment.category}\n` +
          `תיאור: ${payment.transactionDescription || "ללא תיאור"}`;
        
        // בדיקה אם כבר נשלחה התראה על חריגה זו היום
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const existingNotification = await Notification.findOne({
          companyId,
          category: "finance",
          "relatedEntity.entityId": payment._id.toString(),
          "relatedEntity.entityType": "Finance",
          title: { $regex: /פג תוקפו/ },
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        });
        
        // אם לא נשלחה התראה היום, שולח התראה חדשה
        if (!existingNotification) {
          await notifyAdminsAndManagers({
            companyId,
            title,
            content,
            type: "Error",
            category: "finance",
            priority,
            actionUrl: `/dashboard/finance`,
            actionLabel: "צפה ברשומה",
            relatedEntity: {
              entityType: "Finance",
              entityId: payment._id.toString(),
            },
          });
          
          console.log(`✅ Sent overdue reminder for payment ${payment._id} (${daysOverdue} days overdue)`);
        }
      }
      
      if (overduePayments.length > 0) {
        console.log(`✅ Found ${overduePayments.length} overdue payments for company ${companyId}`);
      }
    }
    
    console.log("✅ Overdue payment check completed");
  } catch (error) {
    console.error("❌ Error in checkOverduePayments:", error);
  }
};

/**
 * דוח חודשי למנהלים
 */
export const sendMonthlyReports = async () => {
  try {
    console.log("📊 Sending monthly reports...");
    const companies = await Company.find();

    for (const company of companies) {
      await notifyAdminsAndManagers({
        companyId: company._id,
        title: "📊 דוח חודשי",
        content: "דוח סיכום חודשי זמין לצפייה בדשבורד",
        type: "Info",
        category: "system",
        priority: "low",
        actionUrl: `/dashboard`,
        actionLabel: "צפה בדוח",
      });
    }
    console.log("✅ Monthly reports sent");
  } catch (error) {
    console.error("❌ Error in sendMonthlyReports:", error);
  }
};

// ========================
// LEADS NOTIFICATIONS
// ========================

/**
 * בדיקת לידים שלא יצרו קשר (X ימים)
 */
export const checkUncontactedLeads = async () => {
  try {
    console.log("🔍 Checking uncontacted leads...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const uncontactedLeads = await Lead.find({
        companyId: company._id,
        status: { $in: ["New", "Contacted"] },
        $or: [
          { lastContacted: { $exists: false } },
          { lastContacted: { $lt: threeDaysAgo } },
        ],
        createdAt: { $lt: threeDaysAgo },
      }).populate("assignedTo");

      for (const lead of uncontactedLeads) {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24)
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "leads",
          title: "📞 ליד שלא יצר קשר",
          relatedEntity: {
            entityType: "Lead",
            entityId: lead._id.toString(),
          },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📞 ליד שלא יצר קשר",
            content: `ליד "${lead.name}" לא יצר קשר כבר ${daysSinceCreation} ימים. ערך משוער: ${lead.estimatedValue || 0} ${lead.currency || "ILS"}`,
            type: "Warning",
            category: "leads",
            priority: lead.leadScore >= 70 ? "high" : "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: lead._id.toString(),
            },
            actionUrl: `/dashboard/leads`,
            actionLabel: "צפה בליד",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} uncontacted leads notifications`);
  } catch (error) {
    console.error("❌ Error in checkUncontactedLeads:", error);
  }
};

/**
 * בדיקת לידים ללא פעילות (X ימים)
 */
export const checkStaleLeads = async () => {
  try {
    console.log("🔍 Checking stale leads...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const staleLeads = await Lead.find({
        companyId: company._id,
        status: { $nin: ["Closed Won", "Closed Lost"] },
        $or: [
          { lastContacted: { $exists: false } },
          { lastContacted: { $lt: sevenDaysAgo } },
        ],
        updatedAt: { $lt: sevenDaysAgo },
      });

      for (const lead of staleLeads) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(lead.updatedAt)) / (1000 * 60 * 60 * 24)
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "leads",
          title: "⏰ ליד ללא פעילות",
          relatedEntity: {
            entityType: "Lead",
            entityId: lead._id.toString(),
          },
          hours: 72,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⏰ ליד ללא פעילות",
            content: `ליד "${lead.name}" ללא פעילות כבר ${daysSinceUpdate} ימים. סטטוס: ${lead.status}`,
            type: "Warning",
            category: "leads",
            priority: "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: lead._id.toString(),
            },
            actionUrl: `/dashboard/leads`,
            actionLabel: "צפה בליד",
            dedupe: {
              enabled: true,
              hours: 72,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} stale leads notifications`);
  } catch (error) {
    console.error("❌ Error in checkStaleLeads:", error);
  }
};

/**
 * בדיקת לידים עם עדיפות גבוהה שלא טופלו
 */
export const checkHotLeads = async () => {
  try {
    console.log("🔍 Checking hot leads...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const hotLeads = await Lead.find({
        companyId: company._id,
        status: { $nin: ["Closed Won", "Closed Lost"] },
        $or: [
          { leadScore: { $gte: 70 } },
          { probability: { $gte: 60 } },
          { estimatedValue: { $gte: 10000 } },
        ],
      }).populate("assignedTo");

      for (const lead of hotLeads) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const needsAttention =
          !lead.lastContacted ||
          new Date(lead.lastContacted) < oneDayAgo ||
          lead.status === "New";

        if (needsAttention) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "leads",
            title: "🔥 ליד חם דורש טיפול",
            relatedEntity: {
              entityType: "Lead",
              entityId: lead._id.toString(),
            },
            hours: 12,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "🔥 ליד חם דורש טיפול",
              content: `ליד "${lead.name}" עם ניקוד ${lead.leadScore || 0} והסתברות ${lead.probability || 0}% דורש טיפול דחוף. ערך משוער: ${lead.estimatedValue || 0} ${lead.currency || "ILS"}`,
              type: "Urgent",
              category: "leads",
              priority: "high",
              relatedEntity: {
                entityType: "Lead",
                entityId: lead._id.toString(),
              },
              actionUrl: `/dashboard/leads`,
              actionLabel: "צפה בליד",
              dedupe: {
                enabled: true,
                hours: 12,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} hot leads notifications`);
  } catch (error) {
    console.error("❌ Error in checkHotLeads:", error);
  }
};

/**
 * בדיקת לידים קרובים למועד המרה
 */
export const checkLeadConversionDeadline = async () => {
  try {
    console.log("🔍 Checking lead conversion deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const leadsNearDeadline = await Lead.find({
        companyId: company._id,
        status: { $nin: ["Closed Won", "Closed Lost"] },
        expectedCloseDate: {
          $gte: today,
          $lte: sevenDaysFromNow,
        },
      });

      for (const lead of leadsNearDeadline) {
        if (!lead.expectedCloseDate) continue;

        const daysUntilClose = Math.ceil(
          (new Date(lead.expectedCloseDate) - today) / (1000 * 60 * 60 * 24)
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "leads",
          title: "📅 מועד המרה קרוב",
          relatedEntity: {
            entityType: "Lead",
            entityId: lead._id.toString(),
          },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📅 מועד המרה קרוב",
            content: `ליד "${lead.name}" קרוב למועד המרה הצפוי בעוד ${daysUntilClose} ימים (${new Date(lead.expectedCloseDate).toLocaleDateString("he-IL")}). הסתברות: ${lead.probability || 0}%`,
            type: "Reminder",
            category: "leads",
            priority: daysUntilClose <= 3 ? "high" : "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: lead._id.toString(),
            },
            actionUrl: `/dashboard/leads`,
            actionLabel: "צפה בליד",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} lead conversion deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkLeadConversionDeadline:", error);
  }
};

// ========================
// PRODUCTION ORDERS NOTIFICATIONS
// ========================

/**
 * בדיקת הזמנות ייצור מאחרות
 */
export const checkDelayedProductionOrders = async () => {
  try {
    console.log("🔍 Checking delayed production orders...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const delayedOrders = await ProductionOrder.find({
        companyId: company._id,
        status: { $in: ["Pending", "In Progress"] },
        dueDate: { $lt: today },
      }).populate("productId");

      for (const order of delayedOrders) {
        const daysOverdue = Math.ceil(
          (today - new Date(order.dueDate)) / (1000 * 60 * 60 * 24)
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "production",
          title: "🚨 הזמנת ייצור מאחרת",
          relatedEntity: {
            entityType: "ProductionOrder",
            entityId: order._id.toString(),
          },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "🚨 הזמנת ייצור מאחרת",
            content: `הזמנת ייצור ${order.orderNumber} (${order.productName}) מאחרת ${daysOverdue} ימים. כמות: ${order.quantity}`,
            type: "Error",
            category: "production",
            priority: daysOverdue > 7 ? "critical" : "high",
            relatedEntity: {
              entityType: "ProductionOrder",
              entityId: order._id.toString(),
            },
            actionUrl: `/dashboard/production/${order._id}`,
            actionLabel: "צפה בהזמנה",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} delayed production orders notifications`);
  } catch (error) {
    console.error("❌ Error in checkDelayedProductionOrders:", error);
  }
};

/**
 * בדיקת הזמנות ייצור מתקרבות לדדליין
 */
export const checkProductionOrderDeadlines = async () => {
  try {
    console.log("🔍 Checking production order deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const upcomingOrders = await ProductionOrder.find({
        companyId: company._id,
        status: { $in: ["Pending", "In Progress"] },
        dueDate: {
          $gte: today,
          $lte: threeDaysFromNow,
        },
      }).populate("productId");

      for (const order of upcomingOrders) {
        const daysUntilDue = Math.ceil(
          (new Date(order.dueDate) - today) / (1000 * 60 * 60 * 24)
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "production",
          title: "⏰ הזמנת ייצור מתקרבת לדדליין",
          relatedEntity: {
            entityType: "ProductionOrder",
            entityId: order._id.toString(),
          },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⏰ הזמנת ייצור מתקרבת לדדליין",
            content: `הזמנת ייצור ${order.orderNumber} (${order.productName}) תפוג בעוד ${daysUntilDue} ימים. כמות: ${order.quantity}`,
            type: "Warning",
            category: "production",
            priority: daysUntilDue === 1 ? "high" : "medium",
            relatedEntity: {
              entityType: "ProductionOrder",
              entityId: order._id.toString(),
            },
            actionUrl: `/dashboard/production/${order._id}`,
            actionLabel: "צפה בהזמנה",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} production order deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkProductionOrderDeadlines:", error);
  }
};

/**
 * בדיקת הזמנות ייצור תקועות (חסר חומר/ציוד)
 */
export const checkBlockedProductionOrders = async () => {
  try {
    console.log("🔍 Checking blocked production orders...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const blockedOrders = await ProductionOrder.find({
        companyId: company._id,
        status: { $in: ["Pending", "In Progress", "On Hold"] },
        $or: [
          { "components.status": "Unavailable" },
          { missingComponents: { $exists: true, $ne: [] } },
        ],
      }).populate("productId");

      for (const order of blockedOrders) {
        const hasMissingComponents =
          order.missingComponents && order.missingComponents.length > 0;
        const hasUnavailableComponents =
          order.components && order.components.some((c) => c.status === "Unavailable");

        if (hasMissingComponents || hasUnavailableComponents) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "production",
            title: "⚠️ הזמנת ייצור תקועה",
            relatedEntity: {
              entityType: "ProductionOrder",
              entityId: order._id.toString(),
            },
            hours: 24,
          });

          if (!skip) {
            const missingList = hasMissingComponents
              ? order.missingComponents.map((c) => `${c.componentName} (חסר: ${c.missing})`).join(", ")
              : "רכיבים לא זמינים";

            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ הזמנת ייצור תקועה",
              content: `הזמנת ייצור ${order.orderNumber} (${order.productName}) תקועה עקב: ${missingList}`,
              type: "Warning",
              category: "production",
              priority: "high",
              relatedEntity: {
                entityType: "ProductionOrder",
                entityId: order._id.toString(),
              },
              actionUrl: `/dashboard/production/${order._id}`,
              actionLabel: "צפה בהזמנה",
              dedupe: {
                enabled: true,
                hours: 24,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} blocked production orders notifications`);
  } catch (error) {
    console.error("❌ Error in checkBlockedProductionOrders:", error);
  }
};

/**
 * בדיקת בעיות איכות בהזמנות ייצור
 */
export const checkQualityIssues = async () => {
  try {
    console.log("🔍 Checking production quality issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // בדיקה של הזמנות ייצור שהושלמו לאחרונה עם בעיות פוטנציאליות
      const recentCompletedOrders = await ProductionOrder.find({
        companyId: company._id,
        status: "Completed",
        completedDate: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        $or: [
          { actualCost: { $gt: 0 }, estimatedCost: { $gt: 0 }, $expr: { $gt: ["$actualCost", { $multiply: ["$estimatedCost", 1.2] }] } },
        ],
      }).populate("productId");

      for (const order of recentCompletedOrders) {
        const costOverrun = order.estimatedCost > 0
          ? ((order.actualCost - order.estimatedCost) / order.estimatedCost) * 100
          : 0;

        if (costOverrun > 20) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "production",
            title: "⚠️ חריגת עלות בהזמנת ייצור",
            relatedEntity: {
              entityType: "ProductionOrder",
              entityId: order._id.toString(),
            },
            hours: 72,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ חריגת עלות בהזמנת ייצור",
              content: `הזמנת ייצור ${order.orderNumber} (${order.productName}) חרגה בעלות של ${costOverrun.toFixed(1)}%. עלות משוערת: ${order.estimatedCost}, עלות בפועל: ${order.actualCost}`,
              type: "Warning",
              category: "production",
              priority: "medium",
              relatedEntity: {
                entityType: "ProductionOrder",
                entityId: order._id.toString(),
              },
              actionUrl: `/dashboard/production/${order._id}`,
              actionLabel: "צפה בהזמנה",
              dedupe: {
                enabled: true,
                hours: 72,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} quality issues notifications`);
  } catch (error) {
    console.error("❌ Error in checkQualityIssues:", error);
  }
};

// ========================
// SHIFTS & SALARY NOTIFICATIONS
// ========================

/**
 * בדיקת משמרות ממתינות לאישור
 */
export const checkUnapprovedShifts = async () => {
  try {
    console.log("🔍 Checking unapproved shifts...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // נניח שיש שדה approvalStatus או status במשמרות
      // אם לא, נבדוק משמרות ישנות שלא עודכנו
      const unapprovedShifts = await Shift.find({
        companyId: company._id,
        shiftDate: { $lt: threeDaysAgo },
        createdAt: { $lt: threeDaysAgo },
      })
        .populate("employeeId")
        .sort({ shiftDate: -1 })
        .limit(50);

      // קבוצת משמרות לפי עובד
      const shiftsByEmployee = {};
      for (const shift of unapprovedShifts) {
        const empId = shift.employeeId?._id?.toString() || shift.employeeId?.toString();
        if (!empId) continue;

        if (!shiftsByEmployee[empId]) {
          shiftsByEmployee[empId] = {
            employee: shift.employeeId,
            shifts: [],
          };
        }
        shiftsByEmployee[empId].shifts.push(shift);
      }

      for (const empId in shiftsByEmployee) {
        const { employee, shifts } = shiftsByEmployee[empId];
        const oldestShift = shifts[shifts.length - 1];
        const daysSinceOldest = Math.floor(
          (Date.now() - new Date(oldestShift.shiftDate)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceOldest >= 3) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "hr",
            title: "⏰ משמרות ממתינות לאישור",
            relatedEntity: {
              entityType: "Employee",
              entityId: empId,
            },
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⏰ משמרות ממתינות לאישור",
              content: `יש ${shifts.length} משמרות של ${employee?.name || "עובד"} ממתינות לאישור כבר ${daysSinceOldest} ימים`,
              type: "Reminder",
              category: "hr",
              priority: "medium",
              relatedEntity: {
                entityType: "Employee",
                entityId: empId,
              },
              actionUrl: `/dashboard/Shifts-List`,
              actionLabel: "צפה במשמרות",
              dedupe: {
                enabled: true,
                hours: 24,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} unapproved shifts notifications`);
  } catch (error) {
    console.error("❌ Error in checkUnapprovedShifts:", error);
  }
};

/**
 * בדיקת משכורות ממתינות לאישור (לפני תאריך תשלום)
 */
export const checkSalaryApprovalDeadline = async () => {
  try {
    console.log("🔍 Checking salary approval deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

      // נניח שתאריך התשלום הוא בסוף החודש או תחילת החודש הבא
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const paymentDate = new Date(currentYear, currentMonth + 1, 1); // 1 לחודש הבא

      if (paymentDate >= today && paymentDate <= fiveDaysFromNow) {
        const pendingSalaries = await Salary.find({
          companyId: company._id,
          status: "Draft",
          periodEnd: {
            $lt: new Date(currentYear, currentMonth, 1),
          },
        })
          .populate("employeeId")
          .limit(100);

        if (pendingSalaries.length > 0) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "hr",
            title: "💰 משכורות ממתינות לאישור",
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "💰 משכורות ממתינות לאישור",
              content: `יש ${pendingSalaries.length} משכורות ממתינות לאישור לפני תאריך התשלום (${paymentDate.toLocaleDateString("he-IL")})`,
              type: "Warning",
              category: "hr",
              priority: "high",
              actionUrl: `/dashboard/salary`,
              actionLabel: "צפה במשכורות",
              dedupe: {
                enabled: true,
                hours: 24,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} salary approval deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkSalaryApprovalDeadline:", error);
  }
};

/**
 * בדיקת משכורות שלא שולמו אחרי תאריך התשלום
 */
export const checkUnpaidSalaries = async () => {
  try {
    console.log("🔍 Checking unpaid salaries...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const paymentDate = new Date(currentYear, currentMonth, 1); // 1 לחודש הנוכחי

      if (today > paymentDate) {
        const unpaidSalaries = await Salary.find({
          companyId: company._id,
          status: "Approved",
          periodEnd: {
            $lt: paymentDate,
          },
        })
          .populate("employeeId")
          .limit(100);

        if (unpaidSalaries.length > 0) {
          const daysSincePayment = Math.floor(
            (today - paymentDate) / (1000 * 60 * 60 * 24)
          );

          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "hr",
            title: "🚨 משכורות שלא שולמו",
            hours: 24,
          });

          if (!skip) {
            const totalAmount = unpaidSalaries.reduce(
              (sum, s) => sum + (s.netPay || 0),
              0
            );

            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "🚨 משכורות שלא שולמו",
              content: `יש ${unpaidSalaries.length} משכורות מאושרות שלא שולמו כבר ${daysSincePayment} ימים. סה"כ: ${totalAmount.toLocaleString()} ${company.baseCurrency || "ILS"}`,
              type: "Error",
              category: "hr",
              priority: "critical",
              actionUrl: `/dashboard/salary`,
              actionLabel: "צפה במשכורות",
              dedupe: {
                enabled: true,
                hours: 24,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} unpaid salaries notifications`);
  } catch (error) {
    console.error("❌ Error in checkUnpaidSalaries:", error);
  }
};

// ========================
// WAREHOUSE NOTIFICATIONS
// ========================

/**
 * בדיקת מחסנים קרובים לתפוסה מלאה (80%+)
 */
export const checkWarehouseCapacityAlerts = async () => {
  try {
    console.log("🔍 Checking warehouse capacity alerts...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const warehouses = await Warehouse.find({
        companyId: company._id,
        status: "operational",
      });

      for (const warehouse of warehouses) {
        if (warehouse.utilization >= 80) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "warehouse",
            title: "📦 מחסן קרוב לתפוסה מלאה",
            relatedEntity: {
              entityType: "Warehouse",
              entityId: warehouse._id.toString(),
            },
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "📦 מחסן קרוב לתפוסה מלאה",
              content: `מחסן "${warehouse.name}" בשימוש של ${warehouse.utilization.toFixed(1)}% (${warehouse.capacity ? `תפוסה: ${warehouse.capacity} יחידות` : "תפוסה מלאה"})`,
              type: "Warning",
              category: "warehouse",
              priority: warehouse.utilization >= 95 ? "critical" : "high",
              relatedEntity: {
                entityType: "Warehouse",
                entityId: warehouse._id.toString(),
              },
              actionUrl: `/dashboard/warehouses`,
              actionLabel: "צפה במחסן",
              dedupe: {
                enabled: true,
                hours: 24,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} warehouse capacity alerts`);
  } catch (error) {
    console.error("❌ Error in checkWarehouseCapacityAlerts:", error);
  }
};

/**
 * בדיקת מחסנים עם ניצול נמוך (פחות מ-20%)
 */
export const checkWarehouseUtilizationLow = async () => {
  try {
    console.log("🔍 Checking low warehouse utilization...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const warehouses = await Warehouse.find({
        companyId: company._id,
        status: "operational",
        utilization: { $lt: 20 },
      });

      for (const warehouse of warehouses) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "warehouse",
          title: "📉 מחסן עם ניצול נמוך",
          relatedEntity: {
            entityType: "Warehouse",
            entityId: warehouse._id.toString(),
          },
          hours: 168, // שבוע
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📉 מחסן עם ניצול נמוך",
            content: `מחסן "${warehouse.name}" בשימוש של ${warehouse.utilization.toFixed(1)}% בלבד. שקול לאחד מחסנים או לשחרר שטח`,
            type: "Info",
            category: "warehouse",
            priority: "low",
            relatedEntity: {
              entityType: "Warehouse",
              entityId: warehouse._id.toString(),
            },
            actionUrl: `/dashboard/warehouses`,
            actionLabel: "צפה במחסן",
            dedupe: {
              enabled: true,
              hours: 168,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} low warehouse utilization notifications`);
  } catch (error) {
    console.error("❌ Error in checkWarehouseUtilizationLow:", error);
  }
};

/**
 * בדיקת בעיות במיקומי מחסנים (לא פעילים/חסרים)
 */
export const checkWarehouseLocationIssues = async () => {
  try {
    console.log("🔍 Checking warehouse location issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const warehouses = await Warehouse.find({
        companyId: company._id,
        status: { $in: ["maintenance", "offline"] },
      });

      for (const warehouse of warehouses) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "warehouse",
          title: "⚠️ מחסן לא פעיל",
          relatedEntity: {
            entityType: "Warehouse",
            entityId: warehouse._id.toString(),
          },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⚠️ מחסן לא פעיל",
            content: `מחסן "${warehouse.name}" במצב ${warehouse.status === "maintenance" ? "תחזוקה" : "לא פעיל"}. יש לטפל בהקדם`,
            type: "Warning",
            category: "warehouse",
            priority: warehouse.status === "offline" ? "high" : "medium",
            relatedEntity: {
              entityType: "Warehouse",
              entityId: warehouse._id.toString(),
            },
            actionUrl: `/dashboard/warehouses`,
            actionLabel: "צפה במחסן",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} warehouse location issues notifications`);
  } catch (error) {
    console.error("❌ Error in checkWarehouseLocationIssues:", error);
  }
};

// ========================
// CUSTOMERS & ORDERS NOTIFICATIONS
// ========================

/**
 * בדיקת הזמנות לקוחות ממתינות (X ימים)
 */
export const checkPendingCustomerOrders = async () => {
  try {
    console.log("🔍 Checking pending customer orders...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const pendingOrders = await CustomerOrder.find({
        companyId: company._id,
        status: "Pending",
        orderDate: { $lt: threeDaysAgo },
      })
        .populate("customer")
        .limit(50);

      if (pendingOrders.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "customers",
          title: "🛒 הזמנות לקוחות ממתינות",
          hours: 24,
        });

        if (!skip) {
          const totalAmount = pendingOrders.reduce(
            (sum, order) => sum + (order.orderTotal || 0),
            0
          );

          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "🛒 הזמנות לקוחות ממתינות",
            content: `יש ${pendingOrders.length} הזמנות לקוחות ממתינות מעל 3 ימים. סה"כ: ${totalAmount.toLocaleString()} ${pendingOrders[0]?.currency || "ILS"}`,
            type: "Warning",
            category: "customers",
            priority: "medium",
            actionUrl: `/dashboard/Customers/Orders`,
            actionLabel: "צפה בהזמנות",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} pending customer orders notifications`);
  } catch (error) {
    console.error("❌ Error in checkPendingCustomerOrders:", error);
  }
};

/**
 * בדיקת שינויי סטטוס חשובים בהזמנות לקוחות
 */
export const checkCustomerOrderStatusChanges = async () => {
  try {
    console.log("🔍 Checking customer order status changes...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // בדיקת הזמנות שהשתנו לאחרונה לסטטוסים חשובים
      const importantStatusOrders = await CustomerOrder.find({
        companyId: company._id,
        status: { $in: ["Shipped", "Delivered", "Cancelled"] },
        updatedAt: { $gte: oneDayAgo },
      })
        .populate("customer")
        .limit(20);

      for (const order of importantStatusOrders) {
        const statusLabels = {
          Shipped: "נשלח",
          Delivered: "נמסר",
          Cancelled: "בוטל",
        };

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "customers",
          title: `📦 הזמנה ${statusLabels[order.status] || order.status}`,
          relatedEntity: {
            entityType: "CustomerOrder",
            entityId: order._id.toString(),
          },
          hours: 12,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: `📦 הזמנה ${statusLabels[order.status] || order.status}`,
            content: `הזמנה #${order.orderNumber || order._id} של ${order.customer?.name || "לקוח"} ${statusLabels[order.status] || order.status}. סכום: ${order.orderTotal?.toLocaleString() || 0} ${order.currency || "ILS"}`,
            type: order.status === "Cancelled" ? "Warning" : "Success",
            category: "customers",
            priority: order.status === "Cancelled" ? "high" : "medium",
            relatedEntity: {
              entityType: "CustomerOrder",
              entityId: order._id.toString(),
            },
            actionUrl: `/dashboard/Customers/Orders/${order._id}`,
            actionLabel: "צפה בהזמנה",
            dedupe: {
              enabled: true,
              hours: 12,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} customer order status change notifications`);
  } catch (error) {
    console.error("❌ Error in checkCustomerOrderStatusChanges:", error);
  }
};

/**
 * בדיקת לקוחות עם תשלומים מאחרים
 */
export const checkCustomerPaymentOverdue = async () => {
  try {
    console.log("🔍 Checking customer payment overdue...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // מציאת הזמנות עם תשלומים מאחרים
      const overdueOrders = await CustomerOrder.find({
        companyId: company._id,
        status: { $in: ["Confirmed", "Shipped", "Delivered"] },
        paymentStatus: { $ne: "Paid" },
        deliveryDate: { $lt: today },
      })
        .populate("customer")
        .limit(50);

      if (overdueOrders.length > 0) {
        const totalOverdue = overdueOrders.reduce(
          (sum, order) => sum + (order.orderTotal || 0),
          0
        );

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "customers",
          title: "💸 תשלומי לקוחות מאחרים",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "💸 תשלומי לקוחות מאחרים",
            content: `יש ${overdueOrders.length} הזמנות עם תשלומים מאחרים. סה"כ חוב: ${totalOverdue.toLocaleString()} ${overdueOrders[0]?.currency || "ILS"}`,
            type: "Warning",
            category: "customers",
            priority: "high",
            actionUrl: `/dashboard/Customers/Orders`,
            actionLabel: "צפה בהזמנות",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} customer payment overdue notifications`);
  } catch (error) {
    console.error("❌ Error in checkCustomerPaymentOverdue:", error);
  }
};

/**
 * בדיקת לקוחות ללא פעילות (X חודשים)
 */
export const checkCustomerInactivity = async () => {
  try {
    console.log("🔍 Checking customer inactivity...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // מציאת לקוחות ללא הזמנות לאחרונה
      const inactiveCustomers = await Customer.find({
        companyId: company._id,
      })
        .populate({
          path: "orders",
          match: { orderDate: { $gte: threeMonthsAgo } },
          select: "_id",
        })
        .limit(50);

      const trulyInactive = inactiveCustomers.filter(
        (customer) => !customer.orders || customer.orders.length === 0
      );

      if (trulyInactive.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "customers",
          title: "😴 לקוחות ללא פעילות",
          hours: 168, // שבוע
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "😴 לקוחות ללא פעילות",
            content: `יש ${trulyInactive.length} לקוחות ללא פעילות כבר 3 חודשים. שקול ליצור קשר מחדש`,
            type: "Info",
            category: "customers",
            priority: "low",
            actionUrl: `/dashboard/Customers`,
            actionLabel: "צפה בלקוחות",
            dedupe: {
              enabled: true,
              hours: 168,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} customer inactivity notifications`);
  } catch (error) {
    console.error("❌ Error in checkCustomerInactivity:", error);
  }
};

// ========================
// SUPPLIERS NOTIFICATIONS
// ========================

/**
 * בדיקת בעיות ביצועים של ספקים (דירוג נמוך, איחורים)
 */
export const checkSupplierPerformanceIssues = async () => {
  try {
    console.log("🔍 Checking supplier performance issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const suppliers = await Suppliers.find({
        companyId: company._id,
        IsActive: true,
      });

      for (const supplier of suppliers) {
        const hasLowRating = supplier.averageRating && supplier.averageRating < 3;
        const hasNoRating = !supplier.averageRating || supplier.averageRating === 0;

        // בדיקת הזמנות רכש מאחרות מהספק
        const delayedProcurements = await Procurement.find({
          companyId: company._id,
          supplierId: supplier._id,
          orderStatus: { $in: ["Pending", "In Progress"] },
          deliveryDate: { $lt: new Date() },
        }).limit(5);

        if (hasLowRating || delayedProcurements.length > 0) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "suppliers",
            title: "⚠️ בעיית ביצועים בספק",
            relatedEntity: {
              entityType: "Supplier",
              entityId: supplier._id.toString(),
            },
            hours: 72,
          });

          if (!skip) {
            const issues = [];
            if (hasLowRating) {
              issues.push(`דירוג נמוך: ${supplier.averageRating.toFixed(1)}/5`);
            }
            if (delayedProcurements.length > 0) {
              issues.push(`${delayedProcurements.length} הזמנות מאחרות`);
            }

            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ בעיית ביצועים בספק",
              content: `ספק "${supplier.SupplierName}" עם בעיות: ${issues.join(", ")}`,
              type: "Warning",
              category: "suppliers",
              priority: hasLowRating && supplier.averageRating < 2 ? "high" : "medium",
              relatedEntity: {
                entityType: "Supplier",
                entityId: supplier._id.toString(),
              },
              actionUrl: `/dashboard/supplier`,
              actionLabel: "צפה בספק",
              dedupe: {
                enabled: true,
                hours: 72,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} supplier performance issues notifications`);
  } catch (error) {
    console.error("❌ Error in checkSupplierPerformanceIssues:", error);
  }
};

/**
 * בדיקת חוזי ספקים שקרובים למועד חידוש
 */
export const checkSupplierContractRenewal = async () => {
  try {
    console.log("🔍 Checking supplier contract renewals...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // נניח שיש שדה contractExpiryDate במודל Suppliers
      // אם לא, נדלג על זה
      const suppliers = await Suppliers.find({
        companyId: company._id,
        IsActive: true,
      });

      // אם אין שדה contractExpiryDate, נדלג על הפונקציה הזו
      // נבדוק אם יש שדה כזה
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // נניח שיש שדה contractExpiryDate (אם לא, נדלג)
      for (const supplier of suppliers) {
        // אם אין שדה contractExpiryDate, נדלג
        if (!supplier.contractExpiryDate) continue;

        const expiryDate = new Date(supplier.contractExpiryDate);
        if (expiryDate >= today && expiryDate <= thirtyDaysFromNow) {
          const daysUntilExpiry = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "suppliers",
            title: "📄 חוזה ספק קרוב למועד חידוש",
            relatedEntity: {
              entityType: "Supplier",
              entityId: supplier._id.toString(),
            },
            hours: 168, // שבוע
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "📄 חוזה ספק קרוב למועד חידוש",
              content: `חוזה של ספק "${supplier.SupplierName}" יפוג בעוד ${daysUntilExpiry} ימים (${expiryDate.toLocaleDateString("he-IL")})`,
              type: "Reminder",
              category: "suppliers",
              priority: daysUntilExpiry <= 7 ? "high" : "medium",
              relatedEntity: {
                entityType: "Supplier",
                entityId: supplier._id.toString(),
              },
              actionUrl: `/dashboard/supplier`,
              actionLabel: "צפה בספק",
              dedupe: {
                enabled: true,
                hours: 168,
              },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} supplier contract renewal notifications`);
  } catch (error) {
    console.error("❌ Error in checkSupplierContractRenewal:", error);
  }
};

/**
 * בדיקת בעיות תשלום לספקים
 */
export const checkSupplierPaymentIssues = async () => {
  try {
    console.log("🔍 Checking supplier payment issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // מציאת הזמנות רכש עם תשלומים מאחרים
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueProcurements = await Procurement.find({
        companyId: company._id,
        orderStatus: "Delivered",
        paymentStatus: { $ne: "Paid" },
        deliveryDate: { $lt: today },
      })
        .populate("supplierId")
        .limit(50);

      if (overdueProcurements.length > 0) {
        const totalOverdue = overdueProcurements.reduce((sum, proc) => {
          const procTotal = proc.products?.reduce(
            (pSum, p) => pSum + (p.total || 0),
            0
          ) || 0;
          return sum + procTotal;
        }, 0);

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "suppliers",
          title: "💸 תשלומים לספקים מאחרים",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "💸 תשלומים לספקים מאחרים",
            content: `יש ${overdueProcurements.length} הזמנות רכש עם תשלומים מאחרים לספקים. סה"כ: ${totalOverdue.toLocaleString()} ${company.baseCurrency || "ILS"}`,
            type: "Warning",
            category: "suppliers",
            priority: "high",
            actionUrl: `/dashboard/procurement`,
            actionLabel: "צפה בהזמנות רכש",
            dedupe: {
              enabled: true,
              hours: 24,
            },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created ${totalNotifications} supplier payment issues notifications`);
  } catch (error) {
    console.error("❌ Error in checkSupplierPaymentIssues:", error);
  }
};

// ========================
// INVOICES NOTIFICATIONS
// ========================

/**
 * בדיקת חשבוניות שנוצרו ולא נשלחו (X שעות)
 */
export const checkUnsentInvoices = async () => {
  try {
    console.log("🔍 Checking unsent invoices...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      const unsentInvoices = await Invoice.find({
        companyId: company._id,
        status: "Draft",
        createdAt: { $lt: sixHoursAgo },
        sentDate: { $exists: false },
      }).limit(20);

      if (unsentInvoices.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "invoices",
          title: "📄 חשבוניות שלא נשלחו",
          hours: 24,
        });

        if (!skip) {
          const totalAmount = unsentInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📄 חשבוניות שלא נשלחו",
            content: `יש ${unsentInvoices.length} חשבוניות שנוצרו ולא נשלחו עדיין. סה"כ: ${totalAmount.toLocaleString()} ${unsentInvoices[0]?.currency || "USD"}`,
            type: "Warning",
            category: "invoices",
            priority: "medium",
            actionUrl: `/dashboard/invoices`,
            actionLabel: "צפה בחשבוניות",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} unsent invoices notifications`);
  } catch (error) {
    console.error("❌ Error in checkUnsentInvoices:", error);
  }
};

/**
 * בדיקת חשבוניות ממתינות לאישור
 */
export const checkInvoiceApprovalPending = async () => {
  try {
    console.log("🔍 Checking invoice approval pending...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // נניח שיש שדה approvalStatus או שחשבוניות ב-Draft הן ממתינות לאישור
      const pendingInvoices = await Invoice.find({
        companyId: company._id,
        status: "Draft",
        createdAt: { $lt: twoDaysAgo },
      }).limit(20);

      if (pendingInvoices.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "invoices",
          title: "⏰ חשבוניות ממתינות לאישור",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⏰ חשבוניות ממתינות לאישור",
            content: `יש \${pendingInvoices.length} חשבוניות ממתינות לאישור מעל יומיים`,
            type: "Reminder",
            category: "invoices",
            priority: "medium",
            actionUrl: `/dashboard/invoices`,
            actionLabel: "צפה בחשבוניות",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} invoice approval pending notifications`);
  } catch (error) {
    console.error("❌ Error in checkInvoiceApprovalPending:", error);
  }
};

/**
 * בדיקת אי-התאמות בחשבוניות (סכום, מוצרים)
 */
export const checkInvoiceDiscrepancies = async () => {
  try {
    console.log("🔍 Checking invoice discrepancies...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const recentInvoices = await Invoice.find({
        companyId: company._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).populate("orderId").limit(50);

      for (const invoice of recentInvoices) {
        let hasDiscrepancy = false;
        let discrepancyDetails = [];

        // בדיקת התאמה בין חשבונית להזמנה (אם קיימת)
        if (invoice.orderId) {
          const order = invoice.orderId;
          if (Math.abs(invoice.totalAmount - order.orderTotal) > 0.01) {
            hasDiscrepancy = true;
            discrepancyDetails.push(`סכום לא תואם להזמנה: \${invoice.totalAmount} vs \${order.orderTotal}`);
          }
        }

        // בדיקת חשבוניות עם סכום 0
        if (invoice.totalAmount === 0 && invoice.items && invoice.items.length > 0) {
          hasDiscrepancy = true;
          discrepancyDetails.push("חשבונית עם פריטים אך סכום 0");
        }

        if (hasDiscrepancy) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "invoices",
            title: "⚠️ אי-התאמה בחשבונית",
            relatedEntity: { entityType: "Invoice", entityId: invoice._id.toString() },
            hours: 72,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ אי-התאמה בחשבונית",
              content: `חשבונית #\${invoice.invoiceNumber || invoice._id}: \${discrepancyDetails.join(", ")}`,
              type: "Warning",
              category: "invoices",
              priority: "medium",
              relatedEntity: { entityType: "Invoice", entityId: invoice._id.toString() },
              actionUrl: `/dashboard/invoices/\${invoice._id}`,
              actionLabel: "צפה בחשבונית",
              dedupe: { enabled: true, hours: 72 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} invoice discrepancies notifications`);
  } catch (error) {
    console.error("❌ Error in checkInvoiceDiscrepancies:", error);
  }
};

// ========================
// PROJECTS & TASKS NOTIFICATIONS
// ========================

/**
 * בדיקת משימות תקועות (X ימים ללא התקדמות)
 */
export const checkBlockedTasks = async () => {
  try {
    console.log("🔍 Checking blocked tasks...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const blockedTasks = await Task.find({
        companyId: company._id,
        status: { $in: ["InProgress", "Pending"] },
        updatedAt: { $lt: fiveDaysAgo },
      }).populate("assignedTo").limit(30);

      for (const task of blockedTasks) {
        const daysSinceUpdate = Math.floor((Date.now() - new Date(task.updatedAt)) / (1000 * 60 * 60 * 24));

        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "tasks",
          title: "🚧 משימה תקועה",
          relatedEntity: { entityType: "Task", entityId: task._id.toString() },
          hours: 48,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "🚧 משימה תקועה",
            content: `משימה "\${task.title}" ללא התקדמות כבר \${daysSinceUpdate} ימים`,
            type: "Warning",
            category: "tasks",
            priority: daysSinceUpdate > 10 ? "high" : "medium",
            relatedEntity: { entityType: "Task", entityId: task._id.toString() },
            actionUrl: `/dashboard/tasks/\${task._id}`,
            actionLabel: "צפה במשימה",
            dedupe: { enabled: true, hours: 48 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} blocked tasks notifications`);
  } catch (error) {
    console.error("❌ Error in checkBlockedTasks:", error);
  }
};

/**
 * בדיקת פרויקטים שחרגו מתקציב
 */
export const checkProjectBudgetOverrun = async () => {
  try {
    console.log("🔍 Checking project budget overruns...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // נניח שיש שדה actualCost או spentBudget בפרויקט
      const projects = await Project.find({
        companyId: company._id,
        status: { $in: ["Active", "On Hold"] },
        budget: { $gt: 0 },
      }).limit(50);

      for (const project of projects) {
        // נחשב את העלות הבפועל מכל המשימות או מהשדה spentBudget
        const tasks = await Task.find({ projectId: project._id });
        const actualCost = tasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);

        if (actualCost > project.budget) {
          const overrun = ((actualCost - project.budget) / project.budget) * 100;

          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "projects",
            title: "💸 פרויקט חרג מתקציב",
            relatedEntity: { entityType: "Project", entityId: project._id.toString() },
            hours: 48,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "💸 פרויקט חרג מתקציב",
              content: `פרויקט "\${project.name}" חרג בתקציב של \${overrun.toFixed(1)}%. תקציב: \${project.budget}, בפועל: \${actualCost}`,
              type: "Error",
              category: "projects",
              priority: overrun > 50 ? "critical" : "high",
              relatedEntity: { entityType: "Project", entityId: project._id.toString() },
              actionUrl: `/dashboard/projects/\${project._id}`,
              actionLabel: "צפה בפרויקט",
              dedupe: { enabled: true, hours: 48 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} project budget overrun notifications`);
  } catch (error) {
    console.error("❌ Error in checkProjectBudgetOverrun:", error);
  }
};

/**
 * בדיקת קונפליקטים במשאבים (עובדים/ציוד)
 */
export const checkProjectResourceConflicts = async () => {
  try {
    console.log("🔍 Checking project resource conflicts...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const activeProjects = await Project.find({
        companyId: company._id,
        status: "Active",
      }).populate("teamMembers.employeeId");

      // בדיקת עובדים שמשוייכים ליותר מ-3 פרויקטים פעילים
      const employeeProjectCount = {};
      for (const project of activeProjects) {
        for (const member of project.teamMembers || []) {
          const empId = member.employeeId?._id?.toString() || member.employeeId?.toString();
          if (!empId) continue;
          employeeProjectCount[empId] = (employeeProjectCount[empId] || 0) + 1;
        }
      }

      for (const empId in employeeProjectCount) {
        if (employeeProjectCount[empId] >= 3) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "projects",
            title: "⚠️ קונפליקט במשאבים",
            relatedEntity: { entityType: "Employee", entityId: empId },
            hours: 168,
          });

          if (!skip) {
            const employee = await Employee.findById(empId);
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ קונפליקט במשאבים",
              content: `עובד \${employee?.name || "לא ידוע"} משויך ל-\${employeeProjectCount[empId]} פרויקטים פעילים`,
              type: "Warning",
              category: "projects",
              priority: "medium",
              relatedEntity: { entityType: "Employee", entityId: empId },
              actionUrl: `/dashboard/projects`,
              actionLabel: "צפה בפרויקטים",
              dedupe: { enabled: true, hours: 168 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} resource conflict notifications`);
  } catch (error) {
    console.error("❌ Error in checkProjectResourceConflicts:", error);
  }
};

/**
 * בדיקת משימות ללא הקצאה
 */
export const checkUnassignedTasks = async () => {
  try {
    console.log("🔍 Checking unassigned tasks...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const unassignedTasks = await Task.find({
        companyId: company._id,
        status: { $in: ["Pending", "InProgress"] },
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: { $eq: null } },
          { assignedTo: { $size: 0 } },
        ],
        createdAt: { $lt: twoDaysAgo },
      }).limit(20);

      if (unassignedTasks.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "tasks",
          title: "👤 משימות ללא הקצאה",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "👤 משימות ללא הקצאה",
            content: `יש \${unassignedTasks.length} משימות ללא עובד משויך מעל יומיים`,
            type: "Warning",
            category: "tasks",
            priority: "medium",
            actionUrl: `/dashboard/tasks`,
            actionLabel: "צפה במשימות",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} unassigned tasks notifications`);
  } catch (error) {
    console.error("❌ Error in checkUnassignedTasks:", error);
  }
};

// ========================
// EMPLOYEES NOTIFICATIONS
// ========================

/**
 * בדיקת ימי הולדת של עובדים (X ימים מראש)
 */
export const checkEmployeeBirthdays = async () => {
  try {
    console.log("🔍 Checking employee birthdays...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const employees = await Employee.find({
        companyId: company._id,
        status: "active",
        dateOfBirth: { $exists: true },
      });

      for (const employee of employees) {
        if (!employee.dateOfBirth) continue;

        const birthday = new Date(employee.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

        if (thisYearBirthday >= today && thisYearBirthday <= threeDaysFromNow) {
          const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "employees",
            title: "🎂 יום הולדת של עובד",
            relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "🎂 יום הולדת של עובד",
              content: `יום הולדת של \${employee.name} \${employee.lastName} בעוד \${daysUntil} ימים (\${thisYearBirthday.toLocaleDateString("he-IL")})`,
              type: "Info",
              category: "employees",
              priority: "low",
              relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
              actionUrl: `/dashboard/employees/\${employee._id}`,
              actionLabel: "צפה בעובד",
              dedupe: { enabled: true, hours: 24 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} employee birthday notifications`);
  } catch (error) {
    console.error("❌ Error in checkEmployeeBirthdays:", error);
  }
};

/**
 * בדיקת ימי עבודה/נישואין (X ימים מראש)
 */
export const checkEmployeeAnniversaries = async () => {
  try {
    console.log("🔍 Checking employee work anniversaries...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const employees = await Employee.find({
        companyId: company._id,
        status: "active",
        createdAt: { $exists: true },
      });

      for (const employee of employees) {
        const hireDate = new Date(employee.createdAt);
        const yearsWorked = today.getFullYear() - hireDate.getFullYear();

        if (yearsWorked > 0) {
          const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());

          if (thisYearAnniversary >= today && thisYearAnniversary <= sevenDaysFromNow) {
            const daysUntil = Math.ceil((thisYearAnniversary - today) / (1000 * 60 * 60 * 24));

            const skip = await shouldSkipNotification({
              companyId: company._id,
              category: "employees",
              title: "🎉 יום עבודה שנתי",
              relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
              hours: 168,
            });

            if (!skip) {
              await notifyAdminsAndManagers({
                companyId: company._id,
                title: "🎉 יום עבודה שנתי",
                content: `\${employee.name} \${employee.lastName} חוגג \${yearsWorked} שנים בחברה בעוד \${daysUntil} ימים`,
                type: "Success",
                category: "employees",
                priority: "low",
                relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
                actionUrl: `/dashboard/employees/\${employee._id}`,
                actionLabel: "צפה בעובד",
                dedupe: { enabled: true, hours: 168 },
              });
              totalNotifications++;
            }
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} employee anniversary notifications`);
  } catch (error) {
    console.error("❌ Error in checkEmployeeAnniversaries:", error);
  }
};

/**
 * בדיקת חוזי עובדים שקרובים למועד סיום
 */
export const checkEmployeeContractExpiry = async () => {
  try {
    console.log("�� Checking employee contract expiry...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // נניח שיש שדה contractEndDate בעובדים
      const employees = await Employee.find({
        companyId: company._id,
        status: "active",
      });

      for (const employee of employees) {
        // אם אין שדה contractEndDate, נדלג
        if (!employee.contractEndDate) continue;

        const contractEnd = new Date(employee.contractEndDate);
        if (contractEnd >= today && contractEnd <= thirtyDaysFromNow) {
          const daysUntilExpiry = Math.ceil((contractEnd - today) / (1000 * 60 * 60 * 24));

          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "employees",
            title: "📄 חוזה עובד קרוב לסיום",
            relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
            hours: 168,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "📄 חוזה עובד קרוב לסיום",
              content: `חוזה של \${employee.name} \${employee.lastName} יפוג בעוד \${daysUntilExpiry} ימים (\${contractEnd.toLocaleDateString("he-IL")})`,
              type: "Warning",
              category: "employees",
              priority: daysUntilExpiry <= 7 ? "high" : "medium",
              relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
              actionUrl: `/dashboard/employees/\${employee._id}`,
              actionLabel: "צפה בעובד",
              dedupe: { enabled: true, hours: 168 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} employee contract expiry notifications`);
  } catch (error) {
    console.error("❌ Error in checkEmployeeContractExpiry:", error);
  }
};

/**
 * בדיקת דפוסי היעדרות חריגים (חולים/חופשות)
 */
export const checkEmployeeAbsencePatterns = async () => {
  try {
    console.log("🔍 Checking employee absence patterns...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const employees = await Employee.find({
        companyId: company._id,
        status: "active",
      });

      for (const employee of employees) {
        const recentShifts = await Shift.find({
          companyId: company._id,
          employeeId: employee._id,
          shiftDate: { $gte: thirtyDaysAgo },
          dayType: { $in: ["Sickday", "Vacation"] },
        });

        if (recentShifts.length >= 5) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "employees",
            title: "⚠️ דפוס היעדרות חריג",
            relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
            hours: 168,
          });

          if (!skip) {
            const sickDays = recentShifts.filter(s => s.dayType === "Sickday").length;
            const vacationDays = recentShifts.filter(s => s.dayType === "Vacation").length;

            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ דפוס היעדרות חריג",
              content: `עובד \${employee.name} \${employee.lastName} עם \${recentShifts.length} ימי היעדרות ב-30 ימים האחרונים (חולי: \${sickDays}, חופשה: \${vacationDays})`,
              type: "Warning",
              category: "employees",
              priority: "medium",
              relatedEntity: { entityType: "Employee", entityId: employee._id.toString() },
              actionUrl: `/dashboard/employees/\${employee._id}`,
              actionLabel: "צפה בעובד",
              dedupe: { enabled: true, hours: 168 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} employee absence pattern notifications`);
  } catch (error) {
    console.error("❌ Error in checkEmployeeAbsencePatterns:", error);
  }
};

// ========================
// INVENTORY NOTIFICATIONS
// ========================

/**
 * בדיקת אי-התאמות במלאי (ספירה vs מערכת)
 */
export const checkInventoryDiscrepancies = async () => {
  try {
    console.log("🔍 Checking inventory discrepancies...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // נניח שיש שדה lastAudit או lastPhysicalCount במלאי
      const inventoryItems = await Inventory.find({
        companyId: company._id,
        quantity: { $ne: 0 },
      }).populate("productId").limit(100);

      for (const item of inventoryItems) {
        // בדיקת מלאי שיכול להיות בעייתי
        const hasNegativeQuantity = item.quantity < 0;
        const isBelowMin = item.quantity < item.minStockLevel;

        if (hasNegativeQuantity) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "inventory",
            title: "❌ אי-התאמה במלאי",
            relatedEntity: { entityType: "Inventory", entityId: item._id.toString() },
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "❌ אי-התאמה במלאי",
              content: `מלאי של מוצר "\${item.productId?.ProductName || "לא ידוע"}" בכמות שלילית: \${item.quantity}`,
              type: "Error",
              category: "inventory",
              priority: "critical",
              relatedEntity: { entityType: "Inventory", entityId: item._id.toString() },
              actionUrl: `/dashboard/inventory`,
              actionLabel: "צפה במלאי",
              dedupe: { enabled: true, hours: 24 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} inventory discrepancies notifications`);
  } catch (error) {
    console.error("❌ Error in checkInventoryDiscrepancies:", error);
  }
};

/**
 * בדיקת מוצרים שלא נמכרו (X חודשים)
 */
export const checkSlowMovingInventory = async () => {
  try {
    console.log("🔍 Checking slow moving inventory...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const inventoryItems = await Inventory.find({
        companyId: company._id,
        quantity: { $gt: 0 },
        $or: [
          { lastOrderDate: { $lt: threeMonthsAgo } },
          { lastOrderDate: { $exists: false }, createdAt: { $lt: threeMonthsAgo } },
        ],
      }).populate("productId").limit(50);

      if (inventoryItems.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "inventory",
          title: "📦 מוצרים שלא נמכרו",
          hours: 168,
        });

        if (!skip) {
          const totalValue = inventoryItems.reduce((sum, item) => {
            const price = item.productId?.Price || 0;
            return sum + (price * item.quantity);
          }, 0);

          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📦 מוצרים שלא נמכרו",
            content: `יש \${inventoryItems.length} מוצרים במלאי שלא נמכרו כבר 3 חודשים. ערך משוער: \${totalValue.toLocaleString()} \${company.baseCurrency || "ILS"}`,
            type: "Info",
            category: "inventory",
            priority: "low",
            actionUrl: `/dashboard/Inventory`,
            actionLabel: "צפה במלאי",
            dedupe: { enabled: true, hours: 168 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} slow moving inventory notifications`);
  } catch (error) {
    console.error("❌ Error in checkSlowMovingInventory:", error);
  }
};

/**
 * בדיקת העברות מלאי ממתינות
 */
export const checkInventoryTransferPending = async () => {
  try {
    console.log("🔍 Checking pending inventory transfers...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // נבדוק רשומות ב-InventoryHistory עם סוג "transfer" שלא הושלם
      const pendingTransfers = await InventoryHistory.find({
        companyId: company._id,
        movementType: "transfer",
        createdAt: { $lt: twoDaysAgo },
      }).populate("productId").limit(20);

      if (pendingTransfers.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "inventory",
          title: "⏳ העברות מלאי ממתינות",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⏳ העברות מלאי ממתינות",
            content: `יש \${pendingTransfers.length} העברות מלאי שלא הושלמו מעל יומיים`,
            type: "Warning",
            category: "inventory",
            priority: "medium",
            actionUrl: `/dashboard/Inventory`,
            actionLabel: "צפה בהעברות",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} pending inventory transfer notifications`);
  } catch (error) {
    console.error("❌ Error in checkInventoryTransferPending:", error);
  }
};

/**
 * בדיקת בעיות במיקומי מלאי
 */
export const checkInventoryLocationIssues = async () => {
  try {
    console.log("🔍 Checking inventory location issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // בדיקת מלאי ללא מחסן או מיקום
      const itemsWithoutLocation = await Inventory.find({
        companyId: company._id,
        quantity: { $gt: 0 },
        $or: [
          { warehouseId: { $exists: false } },
          { warehouseId: null },
        ],
      }).populate("productId").limit(20);

      if (itemsWithoutLocation.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "inventory",
          title: "📍 בעיות במיקומי מלאי",
          hours: 48,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "📍 בעיות במיקומי מלאי",
            content: `יש \${itemsWithoutLocation.length} פריטי מלאי ללא מיקום מחסן מוגדר`,
            type: "Warning",
            category: "inventory",
            priority: "medium",
            actionUrl: `/dashboard/Inventory`,
            actionLabel: "צפה במלאי",
            dedupe: { enabled: true, hours: 48 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} inventory location issues notifications`);
  } catch (error) {
    console.error("❌ Error in checkInventoryLocationIssues:", error);
  }
};

// ========================
// FINANCE NOTIFICATIONS
// ========================

/**
 * בדיקת תזרים מזומנים שלילי או קרוב למינימום
 */
export const checkCashFlowAlerts = async () => {
  try {
    console.log("🔍 Checking cash flow alerts...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // חישוב מאזן חשבון
      const allRecords = await Finance.find({
        companyId: company._id,
      });

      let totalIncome = 0;
      let totalExpense = 0;

      for (const record of allRecords) {
        if (record.transactionType === "Income") {
          totalIncome += record.amount || 0;
        } else if (record.transactionType === "Expense") {
          totalExpense += record.amount || 0;
        }
      }

      const cashFlow = totalIncome - totalExpense;
      const minThreshold = 10000; // סף מינימום לדוגמה

      if (cashFlow < minThreshold) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "finance",
          title: "💰 אזהרת תזרים מזומנים",
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "💰 אזהרת תזרים מזומנים",
            content: `תזרים המזומנים נמוך: \${cashFlow.toLocaleString()} \${company.baseCurrency || "ILS"}. סף מינימום: \${minThreshold.toLocaleString()}`,
            type: cashFlow < 0 ? "Error" : "Warning",
            category: "finance",
            priority: cashFlow < 0 ? "critical" : "high",
            actionUrl: `/dashboard/finance`,
            actionLabel: "צפה בכספים",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} cash flow alert notifications`);
  } catch (error) {
    console.error("❌ Error in checkCashFlowAlerts:", error);
  }
};

/**
 * בדיקת עסקאות גדולות (מעל סכום X) — דורש אישור
 */
export const checkLargeTransactions = async () => {
  try {
    console.log("🔍 Checking large transactions...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const largeThreshold = 50000; // סף לעסקה גדולה
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const largeTransactions = await Finance.find({
        companyId: company._id,
        amount: { $gte: largeThreshold },
        createdAt: { $gte: oneDayAgo },
      }).limit(10);

      for (const transaction of largeTransactions) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "finance",
          title: "💵 עסקה גדולה זוהתה",
          relatedEntity: { entityType: "Finance", entityId: transaction._id.toString() },
          hours: 24,
        });

        if (!skip) {
          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "💵 עסקה גדולה זוהתה",
            content: `עסקה של \${transaction.amount.toLocaleString()} \${transaction.currency} (\${transaction.transactionType}) - \${transaction.description || "ללא תיאור"}`,
            type: "Info",
            category: "finance",
            priority: "medium",
            relatedEntity: { entityType: "Finance", entityId: transaction._id.toString() },
            actionUrl: `/dashboard/finance`,
            actionLabel: "צפה בעסקה",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} large transaction notifications`);
  } catch (error) {
    console.error("❌ Error in checkLargeTransactions:", error);
  }
};

/**
 * בדיקת רשומות פיננסיות כפולות (למניעת טעויות)
 */
export const checkDuplicateFinanceRecords = async () => {
  try {
    console.log("🔍 Checking duplicate finance records...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentRecords = await Finance.find({
        companyId: company._id,
        createdAt: { $gte: oneDayAgo },
      });

      const duplicates = new Map();

      for (const record of recentRecords) {
        const key = `\${record.amount}_\${record.transactionType}_\${record.description || ""}_\${new Date(record.transactionDate).toDateString()}`;
        if (duplicates.has(key)) {
          duplicates.get(key).push(record);
        } else {
          duplicates.set(key, [record]);
        }
      }

      for (const [key, records] of duplicates) {
        if (records.length > 1) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "finance",
            title: "⚠️ רשומות פיננסיות כפולות",
            hours: 24,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ רשומות פיננסיות כפולות",
              content: `זוהו \${records.length} רשומות זהות: \${records[0].amount} \${records[0].currency} - \${records[0].description || "ללא תיאור"}`,
              type: "Warning",
              category: "finance",
              priority: "medium",
              actionUrl: `/dashboard/finance`,
              actionLabel: "צפה ברשומות",
              dedupe: { enabled: true, hours: 24 },
            });
            totalNotifications++;
            break; // רק התראה אחת לכל החברה
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} duplicate finance record notifications`);
  } catch (error) {
    console.error("❌ Error in checkDuplicateFinanceRecords:", error);
  }
};

/**
 * בדיקת עסקאות שלא הותאמו (bank reconciliation)
 */
export const checkUnreconciledTransactions = async () => {
  try {
    console.log("🔍 Checking unreconciled transactions...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // נניח שיש שדה reconciled או isReconciled
      const unreconciledRecords = await Finance.find({
        companyId: company._id,
        createdAt: { $lt: sevenDaysAgo },
        // נניח שיש שדה reconciled
      }).limit(50);

      // אם אין שדה reconciled, נדלג על הפונקציה
      const hasReconciledField = unreconciledRecords.length > 0 && unreconciledRecords[0].hasOwnProperty("reconciled");

      if (hasReconciledField) {
        const unreconciled = unreconciledRecords.filter(r => !r.reconciled);

        if (unreconciled.length > 0) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "finance",
            title: "🏦 עסקאות שלא הותאמו",
            hours: 168,
          });

          if (!skip) {
            const totalAmount = unreconciled.reduce((sum, r) => sum + (r.amount || 0), 0);

            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "🏦 עסקאות שלא הותאמו",
              content: `יש \${unreconciled.length} עסקאות מעל שבוע שלא הותאמו. סה"כ: \${totalAmount.toLocaleString()} \${company.baseCurrency || "ILS"}`,
              type: "Warning",
              category: "finance",
              priority: "medium",
              actionUrl: `/dashboard/finance`,
              actionLabel: "צפה בעסקאות",
              dedupe: { enabled: true, hours: 168 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} unreconciled transaction notifications`);
  } catch (error) {
    console.error("❌ Error in checkUnreconciledTransactions:", error);
  }
};

// ========================
// PROCUREMENT NOTIFICATIONS
// ========================

/**
 * בדיקת הזמנות רכש ממתינות לאישור (X ימים)
 */
export const checkProcurementApprovalDeadline = async () => {
  try {
    console.log("🔍 Checking procurement approval deadlines...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const pendingApproval = await Procurement.find({
        companyId: company._id,
        approvalStatus: "Pending Approval",
        createdAt: { $lt: threeDaysAgo },
      }).populate("supplierId").limit(20);

      if (pendingApproval.length > 0) {
        const skip = await shouldSkipNotification({
          companyId: company._id,
          category: "procurement",
          title: "⏰ הזמנות רכש ממתינות לאישור",
          hours: 24,
        });

        if (!skip) {
          const totalAmount = pendingApproval.reduce((sum, proc) => {
            return sum + (proc.products?.reduce((pSum, p) => pSum + (p.total || 0), 0) || 0);
          }, 0);

          await notifyAdminsAndManagers({
            companyId: company._id,
            title: "⏰ הזמנות רכש ממתינות לאישור",
            content: `יש \${pendingApproval.length} הזמנות רכש ממתינות לאישור מעל 3 ימים. סה"כ: \${totalAmount.toLocaleString()} \${company.baseCurrency || "ILS"}`,
            type: "Warning",
            category: "procurement",
            priority: "high",
            actionUrl: `/dashboard/procurement`,
            actionLabel: "צפה בהזמנות",
            dedupe: { enabled: true, hours: 24 },
          });
          totalNotifications++;
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} procurement approval deadline notifications`);
  } catch (error) {
    console.error("❌ Error in checkProcurementApprovalDeadline:", error);
  }
};

/**
 * בדיקת אי-התאמה בין הזמנת רכש לחשבונית ספק
 */
export const checkSupplierInvoiceMismatch = async () => {
  try {
    console.log("🔍 Checking supplier invoice mismatches...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      // נניח שיש שדה supplierInvoiceAmount או שנוכל להשוות
      const deliveredProcurements = await Procurement.find({
        companyId: company._id,
        orderStatus: "Delivered",
        paymentStatus: { $ne: "Paid" },
      }).populate("supplierId").limit(20);

      for (const procurement of deliveredProcurements) {
        const expectedTotal = procurement.products?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        
        // אם יש שדה supplierInvoiceAmount ויש אי-התאמה
        if (procurement.supplierInvoiceAmount && Math.abs(procurement.supplierInvoiceAmount - expectedTotal) > 0.01) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "procurement",
            title: "⚠️ אי-התאמה בחשבונית ספק",
            relatedEntity: { entityType: "PurchaseOrder", entityId: procurement._id.toString() },
            hours: 48,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ אי-התאמה בחשבונית ספק",
              content: `הזמנת רכש \${procurement.PurchaseOrder}: סכום צפוי \${expectedTotal.toLocaleString()} vs חשבונית ספק \${procurement.supplierInvoiceAmount.toLocaleString()}`,
              type: "Warning",
              category: "procurement",
              priority: "high",
              relatedEntity: { entityType: "PurchaseOrder", entityId: procurement._id.toString() },
              actionUrl: `/dashboard/procurement/\${procurement._id}`,
              actionLabel: "צפה בהזמנה",
              dedupe: { enabled: true, hours: 48 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} supplier invoice mismatch notifications`);
  } catch (error) {
    console.error("❌ Error in checkSupplierInvoiceMismatch:", error);
  }
};

/**
 * בדיקת בעיות איכות במוצרים שהתקבלו
 */
export const checkProcurementQualityIssues = async () => {
  try {
    console.log("🔍 Checking procurement quality issues...");
    const companies = await Company.find();
    let totalNotifications = 0;

    for (const company of companies) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentProcurements = await Procurement.find({
        companyId: company._id,
        orderStatus: "Delivered",
        deliveryDate: { $gte: sevenDaysAgo },
      }).populate("supplierId");

      for (const procurement of recentProcurements) {
        let hasQualityIssue = false;
        let issueDescription = [];

        // בדיקת כמות שהתקבלה לעומת כמות שהוזמנה
        for (const product of procurement.products || []) {
          if (product.receivedQuantity < product.quantity) {
            hasQualityIssue = true;
            issueDescription.push(`\${product.productName}: הוזמן \${product.quantity}, התקבל \${product.receivedQuantity}`);
          }
        }

        if (hasQualityIssue) {
          const skip = await shouldSkipNotification({
            companyId: company._id,
            category: "procurement",
            title: "⚠️ בעיית איכות ברכש",
            relatedEntity: { entityType: "PurchaseOrder", entityId: procurement._id.toString() },
            hours: 48,
          });

          if (!skip) {
            await notifyAdminsAndManagers({
              companyId: company._id,
              title: "⚠️ בעיית איכות ברכש",
              content: `הזמנת רכש \${procurement.PurchaseOrder} מספק "\${procurement.supplierId?.SupplierName || "לא ידוע"}": \${issueDescription.join(", ")}`,
              type: "Warning",
              category: "procurement",
              priority: "high",
              relatedEntity: { entityType: "PurchaseOrder", entityId: procurement._id.toString() },
              actionUrl: `/dashboard/procurement/\${procurement._id}`,
              actionLabel: "צפה בהזמנה",
              dedupe: { enabled: true, hours: 48 },
            });
            totalNotifications++;
          }
        }
      }
    }
    console.log(`✅ Created \${totalNotifications} procurement quality issue notifications`);
  } catch (error) {
    console.error("❌ Error in checkProcurementQualityIssues:", error);
  }
};
