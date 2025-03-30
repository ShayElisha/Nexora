import Product from "../models/product.model.js";
import cloudinary, {
  extractPublicId,
  uploadToCloudinary,
} from "../config/lib/cloudinary.js";
import jwt from "jsonwebtoken";
import Inventory from "../models/inventory.model.js";
import ProductTree from "../models/productTree.model.js";
import mongoose from "mongoose";

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
    console.log(req.params.id);
    const product = await Product.findById(req.params.id);
    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
export const createProduct = async (req, res) => {
  try {
    const {
      companyId,
      sku,
      barcode,
      productName,
      productDescription,
      unitPrice,
      category,
      supplierId,
      supplierName,
      length,
      width,
      height,
      volume,
      productType,
    } = req.body;

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
    // טיפול בהעלאת תמונת המוצר
    if (
      req.files &&
      req.files.productImage &&
      req.files.productImage.length > 0
    ) {
      const file = req.files.productImage[0];
      const uploadResponse = await uploadToCloudinary(file.buffer, {
        folder: "products",
        use_filename: true,
        unique_filename: false,
      });
      productImageURL = uploadResponse.secure_url;
    } else if (req.body.productImage) {
      // מקרה של base64
      const uploadResponse = await cloudinary.uploader.upload(
        req.body.productImage,
        {
          folder: "products",
          use_filename: true,
          unique_filename: false,
        }
      );
      productImageURL = uploadResponse.secure_url;
    }

    // טיפול בהעלאת קבצים מצורפים (attachments)
    let attachmentsArray = [];
    if (req.files && req.files.attachments) {
      for (const file of req.files.attachments) {
        const result = await uploadToCloudinary(file.buffer, {
          folder: "products/attachments",
          use_filename: true,
          unique_filename: false,
        });
        attachmentsArray.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
        });
      }
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
      attachments: attachmentsArray,
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
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Extract fields from req.body
    const {
      productName,
      productDescription,
      unitPrice,
      category,
      supplierId,
      supplierName,
      length,
      width,
      height,
      productType,
      attachedFiles: existingFilesFromBody, // Renamed for clarity
    } = req.body;

    // Update basic fields if provided
    product.productName = productName || product.productName;
    product.productDescription =
      productDescription || product.productDescription;
    product.unitPrice = unitPrice || product.unitPrice;
    product.category = category || product.category;
    product.supplierId = supplierId || product.supplierId;
    product.supplierName = supplierName || product.supplierName;
    product.length = length || product.length;
    product.width = width || product.width;
    product.height = height || product.height;
    product.productType = productType || product.productType;

    // Handle product image update
    if (
      req.files &&
      req.files.productImage &&
      req.files.productImage.length > 0
    ) {
      if (product.productImage) {
        const publicId = extractPublicId(product.productImage);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      const file = req.files.productImage[0];
      const uploadResponse = await uploadToCloudinary(file.buffer, {
        folder: "products",
        use_filename: true,
        unique_filename: false,
      });
      product.productImage = uploadResponse.secure_url;
    } else if (req.body.productImage === "") {
      if (product.productImage) {
        const publicId = extractPublicId(product.productImage);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
        product.productImage = "";
      }
    }

    // Handle attached files
    if (req.files && req.files.attachments) {
      const newAttachments = [];
      for (const file of req.files.attachments) {
        const result = await uploadToCloudinary(file.buffer, {
          folder: "products/attachments",
          use_filename: true,
          unique_filename: false,
        });
        newAttachments.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
        });
      }

      const existingFiles = product.attachments || [];
      const updatedFiles = existingFilesFromBody
        ? JSON.parse(existingFilesFromBody).map((file) => ({
            fileName: file.name,
            fileUrl:
              file.fileUrl ||
              existingFiles.find((ef) => ef.fileName === file.name)?.fileUrl,
          }))
        : existingFiles;

      const filesToKeep = updatedFiles.map((f) => f.fileUrl);
      const filesToDelete = existingFiles.filter(
        (file) => !filesToKeep.includes(file.fileUrl)
      );
      for (const file of filesToDelete) {
        const publicId = extractPublicId(file.fileUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      product.attachments = [...updatedFiles, ...newAttachments];
    } else if (existingFilesFromBody) {
      const updatedFiles = JSON.parse(existingFilesFromBody).map((file) => ({
        fileName: file.name,
        fileUrl:
          file.fileUrl ||
          product.attachments.find((ef) => ef.fileName === file.name)?.fileUrl,
      }));

      const filesToKeep = updatedFiles.map((f) => f.fileUrl);
      const filesToDelete = product.attachments.filter(
        (file) => !filesToKeep.includes(file.fileUrl)
      );
      for (const file of filesToDelete) {
        const publicId = extractPublicId(file.fileUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      product.attachments = updatedFiles;
    }

    await product.save();
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({
      success: false,
      error: "Error updating product: " + err.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
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
    if (pro.productImage) {
      const publicId = extractPublicId(pro.productImage);
      if (publicId) {
        const deletionResult = await cloudinary.uploader.destroy(publicId);
        console.log("Deletion result:", deletionResult);
      } else {
        console.log("Could not extract public_id from URL");
      }
    }

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

    const productTree = await ProductTree.findOne({ productId: req.params.id });
    if (productTree) {
      await productTree.deleteOne();
    }

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Invalid product ID" });
  }
};
export const searchProductByName = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const { name } = req.query;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing 'name' query parameter." });
    }

    console.log("Searching for products with name:", name);

    const products = await Product.find({
      companyId,
      productName: name,
    });
    console.log("Found products:", products);

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found with given name" });
    }

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error searching product by name:", err);
    return res.status(500).json({
      success: false,
      message: "Error searching product by name",
      error: err.message,
    });
  }
};
