import Warehouse from "../models/warehouse.model.js";
import Inventory from "../models/inventory.model.js";
import mongoose from "mongoose";

/**
 * עדכון utilization של מחסן לפי המלאי
 */
export const updateWarehouseUtilization = async (warehouseId, companyId) => {
  try {
    // המרת warehouseId ו-companyId ל-ObjectId אם צריך
    let warehouseIdValue = warehouseId;
    let companyIdValue = companyId;
    
    if (typeof warehouseId === "string") {
      warehouseIdValue = new mongoose.Types.ObjectId(warehouseId);
    }
    if (typeof companyId === "string") {
      companyIdValue = new mongoose.Types.ObjectId(companyId);
    }

    console.log(`📊 Updating warehouse utilization: warehouseId=${warehouseIdValue}, companyId=${companyIdValue}`);
    
    const warehouse = await Warehouse.findOne({ _id: warehouseIdValue, companyId: companyIdValue });
    if (!warehouse) {
      console.warn(`⚠️ Warehouse ${warehouseIdValue} not found for company ${companyIdValue}`);
      return;
    }

    // חישוב כמות המלאי במחסן
    const inventoryItems = await Inventory.find({
      warehouseId: warehouseIdValue,
      companyId: companyIdValue
    });

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // חישוב utilization (אם יש capacity)
    if (warehouse.capacity > 0) {
      warehouse.utilization = Math.min(100, Math.round((totalQuantity / warehouse.capacity) * 100));
    } else {
      // אם אין capacity, נשתמש בכמות המלאי
      warehouse.utilization = totalQuantity;
    }

    await warehouse.save();
    console.log(`Updated warehouse ${warehouseId} utilization: ${warehouse.utilization}%`);
    
    return warehouse.utilization;
  } catch (error) {
    console.error("Error updating warehouse utilization:", error);
    throw error;
  }
};

/**
 * בדיקה אם מחסן יכול להכיל כמות נוספת
 */
export const checkWarehouseCapacity = async (warehouseId, companyId, additionalQuantity = 0) => {
  try {
    const warehouse = await Warehouse.findOne({ _id: warehouseId, companyId });
    if (!warehouse) {
      return { canFit: false, reason: "Warehouse not found" };
    }

    // אם אין capacity מוגדר, תמיד אפשר להוסיף
    if (!warehouse.capacity || warehouse.capacity === 0) {
      return { canFit: true };
    }

    // חישוב כמות נוכחית
    const inventoryItems = await Inventory.find({
      warehouseId,
      companyId
    });
    
    const currentQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const newQuantity = currentQuantity + additionalQuantity;

    if (newQuantity > warehouse.capacity) {
      return {
        canFit: false,
        reason: `Exceeds capacity. Current: ${currentQuantity}, Capacity: ${warehouse.capacity}, Requested: ${additionalQuantity}`,
        currentQuantity,
        capacity: warehouse.capacity,
        available: warehouse.capacity - currentQuantity
      };
    }

    return {
      canFit: true,
      currentQuantity,
      capacity: warehouse.capacity,
      available: warehouse.capacity - currentQuantity,
      newUtilization: Math.round((newQuantity / warehouse.capacity) * 100)
    };
  } catch (error) {
    console.error("Error checking warehouse capacity:", error);
    return { canFit: false, reason: error.message };
  }
};

