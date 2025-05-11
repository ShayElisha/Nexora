import jwt from "jsonwebtoken";
import TaxConfig from "../models/TaxConfig.model.js";

// Create a new tax configuration
export const createTaxConfig = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { countryCode, taxName, taxBrackets, otherTaxes, currency } =
      req.body;
    const companyId = decodedToken.companyId;

    // Validate required fields
    if (!countryCode || !taxBrackets || !currency) {
      return res.status(400).json({
        success: false,
        message: "countryCode, taxBrackets ו-currency הם שדות חובה",
      });
    }

    // Validate countryCode format
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return res.status(400).json({
        success: false,
        message: "countryCode חייב להיות קוד מדינה תקין (למשל, IL, US)",
      });
    }

    // Validate taxBrackets
    if (!Array.isArray(taxBrackets) || taxBrackets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "taxBrackets חייב להיות מערך לא ריק",
      });
    }
    for (const bracket of taxBrackets) {
      if (
        !bracket.limit ||
        !bracket.rate ||
        bracket.rate < 0 ||
        bracket.rate > 1
      ) {
        return res.status(400).json({
          success: false,
          message: "כל מדרגת מס חייבת לכלול limit ו-rate תקינים (0-1)",
        });
      }
    }

    // Validate otherTaxes
    if (otherTaxes && !Array.isArray(otherTaxes)) {
      return res.status(400).json({
        success: false,
        message: "otherTaxes חייב להיות מערך",
      });
    }
    if (otherTaxes) {
      for (const tax of otherTaxes) {
        if (
          !tax.name ||
          (tax.rate === undefined && tax.fixedAmount === undefined)
        ) {
          return res.status(400).json({
            success: false,
            message: "כל מס נוסף חייב לכלול name ו-rate או fixedAmount",
          });
        }
      }
    }

    // Check for existing active tax config
    const existingConfig = await TaxConfig.findOne({
      countryCode,
      companyId,
      isActive: true,
    });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: "קיימת תצורת מס פעילה עבור מדינה זו",
      });
    }

    // Create new tax configuration
    const taxConfig = new TaxConfig({
      countryCode,
      companyId,
      taxName: taxName || "Income Tax",
      taxBrackets,
      otherTaxes: otherTaxes || [],
      currency,
      isActive: true,
    });

    await taxConfig.save();

    res.status(201).json({ success: true, data: taxConfig });
  } catch (error) {
    console.error("Error creating tax config:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה ביצירת תצורת מס: " + error.message,
    });
  }
};

// Update an existing tax configuration
export const updateTaxConfig = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const updates = req.body;
    const companyId = decodedToken.companyId;

    // Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "לא נשלחו נתונים לעדכון",
      });
    }

    // Define allowed updates
    const allowedUpdates = [
      "countryCode", // Added to allow updating countryCode
      "taxName",
      "taxBrackets",
      "otherTaxes",
      "currency",
      "isActive",
    ];

    // Validate updates
    const isValidUpdate = Object.keys(updates).every((key) =>
      allowedUpdates.includes(key)
    );
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: "שדות עדכון לא חוקיים",
      });
    }

    // Validate countryCode if provided
    if (updates.countryCode && !/^[A-Z]{2}$/.test(updates.countryCode)) {
      return res.status(400).json({
        success: false,
        message: "countryCode חייב להיות קוד מדינה תקין (למשל, IL, US)",
      });
    }

    // Validate taxBrackets if provided
    if (updates.taxBrackets) {
      if (
        !Array.isArray(updates.taxBrackets) ||
        updates.taxBrackets.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "taxBrackets חייב להיות מערך לא ריק",
        });
      }
      for (const bracket of updates.taxBrackets) {
        if (
          bracket.limit === undefined ||
          bracket.rate === undefined ||
          bracket.rate < 0 ||
          bracket.rate > 1
        ) {
          return res.status(400).json({
            success: false,
            message: "כל מדרגת מס חייבת לכלול limit ו-rate תקינים (0-1)",
          });
        }
      }
    }

    // Validate otherTaxes if provided
    if (updates.otherTaxes) {
      if (!Array.isArray(updates.otherTaxes)) {
        return res.status(400).json({
          success: false,
          message: "otherTaxes חייב להיות מערך",
        });
      }
      for (const tax of updates.otherTaxes) {
        if (
          !tax.name ||
          (tax.rate === undefined && tax.fixedAmount === undefined)
        ) {
          return res.status(400).json({
            success: false,
            message: "כל מס נוסף חייב לכלול name ו-rate או fixedAmount",
          });
        }
      }
    }

    // Find and update tax config
    const taxConfig = await TaxConfig.findOne({ _id: id, companyId });
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: "תצורת מס לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    Object.assign(taxConfig, updates);
    await taxConfig.save();

    res.status(200).json({ success: true, data: taxConfig });
  } catch (error) {
    console.error("Error updating tax config:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה בעדכון תצורת מס: " + error.message,
    });
  }
};

// Delete a tax configuration
export const deleteTaxConfig = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const companyId = decodedToken.companyId;

    // Find and delete tax config
    const taxConfig = await TaxConfig.findOneAndDelete({ _id: id, companyId });
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: "תצורת מס לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    res.status(200).json({ success: true, message: "תצורת מס נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting tax config:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה במחיקת תצורת מס: " + error.message,
    });
  }
};

// Get a tax configuration by ID
export const getTaxConfig = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const companyId = decodedToken.companyId;

    // Find tax config
    const taxConfig = await TaxConfig.findOne({ _id: id, companyId });
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: "תצורת מס לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    res.status(200).json({ success: true, data: taxConfig });
  } catch (error) {
    console.error("Error fetching tax config:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה בשליפת תצורת מס: " + error.message,
    });
  }
};

// Get all tax configurations for a company
export const getAllTaxConfigs = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const companyId = decodedToken.companyId;

    // Find all tax configs
    const taxConfigs = await TaxConfig.find({ companyId });
    res.status(200).json({ success: true, data: taxConfigs });
  } catch (error) {
    console.error("Error fetching all tax configs:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה בשליפת תצורות מס: " + error.message,
    });
  }
};
