// controllers/inventory.controller.js
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import jwt from "jsonwebtoken";
import Notification from "../models/notification.model.js";
import Employee from "../models/employees.model.js";

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
    });

    const savedItem = await newInventoryItem.save();
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
    });

    const productsWithInventory = products.map((product) => {
      const inventory = inventoryDetails.find(
        (inv) => inv.productId.toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        inventory: inventory ? inventory.toObject() : null,
      };
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
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const inventory = await Inventory.findOne({
      productId: req.params.productId,
      companyId,
    });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found for this product",
      });
    }
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    console.error("Error fetching inventory:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
};
export const updateInventoryItem = async (req, res) => {
  try {
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

    const productId = req.params.id;
    const {
      quantity,
      minStockLevel,
      reorderQuantity,
      batchNumber,
      expirationDate,
      shelfLocation,
      lastOrderDate,
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

    const inventoryItem = await Inventory.findOne({ productId, companyId });
    if (!inventoryItem) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found." });
    }

    // Fetch product details to get the product name
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }
    const productName = product.productName || "Unknown Product";

    // אם המלאי יורד מתחת לרמה המינימלית
    if (
      typeof quantity === "number" && // רק אם נשלח quantity
      inventoryItem.quantity - quantity < inventoryItem.minStockLevel
    ) {
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
          content: notificationContent,
          employeeId: employee._id,
          type: "Warning",
          PurchaseOrder: "Inventory", // לצורך זיהוי שההזמנה קשורה למלאי
        });
        await newNotification.save();
      }
    }

    // עדכון פרטי הפריט במלאי
    if (typeof quantity === "number") {
      inventoryItem.quantity = inventoryItem.quantity - quantity;
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

    const updatedInventory = await inventoryItem.save();

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
