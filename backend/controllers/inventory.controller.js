// controllers/inventory.controller.js
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import jwt from "jsonwebtoken";

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

/**
 * Update inventory item by allowed fields
 */
export const updateInventoryItem = async (req, res) => {
  try {
    // בדיקת טוקן
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // כאן req.params.id הוא מזהה המוצר (productId)
    const productId = req.params.id;

    // חילוץ שדות לעדכון מהבקשה
    const {
      quantity,
      minStockLevel,
      reorderQuantity,
      batchNumber,
      expirationDate,
      shelfLocation,
      lastOrderDate,
    } = req.body;

    // מציאת רשומת מלאי לפי productId ו-companyId
    const inventoryItem = await Inventory.findOne({ productId, companyId });
    if (!inventoryItem) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found." });
    }

    // עדכון השדות – מעדכנים רק אם נשלח ערך
    if (quantity !== undefined) inventoryItem.quantity = quantity;
    if (minStockLevel !== undefined)
      inventoryItem.minStockLevel = minStockLevel;
    if (reorderQuantity !== undefined)
      inventoryItem.reorderQuantity = reorderQuantity;
    if (batchNumber !== undefined) inventoryItem.batchNumber = batchNumber;
    if (expirationDate !== undefined)
      inventoryItem.expirationDate = expirationDate
        ? new Date(expirationDate)
        : null;
    if (shelfLocation !== undefined)
      inventoryItem.shelfLocation = shelfLocation;
    if (lastOrderDate !== undefined)
      inventoryItem.lastOrderDate = lastOrderDate
        ? new Date(lastOrderDate)
        : null;

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

/**
 * Delete inventory item by id
 */
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
