// controllers/inventory.controller.js
import Inventory from "../models/inventory.model.js";
import InventoryHistory from "../models/InventoryHistory.model.js";
import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Employee from "../models/employees.model.js";
import { updateWarehouseUtilization, checkWarehouseCapacity } from "../utils/warehouseUtilization.js";

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decodedToken.companyId;

  try {
    const {
      productId,
      quantity,
      minStockLevel,
      reorderQuantity,
      batchNumber,
      expirationDate,
      shelfLocation,
      lastOrderDate,
      warehouseId,
      locationId,
    } = req.body;

    // בדיקת שדות חובה
    if (!companyId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Required fields (companyId, productId) are missing",
      });
    }

    const newInventoryItem = new Inventory({
      companyId,
      productId,
      quantity,
      minStockLevel,
      reorderQuantity,
      batchNumber,
      expirationDate,
      shelfLocation,
      lastOrderDate,
      warehouseId,
      locationId,
    });

    const savedItem = await newInventoryItem.save();
    
    // עדכון utilization אם יש warehouseId
    if (warehouseId) {
      try {
        await updateWarehouseUtilization(warehouseId, companyId);
      } catch (error) {
        console.error("Error updating warehouse utilization:", error);
        // לא נכשל את הבקשה אם זה נכשל
      }
    }
    
    res.status(201).json({ success: true, data: savedItem });
  } catch (error) {
    console.error("Error creating inventory item:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating inventory item",
      error: error.message,
    });
  }
};

/**
 * Pull all inventory items
 */
export const getAllInventoryItems = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const products = await Product.find({ companyId });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this supplier.",
      });
    }

    const productIds = products.map((product) => product._id);

    // Find inventory details for the fetched product IDs
    const inventoryDetails = await Inventory.find({
      productId: { $in: productIds },
      companyId: companyId,
    });

    // יצירת מפה של productId -> array of inventory items
    const inventoryMap = new Map();
    inventoryDetails.forEach((inv) => {
      const productIdStr = inv.productId.toString();
      if (!inventoryMap.has(productIdStr)) {
        inventoryMap.set(productIdStr, []);
      }
      inventoryMap.get(productIdStr).push(inv.toObject());
    });

    // יצירת רשומה נפרדת לכל product + inventory combination
    const productsWithInventory = [];
    products.forEach((product) => {
      const productIdStr = product._id.toString();
      const inventories = inventoryMap.get(productIdStr) || [];
      
      if (inventories.length === 0) {
        // אם אין inventory, נוסיף את ה-product בלי inventory
        productsWithInventory.push({
          ...product.toObject(),
          inventory: null,
          _id: `${product._id}_no_inventory`, // ID ייחודי כדי למנוע conflicts
        });
      } else {
        // נוסיף שורה נפרדת לכל inventory item
        inventories.forEach((inventory, index) => {
          productsWithInventory.push({
            ...product.toObject(),
            inventory: inventory,
            _id: `${product._id}_${inventory._id}_${index}`, // ID ייחודי לכל combination
            inventoryId: inventory._id, // שמירת ה-inventory ID המקורי
          });
        });
      }
    });

    res.status(200).json({ success: true, data: productsWithInventory });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
      error: error.message,
    });
  }
};
// controllers/inventory.controller.js
export const getInventoryByProductId = async (req, res) => {
  try {
    console.log("Getting inventory by productId:", req.params.productId);
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    console.log("Company ID:", companyId);

    const inventory = await Inventory.findOne({
      productId: req.params.productId,
      companyId,
    });
    console.log("Inventory found:", inventory ? "Yes" : "No");
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
export const updateInventoryItem = async (req, res) => {
  try {
    console.log("📝 updateInventoryItem called with:", {
      id: req.params.id,
      body: req.body,
    });

    // Token verification
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const inventoryId = req.params.id;
    const {
      quantity,
      minStockLevel,
      reorderQuantity,
      batchNumber,
      expirationDate,
      shelfLocation,
      lastOrderDate,
      warehouseId,
      locationId,
    } = req.body;

    const employee = await Employee.findOne({
      companyId,
      role: "Admin",
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "No Admin found for this company.",
      });
    }

    // חיפוש לפי inventoryId (לא productId) כדי לתמוך באותו מוצר במספר מחסנים
    console.log(`🔍 Looking for inventory item: inventoryId=${inventoryId}, companyId=${companyId}`);
    let inventoryItem = await Inventory.findOne({ _id: inventoryId, companyId });
    
    // אם לא נמצא, ננסה לחפש לפי productId (backward compatibility)
    if (!inventoryItem) {
      console.log(`🔍 Inventory not found by ID, trying to find by productId...`);
      inventoryItem = await Inventory.findOne({ productId: inventoryId, companyId });
    }

    if (!inventoryItem) {
      console.error(`❌ Inventory item not found: inventoryId=${inventoryId}, companyId=${companyId}`);
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found." });
    }

    console.log(`✅ Inventory item found:`, {
      id: inventoryItem._id,
      productId: inventoryItem.productId,
      warehouseId: inventoryItem.warehouseId,
      currentQuantity: inventoryItem.quantity,
    });

    // Fetch product details to get the product name
    const product = await Product.findById(inventoryItem.productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }
    const productName = product.productName || "Unknown Product";

    // עדכון פרטי הפריט במלאי
    // Note: quantity from frontend is the NEW quantity value, not the amount to subtract
    console.log("Updating inventory item:", {
      inventoryId: inventoryItem._id,
      productId: inventoryItem.productId,
      companyId,
      receivedQuantity: quantity,
      quantityType: typeof quantity,
      currentQuantity: inventoryItem.quantity,
    });
    
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      const numQuantity = Number(quantity);
      if (!isNaN(numQuantity)) {
        const oldQuantity = inventoryItem.quantity;
        inventoryItem.quantity = numQuantity;
        console.log(`Quantity updated: ${oldQuantity} -> ${numQuantity}`);
      
      // אם המלאי יורד מתחת לרמה המינימלית
      if (numQuantity < inventoryItem.minStockLevel) {
        // בדיקה שאין כבר התראה קיימת עם אותו תוכן ושעדיין לא נקראה
        const notificationContent = `The quantity of the product ${productName} is below the minimum stock level. Please order more.`;
        const existingNotification = await Notification.findOne({
          companyId,
          content: notificationContent,
          employeeId: employee._id,
          isRead: false,
        });

        if (!existingNotification) {
          const newNotification = new Notification({
            companyId,
            title: `Low stock alert - ${productName}`,
            content: notificationContent,
            category: "inventory",
            priority: "high",
            employeeId: employee._id,
            type: "Warning",
            relatedEntity: {
              entityType: "Inventory",
              entityId: inventoryItem._id?.toString(),
            },
            metadata: {
              productId: inventoryItem.productId,
              warehouseId: inventoryItem.warehouseId,
              quantity: numQuantity,
              minStockLevel: inventoryItem.minStockLevel,
            },
          });
          await newNotification.save();
        }
      }
      } else {
        console.warn(`Invalid quantity value received: ${quantity} (type: ${typeof quantity})`);
      }
    }
    if (typeof minStockLevel === "number") {
      inventoryItem.minStockLevel = minStockLevel;
    }
    if (typeof reorderQuantity === "number") {
      inventoryItem.reorderQuantity = reorderQuantity;
    }
    if (batchNumber !== undefined) {
      inventoryItem.batchNumber = batchNumber;
    }
    if (expirationDate !== undefined) {
      inventoryItem.expirationDate = expirationDate
        ? new Date(expirationDate)
        : null;
    }
    if (shelfLocation !== undefined) {
      inventoryItem.shelfLocation = shelfLocation;
    }
    if (lastOrderDate !== undefined) {
      inventoryItem.lastOrderDate = lastOrderDate
        ? new Date(lastOrderDate)
        : null;
    }
    if (warehouseId !== undefined) {
      inventoryItem.warehouseId = warehouseId || null;
    }
    if (locationId !== undefined) {
      inventoryItem.locationId = locationId || null;
    }

    const updatedInventory = await inventoryItem.save();
    
    // עדכון utilization אם יש warehouseId
    if (inventoryItem.warehouseId) {
      try {
        await updateWarehouseUtilization(inventoryItem.warehouseId, companyId);
      } catch (error) {
        console.error("Error updating warehouse utilization:", error);
      }
    }
    
    // אם שונה warehouseId, עדכון גם את המחסן הישן והחדש
    if (warehouseId && inventoryItem.warehouseId && warehouseId.toString() !== inventoryItem.warehouseId.toString()) {
      try {
        const oldWarehouseId = inventoryItem.warehouseId;
        await updateWarehouseUtilization(oldWarehouseId, companyId);
        await updateWarehouseUtilization(warehouseId, companyId);
      } catch (error) {
        console.error("Error updating warehouse utilization after transfer:", error);
      }
    }

    return res.status(200).json({ success: true, data: updatedInventory });
  } catch (error) {
    console.error("Error updating inventory item:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory item.",
      error: error.message,
    });
  }
};
export const deleteInventoryItem = async (req, res) => {
  try {
    const deletedInventoryItem = await Inventory.findByIdAndDelete(
      req.params.id
    );
    if (!deletedInventoryItem) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting inventory item",
      error: error.message,
    });
  }
};

/**
 * Get products by supplier ID
 */
export const getProductsBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.query;

    if (!supplierId) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier ID is required." });
    }

    console.log("Supplier ID:", supplierId);

    // Find products by supplier ID
    const products = await Product.find({ supplierId });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this supplier.",
      });
    }

    // Extract product IDs
    const productIds = products.map((product) => product._id);

    // Find inventory details for the fetched product IDs
    const inventoryDetails = await Inventory.find({
      productId: { $in: productIds },
    });

    // Combine product and inventory data
    const productsWithInventory = products.map((product) => {
      const inventory = inventoryDetails.find(
        (inv) => inv.productId.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        inventory: inventory ? inventory.toObject() : null,
      };
    });
    console.log(productsWithInventory);

    res.status(200).json({ success: true, data: productsWithInventory });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
      error: error.message,
    });
  }
};

export const getInventoryandItem = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;

    // Fetch inventory items for the company
    const inventoryItem = await Inventory.find({ companyId });
    if (!inventoryItem || inventoryItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Fetch products where productType is either "sale" or "both"
    const products = await Product.find({
      companyId,
      $or: [{ productType: "sale" }, { productType: "both" }],
    });

    res.status(200).json({
      success: true,
      data: {
        inventory: inventoryItem,
        products: products,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory item",
      error: error.message,
    });
  }
};

/**
 * Get inventory history (movements)
 */
export const getInventoryHistory = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const { productId, startDate, endDate, reason, limit = 100, page = 1 } = req.query;

    // Build query
    const query = { companyId };
    if (productId) {
      query.productId = productId;
    }
    if (reason) {
      query.reason = reason;
    }
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await InventoryHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("productId", "productName SKU")
      .populate("userId", "name lastName")
      .populate("orderId", "orderNumber");

    const total = await InventoryHistory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching inventory history:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory history",
      error: error.message,
    });
  }
};

/**
 * Get inventory alerts (low stock, expiring items)
 */
export const getInventoryAlerts = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const { alertType } = req.query; // 'lowStock' or 'expiring'

    const inventoryItems = await Inventory.find({ companyId })
      .populate("productId", "productName SKU unitPrice category");

    const alerts = {
      lowStock: [],
      expiring: [],
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    inventoryItems.forEach((item) => {
      // Check for low stock
      if (item.quantity < item.minStockLevel) {
        alerts.lowStock.push({
          inventoryId: item._id,
          productId: item.productId?._id,
          productName: item.productId?.productName || "Unknown",
          SKU: item.productId?.SKU || "",
          currentQuantity: item.quantity,
          minStockLevel: item.minStockLevel,
          reorderQuantity: item.reorderQuantity,
          difference: item.minStockLevel - item.quantity,
          category: item.productId?.category || "",
        });
      }

      // Check for expiring items
      if (item.expirationDate) {
        const expirationDate = new Date(item.expirationDate);
        if (expirationDate <= thirtyDaysFromNow && expirationDate >= now) {
          const daysUntilExpiration = Math.ceil(
            (expirationDate - now) / (1000 * 60 * 60 * 24)
          );
          alerts.expiring.push({
            inventoryId: item._id,
            productId: item.productId?._id,
            productName: item.productId?.productName || "Unknown",
            SKU: item.productId?.SKU || "",
            quantity: item.quantity,
            expirationDate: item.expirationDate,
            batchNumber: item.batchNumber || "",
            daysUntilExpiration,
            category: item.productId?.category || "",
          });
        }
      }
    });

    // Sort alerts
    alerts.lowStock.sort((a, b) => a.difference - b.difference);
    alerts.expiring.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

    // Return based on alertType filter
    if (alertType === "lowStock") {
      return res.status(200).json({
        success: true,
        data: alerts.lowStock,
        count: alerts.lowStock.length,
      });
    } else if (alertType === "expiring") {
      return res.status(200).json({
        success: true,
        data: alerts.expiring,
        count: alerts.expiring.length,
      });
    }

    res.status(200).json({
      success: true,
      data: alerts,
      counts: {
        lowStock: alerts.lowStock.length,
        expiring: alerts.expiring.length,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory alerts:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory alerts",
      error: error.message,
    });
  }
};

/**
 * Get inventory statistics
 */
export const getInventoryStatistics = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const inventoryItems = await Inventory.find({ companyId })
      .populate("productId", "productName SKU unitPrice category");

    let totalProducts = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    inventoryItems.forEach((item) => {
      if (item.productId) {
        totalProducts++;
        const itemValue = (item.quantity || 0) * (item.productId.unitPrice || 0);
        totalValue += itemValue;

        if (item.quantity < item.minStockLevel) {
          lowStockCount++;
        }
        if (item.quantity === 0) {
          outOfStockCount++;
        }
        if (item.expirationDate) {
          const expirationDate = new Date(item.expirationDate);
          if (expirationDate <= thirtyDaysFromNow && expirationDate >= now) {
            expiringCount++;
          }
        }
      }
    });

    // Get recent movements (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentMovements = await InventoryHistory.countDocuments({
      companyId,
      timestamp: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        recentMovements,
        averageStockLevel: totalProducts > 0 
          ? Math.round((inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0) / totalProducts) * 100) / 100
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory statistics:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory statistics",
      error: error.message,
    });
  }
};

/**
 * Get inventory item by ID
 */
export const getInventoryItemById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    const { id } = req.params;

    const inventoryItem = await Inventory.findOne({
      _id: id,
      companyId
    })
      .populate("productId", "productName SKU unitPrice category")
      .populate("warehouseId", "name code")
      .populate("locationId", "name zone aisle shelf");

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: inventoryItem
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory item",
      error: error.message
    });
  }
};

/**
 * Get inventory by warehouse
 */
export const getInventoryByWarehouse = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    const { warehouseId } = req.params;

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is required"
      });
    }

    // בדיקה שהמחסן קיים ושייך לחברה
    const warehouse = await Warehouse.findOne({ _id: warehouseId, companyId });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    // שליפת כל המלאי במחסן
    const inventoryItems = await Inventory.find({
      warehouseId,
      companyId
    })
      .populate("productId", "productName SKU unitPrice category")
      .populate("locationId", "name zone aisle shelf binCode")
      .sort({ createdAt: -1 });

    // חישוב סטטיסטיקות
    const totalItems = inventoryItems.length;
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = inventoryItems.reduce((sum, item) => {
      const price = item.productId?.unitPrice || 0;
      return sum + (item.quantity || 0) * price;
    }, 0);
    const lowStockItems = inventoryItems.filter(
      item => item.quantity < item.minStockLevel
    ).length;

    res.status(200).json({
      success: true,
      data: {
        warehouse: {
          _id: warehouse._id,
          name: warehouse.name,
          code: warehouse.code,
          utilization: warehouse.utilization,
          capacity: warehouse.capacity
        },
        inventory: inventoryItems,
        statistics: {
          totalItems,
          totalQuantity,
          totalValue: Math.round(totalValue * 100) / 100,
          lowStockItems
        }
      }
    });
  } catch (error) {
    console.error("Error fetching inventory by warehouse:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory by warehouse",
      error: error.message
    });
  }
};

/**
 * Get total inventory for a product across all warehouses
 */
export const getProductInventoryTotal = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    const { productId } = req.params;

    // שליפת כל המלאי של המוצר בכל המחסנים
    const inventoryItems = await Inventory.find({
      productId,
      companyId
    })
      .populate("warehouseId", "name code region")
      .populate("locationId", "name zone aisle shelf")
      .populate("productId", "productName SKU unitPrice");

    // חישוב סכום כולל
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // קיבוץ לפי מחסן
    const byWarehouse = inventoryItems.reduce((acc, item) => {
      const warehouseId = item.warehouseId?._id?.toString() || 'no-warehouse';
      const warehouseName = item.warehouseId?.name || 'No Warehouse';
      
      if (!acc[warehouseId]) {
        acc[warehouseId] = {
          warehouseId: item.warehouseId?._id,
          warehouseName,
          quantity: 0,
          items: []
        };
      }
      
      acc[warehouseId].quantity += item.quantity || 0;
      acc[warehouseId].items.push({
        _id: item._id,
        quantity: item.quantity,
        location: item.locationId?.name || item.shelfLocation || 'No Location',
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate
      });
      
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        product: inventoryItems[0]?.productId || null,
        totalQuantity,
        byWarehouse: Object.values(byWarehouse),
        breakdown: inventoryItems
      }
    });
  } catch (error) {
    console.error("Error fetching product inventory total:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product inventory total",
      error: error.message
    });
  }
};

/**
 * Transfer inventory between warehouses
 */
export const transferInventory = async (req, res) => {
  console.log("🔄 transferInventory called with:", {
    inventoryId: req.body.inventoryId,
    fromWarehouseId: req.body.fromWarehouseId,
    toWarehouseId: req.body.toWarehouseId,
    quantity: req.body.quantity,
    toLocationId: req.body.toLocationId,
    notes: req.body.notes,
  });

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      console.error("❌ No auth token found");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("❌ Invalid token:", err.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      console.error("❌ No companyId in token");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log(`✅ Authenticated: companyId=${companyId}`);
    
    const {
      inventoryId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      toLocationId,
      notes
    } = req.body;

    if (!inventoryId || !fromWarehouseId || !toWarehouseId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: inventoryId, fromWarehouseId, toWarehouseId, quantity"
      });
    }

    // המרת IDs ל-ObjectId אם צריך
    let companyIdValue = companyId;
    let inventoryIdValue = inventoryId;
    let fromWarehouseIdValue = fromWarehouseId;
    let toWarehouseIdValue = toWarehouseId;
    
    try {
      if (typeof companyId === "string") {
        companyIdValue = new mongoose.Types.ObjectId(companyId);
      }
      if (typeof inventoryId === "string") {
        inventoryIdValue = new mongoose.Types.ObjectId(inventoryId);
      }
      if (typeof fromWarehouseId === "string") {
        fromWarehouseIdValue = new mongoose.Types.ObjectId(fromWarehouseId);
      }
      if (typeof toWarehouseId === "string") {
        toWarehouseIdValue = new mongoose.Types.ObjectId(toWarehouseId);
      }
      console.log(`✅ Converted IDs to ObjectId`);
    } catch (idError) {
      console.error("❌ Error converting IDs:", idError);
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${idError.message}`
      });
    }

    // בדיקה שהמלאי קיים
    console.log(`🔍 Looking for source inventory: inventoryId=${inventoryIdValue}, fromWarehouseId=${fromWarehouseIdValue}, companyId=${companyIdValue}`);
    
    // חיפוש ראשון: עם warehouseId המדויק
    let sourceInventory = await Inventory.findOne({
      _id: inventoryIdValue,
      warehouseId: fromWarehouseIdValue,
      companyId: companyIdValue
    });

    // אם לא נמצא, נחפש רק לפי inventoryId ו-companyId (אולי ה-warehouseId שונה או null)
    if (!sourceInventory) {
      console.log(`🔍 Source inventory not found with exact warehouseId, searching by inventoryId and companyId only...`);
      sourceInventory = await Inventory.findOne({
        _id: inventoryIdValue,
        companyId: companyIdValue
      });
      
      if (sourceInventory) {
        console.log(`📦 Found source inventory with different warehouseId (${sourceInventory.warehouseId || 'null'}), updating to match fromWarehouseId: ${fromWarehouseIdValue}`);
        // נעדכן את ה-warehouseId למחסן המקור
        sourceInventory.warehouseId = fromWarehouseIdValue;
      }
    }

    if (!sourceInventory) {
      console.error(`❌ Source inventory not found with inventoryId=${inventoryIdValue} and companyId=${companyIdValue}`);
      return res.status(404).json({
        success: false,
        message: `Source inventory not found with ID ${inventoryId}`
      });
    }

    console.log(`✅ Source inventory found: quantity=${sourceInventory.quantity}, productId=${sourceInventory.productId}`);

    if (sourceInventory.quantity < quantity) {
      console.error(`❌ Insufficient quantity: Available=${sourceInventory.quantity}, Requested=${quantity}`);
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${sourceInventory.quantity}, Requested: ${quantity}`
      });
    }

    // בדיקת קיבולת מחסן יעד (אחרי המרת ה-IDs)
    console.log(`🔍 Checking warehouse capacity: toWarehouseId=${toWarehouseIdValue}, companyId=${companyIdValue}, quantity=${quantity}`);
    const capacityCheck = await checkWarehouseCapacity(toWarehouseIdValue, companyIdValue, quantity);
    if (!capacityCheck.canFit) {
      console.error(`❌ Warehouse capacity check failed: ${capacityCheck.reason}`);
      return res.status(400).json({
        success: false,
        message: capacityCheck.reason
      });
    }
    console.log(`✅ Warehouse capacity check passed`);

    // בדיקת מחסן יעד
    console.log(`🔍 Checking destination warehouse: toWarehouseId=${toWarehouseIdValue}, companyId=${companyIdValue}`);
    const toWarehouse = await Warehouse.findOne({ _id: toWarehouseIdValue, companyId: companyIdValue });
    if (!toWarehouse) {
      console.error(`❌ Destination warehouse not found`);
      return res.status(404).json({
        success: false,
        message: "Destination warehouse not found"
      });
    }
    console.log(`✅ Destination warehouse found: ${toWarehouse.name}`);

    // עדכון מלאי מקור
    const oldSourceQuantity = sourceInventory.quantity;
    sourceInventory.quantity -= quantity;
    try {
      await sourceInventory.save();
      console.log(`✅ Source inventory updated: ${oldSourceQuantity} - ${quantity} = ${sourceInventory.quantity}`);
    } catch (saveError) {
      console.error(`❌ Error saving source inventory:`, saveError);
      throw new Error(`Failed to save source inventory: ${saveError.message}`);
    }

    // יצירת/עדכון מלאי יעד
    // חיפוש ראשון: עם warehouseId המדויק
    console.log(`🔍 Looking for target inventory: productId=${sourceInventory.productId}, toWarehouseId=${toWarehouseIdValue}, companyId=${companyIdValue}`);
    // חיפוש target inventory - נסה גם בלי batchNumber אם לא נמצא
    let targetInventory = await Inventory.findOne({
      productId: sourceInventory.productId,
      warehouseId: toWarehouseIdValue,
      companyId: companyIdValue,
      ...(sourceInventory.batchNumber ? { batchNumber: sourceInventory.batchNumber } : {})
    });
    
    // אם לא נמצא עם batchNumber, נחפש בלי batchNumber
    if (!targetInventory && sourceInventory.batchNumber) {
      console.log(`🔍 Target inventory not found with batchNumber, searching without batchNumber...`);
      targetInventory = await Inventory.findOne({
        productId: sourceInventory.productId,
        warehouseId: toWarehouseIdValue,
        companyId: companyIdValue,
      });
    }

    // אם לא נמצא, נחפש inventory בלי warehouseId (אולי יש inventory ישן בלי warehouseId)
    if (!targetInventory) {
      console.log(`🔍 Target inventory not found with exact warehouseId, searching for inventory without warehouseId...`);
      targetInventory = await Inventory.findOne({
        companyId: companyIdValue,
        productId: sourceInventory.productId,
        $or: [
          { warehouseId: null },
          { warehouseId: { $exists: false } }
        ]
      });
      
      if (targetInventory) {
        console.log(`📦 Found existing inventory without warehouseId, updating with warehouseId: ${toWarehouseIdValue}`);
        const oldQuantity = targetInventory.quantity || 0;
        targetInventory.warehouseId = toWarehouseIdValue;
        if (toLocationId) targetInventory.locationId = toLocationId;
        targetInventory.quantity = oldQuantity + quantity;
        console.log(`📦 Updated existing inventory: ${oldQuantity} + ${quantity} = ${targetInventory.quantity}`);
      } else {
        // יצירת inventory חדש
        console.log(`📦 Creating new inventory item in destination warehouse ${toWarehouseIdValue}`);
        try {
          targetInventory = new Inventory({
            companyId: companyIdValue,
            productId: sourceInventory.productId,
            warehouseId: toWarehouseIdValue,
            locationId: toLocationId,
            quantity: Number(quantity),
            minStockLevel: sourceInventory.minStockLevel || 10,
            reorderQuantity: sourceInventory.reorderQuantity || 20,
            batchNumber: sourceInventory.batchNumber,
            expirationDate: sourceInventory.expirationDate
          });
          console.log(`✅ Target inventory object created:`, {
            companyId: targetInventory.companyId?.toString(),
            productId: targetInventory.productId?.toString(),
            warehouseId: targetInventory.warehouseId?.toString(),
            quantity: targetInventory.quantity,
          });
        } catch (createError) {
          console.error(`❌ Error creating target inventory object:`, createError);
          console.error("Create error details:", {
            message: createError.message,
            name: createError.name,
            errors: createError.errors,
          });
          throw new Error(`Failed to create target inventory: ${createError.message}`);
        }
      }
    } else {
      // עדכון inventory קיים
      const oldTargetQuantity = targetInventory.quantity;
      targetInventory.quantity += quantity;
      if (toLocationId) targetInventory.locationId = toLocationId;
      console.log(`📦 Updating existing target inventory: ${oldTargetQuantity} + ${quantity} = ${targetInventory.quantity}`);
    }

    try {
      console.log(`💾 Attempting to save target inventory...`);
      console.log(`📦 Target inventory details:`, {
        companyId: targetInventory.companyId?.toString(),
        productId: targetInventory.productId?.toString(),
        warehouseId: targetInventory.warehouseId?.toString(),
        quantity: targetInventory.quantity,
        isNew: targetInventory.isNew,
      });
      const savedTargetInventory = await targetInventory.save();
      console.log(`✅ Target inventory saved successfully:`, {
        id: savedTargetInventory._id,
        quantity: savedTargetInventory.quantity,
        warehouseId: savedTargetInventory.warehouseId?.toString(),
      });
    } catch (saveError) {
      console.error(`❌ Error saving target inventory:`, saveError);
      console.error("Target inventory save error details:", {
        message: saveError.message,
        name: saveError.name,
        errors: saveError.errors,
        stack: saveError.stack,
      });
      
      // נסה להבין מה הבעיה
      if (saveError.name === "ValidationError") {
        const validationErrors = Object.keys(saveError.errors || {}).map(key => ({
          field: key,
          message: saveError.errors[key].message,
        }));
        console.error("Validation errors:", validationErrors);
      }
      
      throw new Error(`Failed to save target inventory: ${saveError.message}`);
    }

    // עדכון utilization של שני המחסנים
    try {
      console.log(`📊 Updating warehouse utilization for both warehouses...`);
      await updateWarehouseUtilization(fromWarehouseIdValue, companyIdValue);
      await updateWarehouseUtilization(toWarehouseIdValue, companyIdValue);
      console.log(`✅ Warehouse utilization updated successfully`);
    } catch (utilizationError) {
      console.error("⚠️ Error updating warehouse utilization:", utilizationError);
      // לא נכשיל את הפעולה אם עדכון הניצול נכשל
    }

    // יצירת רשומה בהיסטוריה
    console.log(`📝 Creating inventory history records...`);
    const fromWarehouse = await Warehouse.findById(fromWarehouseIdValue);
    const product = await Product.findById(sourceInventory.productId);
    
    try {
      await InventoryHistory.create({
        companyId: companyIdValue,
        productId: sourceInventory.productId,
        productName: product?.productName || "Unknown Product",
        userId: decodedToken.userId,
        type: 'transfer',
        quantity: -quantity,
        changeAmount: -quantity,
        reason: `Transferred to warehouse ${toWarehouse.name}`,
        notes: notes || `Transfer from ${fromWarehouse?.name || fromWarehouseIdValue} to ${toWarehouse.name}`,
        timestamp: new Date()
      });

      await InventoryHistory.create({
        companyId: companyIdValue,
        productId: sourceInventory.productId,
        productName: product?.productName || "Unknown Product",
        userId: decodedToken.userId,
        type: 'transfer',
        quantity: quantity,
        changeAmount: quantity,
        reason: `Received from warehouse ${fromWarehouse?.name || fromWarehouseIdValue}`,
        notes: notes || `Transfer from ${fromWarehouse?.name || fromWarehouseIdValue} to ${toWarehouse.name}`,
        timestamp: new Date()
      });
      console.log(`✅ Inventory history records created successfully`);
    } catch (historyError) {
      console.error("⚠️ Error creating inventory history:", historyError);
      // לא נכשיל את הפעולה אם יצירת ההיסטוריה נכשלה
    }

    console.log(`✅ Transfer completed successfully: ${quantity} units from warehouse ${fromWarehouse?.name || fromWarehouseIdValue} to ${toWarehouse.name}`);
    res.status(200).json({
      success: true,
      message: `Successfully transferred ${quantity} units`,
      data: {
        source: sourceInventory,
        target: targetInventory
      }
    });
  } catch (error) {
    console.error("❌ Error transferring inventory:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      errors: error.errors,
    });
    res.status(500).json({
      success: false,
      message: "Error transferring inventory",
      error: error.message
    });
  }
};
