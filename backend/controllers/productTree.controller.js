import ProductTree from "../models/productTree.model.js";
import jwt from "jsonwebtoken";

export const createProductTree = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      console.error("Token is missing in request headers.");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      console.error("Invalid token: Missing companyId");
      return res.status(400).json({ success: false, message: "Invalid token" });
    }
    const companyId = decodedToken.companyId;

    // הוצא מהגוף את הנתונים הדרושים
    const { productId, components, notes } = req.body;
    if (!companyId || !productId || !components || components.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // חישוב עלות כוללת
    const totalCost = components.reduce((sum, comp) => {
      return sum + (comp.unitCost || 0) * comp.quantity;
    }, 0);

    // בונה את מסמך עץ המוצר (שים לב למבנה!)
    const productTree = new ProductTree({
      companyId: companyId,
      productId: productId, // חשוב: לא לשים בתוך components
      components: components, // כל מערך ה-components
      totalCost: totalCost,
      notes: notes,
    });

    await productTree.save();
    res.status(201).json(productTree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProductTrees = async (req, res) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};

    const productTrees = await ProductTree.find(filter)
      .populate("components.componentId", "productName unitPrice")

    res.status(200).json(productTrees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductTreeById = async (req, res) => {
  try {
    const productTree = await ProductTree.findById(req.params.id);
    if (!productTree) {
      return res.status(404).json({ message: "Product tree not found" });
    }
    res.status(200).json(productTree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProductTree = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { components, notes } = req.body;

    if (!components || !Array.isArray(components)) {
      return res.status(400).json({ 
        success: false, 
        message: "Components array is required" 
      });
    }

    const productTree = await ProductTree.findById(req.params.id);
    if (!productTree) {
      return res.status(404).json({ 
        success: false, 
        message: "Product tree not found" 
      });
    }

    // Verify companyId matches
    if (productTree.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized access to this product tree" 
      });
    }

    // Update components and notes
    // Allow empty array to clear BOM
    productTree.components = components;
    if (notes !== undefined) {
      productTree.notes = notes;
    }

    // Recalculate total cost (will be 0 if components is empty)
    productTree.totalCost = components.reduce((sum, comp) => {
      return sum + (comp.unitCost || 0) * (comp.quantity || 0);
    }, 0);

    await productTree.save();
    res.status(200).json({ success: true, data: productTree });
  } catch (error) {
    console.error("Error updating product tree:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteProductTree = async (req, res) => {
  try {
    const productTree = await ProductTree.findById(req.params.id);
    if (!productTree) {
      return res.status(404).json({ message: "Product tree not found" });
    }

    await productTree.deleteOne();
    res.status(200).json({ message: "Product tree deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
