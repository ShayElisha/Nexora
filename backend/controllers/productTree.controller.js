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
    const productTrees = await ProductTree.find().populate(
      "productId components.componentId"
    );
    res.status(200).json(productTrees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductTreeById = async (req, res) => {
  try {
    const productTree = await ProductTree.findById(req.params.id).populate(
      "productId components.componentId"
    );
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
    const { companyId, productId, components, notes } = req.body;

    const productTree = await ProductTree.findById(req.params.id);
    if (!productTree) {
      return res.status(404).json({ message: "Product tree not found" });
    }

    productTree.companyId = companyId || productTree.companyId;
    productTree.productId = productId || productTree.productId;
    productTree.components = components || productTree.components;
    productTree.notes = notes || productTree.notes;

    productTree.totalCost = components.reduce((sum, comp) => {
      return sum + (comp.unitCost || 0) * comp.quantity;
    }, 0);

    await productTree.save();
    res.status(200).json(productTree);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
