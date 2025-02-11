// backend/controllers/notification.controller.js
import Procurement from "../models/procurement.model.js";
import Notification from "../models/notification.model.js";
import Budget from "../models/budget.model.js";
import Event from "../models/events.model.js";

import Company from "../models/companies.model.js"; // ייבוא מודל העובד
import jwt from "jsonwebtoken";
import cron from "node-cron";
import Project from "../models/project.model.js";

// פונקציה נפרדת ללוגיקה עסקית
const checkPendingSignaturesLogic = async (companyId) => {
  try {
    const now = new Date();

    const procurements = await Procurement.find({
      status: { $ne: "completed" },
      companyId: companyId,
    });
    console.log("Procurements not signed:", procurements);

    const notifications = [];

    for (const procurement of procurements) {
      const { currentSignerIndex, signers, PurchaseOrder } = procurement;

      const currentSigner = signers.find(
        (signer) => signer.order === currentSignerIndex
      );
      if (!currentSigner || currentSigner.hasSigned) continue;

      const timeSinceLastTurn =
        now - new Date(currentSigner.timeStamp || procurement.createdAt);

      if (timeSinceLastTurn >= 60 * 1000 * 60 * 24) {
        // 24 שעות
        const message = `The signer ${currentSigner.name} has not signed Purchase Order ${PurchaseOrder} after 24 hours.`;

        const notification = new Notification({
          companyId: companyId, // שמירת מזהה החברה
          content: message,
          type: "Reminder",
          employeeId: currentSigner.employeeId,
          PurchaseOrder: PurchaseOrder,
        });

        await notification.save();
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error("Error checking pending signatures:", error);
    throw error;
  }
};

// בקר HTTP לבדיקת חתימות בהמתנה
export const checkPendingSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
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
    res.status(500).json({
      success: false,
      message: "Error checking pending signatures",
      error: error.message,
    });
  }
};

// בקר HTTP לקבלת התראות לאדמין
export const getAdminNotifications = async (req, res) => {
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
    const notifications = await Notification.find({
      companyId: companyId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
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

    console.log("Budgets not signed:", budgets);

    const notifications = [];

    for (const budget of budgets) {
      const { currentSignerIndex, signers, departmentOrProjectName } = budget;

      const currentSigner = signers.find(
        (signer) => signer.order === currentSignerIndex
      );
      if (!currentSigner || currentSigner.hasSigned) continue;

      const timeSinceLastTurn =
        now - new Date(currentSigner.timeStamp || budget.createdAt);

      if (timeSinceLastTurn >= 60 * 1000 * 60 * 24) {
        // 24 שעות
        const message = `The signer ${currentSigner.name} has not signed the budget for ${departmentOrProjectName} after 24 hours.`;

        const notification = new Notification({
          companyId: companyId, // שמירת מזהה החברה
          content: message,
          type: "Reminder",
          employeeId: currentSigner.employeeId,
          budgetName: departmentOrProjectName,
        });

        await notification.save();
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error("Error checking pending budget signatures:", error);
    throw error;
  }
};

// בקר HTTP לבדיקת חתימות תקציב בהמתנה
export const checkPendingBudgetSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
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
    res.status(500).json({
      success: false,
      message: "Error checking pending budget signatures",
      error: error.message,
    });
  }
};

cron.schedule("0 * * * *", async () => {
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

// Cron job scheduled to run every minute
cron.schedule("*/1 * * * *", async () => {
  try {
    const companies = await Company.find();
    for (const company of companies) {
      await checkDateProjectForCompany(company._id);
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});
