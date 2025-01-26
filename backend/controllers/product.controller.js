import Product from "../models/product.model.js";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";
import jwt from "jsonwebtoken";

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
      SKU,
      barcode,
      productName,
      unitPrice,
      category,
      supplierId,
      supplierName,
      productDescription,
      productImage,
    } = req.body;

    // בדיקת שדות חובה
    if (
      !companyId ||
      !SKU ||
      !barcode ||
      !productName ||
      !unitPrice ||
      !category ||
      !supplierId ||
      !supplierName
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
      SKU,
      barcode,
      productName,
      productDescription,
      unitPrice,
      category,
      supplierId,
      supplierName,
      productImage: productImageURL || "",
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
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Invalid product ID" });
  }
};
