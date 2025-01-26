// backend/controllers/notification.controller.js
import Procurement from "../models/procurement.model.js";
import Notification from "../models/notification.model.js";
import Budget from "../models/budget.model.js";

import Company from "../models/companies.model.js"; // ייבוא מודל העובד
import jwt from "jsonwebtoken";
import cron from "node-cron";

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
        console.log(
          `Procurement notifications created for company ${companyId}:`,
          procurementNotifications
        );

        const budgetNotifications = await checkPendingBudgetSignaturesLogic(
          companyId
        );
        console.log(
          `Budget notifications created for company ${companyId}:`,
          budgetNotifications
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

cron.schedule("0 0 * * *", async () => {
  console.log("Running cron job to clean up expired notifications...");
  try {
    const now = new Date();
    const result = await Notification.deleteMany({
      expirationDate: { $lt: now },
    });
    console.log(`Deleted ${result.deletedCount} expired notifications.`);
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error);
  }
});
