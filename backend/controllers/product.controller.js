import Product from "../models/product.model.js";
import cloudinary, {extractPublicId, uploadToCloudinary } from "../config/lib/cloudinary.js";
import jwt from "jsonwebtoken";
import Inventory from "../models/inventory.model.js";

export const getProducts = async (req, res) => {
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
    const products = await Product.find({ companyId });
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "supplierId",
      "name"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: "Invalid product ID" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      companyId,
      sku,
      barcode,
      productName,
      unitPrice,
      category,
      supplierId,
      supplierName,
      productDescription,
      productImage,
      length,
      width,
      height,
      volume,
      productType,
    } = req.body;

    console.log(req.body);
    // בדיקת שדות חובה
    if (
      !companyId ||
      !sku ||
      !barcode ||
      !productName ||
      !unitPrice ||
      !category ||
      !productType
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Please provide all required fields" });
    }

    let productImageURL = "";
    if (productImage) {
      const uploadResponse = await cloudinary.uploader.upload(productImage, {
        folder: "products",
        use_filename: true,
        unique_filename: false,
      });
      productImageURL = uploadResponse.secure_url;
    }

    const newProduct = new Product({
      companyId,
      sku,
      barcode,
      productName,
      productDescription,
      unitPrice,
      category,
      supplierId,
      supplierName,
      productImage: productImageURL || "",
      length,
      width,
      height,
      volume,
      productType,
    });

    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      unitPrice,
      category,
      supplierId,
      supplierName,
      productImage,
      length,
      width,
      height,
      productType,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Update product fields
    product.productName = productName || product.productName;
    product.productDescription =
      productDescription || product.productDescription;
    product.unitPrice = unitPrice || product.unitPrice;
    product.category = category || product.category;
    product.supplierId = supplierId || product.supplierId;
    product.supplierName = supplierName || product.supplierName;
    product.productImage = productImage || product.productImage;
    product.length = length || product.length;
    (product.width = width || product.width),
      (product.height = height || product.height),
      (product.productType = productType || product.productType);
    await product.save();
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Invalid product ID or request data" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    // נניח שה-token נמצא בעוגייה בשם "auth_token"
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // חיפוש המוצר תוך כדי סינון לפי companyId
    const pro = await Product.findOne({ _id: req.params.id, companyId });
    if (!pro) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    console.log("Product image URL:", pro.productImage);
    // מחיקת התמונה ב־Cloudinary (אם קיימת)
    if (pro.productImage) {
      const publicId = extractPublicId(pro.productImage);
      if (publicId) {
        // חשוב לא להשתמש שוב בשם "res", מכיוון שזה קונפליקט עם response
        const deletionResult = await cloudinary.uploader.destroy(publicId);
        console.log("Deletion result:", deletionResult);
      } else {
        console.log("Could not extract public_id from URL");
      }
    }

    // מחיקת המוצר ממסד הנתונים
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      companyId,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    const inventory = await Inventory.findOne({ productId: req.params.id });
    if (inventory) {
      await inventory.deleteOne();
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Invalid product ID" });
  }
};

