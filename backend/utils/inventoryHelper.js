import mongoose from "mongoose";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import InventoryHistory from "../models/InventoryHistory.model.js";

/**
 * Helper function to check and reserve inventory for an order
 * Uses MongoDB transactions to prevent race conditions
 * 
 * @param {Object} order - The order object with items
 * @param {Object} options - Options object
 * @param {Object} options.session - MongoDB session for transaction
 * @param {String} options.reason - Reason for inventory change (for audit trail)
 * @param {String} options.userId - User ID making the change
 * @param {Boolean} options.skipReservation - Skip reservation check (for prepare endpoint)
 * @returns {Object} - { success: boolean, inventoryIssues: [], lowStockProducts: [] }
 */
export const checkAndReserveInventory = async (order, options = {}) => {
  const { session, reason = "Order Confirmation", userId = null, skipReservation = false } = options;
  
  // Validate order status
  if (order.status === "Cancelled" || order.status === "Delivered") {
    throw new Error(`Cannot update inventory for order with status: ${order.status}`);
  }

  // Check if inventory already reserved (prevent double deduction)
  // Only check if we're actually trying to reserve (not just checking)
  if (!skipReservation && order.inventoryReserved) {
    console.log(`⚠️ Inventory already reserved for order ${order._id}`);
    // Still return success but don't update inventory
    return {
      success: true,
      inventoryIssues: [],
      lowStockProducts: [],
      alreadyReserved: true
    };
  }
  
  // If skipReservation is true, we're just checking for notifications, not actually reserving
  if (skipReservation) {
    // Just check stock levels without updating
    const inventoryChecks = [];
    for (const item of order.items || []) {
      const productId = item.product?._id || item.productId;
      if (!productId) continue;
      
      const requiredQuantity = item.quantity || 0;
      if (requiredQuantity <= 0) continue;
      
      const inventory = await Inventory.findOne({
        companyId: order.companyId,
        productId: productId
      }).session(session || null);
      
      if (inventory) {
        if (inventory.quantity < requiredQuantity) {
          const product = await Product.findById(productId).session(session || null);
          inventoryIssues.push({
            productId: productId.toString(),
            productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
            required: requiredQuantity,
            available: inventory.quantity,
            missing: requiredQuantity - inventory.quantity
          });
        }
        
        // Check for low stock
        if (inventory.quantity < inventory.minStockLevel) {
          const product = await Product.findById(productId).session(session || null);
          lowStockProducts.push({
            productId: productId.toString(),
            productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
            currentQuantity: inventory.quantity,
            minStockLevel: inventory.minStockLevel
          });
        }
      }
    }
    
    return {
      success: inventoryIssues.length === 0,
      inventoryIssues,
      lowStockProducts,
      inventoryHistory: []
    };
  }

  const inventoryIssues = [];
  const lowStockProducts = [];
  const inventoryUpdates = []; // For bulkWrite
  const inventoryHistory = []; // For audit trail

  // Check inventory for each item
  for (const item of order.items || []) {
    const productId = item.product?._id || item.productId;
    if (!productId) continue;
    
    const requiredQuantity = item.quantity || 0;
    if (requiredQuantity <= 0) continue;
    
    // Find inventory item (with session for transaction)
    let inventory = await Inventory.findOne({
      companyId: order.companyId,
      productId: productId
    }).session(session || null);
    
    if (!inventory) {
      // Create inventory item if it doesn't exist (with 0 quantity)
      inventory = new Inventory({
        companyId: order.companyId,
        productId: productId,
        quantity: 0,
        minStockLevel: 10,
        reorderQuantity: 20
      });
      await inventory.save({ session });
    }
    
    // Check if enough stock
    if (inventory.quantity < requiredQuantity) {
      const product = await Product.findById(productId).session(session || null);
      inventoryIssues.push({
        productId: productId.toString(),
        productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
        required: requiredQuantity,
        available: inventory.quantity,
        missing: requiredQuantity - inventory.quantity
      });
    } else {
      // Prepare inventory update for bulkWrite
      const oldQuantity = inventory.quantity;
      const newQuantity = inventory.quantity - requiredQuantity;
      
      inventoryUpdates.push({
        updateOne: {
          filter: { 
            _id: inventory._id,
            quantity: { $gte: requiredQuantity } // Optimistic locking
          },
          update: { 
            $inc: { quantity: -requiredQuantity },
            $set: { lastOrderDate: new Date() }
          }
        }
      });

      // Get product name for inventory history
      let productName = item.product?.productName;
      if (!productName) {
        const product = await Product.findById(productId).session(session || null);
        productName = product?.productName || "מוצר לא ידוע";
      }
      
      // Track for audit trail
      inventoryHistory.push({
        productId: productId.toString(),
        productName: productName,
        oldQuantity,
        newQuantity,
        changeAmount: -requiredQuantity,
        reason: reason, // Should be a valid enum value: "Order Confirmation", "Order Preparation", "Order Cancelled", etc.
        orderId: order._id.toString(),
        userId: userId?.toString() || null,
        timestamp: new Date()
      });
      
      // Check if stock is now below minimum level
      if (newQuantity < inventory.minStockLevel) {
        lowStockProducts.push({
          productId: productId.toString(),
          productName: item.product?.productName || "מוצר לא ידוע",
          currentQuantity: newQuantity,
          minStockLevel: inventory.minStockLevel
        });
      }
    }
  }
  
  // If there are inventory issues, don't allow reservation
  if (inventoryIssues.length > 0) {
    return {
      success: false,
      inventoryIssues,
      lowStockProducts: [],
      inventoryHistory: []
    };
  }
  
  // Perform bulk update if there are updates to make
  if (inventoryUpdates.length > 0) {
    const bulkResult = await Inventory.bulkWrite(inventoryUpdates, { session });
    
    // Check if any updates failed (due to optimistic locking)
    if (bulkResult.modifiedCount < inventoryUpdates.length) {
      // Some items were modified by another process - need to recheck
      throw new Error("Inventory was modified by another process. Please retry.");
    }
    
    console.log(`✅ Updated ${bulkResult.modifiedCount} inventory items for order ${order._id}`);
    
    // Save inventory history for audit trail
    if (inventoryHistory.length > 0) {
      const historyDocs = inventoryHistory.map(history => ({
        ...history,
        companyId: order.companyId
      }));
      await InventoryHistory.insertMany(historyDocs, { session });
    }
  }
  
  return {
    success: true,
    inventoryIssues: [],
    lowStockProducts,
    inventoryHistory
  };
};

/**
 * Release reserved inventory (for cancelled orders)
 * @param {Object} order - The order object
 * @param {Object} options - Options object
 * @param {Object} options.session - MongoDB session
 * @param {String} options.reason - Reason for release
 * @param {String} options.userId - User ID
 */
export const releaseInventory = async (order, options = {}) => {
  const { session, reason = "Order Cancelled", userId = null } = options;
  
  if (!order.inventoryReserved) {
    return { success: true, message: "No inventory to release" };
  }

  const inventoryUpdates = [];
  const inventoryHistory = [];

  for (const item of order.items || []) {
    const productId = item.product?._id || item.productId;
    if (!productId) continue;
    
    const quantity = item.quantity || 0;
    if (quantity <= 0) continue;
    
    inventoryUpdates.push({
      updateOne: {
        filter: { 
          companyId: order.companyId,
          productId: productId
        },
        update: { 
          $inc: { quantity: quantity }
        },
        upsert: false
      }
    });

    // Get product name for inventory history
    let productName = item.product?.productName;
    if (!productName) {
      const product = await Product.findById(productId).session(session || null);
      productName = product?.productName || "מוצר לא ידוע";
    }
    
    inventoryHistory.push({
      productId: productId.toString(),
      productName: productName,
      oldQuantity: null, // Will be calculated
      newQuantity: null, // Will be calculated
      changeAmount: quantity,
      reason: reason, // Should be a valid enum value: "Order Cancelled", "Order Returned", etc.
      orderId: order._id.toString(),
      userId: userId?.toString() || null,
      timestamp: new Date()
    });
  }

  if (inventoryUpdates.length > 0) {
    await Inventory.bulkWrite(inventoryUpdates, { session });
    console.log(`✅ Released inventory for order ${order._id}`);
    
    // Save inventory history for audit trail
    if (inventoryHistory.length > 0) {
      const historyDocs = inventoryHistory.map(history => ({
        ...history,
        companyId: order.companyId
      }));
      await InventoryHistory.insertMany(historyDocs, { session });
    }
  }

  return {
    success: true,
    inventoryHistory
  };
};

