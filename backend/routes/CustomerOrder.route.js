import express from "express";
import {
  createCustomerOrder,
  createOrderFromInvoice,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder,
  getUnallocatedOrders,
} from "../controllers/CustomerOrder.controller.js";

const router = express.Router();

// Create a new customer order
router.post("/", createCustomerOrder);

// Create order from invoice
router.post("/from-invoice", createOrderFromInvoice);

// Get all customer orders
router.get("/", getCustomerOrders);

// Get unallocated orders (must be before /:id)
router.get("/unallocated", getUnallocatedOrders);

// Get orders for preparation (must be before /:id)
router.get("/preparation", async (req, res) => {
  try {
    const CustomerOrder = (await import("../models/CustomerOrder.model.js")).default;
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const jwt = (await import("jsonwebtoken")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    const orders = await CustomerOrder.find({
      companyId,
      preparationStatus: "In Progress" // Only show orders that are still being prepared
    })
      .populate("customer")
      .populate("items.product")
      .sort({ preparationDate: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create production orders for missing inventory (must be before /:id)
router.post("/:id/create-production-orders", async (req, res) => {
  console.log(`🚀 [CREATE PROD ORDERS] Route called for order ID: ${req.params.id}`);
  const mongoose = (await import("mongoose")).default;
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    console.log(`✅ [CREATE PROD ORDERS] Transaction started`);
    
    const CustomerOrder = (await import("../models/CustomerOrder.model.js")).default;
    const { createProductionOrderFromCustomerOrder } = await import("../controllers/ProductionOrder.controller.js");
    
    const order = await CustomerOrder.findById(req.params.id)
      .populate("items.product")
      .session(session);
      
    if (!order) {
      console.log(`❌ [CREATE PROD ORDERS] Order ${req.params.id} not found`);
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    console.log(`✅ [CREATE PROD ORDERS] Order found: ${order._id}, Status: ${order.status}, Items: ${order.items?.length || 0}`);
    
    // Create production orders
    const productionOrders = await createProductionOrderFromCustomerOrder(order, session);
    
    await session.commitTransaction();
    
    console.log(`✅ [CREATE PROD ORDERS] Created ${productionOrders.length} production order(s) for order ${order._id}`);
    
    res.json({
      success: true,
      productionOrdersCreated: productionOrders.length,
      productionOrderDetails: productionOrders.map(po => ({
        orderNumber: po.orderNumber,
        productName: po.productName,
        quantity: po.quantity,
        status: po.status,
        id: po._id.toString()
      }))
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ [CREATE PROD ORDERS] Error:", error);
    console.error("❌ [CREATE PROD ORDERS] Error stack:", error.stack);
    console.error("❌ [CREATE PROD ORDERS] Error name:", error.name);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
});

// Get a single customer order by its ID (must be after specific routes)
router.get("/:id", getCustomerOrderById);

// Update an existing customer order
router.put("/:id", updateCustomerOrder);

// Delete a customer order by its ID
router.delete("/:id", deleteCustomerOrder);

// Update order status
router.put("/:id/status", async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const CustomerOrder = (await import("../models/CustomerOrder.model.js")).default;
    const Finance = (await import("../models/finance.model.js")).default;
    const Notification = (await import("../models/notification.model.js")).default;
    const Employee = (await import("../models/employees.model.js")).default;
    const Task = (await import("../models/tasks.model.js")).default;
    const { releaseInventory } = await import("../utils/inventoryHelper.js");
    const { notifyAdminsAndManagers } = await import("../controllers/notification.controller.js");
    const { status } = req.body;
    
    const order = await CustomerOrder.findById(req.params.id)
      .populate("items.product")
      .populate("customer", "name email")
      .populate("companyId", "name")
      .session(session);
      
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const oldStatus = order.status;
    const isConfirming = status === "Confirmed" && oldStatus !== "Confirmed";

    // If approving order (status = "Confirmed"), update financial record and create notifications
    // NOTE: Inventory check is NOT performed here - it will be done later during preparation
    if (isConfirming) {
      order.confirmedAt = new Date();
      
      // Update financial record if it exists
      try {
        const financialRecord = await Finance.findOne({ orderId: order._id }).session(session);
        if (financialRecord) {
          // Update financial record status to reflect order confirmation
          financialRecord.transactionStatus = "Pending"; // Keep as Pending until payment received
          financialRecord.transactionDate = order.confirmedAt;
          await financialRecord.save({ session });
          console.log(`✅ Updated financial record ${financialRecord._id} for confirmed order ${order._id}`);
        } else {
          console.log(`⚠️ No financial record found for order ${order._id} - may need to be created manually`);
        }
      } catch (financeError) {
        console.error("❌ Error updating financial record:", financeError);
        // Continue even if financial record update fails
      }

      // Create notifications
      try {
        // Notify customer service / sales team
        const salesTeam = await Employee.find({
          companyId: order.companyId,
          role: { $in: ["Admin", "Manager"] },
          status: "active",
        }).select("_id").limit(10);

        for (const employee of salesTeam) {
          await Notification.create({
            companyId: order.companyId,
            employeeId: employee._id,
            title: "✅ הזמנה אושרה",
            content: `הזמנה #${order._id.toString().slice(-6)} של ${order.customer?.name || "לקוח"} אושרה. סך ההזמנה: ${order.orderTotal.toFixed(2)} ${order.companyId?.currency || "ILS"}`,
            type: "Success",
            category: "customers",
            priority: "medium",
            relatedEntity: {
              entityType: "CustomerOrder",
              entityId: order._id.toString(),
            },
            actionUrl: `/dashboard/Customers/Orders/${order._id}`,
            actionLabel: "צפה בהזמנה",
          });
        }

        // Notify finance team about confirmed order
        const financeTeam = await Employee.find({
          companyId: order.companyId,
          role: { $in: ["Admin", "Manager"] },
          status: "active",
        }).select("_id").limit(5);

        for (const employee of financeTeam) {
          await Notification.create({
            companyId: order.companyId,
            employeeId: employee._id,
            title: "💰 הזמנה אושרה - נדרש מעקב תשלום",
            content: `הזמנה #${order._id.toString().slice(-6)} אושרה. סך לתשלום: ${order.orderTotal.toFixed(2)} ${order.companyId?.currency || "ILS"}. מועד תשלום: ${order.paymentTerms || "Net 30"}`,
            type: "Info",
            category: "finance",
            priority: "medium",
            relatedEntity: {
              entityType: "CustomerOrder",
              entityId: order._id.toString(),
            },
            actionUrl: `/dashboard/finance`,
            actionLabel: "צפה במימון",
          });
        }

        console.log(`✅ Created notifications for confirmed order ${order._id}`);
      } catch (notificationError) {
        console.error("❌ Error creating notifications:", notificationError);
        // Continue even if notifications fail
      }

      // Update related tasks status
      try {
        const relatedTasks = await Task.find({ 
          orderId: order._id,
          status: { $ne: "completed" } // Only update tasks that are not already completed
        }).session(session);

        if (relatedTasks.length > 0) {
          // Update all related tasks to "in progress"
          await Task.updateMany(
            { orderId: order._id, status: { $ne: "completed" } },
            { 
              $set: { 
                status: "in progress",
                updatedAt: new Date()
              }
            },
            { session }
          );
          console.log(`✅ Updated ${relatedTasks.length} task(s) to "in progress" for confirmed order ${order._id}`);
        }
      } catch (taskError) {
        console.error("❌ Error updating related tasks:", taskError);
        // Continue even if task update fails
      }
    } 
    // If cancelling order, release inventory
    else if (status === "Cancelled" && order.inventoryReserved) {
      const token = req.cookies["auth_token"];
      let userId = null;
      if (token) {
        try {
          const jwt = (await import("jsonwebtoken")).default;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId || decoded._id;
        } catch (e) {
          // Token invalid, continue without userId
        }
      }
      
      await releaseInventory(order, {
        session,
        reason: "Order Cancelled",
        userId
      });
      
      order.inventoryReserved = false;

      // Update financial record if exists
      try {
        const financialRecord = await Finance.findOne({ orderId: order._id }).session(session);
        if (financialRecord) {
          financialRecord.transactionStatus = "Cancelled";
          await financialRecord.save({ session });
          console.log(`✅ Updated financial record ${financialRecord._id} for cancelled order ${order._id}`);
        }
      } catch (financeError) {
        console.error("❌ Error updating financial record for cancelled order:", financeError);
      }

      // Update related tasks to "cancelled" when order is cancelled
      try {
        const relatedTasks = await Task.find({ 
          orderId: order._id,
          status: { $nin: ["completed", "cancelled"] }
        }).session(session);

        if (relatedTasks.length > 0) {
          await Task.updateMany(
            { orderId: order._id, status: { $nin: ["completed", "cancelled"] } },
            { 
              $set: { 
                status: "cancelled",
                updatedAt: new Date()
              }
            },
            { session }
          );
          console.log(`✅ Updated ${relatedTasks.length} task(s) to "cancelled" for cancelled order ${order._id}`);
        }
      } catch (taskError) {
        console.error("❌ Error updating related tasks for cancelled order:", taskError);
        // Continue even if task update fails
      }
    } 
    else if (status === "Shipped") {
      order.shippedAt = new Date();
      
      // Create notification for shipped order
      try {
        await notifyAdminsAndManagers({
          companyId: order.companyId,
          title: "🚚 הזמנה נשלחה",
          content: `הזמנה #${order._id.toString().slice(-6)} של ${order.customer?.name || "לקוח"} נשלחה`,
          type: "Info",
          category: "customers",
          priority: "low",
          relatedEntity: {
            entityType: "CustomerOrder",
            entityId: order._id.toString(),
          },
          actionUrl: `/dashboard/Customers/Orders/${order._id}`,
          actionLabel: "צפה בהזמנה",
        });
      } catch (notificationError) {
        console.error("❌ Error creating notification for shipped order:", notificationError);
      }

      // Update related tasks - keep as "in progress" (delivery tracking tasks)
      // Tasks remain active until delivery is confirmed
    } 
    else if (status === "Delivered") {
      order.deliveredAt = new Date();
      
      // Update financial record status when order is delivered
      try {
        const financialRecord = await Finance.findOne({ orderId: order._id }).session(session);
        if (financialRecord && financialRecord.transactionStatus === "Pending") {
          // Keep as Pending until payment is actually received
          // This is just a status update for tracking
          console.log(`ℹ️ Order ${order._id} delivered - financial record remains Pending until payment`);
        }
      } catch (financeError) {
        console.error("❌ Error checking financial record for delivered order:", financeError);
      }

      // Create notification for delivered order
      try {
        await notifyAdminsAndManagers({
          companyId: order.companyId,
          title: "📦 הזמנה נמסרה",
          content: `הזמנה #${order._id.toString().slice(-6)} של ${order.customer?.name || "לקוח"} נמסרה בהצלחה`,
          type: "Success",
          category: "customers",
          priority: "low",
          relatedEntity: {
            entityType: "CustomerOrder",
            entityId: order._id.toString(),
          },
          actionUrl: `/dashboard/Customers/Orders/${order._id}`,
          actionLabel: "צפה בהזמנה",
        });
      } catch (notificationError) {
        console.error("❌ Error creating notification for delivered order:", notificationError);
      }

      // Update related tasks to "completed" when order is delivered
      try {
        const relatedTasks = await Task.find({ 
          orderId: order._id,
          status: { $ne: "completed" }
        }).session(session);

        if (relatedTasks.length > 0) {
          await Task.updateMany(
            { orderId: order._id, status: { $ne: "completed" } },
            { 
              $set: { 
                status: "completed",
                updatedAt: new Date()
              }
            },
            { session }
          );
          console.log(`✅ Updated ${relatedTasks.length} task(s) to "completed" for delivered order ${order._id}`);
        }
      } catch (taskError) {
        console.error("❌ Error updating related tasks for delivered order:", taskError);
        // Continue even if task update fails
      }
    }
    
    order.status = status;
    await order.save({ session });
    
    await session.commitTransaction();
    res.json({ success: true, data: order });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// Mark order as ready to ship (removes from preparation list)
router.post("/:id/ready-to-ship", async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const CustomerOrder = (await import("../models/CustomerOrder.model.js")).default;
    const Inventory = (await import("../models/inventory.model.js")).default;
    const Product = (await import("../models/product.model.js")).default;
    const { checkAndReserveInventory } = await import("../utils/inventoryHelper.js");
    
    const order = await CustomerOrder.findById(req.params.id)
      .populate("items.product")
      .session(session);
      
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    // Always check inventory before marking as ready to ship
    // Check current stock levels for all items
    const inventoryIssues = [];
    
    for (const item of order.items || []) {
      const productId = item.product?._id || item.productId;
      if (!productId) continue;
      
      const requiredQuantity = item.quantity || 0;
      if (requiredQuantity <= 0) continue;
      
      const inventory = await Inventory.findOne({
        companyId: order.companyId,
        productId: productId
      }).session(session);
      
      if (!inventory) {
        // No inventory record - treat as zero stock
        const product = await Product.findById(productId).session(session);
        inventoryIssues.push({
          productId: productId.toString(),
          productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
          required: requiredQuantity,
          available: 0,
          missing: requiredQuantity
        });
      } else if (inventory.quantity < requiredQuantity) {
        // Not enough stock
        const product = await Product.findById(productId).session(session);
        inventoryIssues.push({
          productId: productId.toString(),
          productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
          required: requiredQuantity,
          available: inventory.quantity,
          missing: requiredQuantity - inventory.quantity
        });
      }
    }
    
    // If there are inventory issues, don't allow marking as ready to ship
    if (inventoryIssues.length > 0) {
      await session.abortTransaction();
      const issuesText = inventoryIssues.map(issue =>
        `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
      ).join("\n");
      
      return res.status(400).json({
        success: false,
        message: "לא ניתן לסמן כמוכן למשלוח - חסר מלאי",
        inventoryIssues: inventoryIssues,
        details: issuesText
      });
    }
    
    // If order is still Pending or inventory not reserved, reserve it now
    if (order.status === "Pending" || !order.inventoryReserved) {
      const token = req.cookies["auth_token"];
      let userId = null;
      if (token) {
        try {
          const jwt = (await import("jsonwebtoken")).default;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId || decoded._id;
        } catch (e) {
          // Token invalid, continue without userId
        }
      }
      
      const result = await checkAndReserveInventory(order, {
        session,
        reason: "Order Ready to Ship",
        userId
      });
      
      if (!result.success) {
        await session.abortTransaction();
        const issuesText = result.inventoryIssues.map(issue =>
          `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
        ).join("\n");
        
        return res.status(400).json({
          success: false,
          message: "לא ניתן לסמן כמוכן למשלוח - חסר מלאי",
          inventoryIssues: result.inventoryIssues,
          details: issuesText
        });
      }
      
      order.status = "Confirmed";
      order.confirmedAt = new Date();
      order.inventoryReserved = true;
      order.inventoryReservedAt = new Date();
    }
    
    order.preparationStatus = "Ready to Ship";
    await order.save({ session });
    
    await session.commitTransaction();
    res.json({ success: true, data: order, message: "ההזמנה מוכנה למשלוח" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error marking order as ready to ship:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// Prepare for shipping
router.post("/:id/prepare", async (req, res) => {
  console.log(`🚀 [PREPARE ROUTE] Route called for order ID: ${req.params.id}`);
  const mongoose = (await import("mongoose")).default;
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    console.log(`✅ [PREPARE ROUTE] Transaction started`);
    
    const CustomerOrder = (await import("../models/CustomerOrder.model.js")).default;
    const Employee = (await import("../models/employees.model.js")).default;
    const Task = (await import("../models/tasks.model.js")).default;
    const Inventory = (await import("../models/inventory.model.js")).default;
    const Product = (await import("../models/product.model.js")).default;
    const productTree = (await import("../models/productTree.model.js")).default;
    const ProductionOrder = (await import("../models/ProductionOrder.model.js")).default;
    const { notifyAdminsAndManagers } = await import("../controllers/notification.controller.js");
    const { checkAndReserveInventory } = await import("../utils/inventoryHelper.js");
    const { createProductionOrderFromCustomerOrder } = await import("../controllers/ProductionOrder.controller.js");
    
    console.log(`🔍 [PREPARE ROUTE] Fetching order ${req.params.id}...`);
    const order = await CustomerOrder.findById(req.params.id)
      .populate("customer")
      .populate("items.product")
      .session(session);
      
    if (!order) {
      console.log(`❌ [PREPARE ROUTE] Order ${req.params.id} not found`);
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    console.log(`✅ [PREPARE ROUTE] Order found: ${order._id}, Status: ${order.status}, Items: ${order.items?.length || 0}`);
    
    // Get user ID from token
    const token = req.cookies["auth_token"];
    let userId = null;
    if (token) {
      try {
        const jwt = (await import("jsonwebtoken")).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded._id;
      } catch (e) {
        // Token invalid, continue without userId
      }
    }
    
    // Check and reserve inventory if not already reserved
    // If order is already confirmed, inventory is already reserved - just check for notifications
    let result;
    let inventoryIssues = [];
    let lowStockProducts = [];
    
    if (!order.inventoryReserved && order.status === "Pending") {
      // Order is pending and inventory not reserved - reserve it now
      result = await checkAndReserveInventory(order, {
        session,
        reason: "Order Preparation",
        userId,
        skipReservation: false
      });
      
      if (!result.success) {
        await session.abortTransaction();
        const issuesText = result.inventoryIssues.map(issue =>
          `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
        ).join("\n");
        
        return res.status(400).json({
          success: false,
          message: "לא ניתן להכין הזמנה - חסר מלאי",
          inventoryIssues: result.inventoryIssues,
          details: issuesText
        });
      }
      
      // Mark inventory as reserved
      order.inventoryReserved = true;
      order.inventoryReservedAt = new Date();
      inventoryIssues = result.inventoryIssues || [];
      lowStockProducts = result.lowStockProducts || [];
    } else if (order.inventoryReserved) {
      // Inventory already reserved - just check current stock levels for notifications
      // Don't actually update inventory, just check for low stock warnings
      const Inventory = (await import("../models/inventory.model.js")).default;
      const Product = (await import("../models/product.model.js")).default;
      
      for (const item of order.items || []) {
        const productId = item.product?._id || item.productId;
        if (!productId) continue;
        
        const inventory = await Inventory.findOne({
          companyId: order.companyId,
          productId: productId
        }).session(session);
        
        if (inventory && inventory.quantity < inventory.minStockLevel) {
          const product = await Product.findById(productId).session(session);
          lowStockProducts.push({
            productName: product?.productName || item.product?.productName || "מוצר לא ידוע",
            currentQuantity: inventory.quantity,
            minStockLevel: inventory.minStockLevel
          });
        }
      }
    }
    
    // Send notifications about inventory issues
    if (inventoryIssues.length > 0) {
      const issuesText = inventoryIssues.map(issue => 
        `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
      ).join("\n");
      
      await notifyAdminsAndManagers({
        companyId: order.companyId,
        title: "⚠️ מלאי חסר להזמנה",
        content: `הזמנה #${order._id.toString().slice(-6)} דורשת מוצרים שאינם במלאי:\n${issuesText}`,
        type: "Warning",
        category: "inventory",
        priority: "high",
        relatedEntity: {
          entityType: "CustomerOrder",
          entityId: order._id.toString()
        },
        actionUrl: `/dashboard/orders/management/${order._id}`,
        actionLabel: "צפה בהזמנה"
      });
    }
    
    // Send notifications about low stock
    if (lowStockProducts.length > 0) {
      const lowStockText = lowStockProducts.map(product => 
        `${product.productName}: כמות נוכחית ${product.currentQuantity}, מינימום ${product.minStockLevel}`
      ).join("\n");
      
      await notifyAdminsAndManagers({
        companyId: order.companyId,
        title: "📉 מלאי נמוך",
        content: `לאחר הכנת הזמנה #${order._id.toString().slice(-6)}, המלאי של המוצרים הבאים נמוך:\n${lowStockText}`,
        type: "Warning",
        category: "inventory",
        priority: "medium",
        relatedEntity: {
          entityType: "CustomerOrder",
          entityId: order._id.toString()
        },
        actionUrl: `/dashboard/orders/management/${order._id}`,
        actionLabel: "צפה בהזמנה"
      });
    }
    
    // Check inventory and create production orders for missing stock
    console.log(`🔍 [PREPARE ROUTE] Starting production order check section...`);
    const productionOrdersCreated = [];
    try {
      console.log(`🏭 [PREPARE] Starting production order check for order ${order._id}`);
      console.log(`🏭 [PREPARE] Order has ${order.items?.length || 0} items`);
      
      for (const orderItem of order.items || []) {
        const productId = orderItem.product?._id || orderItem.productId;
        if (!productId) {
          console.log(`⚠️ [PREPARE] Skipping item - no productId`);
          continue;
        }

        console.log(`🔍 [PREPARE] Checking product ${productId}`);

        // Get product
        const product = await Product.findById(productId).session(session);
        if (!product) {
          console.log(`⚠️ [PREPARE] Product ${productId} not found`);
          continue;
        }

        console.log(`📦 [PREPARE] Product: ${product.productName}, Type: ${product.productType}`);

        // Only check products for sale (sale or both)
        if (product.productType !== "sale" && product.productType !== "both") {
          console.log(`⏭️ [PREPARE] Product ${product.productName} is not for sale (type: ${product.productType}) - skipping`);
          continue;
        }

        // Check inventory for the finished product
        const finishedProductInventory = await Inventory.findOne({
          companyId: order.companyId,
          productId: productId,
        }).session(session);

        const availableQuantity = finishedProductInventory?.quantity || 0;
        const requiredQuantity = orderItem.quantity || 0;

        console.log(`📊 [PREPARE] Product ${product.productName}: Required ${requiredQuantity}, Available ${availableQuantity}`);
        console.log(`📊 [PREPARE] Inventory record exists: ${!!finishedProductInventory}, Inventory ID: ${finishedProductInventory?._id || 'N/A'}`);

        // Always check if we need to produce (even if we have some stock)
        // Calculate how many we need to produce
        let quantityToProduce = 0;
        
        if (availableQuantity < requiredQuantity) {
          quantityToProduce = requiredQuantity - availableQuantity;
          console.log(`🔨 [PREPARE] Need to produce ${quantityToProduce} units of ${product.productName} (Available: ${availableQuantity}, Required: ${requiredQuantity})`);
        } else {
          console.log(`✅ [PREPARE] Product ${product.productName} has enough stock (${availableQuantity} >= ${requiredQuantity}) - skipping production`);
          continue;
        }

        // Check if product has a BOM (Bill of Materials)
        const bom = await productTree
          .findOne({ productId: productId, companyId: order.companyId })
          .session(session);

        if (!bom || !bom.components || bom.components.length === 0) {
          // Product doesn't need manufacturing - skip
          console.log(
            `⚠️ [PREPARE] Product ${product.productName} has no BOM - skipping production order`
          );
          continue;
        }

        console.log(`✅ [PREPARE] Product ${product.productName} has BOM with ${bom.components.length} components`);

        // Import helper function for checking component availability
        const { checkComponentAvailability } = await import("../controllers/ProductionOrder.controller.js");
        
        if (!checkComponentAvailability) {
          console.error(`❌ [PREPARE] checkComponentAvailability function not found`);
          continue;
        }
        
        let availabilityCheck = null;
        let productionOrder = null;
        
        try {
          // Check component availability
          console.log(`🔍 [PREPARE] Checking component availability for ${quantityToProduce} units...`);
          availabilityCheck = await checkComponentAvailability(
            bom,
            quantityToProduce,
            order.companyId,
            session
          );

          console.log(`📋 [PREPARE] Availability check result:`, {
            componentsCount: availabilityCheck.components?.length || 0,
            missingComponentsCount: availabilityCheck.missingComponents?.length || 0,
            allComponentsAvailable: availabilityCheck.allComponentsAvailable,
            estimatedCost: availabilityCheck.totalEstimatedCost
          });

          // Create production order for the missing quantity
          console.log(`🏭 [PREPARE] Creating production order for ${quantityToProduce} units of ${product.productName}...`);
          productionOrder = new ProductionOrder({
            companyId: order.companyId,
            productId: productId,
            productName: product.productName,
            quantity: quantityToProduce,
            bomId: bom._id,
            customerOrderId: order._id,
            dueDate: order.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
            components: availabilityCheck.components,
            missingComponents: availabilityCheck.missingComponents,
            estimatedCost: availabilityCheck.totalEstimatedCost,
            priority: availabilityCheck.allComponentsAvailable ? "high" : "urgent",
            status: availabilityCheck.allComponentsAvailable ? "Pending" : "On Hold",
            notes: `נוצר אוטומטית מהזמנה #${order._id.toString().slice(-6)} - הפרש חסר במלאי (${quantityToProduce} יחידות)`,
          });

          console.log(`💾 [PREPARE] Saving production order to database...`);
          await productionOrder.save({ session });
          console.log(`✅ [PREPARE] Production order saved with ID: ${productionOrder._id}, Order Number: ${productionOrder.orderNumber}`);
          
          productionOrdersCreated.push(productionOrder);

          console.log(
            `✅ [PREPARE] Created production order ${productionOrder.orderNumber} for ${quantityToProduce} units of ${product.productName} (missing from inventory)`
          );

          // Create notifications for missing components
          if (availabilityCheck && availabilityCheck.missingComponents && availabilityCheck.missingComponents.length > 0 && productionOrder) {
            const missingText = availabilityCheck.missingComponents
              .map(
                (comp) =>
                  `${comp.componentName}: נדרש ${comp.required}, זמין ${comp.available}, חסר ${comp.missing}`
              )
              .join("\n");

            await notifyAdminsAndManagers({
              companyId: order.companyId,
              title: "⚠️ מלאי חסר לייצור",
              content: `הזמנת ייצור ${productionOrder.orderNumber} דורשת רכיבים חסרים:\n${missingText}`,
              type: "Warning",
              category: "inventory",
              priority: "high",
              relatedEntity: {
                entityType: "ProductionOrder",
                entityId: productionOrder._id.toString(),
              },
              actionUrl: `/dashboard/production/${productionOrder._id}`,
              actionLabel: "צפה בהזמנת ייצור",
            });
          }
        } catch (itemError) {
          console.error(`❌ [PREPARE] Error creating production order for product ${product.productName}:`, itemError);
          console.error(`❌ [PREPARE] Error details:`, {
            message: itemError.message,
            stack: itemError.stack,
            productId: productId.toString(),
            quantityToProduce
          });
          // Continue with next item even if this one fails
        }
      }

      if (productionOrdersCreated.length > 0) {
        console.log(
          `✅ [PREPARE] Created ${productionOrdersCreated.length} production order(s) for missing inventory in order ${order._id}`
        );

        // Notify about production orders created
        await notifyAdminsAndManagers({
          companyId: order.companyId,
          title: "🏭 הזמנות ייצור נוצרו אוטומטית",
          content: `נוצרו ${productionOrdersCreated.length} הזמנות ייצור עבור ההפרש החסר במלאי בהזמנה #${order._id.toString().slice(-6)}`,
          type: "Info",
          category: "production",
          priority: "medium",
          relatedEntity: {
            entityType: "CustomerOrder",
            entityId: order._id.toString(),
          },
          actionUrl: `/dashboard/production`,
          actionLabel: "צפה בהזמנות ייצור",
        });
      } else {
        console.log(`ℹ️ [PREPARE] No production orders created for order ${order._id} - all products have sufficient stock or no BOM`);
      }
    } catch (productionError) {
      console.error("❌ [PREPARE] Error creating production orders for missing inventory:", productionError);
      console.error("❌ [PREPARE] Error stack:", productionError.stack);
      // Continue even if production order creation fails
    }
    
    // Update order status
    order.preparationStatus = "In Progress";
    order.preparationDate = new Date();
    // Update status to Confirmed if still Pending
    if (order.status === "Pending") {
      order.status = "Confirmed";
      order.confirmedAt = new Date();
    }
    await order.save({ session });
    
    // Send notifications to Admins & Managers about preparation
    try {
      await notifyAdminsAndManagers({
        companyId: order.companyId,
        title: "📦 הזמנה מוכנה להכנה",
        content: `הזמנה #${order._id.toString().slice(-6)} של ${order.customer?.name || "לקוח"} מוכנה להכנה למשלוח${inventoryIssues.length > 0 ? " (יש בעיות מלאי)" : ""}`,
        type: inventoryIssues.length > 0 ? "Warning" : "Info",
        category: "customers",
        priority: inventoryIssues.length > 0 ? "high" : "medium",
        relatedEntity: {
          entityType: "CustomerOrder",
          entityId: order._id.toString()
        },
        actionUrl: `/dashboard/orders/management/${order._id}`,
        actionLabel: "צפה בהזמנה",
        metadata: {
          orderId: order._id.toString(),
          customerName: order.customer?.name,
          orderTotal: order.orderTotal,
          hasInventoryIssues: inventoryIssues.length > 0
        }
      });
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
      // Continue even if notifications fail
    }
    
    // Create automatic task
    try {
      const itemsDescription = order.items?.map(item => 
        `• ${item.product?.productName || item.productName || "מוצר"} - כמות: ${item.quantity}`
      ).join("\n") || "אין פרטי מוצרים";
      
      // Find departments and employees for the company
      const Department = (await import("../models/department.model.js")).default;
      const departments = await Department.find({ companyId: order.companyId }).limit(1);
      const departmentId = departments.length > 0 ? departments[0]._id : null;
      
      // Find Admins and Managers to assign to the task
      const adminsAndManagers = await Employee.find({
        companyId: order.companyId,
        role: { $in: ["Admin", "Manager"] },
        status: "active"
      }).limit(5); // Limit to 5 employees to avoid too many assignments
      
      const assignedTo = adminsAndManagers.map(emp => emp._id);
      
      // Build description with warnings if missing department or employees
      let description = `הזמנה של ${order.customer?.name || "לקוח"}\n\nמוצרים להכנה:\n${itemsDescription}\n\nסכום כולל: ${order.orderTotal} ${order.currency || "USD"}`;
      
      if (inventoryIssues.length > 0) {
        description += `\n\n⚠️ בעיות מלאי: ${inventoryIssues.length} מוצרים חסרים`;
      }
      
      if (!departmentId) {
        description += `\n\n⚠️ שים לב: לא נמצאה מחלקה בחברה. יש להקצות מחלקה למשימה זו.`;
      }
      
      if (assignedTo.length === 0) {
        description += `\n\n⚠️ שים לב: לא נמצאו מנהלים או אדמינים להקצות למשימה. יש להקצות עובדים למשימה זו.`;
      }
      
      const task = await Task.create({
        companyId: order.companyId,
        departmentId: departmentId, // Assign first department if exists
        title: `הכן הזמנה #${order._id.toString().slice(-6)} למשלוח`,
        description: description,
        status: "pending",
        priority: inventoryIssues.length > 0 ? "high" : "medium",
        dueDate: order.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now if no delivery date
        assignedTo: assignedTo, // Assign Admins and Managers if available
        orderId: order._id,
        orderItems: order.items?.map(item => ({
          productId: item.product?._id || item.productId,
          productName: item.product?.productName || item.productName || "מוצר",
          quantity: item.quantity
        })) || []
      });
      
      console.log(`✅ Created task ${task._id} for order ${order._id}`);
      if (!departmentId) {
        console.log(`⚠️ Task created without department - needs manual assignment`);
      }
      if (assignedTo.length === 0) {
        console.log(`⚠️ Task created without assigned employees - needs manual assignment`);
      }
    } catch (taskError) {
      console.error("Error creating task:", taskError);
      // Continue even if task creation fails
    }
    
    await session.commitTransaction();
    
    res.json({ 
      success: true, 
      data: order,
      productionOrdersCreated: productionOrdersCreated.length,
      productionOrderDetails: productionOrdersCreated.map(po => ({
        orderNumber: po.orderNumber,
        productName: po.productName,
        quantity: po.quantity,
        status: po.status,
        id: po._id.toString()
      })),
      inventoryIssues: inventoryIssues.length > 0 ? inventoryIssues : undefined,
      lowStockProducts: lowStockProducts.length > 0 ? lowStockProducts : undefined
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error preparing order:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
