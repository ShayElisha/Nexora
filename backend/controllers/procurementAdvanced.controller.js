import PurchaseRequest from "../models/PurchaseRequest.model.js";
import Tender from "../models/Tender.model.js";
import SupplierContract from "../models/SupplierContract.model.js";
import PriceList from "../models/PriceList.model.js";
import SupplierInvoice from "../models/SupplierInvoice.model.js";
import SupplySchedule from "../models/SupplySchedule.model.js";
import Supplier from "../models/suppliers.model.js";
import Company from "../models/companies.model.js";
import Product from "../models/product.model.js";
import { sendSupplierInvoiceEmail as sendEmail } from "../emails/emailService.js";
import jwt from "jsonwebtoken";

const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Unauthorized: No token provided");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ========== PURCHASE REQUEST ==========

const generateRequestNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;
  const lastRequest = await PurchaseRequest.findOne({
    companyId,
    requestNumber: new RegExp(`^${prefix}`),
  })
    .sort({ requestNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastRequest) {
    const lastSeq = parseInt(lastRequest.requestNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createPurchaseRequest = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const requestNumber = await generateRequestNumber(decoded.companyId);
    const request = new PurchaseRequest({
      ...req.body,
      companyId: decoded.companyId,
      requestNumber,
    });
    await request.save();

    // יצירת Supply Schedule אוטומטית אם יש פריטים עם preferredSupplier
    if (request.items && request.items.length > 0) {
      const supplierGroups = {};
      
      // קיבוץ פריטים לפי ספק
      request.items.forEach((item) => {
        if (item.preferredSupplier) {
          const supplierId = item.preferredSupplier.toString();
          if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = {
              supplierId: item.preferredSupplier,
              items: [],
            };
          }
          supplierGroups[supplierId].items.push({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || item.quantity * (item.unitPrice || 0),
          });
        }
      });

      // יצירת Supply Schedule לכל ספק
      for (const [supplierId, group] of Object.entries(supplierGroups)) {
        try {
          // קבלת שם הספק
          const supplier = await Supplier.findById(supplierId);
          const supplierName = supplier?.SupplierName || "Unknown Supplier";

          // יצירת לוח זמנים
          const scheduleNumber = await generateScheduleNumber(decoded.companyId);
          const requiredDate = request.requiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ימים מהיום אם לא צוין

          const schedule = new SupplySchedule({
            companyId: decoded.companyId,
            scheduleNumber,
            procurementId: request.procurementId || null,
            supplierId: group.supplierId,
            supplierName,
            items: group.items,
            schedule: [
              {
                deliveryDate: requiredDate,
                items: group.items.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  receivedQuantity: 0,
                  status: "Scheduled",
                })),
                tracking: {
                  status: "Pending",
                },
              },
            ],
            status: "Scheduled",
            startDate: request.requestDate || new Date(),
            endDate: requiredDate,
            createdBy: decoded.employeeId || decoded.userId,
            notes: `Created automatically from Purchase Request ${requestNumber}`,
          });

          await schedule.save();
        } catch (scheduleError) {
          console.error("Error creating Supply Schedule:", scheduleError);
          // לא נכשל את כל התהליך אם יש שגיאה ביצירת לוח זמנים
        }
      }

      // יצירת Supplier Invoice אוטומטית אם יש פריטים עם preferredSupplier
      for (const [supplierId, group] of Object.entries(supplierGroups)) {
        try {
          const supplier = await Supplier.findById(supplierId);
          const supplierName = supplier?.SupplierName || "Unknown Supplier";

          // חישוב סכומים
          const subtotal = group.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
          const taxAmount = subtotal * 0.17; // 17% מע"מ (ניתן לשנות)
          const totalAmount = subtotal + taxAmount;

          // יצירת מספר חשבונית
          const year = new Date().getFullYear();
          const prefix = `SI-${year}-`;
          const lastInvoice = await SupplierInvoice.findOne({
            companyId: decoded.companyId,
            invoiceNumber: new RegExp(`^${prefix}`),
          })
            .sort({ invoiceNumber: -1 })
            .limit(1);
          let sequence = 1;
          if (lastInvoice) {
            const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-")[2] || "0");
            sequence = lastSeq + 1;
          }
          const invoiceNumber = `${prefix}${sequence.toString().padStart(6, "0")}`;

          // חישוב תאריך תשלום (30 ימים מהיום)
          const invoiceDate = new Date();
          const dueDate = new Date(invoiceDate);
          dueDate.setDate(dueDate.getDate() + 30);

          const invoice = new SupplierInvoice({
            companyId: decoded.companyId,
            invoiceNumber,
            supplierId: group.supplierId,
            supplierName,
            invoiceDate,
            dueDate,
            receivedDate: invoiceDate,
            items: group.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice || 0,
              discount: 0,
              tax: 17, // 17% מע"מ
              totalPrice: item.totalPrice || item.quantity * (item.unitPrice || 0),
            })),
            subtotal,
            taxAmount,
            discountAmount: 0,
            totalAmount,
            remainingAmount: totalAmount,
            currency: request.currency || "ILS",
            procurementId: request.procurementId || null,
            status: "Pending",
            paymentTerms: "Net 30",
            notes: `Created automatically from Purchase Request ${requestNumber}`,
          });

          await invoice.save();
        } catch (invoiceError) {
          console.error("Error creating Supplier Invoice:", invoiceError);
          // לא נכשל את כל התהליך אם יש שגיאה ביצירת חשבונית
        }
      }
    }

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPurchaseRequests = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { status, requestedBy } = req.query;
    const filter = { companyId: decoded.companyId };
    if (status) filter.status = status;
    if (requestedBy) filter.requestedBy = requestedBy;

    const requests = await PurchaseRequest.find(filter)
      .populate("requestedBy", "name lastName")
      .populate("departmentId", "name")
      .sort({ requestDate: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== TENDER ==========

const generateTenderNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `TDR-${year}-`;
  const lastTender = await Tender.findOne({
    companyId,
    tenderNumber: new RegExp(`^${prefix}`),
  })
    .sort({ tenderNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastTender) {
    const lastSeq = parseInt(lastTender.tenderNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createTender = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const tenderNumber = await generateTenderNumber(decoded.companyId);
    const tender = new Tender({
      ...req.body,
      companyId: decoded.companyId,
      tenderNumber,
      createdBy: decoded.employeeId || decoded.userId,
    });
    await tender.save();
    res.status(201).json({ success: true, data: tender });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTenders = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { status } = req.query;
    const filter = { companyId: decoded.companyId };
    if (status) filter.status = status;

    const tenders = await Tender.find(filter)
      .populate("createdBy", "name lastName")
      .sort({ publishDate: -1 });

    res.status(200).json({ success: true, data: tenders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPLIER CONTRACT ==========

const generateContractNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `SC-${year}-`;
  const lastContract = await SupplierContract.findOne({
    companyId,
    contractNumber: new RegExp(`^${prefix}`),
  })
    .sort({ contractNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastContract) {
    const lastSeq = parseInt(lastContract.contractNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createSupplierContract = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const contractNumber = await generateContractNumber(decoded.companyId);
    const contract = new SupplierContract({
      ...req.body,
      companyId: decoded.companyId,
      contractNumber,
      createdBy: decoded.employeeId || decoded.userId,
    });
    await contract.save();
    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSupplierContracts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { supplierId, status } = req.query;
    const filter = { companyId: decoded.companyId };
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;

    const contracts = await SupplierContract.find(filter)
      .populate("supplierId", "SupplierName")
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== PRICE LIST ==========

const generatePriceListNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `PL-${year}-`;
  const lastList = await PriceList.findOne({
    companyId,
    priceListNumber: new RegExp(`^${prefix}`),
  })
    .sort({ priceListNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastList) {
    const lastSeq = parseInt(lastList.priceListNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createPriceList = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const priceListNumber = await generatePriceListNumber(decoded.companyId);
    
    // Clean up the data before creating
    const priceListData = {
      ...req.body,
      companyId: decoded.companyId,
      priceListNumber,
      // Remove empty supplierId/customerId (convert empty strings to undefined)
      supplierId: req.body.supplierId && req.body.supplierId.trim() !== "" 
        ? req.body.supplierId 
        : undefined,
      customerId: req.body.customerId && req.body.customerId.trim() !== "" 
        ? req.body.customerId 
        : undefined,
    };
    
    // Validate items have basePrice
    if (priceListData.items && Array.isArray(priceListData.items)) {
      priceListData.items = priceListData.items.map(item => {
        if (!item.basePrice && item.basePrice !== 0) {
          throw new Error(`Item ${item.productName || 'unknown'} must have a basePrice`);
        }
        
        // Log quantity breaks for debugging
        if (item.quantityBreaks && item.quantityBreaks.length > 0) {
          console.log(`💾 Saving item ${item.productName || item.productId} with ${item.quantityBreaks.length} quantity breaks:`, 
            item.quantityBreaks.map(qb => ({
              min: qb.minQuantity,
              max: qb.maxQuantity,
              price: qb.price
            }))
          );
        }
        
        return item;
      });
    }
    
    const priceList = new PriceList(priceListData);
    await priceList.save();
    
    // Verify what was saved
    const saved = await PriceList.findById(priceList._id);
    console.log(`✅ Saved price list ${priceList._id}, items:`, saved.items.map(item => ({
      productName: item.productName,
      quantityBreaksCount: item.quantityBreaks?.length || 0
    })));
    res.status(201).json({ success: true, data: priceList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPriceLists = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    let companyId = decoded.companyId;
    
    // If companyId is not in token, try to get it from userId
    if (!companyId && decoded.userId) {
      const Employee = (await import("../models/employees.model.js")).default;
      const user = await Employee.findById(decoded.userId);
      if (user) {
        companyId = user.companyId || user.company;
      }
    }

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: "Company ID not found" 
      });
    }

    const { priceListType, status } = req.query;
    const filter = { companyId };
    if (priceListType) filter.priceListType = priceListType;
    if (status) filter.status = status;

    const priceLists = await PriceList.find(filter)
      .populate("customerId", "name")
      .populate("supplierId", "SupplierName")
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: priceLists });
  } catch (error) {
    console.error("❌ Error in getAllPriceLists:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

export const getPriceListById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const priceList = await PriceList.findOne({
      _id: id,
      companyId: decoded.companyId,
    })
      .populate("customerId", "name")
      .populate("supplierId", "SupplierName")
      .populate("items.productId", "productName sku");

    if (!priceList) {
      return res.status(404).json({ success: false, message: "Price list not found" });
    }

    res.status(200).json({ success: true, data: priceList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePriceList = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    // Check if price list exists and belongs to company
    const existingPriceList = await PriceList.findOne({
      _id: id,
      companyId: decoded.companyId,
    });

    if (!existingPriceList) {
      return res.status(404).json({ success: false, message: "Price list not found" });
    }

    // Clean up the data before updating
    const updateData = {
      ...req.body,
      // Remove empty supplierId/customerId (convert empty strings to undefined)
      supplierId: req.body.supplierId && req.body.supplierId.trim() !== "" 
        ? req.body.supplierId 
        : undefined,
      customerId: req.body.customerId && req.body.customerId.trim() !== "" 
        ? req.body.customerId 
        : undefined,
    };

    // Validate items have basePrice
    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.items = updateData.items.map(item => {
        if (!item.basePrice && item.basePrice !== 0) {
          throw new Error(`Item ${item.productName || 'unknown'} must have a basePrice`);
        }
        return item;
      });
    }

    const updatedPriceList = await PriceList.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("customerId", "name")
      .populate("supplierId", "SupplierName")
      .populate("items.productId", "productName sku");

    res.status(200).json({ success: true, data: updatedPriceList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePriceList = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;

    const priceList = await PriceList.findOneAndDelete({
      _id: id,
      companyId: decoded.companyId,
    });

    if (!priceList) {
      return res.status(404).json({ success: false, message: "Price list not found" });
    }

    res.status(200).json({ success: true, message: "Price list deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== GET PRICE FROM PRICE LIST ==========

/**
 * Get price for a product from price list
 * Supports: Customer price lists, Supplier price lists, Quantity breaks
 */
export const getPriceFromPriceList = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { customerId, supplierId, productId, quantity = 1, date } = req.query;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "productId is required" 
      });
    }

    const queryDate = date ? new Date(date) : new Date();
    // Ensure quantity is a number
    const qty = quantity ? Number(quantity) : 1;
    
    console.log(`🔍 Getting price for productId=${productId}, customerId=${customerId}, supplierId=${supplierId}, quantity=${qty}`);

    // Build filter for active price lists
    const filter = {
      companyId: decoded.companyId,
      status: "Active",
      startDate: { $lte: queryDate },
      $or: [
        { endDate: { $gte: queryDate } },
        { endDate: null }
      ],
      "items.productId": productId
    };

    // Add type-specific filters
    if (customerId) {
      filter.priceListType = "Customer";
      // Combine customer filter with date filter using $and
      const customerFilter = {
        $or: [
          { customerId: customerId }, // Specific customer
          { customerId: null } // General customer price list
        ]
      };
      
      // Use $and to combine both conditions
      filter.$and = [
        {
          $or: [
            { endDate: { $gte: queryDate } },
            { endDate: null }
          ]
        },
        customerFilter
      ];
      // Remove the standalone $or since we're using $and now
      delete filter.$or;
    } else if (supplierId) {
      filter.priceListType = "Supplier";
      // Support both specific supplier and general supplier price lists
      const supplierFilter = {
        $or: [
          { supplierId: supplierId }, // Specific supplier
          { supplierId: null } // General supplier price list
        ]
      };
      
      // Use $and to combine both conditions
      filter.$and = [
        {
          $or: [
            { endDate: { $gte: queryDate } },
            { endDate: null }
          ]
        },
        supplierFilter
      ];
      // Remove the standalone $or since we're using $and now
      delete filter.$or;
    }

    // Find price lists, prefer specific over general
    const priceLists = await PriceList.find(filter)
      .sort({ 
        customerId: -1, // Prefer specific customer over null
        supplierId: -1, // Prefer specific supplier over null
        startDate: -1 
      })
      .limit(10);

    // Search through price lists to find the best price
    console.log(`📋 Found ${priceLists.length} price lists to check`);
    
    for (const priceList of priceLists) {
      console.log(`🔍 Checking price list: ${priceList.priceListName} (ID: ${priceList._id})`);
      
      const item = priceList.items.find(i => 
        i.productId.toString() === productId.toString()
      );

      if (item) {
        console.log(`✅ Found item in price list: ${item.productName || 'Unknown'}`);
        console.log(`   Base price: ${item.basePrice}`);
        console.log(`   Quantity breaks: ${item.quantityBreaks?.length || 0}`);
        
        // Check quantity breaks first
        if (item.quantityBreaks && item.quantityBreaks.length > 0) {
          console.log(`   Checking quantity breaks for qty=${qty}:`, item.quantityBreaks);
          
          // Sort by minQuantity descending to find the best match (highest quantity first)
          // This ensures we find the most specific/highest quantity break first
          const sortedBreaks = [...item.quantityBreaks].sort((a, b) => {
            const aMin = Number(a.minQuantity) || 0;
            const bMin = Number(b.minQuantity) || 0;
            return bMin - aMin; // Descending order - highest minQuantity first
          });

          console.log(`   Sorted breaks (descending by minQuantity):`, sortedBreaks.map(b => ({
            min: b.minQuantity,
            max: b.maxQuantity,
            price: b.price
          })));

          // Find the best matching quantity break
          // We want the break with the HIGHEST minQuantity that the quantity still matches
          let bestMatch = null;
          let bestMinQty = -1;

          for (const breakPrice of sortedBreaks) {
            const minQty = Number(breakPrice.minQuantity) || 0;
            // Handle maxQuantity: null/undefined means "and above", empty string also means "and above"
            let maxQty = null;
            if (breakPrice.maxQuantity !== null && 
                breakPrice.maxQuantity !== undefined && 
                breakPrice.maxQuantity !== "" &&
                !isNaN(Number(breakPrice.maxQuantity))) {
              maxQty = Number(breakPrice.maxQuantity);
            }
            
            console.log(`   Checking break: min=${minQty}, max=${maxQty === null ? 'null (unlimited)' : maxQty}, price=${breakPrice.price}, qty=${qty}`);
            
            // Check if quantity matches this break
            if (qty >= minQty) {
              console.log(`   ✅ qty ${qty} >= minQty ${minQty}`);
              // If no maxQuantity (null/undefined/empty), it means "and above" - so it matches
              // Otherwise check if qty is within range
              if (maxQty === null || qty <= maxQty) {
                console.log(`   ✅ Break matches! min=${minQty}, max=${maxQty === null ? 'unlimited' : maxQty}, price=${breakPrice.price}`);
                // Keep track of the best match (highest minQuantity that still matches)
                if (minQty > bestMinQty) {
                  bestMatch = breakPrice;
                  bestMinQty = minQty;
                  console.log(`   🎯 New best match: min=${minQty}, price=${breakPrice.price}`);
                }
              } else {
                console.log(`   ❌ qty ${qty} > maxQty ${maxQty}, skipping`);
              }
            } else {
              console.log(`   ❌ qty ${qty} < minQty ${minQty}, skipping`);
            }
          }

          // Return the best match if found
          if (bestMatch) {
            const minQty = Number(bestMatch.minQuantity) || 0;
            let maxQty = null;
            if (bestMatch.maxQuantity !== null && 
                bestMatch.maxQuantity !== undefined && 
                bestMatch.maxQuantity !== "" &&
                !isNaN(Number(bestMatch.maxQuantity))) {
              maxQty = Number(bestMatch.maxQuantity);
            }
            
            const breakPrice = Number(bestMatch.price);
            const basePrice = Number(item.basePrice) || 0;
            // Calculate discount percentage from base price
            const discountPercent = basePrice > 0 
              ? ((basePrice - breakPrice) / basePrice * 100).toFixed(2)
              : 0;
            
            console.log(`   ✅✅ FINAL Quantity break matched! qty=${qty}, min=${minQty}, max=${maxQty === null ? 'unlimited' : maxQty}, price=${breakPrice}, discount=${discountPercent}%`);
            return res.json({
              success: true,
              price: breakPrice,
              source: "quantityBreak",
              priceListId: priceList._id,
              priceListName: priceList.priceListName,
              basePrice: basePrice,
              discountPercent: parseFloat(discountPercent),
              quantityBreak: {
                minQuantity: minQty,
                maxQuantity: maxQty,
                discount: bestMatch.discount,
                discountPercent: parseFloat(discountPercent)
              }
            });
          }
          
          console.log(`⚠️ No quantity break matched for qty=${qty}`);
        }

        // Check period pricing
        if (item.periodPricing && item.periodPricing.length > 0) {
          const periodPrice = item.periodPricing.find(p => {
            const start = new Date(p.startDate);
            const end = p.endDate ? new Date(p.endDate) : null;
            return queryDate >= start && (!end || queryDate <= end);
          });

          if (periodPrice) {
            const periodPriceValue = Number(periodPrice.price);
            const basePrice = Number(item.basePrice) || 0;
            const discountPercent = basePrice > 0 
              ? ((basePrice - periodPriceValue) / basePrice * 100).toFixed(2)
              : 0;
            
            console.log(`   ✅ Period pricing matched! date=${queryDate}, price=${periodPriceValue}, discount=${discountPercent}%`);
            return res.json({
              success: true,
              price: periodPriceValue,
              source: "periodPricing",
              priceListId: priceList._id,
              priceListName: priceList.priceListName,
              basePrice: basePrice,
              discountPercent: parseFloat(discountPercent),
              periodPricing: {
                startDate: periodPrice.startDate,
                endDate: periodPrice.endDate,
                discount: periodPrice.discount,
                discountPercent: parseFloat(discountPercent)
              }
            });
          }
        }

        // Return base price
        const basePrice = Number(item.basePrice);
        console.log(`ℹ️ Returning base price: ${basePrice} for product ${item.productId}`);
        return res.json({
          success: true,
          price: basePrice,
          source: "basePrice",
          priceListId: priceList._id,
          priceListName: priceList.priceListName,
          basePrice: basePrice,
          discountPercent: 0
        });
      }
    }

    // Fallback to product unitPrice
    const product = await Product.findById(productId);
    if (product) {
      return res.json({
        success: true,
        price: product.unitPrice || 0,
        source: "productDefault"
      });
    }

    // No price found
    res.status(404).json({
      success: false,
      message: "Price not found for this product"
    });
  } catch (error) {
    console.error("Error getting price from price list:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPLIER INVOICE ==========

export const createSupplierInvoice = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const invoice = new SupplierInvoice({
      ...req.body,
      companyId: decoded.companyId,
      remainingAmount: req.body.totalAmount || 0,
    });
    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSupplierInvoices = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { supplierId, status } = req.query;
    const filter = { companyId: decoded.companyId };
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;

    const invoices = await SupplierInvoice.find(filter)
      .populate("supplierId", "SupplierName Email")
      .sort({ invoiceDate: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierInvoice = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const invoice = await SupplierInvoice.findOne({
      _id: req.params.id,
      companyId: decoded.companyId,
    })
      .populate("supplierId", "SupplierName Email")
      .populate("procurementId");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplierInvoice = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const invoice = await SupplierInvoice.findOneAndUpdate(
      { _id: req.params.id, companyId: decoded.companyId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate("supplierId", "SupplierName Email");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplierInvoice = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const invoice = await SupplierInvoice.findOneAndDelete({
      _id: req.params.id,
      companyId: decoded.companyId,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendSupplierInvoiceEmail = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const invoice = await SupplierInvoice.findOne({
      _id: req.params.id,
      companyId: decoded.companyId,
    })
      .populate("supplierId", "SupplierName Email")
      .populate("companyId", "name");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (!invoice.supplierId?.Email) {
      return res.status(400).json({ success: false, message: "Supplier email not found" });
    }

    const company = await Company.findById(decoded.companyId);
    const invoiceUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/procurement/supplier-invoices/${invoice._id}`;

    await sendEmail(
      invoice.supplierId.Email,
      invoice.supplierId.SupplierName || invoice.supplierName,
      company?.name || "Company",
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.dueDate,
      invoice.totalAmount,
      invoice.currency,
      invoiceUrl
    );

    res.status(200).json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    console.error("Error sending supplier invoice email:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SUPPLY SCHEDULE ==========

const generateScheduleNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `SS-${year}-`;
  const lastSchedule = await SupplySchedule.findOne({
    companyId,
    scheduleNumber: new RegExp(`^${prefix}`),
  })
    .sort({ scheduleNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastSchedule) {
    const lastSeq = parseInt(lastSchedule.scheduleNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export const createSupplySchedule = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const scheduleNumber = await generateScheduleNumber(decoded.companyId);
    const schedule = new SupplySchedule({
      ...req.body,
      companyId: decoded.companyId,
      scheduleNumber,
    });
    await schedule.save();
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSupplySchedules = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { supplierId, status, startDate, endDate, procurementId, page = 1, limit = 20, sortBy = "startDate", sortOrder = "desc" } = req.query;
    const filter = { companyId: decoded.companyId };
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;
    if (procurementId) filter.procurementId = procurementId;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const schedules = await SupplySchedule.find(filter)
      .populate("supplierId", "SupplierName Email Phone")
      .populate("procurementId", "PurchaseOrder totalCost currency")
      .populate("createdBy", "name email")
      .populate("managedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupplySchedule.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplyScheduleById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    
    const schedule = await SupplySchedule.findOne({ 
      _id: id, 
      companyId: decoded.companyId 
    })
      .populate("supplierId")
      .populate("procurementId")
      .populate("createdBy", "name email")
      .populate("managedBy", "name email")
      .populate("items.productId")
      .populate("schedule.items.productId");

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Supply schedule not found" });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplySchedule = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    
    const schedule = await SupplySchedule.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("supplierId")
      .populate("procurementId");

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Supply schedule not found" });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplySchedule = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    
    const schedule = await SupplySchedule.findOneAndDelete({ 
      _id: id, 
      companyId: decoded.companyId 
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Supply schedule not found" });
    }

    res.status(200).json({ success: true, message: "Supply schedule deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplyScheduleStatus = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["Scheduled", "In Progress", "Partially Delivered", "Delivered", "Delayed", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const schedule = await SupplySchedule.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("supplierId")
      .populate("procurementId");

    if (!schedule) {
      return res.status(404).json({ success: false, message: "Supply schedule not found" });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const duplicateSupplySchedule = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    
    const originalSchedule = await SupplySchedule.findOne({ 
      _id: id, 
      companyId: decoded.companyId 
    });

    if (!originalSchedule) {
      return res.status(404).json({ success: false, message: "Supply schedule not found" });
    }

    const scheduleNumber = await generateScheduleNumber(decoded.companyId);
    const scheduleData = originalSchedule.toObject();
    delete scheduleData._id;
    delete scheduleData.createdAt;
    delete scheduleData.updatedAt;
    scheduleData.scheduleNumber = scheduleNumber;
    scheduleData.status = "Scheduled";
    scheduleData.createdBy = decoded._id;
    scheduleData.managedBy = decoded._id;

    // Reset schedule items status
    if (scheduleData.schedule) {
      scheduleData.schedule = scheduleData.schedule.map(s => ({
        ...s,
        items: s.items.map(item => ({
          ...item,
          receivedQuantity: 0,
          status: "Scheduled"
        })),
        tracking: {
          ...s.tracking,
          status: "Pending"
        }
      }));
    }

    const newSchedule = new SupplySchedule(scheduleData);
    await newSchedule.save();

    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplyScheduleStats = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { startDate, endDate } = req.query;
    
    const filter = { companyId: decoded.companyId };
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const schedules = await SupplySchedule.find(filter)
      .populate("supplierId", "SupplierName")
      .populate("procurementId", "PurchaseOrder totalCost currency");

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalActive = 0;
    let upcoming7Days = 0;
    let upcoming14Days = 0;
    let upcoming30Days = 0;
    let delayed = 0;
    let totalDeliveries = 0;
    let completedDeliveries = 0;
    let totalAmount = 0;
    const statusDistribution = {};
    const supplierStats = {};

    schedules.forEach(schedule => {
      if (["Scheduled", "In Progress", "Partially Delivered"].includes(schedule.status)) {
        totalActive++;
      }

      if (schedule.status === "Delayed") {
        delayed++;
      }

      if (schedule.schedule && schedule.schedule.length > 0) {
        schedule.schedule.forEach(delivery => {
          totalDeliveries++;
          const deliveryDate = new Date(delivery.deliveryDate);
          
          if (deliveryDate <= now && delivery.status !== "Delivered") {
            delayed++;
          } else if (deliveryDate <= sevenDaysFromNow && deliveryDate > now) {
            upcoming7Days++;
          } else if (deliveryDate <= fourteenDaysFromNow && deliveryDate > sevenDaysFromNow) {
            upcoming14Days++;
          } else if (deliveryDate <= thirtyDaysFromNow && deliveryDate > fourteenDaysFromNow) {
            upcoming30Days++;
          }

          if (delivery.status === "Delivered") {
            completedDeliveries++;
          }
        });
      }

      statusDistribution[schedule.status] = (statusDistribution[schedule.status] || 0) + 1;

      if (schedule.procurementId && schedule.procurementId.totalCost) {
        totalAmount += schedule.procurementId.totalCost;
      }

      const supplierName = schedule.supplierId?.SupplierName || "Unknown";
      if (!supplierStats[supplierName]) {
        supplierStats[supplierName] = { count: 0, totalAmount: 0 };
      }
      supplierStats[supplierName].count++;
      if (schedule.procurementId && schedule.procurementId.totalCost) {
        supplierStats[supplierName].totalAmount += schedule.procurementId.totalCost;
      }
    });

    const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalActive,
        upcoming7Days,
        upcoming14Days,
        upcoming30Days,
        delayed,
        totalDeliveries,
        completedDeliveries,
        completionRate: Math.round(completionRate * 100) / 100,
        totalAmount,
        statusDistribution,
        supplierStats: Object.entries(supplierStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

