import StockCount from "../models/StockCount.model.js";
import InventoryMovement from "../models/InventoryMovement.model.js";
import InventoryQuality from "../models/InventoryQuality.model.js";
import Inventory from "../models/inventory.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Unauthorized: No token provided");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ========== STOCK COUNT ==========

const generateCountNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `SC-${year}-`;
  const lastCount = await StockCount.findOne({
    companyId,
    countNumber: new RegExp(`^${prefix}`),
  })
    .sort({ countNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastCount) {
    const lastSeq = parseInt(lastCount.countNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createStockCount = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const countNumber = await generateCountNumber(decoded.companyId);
    const stockCount = new StockCount({
      ...req.body,
      companyId: decoded.companyId,
      countNumber,
    });
    await stockCount.save();
    res.status(201).json({ success: true, data: stockCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStockCounts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { warehouseId, status } = req.query;
    const filter = { companyId: decoded.companyId };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status) filter.status = status;

    const counts = await StockCount.find(filter)
      .populate("warehouseId", "name")
      .sort({ countDate: -1 });

    res.status(200).json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== INVENTORY MOVEMENT ==========

const generateMovementNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `MOV-${year}-`;
  const lastMovement = await InventoryMovement.findOne({
    companyId,
    movementNumber: new RegExp(`^${prefix}`),
  })
    .sort({ movementNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastMovement) {
    const lastSeq = parseInt(lastMovement.movementNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createInventoryMovement = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const movementNumber = await generateMovementNumber(decoded.companyId);
    const movement = new InventoryMovement({
      ...req.body,
      companyId: decoded.companyId,
      movementNumber,
    });
    await movement.save();
    res.status(201).json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllInventoryMovements = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { movementType, productId, warehouseId } = req.query;
    const filter = { companyId: decoded.companyId };
    if (movementType) filter.movementType = movementType;
    if (productId) filter.productId = productId;
    if (warehouseId) {
      filter.$or = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId },
      ];
    }

    const movements = await InventoryMovement.find(filter)
      .populate("productId", "productName sku")
      .populate("fromWarehouseId", "name")
      .populate("toWarehouseId", "name")
      .sort({ movementDate: -1 });

    res.status(200).json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== INVENTORY QUALITY ==========

const generateQualityCheckNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `QC-${year}-`;
  const lastCheck = await InventoryQuality.findOne({
    companyId,
    qualityCheckNumber: new RegExp(`^${prefix}`),
  })
    .sort({ qualityCheckNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastCheck) {
    const lastSeq = parseInt(lastCheck.qualityCheckNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createInventoryQuality = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const qualityCheckNumber = await generateQualityCheckNumber(decoded.companyId);
    const quality = new InventoryQuality({
      ...req.body,
      companyId: decoded.companyId,
      qualityCheckNumber,
    });
    await quality.save();
    res.status(201).json({ success: true, data: quality });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllInventoryQuality = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { checkType, status, overallResult } = req.query;
    const filter = { companyId: decoded.companyId };
    if (checkType) filter.checkType = checkType;
    if (status) filter.status = status;
    if (overallResult) filter.overallResult = overallResult;

    const qualityChecks = await InventoryQuality.find(filter)
      .populate("inventoryId")
      .populate("productId", "productName")
      .populate("warehouseId", "name")
      .sort({ checkDate: -1 });

    res.status(200).json({ success: true, data: qualityChecks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

