import ProcurementProposal from "../models/ProcurementProposal.model.js";
import jwt from "jsonwebtoken";

// שליפת כל הצעות הרכש
export const getProposals = async (req, res) => {
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
    const employeeId = decodedToken.employeeId;

    const proposals = await ProcurementProposal.find({
      companyId,
      employeeId,
    });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({
      error: "אירעה שגיאה בשליפת ההצעות",
      details: error.message,
    });
  }
};

// שליפת הצעה לפי מזהה
export const getProposal = async (req, res) => {
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
    const proposal = await ProcurementProposal.find({ companyId });
    if (!proposal) {
      return res.status(404).json({ error: "לא נמצאה הצעה עם מזהה זה" });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({
      error: "אירעה שגיאה בשליפת ההצעה",
      details: error.message,
    });
  }
};

// יצירת הצעת רכש חדשה
export const createProposal = async (req, res) => {
  try {
    // אימות טוקן
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // בדיקת שדות חובה (title ו-description)
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        error: "חובה למלא כותרת ותיאור",
      });
    }

    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId;

    // עיבוד פריטי המוצר
    let items = [];
    if (Array.isArray(req.body.items)) {
      items = req.body.items.map((item) => ({
        productId: item.productId,
        productName: item.productName || "N/A",
        sku: item.sku || "N/A",
        category: item.category || "N/A",
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 0,
        total: item.total || 0,
        // receivedQuantity לא חובה — ערך ברירת מחדל במודל
      }));
    }

    // הכנת אובייקט הנתונים לשמירה
    const proposalData = {
      ...req.body,
      companyId, // מהטוקן
      createdBy: employeeId,
      items,
    };

    console.log("Creating proposal with data:", proposalData);

    const newProposal = new ProcurementProposal(proposalData);
    const savedProposal = await newProposal.save();

    return res.status(201).json(savedProposal);
  } catch (error) {
    console.error("Error in createProposal:", error);
    return res.status(500).json({
      error: "אירעה שגיאה ביצירת ההצעה",
      details: error.message,
    });
  }
};

// עדכון הצעת רכש קיימת
export const updateProposal = async (req, res) => {
  try {
    const updatedProposal = await ProcurementProposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProposal) {
      return res.status(404).json({ error: "לא נמצאה הצעה לעדכון" });
    }
    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({
      error: "אירעה שגיאה בעדכון ההצעה",
      details: error.message,
    });
  }
};

export const deleteProposal = async (req, res) => {
  try {
    const deletedProposal = await ProcurementProposal.findByIdAndDelete(
      req.params.id
    );
    if (!deletedProposal) {
      return res.status(404).json({ error: "לא נמצאה הצעה למחיקה" });
    }
    res.json({ message: "ההצעה נמחקה בהצלחה" });
  } catch (error) {
    res.status(500).json({
      error: "אירעה שגיאה במחיקת ההצעה",
      details: error.message,
    });
  }
};
