import PayRate from "../models/PayRates.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// שליפת כל התעריפים של חברה
export const getPayRates = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const payRates = await PayRate.find({ companyId }).select("-__v");
    console.log("Pay Rates:", payRates);
    res.status(200).json(payRates);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pay rates", error: error.message });
  }
};

// שליפת תעריף ספציפי לפי ID
export const getPayRateById = async (req, res) => {
  try {
    const { companyId, id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(companyId) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid companyId or payRateId" });
    }

    const payRate = await PayRate.findOne({ _id: id, companyId }).select(
      "-__v"
    );
    if (!payRate) {
      return res.status(404).json({ message: "Pay rate not found" });
    }

    res.status(200).json(payRate);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pay rate", error: error.message });
  }
};

// יצירת תעריף חדש
export const createPayRate = async (req, res) => {
  try {
    const {
      rateType,
      multiplier,
      fullTimeHours,
      hoursThreshold,
      description,
      isActive,
      workHours, // הוספת workHours
    } = req.body;
    console.log(req.body);

    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    console.log("Company ID:", companyId);

    // ולידציה בסיסית
    if (!rateType || !multiplier) {
      return res
        .status(400)
        .json({ message: "rateType and multiplier are required" });
    }

    // ולידציה ל-workHours
    if (workHours) {
      const { startTime, endTime } = workHours;
      if (
        (startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) ||
        (endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime))
      ) {
        return res
          .status(400)
          .json({ message: "Invalid time format for startTime or endTime" });
      }
    }

    const payRate = new PayRate({
      companyId: companyId,
      rateType,
      multiplier,
      hoursThreshold,
      fullTimeHours,
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      workHours: workHours || { startTime: "06:00", endTime: "14:00" }, // דוגמה לשעות 6:00-14:00
    });

    console.log(payRate);
    const savedPayRate = await payRate.save();
    res.status(201).json(savedPayRate);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        message: "Pay rate with this rateType already exists for the company",
      });
    } else {
      res
        .status(500)
        .json({ message: "Error creating pay rate", error: error.message });
    }
  }
};

// עדכון תעריף קיים
export const updatePayRate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rateType,
      multiplier,
      description,
      fullTimeHours,
      hoursThreshold,
      isActive,
      workHours, // הוספת workHours
    } = req.body;

    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const payRate = await PayRate.findOne({ _id: id, companyId });
    if (!payRate) {
      return res.status(404).json({ message: "Pay rate not found" });
    }

    // ולידציה ל-workHours
    if (workHours) {
      const { startTime, endTime } = workHours;
      if (
        (startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) ||
        (endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime))
      ) {
        return res
          .status(400)
          .json({ message: "Invalid time format for startTime or endTime" });
      }
      payRate.workHours = { startTime, endTime };
    }

    // עדכון שדות
    if (rateType) payRate.rateType = rateType;
    if (multiplier) payRate.multiplier = multiplier;
    if (description !== undefined) payRate.description = description;
    if (isActive !== undefined) payRate.isActive = isActive;
    if (fullTimeHours !== undefined) payRate.fullTimeHours = fullTimeHours;
    if (hoursThreshold !== undefined) payRate.hoursThreshold = hoursThreshold;

    const updatedPayRate = await payRate.save();
    res.status(200).json(updatedPayRate);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        message: "Pay rate with this rateType already exists for the company",
      });
    } else {
      res
        .status(500)
        .json({ message: "Error updating pay rate", error: error.message });
    }
  }
};

// מחיקת תעריף (או סימון כלא פעיל)
export const deletePayRate = async (req, res) => {
  try {
    const { id } = req.params;

    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const payRate = await PayRate.findOneAndDelete({ _id: id, companyId });
    if (!payRate) {
      return res.status(404).json({ message: "Pay rate not found" });
    }

    // במקום מחיקה פיזית, מסמן כלא פעיל (Soft Delete)
    payRate.isActive = false;
    await payRate.save();

    // אם רוצים מחיקה פיזית:
    // await PayRate.deleteOne({ _id: id, companyId });

    res.status(200).json({ message: "Pay rate deactivated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deactivating pay rate", error: error.message });
  }
};
