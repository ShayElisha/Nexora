import Product from "../models/product.model.js";
import cloudinary, {
  extractPublicId,
  uploadToCloudinary,
} from "../config/lib/cloudinary.js";
import jwt from "jsonwebtoken";
import Inventory from "../models/inventory.model.js";
import ProductTree from "../models/productTree.model.js";
import mongoose from "mongoose";
import { paginateResponse } from "../middleware/pagination.js";

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
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { companyId };
    
    // Optional filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { productName: { $regex: req.query.search, $options: "i" } },
        { sku: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Product.countDocuments(query);
    
    // Get paginated results
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    res.status(200).json(paginateResponse(products, pagination));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    console.log("Getting product by ID:", req.params.id);
    const product = await Product.findById(req.params.id);
    console.log("Product found:", product ? "Yes" : "No");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Error in getProductById:", err);
    res.status(500).json({ 
      success: false, 
      error: "Server error",
      message: err.message 
    });
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
    console.log("Update product request body keys:", Object.keys(req.body));
    console.log("Update product request files:", req.files ? Object.keys(req.files) : "No files");
    
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
      sku,
      barcode,
      attachments: attachmentsFromBody, // Can be string (JSON) or array
      attachedFiles: attachedFilesFromBody, // Legacy support
    } = req.body;
    
    // Use attachments if provided, otherwise fall back to attachedFiles
    const existingFilesFromBody = attachmentsFromBody || attachedFilesFromBody;
    
    console.log("Existing files from body type:", typeof existingFilesFromBody);
    console.log("Existing files from body:", existingFilesFromBody);

    // Update basic fields if provided (only if they are defined and not empty strings)
    if (productName !== undefined && productName !== null && productName !== "") {
      product.productName = productName;
    }
    if (productDescription !== undefined && productDescription !== null) {
      product.productDescription = productDescription;
    }
    if (unitPrice !== undefined && unitPrice !== null) {
      product.unitPrice = Number(unitPrice);
    }
    if (category !== undefined && category !== null && category !== "") {
      product.category = category;
    }
    // Handle supplierId - can be null for sale products, but not string "null"
    // We'll handle this after all other updates, using updateOne with $unset
    let shouldUnsetSupplierId = false;
    let validSupplierId = null;
    
    if (supplierId !== undefined) {
      // Normalize string "null" or empty string to actual null
      const normalizedSupplierId = (supplierId === "null" || supplierId === "" || supplierId === null) ? null : supplierId;
      
      if (normalizedSupplierId === null) {
        shouldUnsetSupplierId = true;
      } else {
        validSupplierId = normalizedSupplierId;
      }
    }
    if (supplierName !== undefined && supplierName !== null) {
      product.supplierName = supplierName;
    }
    if (length !== undefined && length !== null && length !== "") {
      product.length = Number(length);
    }
    if (width !== undefined && width !== null && width !== "") {
      product.width = Number(width);
    }
    if (height !== undefined && height !== null && height !== "") {
      product.height = Number(height);
    }
    if (productType !== undefined && productType !== null && productType !== "") {
      product.productType = productType;
    }
    if (sku !== undefined && sku !== null && sku !== "") {
      product.sku = sku;
    }
    if (barcode !== undefined && barcode !== null && barcode !== "") {
      product.barcode = barcode;
    }

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
      let updatedFiles = existingFiles;
      
      if (existingFilesFromBody) {
        try {
          let parsedFiles;
          
          // Handle different input types
          if (typeof existingFilesFromBody === 'string') {
            // Try to parse JSON string
            try {
              parsedFiles = JSON.parse(existingFilesFromBody);
            } catch (jsonError) {
              console.error("Error parsing JSON string:", jsonError);
              // If it's not valid JSON, treat as empty array
              parsedFiles = [];
            }
          } else if (Array.isArray(existingFilesFromBody)) {
            // Already an array
            parsedFiles = existingFilesFromBody;
          } else {
            // Unknown type, use empty array
            console.warn("Unknown attachments type:", typeof existingFilesFromBody);
            parsedFiles = [];
          }
          
          updatedFiles = Array.isArray(parsedFiles) && parsedFiles.length > 0
            ? parsedFiles.map((file) => ({
                fileName: file.name || file.fileName || file.fileName,
                fileUrl:
                  file.fileUrl || file.url ||
                  existingFiles.find((ef) => ef.fileName === (file.name || file.fileName))?.fileUrl,
              }))
            : existingFiles;
        } catch (parseError) {
          console.error("Error processing existingFilesFromBody:", parseError);
          console.error("existingFilesFromBody value:", existingFilesFromBody);
          // If parsing fails, keep existing files
          updatedFiles = existingFiles;
        }
      }

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
      try {
        let parsedFiles;
        
        // Handle different input types
        if (typeof existingFilesFromBody === 'string') {
          // Try to parse JSON string
          try {
            parsedFiles = JSON.parse(existingFilesFromBody);
          } catch (jsonError) {
            console.error("Error parsing JSON string:", jsonError);
            // If it's not valid JSON, treat as empty array
            parsedFiles = [];
          }
        } else if (Array.isArray(existingFilesFromBody)) {
          // Already an array
          parsedFiles = existingFilesFromBody;
        } else {
          // Unknown type, use empty array
          console.warn("Unknown attachments type:", typeof existingFilesFromBody);
          parsedFiles = [];
        }
        
        const updatedFiles = Array.isArray(parsedFiles) && parsedFiles.length > 0
          ? parsedFiles.map((file) => ({
              fileName: file.name || file.fileName || file.fileName,
              fileUrl:
                file.fileUrl || file.url ||
                (product.attachments || []).find((ef) => ef.fileName === (file.name || file.fileName))?.fileUrl,
            }))
          : product.attachments || [];

        const filesToKeep = updatedFiles.map((f) => f.fileUrl).filter(Boolean);
        const filesToDelete = (product.attachments || []).filter(
          (file) => file.fileUrl && !filesToKeep.includes(file.fileUrl)
        );
        for (const file of filesToDelete) {
          const publicId = extractPublicId(file.fileUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        }

        product.attachments = updatedFiles;
      } catch (parseError) {
        console.error("Error processing existingFilesFromBody:", parseError);
        console.error("existingFilesFromBody value:", existingFilesFromBody);
        // If parsing fails, keep existing attachments
      }
    }

    await product.save();
    
    // Handle supplierId separately to avoid casting issues
    if (shouldUnsetSupplierId) {
      await Product.updateOne({ _id: product._id }, { $unset: { supplierId: "" } });
    } else if (validSupplierId !== null) {
      await Product.updateOne({ _id: product._id }, { $set: { supplierId: validSupplierId } });
    }
    
    // Reload product to get latest state
    const updatedProduct = await Product.findById(product._id);
    console.log("✅ Product updated successfully:", updatedProduct._id);
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      success: false,
      error: "Error updating product: " + err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
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
