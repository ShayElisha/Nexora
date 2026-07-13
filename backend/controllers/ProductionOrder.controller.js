import ProductionOrder from "../models/ProductionOrder.model.js";
import Product from "../models/product.model.js";
import productTree from "../models/productTree.model.js";
import Inventory from "../models/inventory.model.js";
import InventoryMovement from "../models/InventoryMovement.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Notification from "../models/notification.model.js";
import Employee from "../models/employees.model.js";
import InventoryHistory from "../models/InventoryHistory.model.js";
import Procurement from "../models/procurement.model.js";
import Supplier from "../models/suppliers.model.js";
import Task from "../models/tasks.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { notifyAdminsAndManagers } from "./notification.controller.js";

// Helper function to format address string
const formatAddressString = (address) => {
  if (!address || typeof address !== "object") return "";
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
    address.zipCode,
  ].filter(Boolean);
  return parts.join(", ");
};

/**
 * Check component availability and calculate missing components
 */
export const checkComponentAvailability = async (bom, quantity, companyId, session = null) => {
  const components = [];
  const missingComponents = [];
  let totalEstimatedCost = 0;

  for (const bomComponent of bom.components || []) {
    const componentId = bomComponent.componentId;
    const requiredQuantity = (bomComponent.quantity || 0) * quantity;

    // Get inventory for this component
    const inventory = await Inventory.findOne({
      companyId,
      productId: componentId,
    }).session(session || null);

    const availableQuantity = inventory?.quantity || 0;
    const unitCost = bomComponent.unitCost || 0;
    const componentCost = requiredQuantity * unitCost;
    totalEstimatedCost += componentCost;

    // Get product name
    const product = await Product.findById(componentId).session(session || null);
    const componentName = product?.productName || "Unknown Component";

    let status = "Available";
    if (availableQuantity < requiredQuantity) {
      status = availableQuantity > 0 ? "Partial" : "Unavailable";
      missingComponents.push({
        componentId,
        componentName,
        required: requiredQuantity,
        available: availableQuantity,
        missing: requiredQuantity - availableQuantity,
      });
    }

    components.push({
      componentId,
      componentName,
      requiredQuantity,
      availableQuantity,
      reservedQuantity: 0,
      status,
      unitCost,
    });
  }

  return {
    components,
    missingComponents,
    totalEstimatedCost,
    allComponentsAvailable: missingComponents.length === 0,
  };
};

/**
 * Create production order from customer order
 */
export const createProductionOrderFromCustomerOrder = async (
  customerOrder,
  session = null
) => {
  try {
    console.log(
      `🏭 Creating production orders for customer order: ${customerOrder._id}`
    );
    console.log(`🏭 Order companyId: ${customerOrder.companyId}`);
    console.log(`🏭 Order items count: ${customerOrder.items?.length || 0}`);

    if (!customerOrder.companyId) {
      throw new Error("Customer order must have a companyId");
    }

    const productionOrders = [];

    // Check each item in the customer order
    for (const orderItem of customerOrder.items || []) {
      try {
        const productId = orderItem.product?._id || orderItem.productId;
        if (!productId) {
          console.log(`⚠️ Skipping item - no productId found`);
          continue;
        }
        
        console.log(`🔍 Processing item with productId: ${productId}`);

        // Check if product has a BOM (Bill of Materials)
        const bom = await productTree
          .findOne({ productId: productId, companyId: customerOrder.companyId })
          .session(session || null);

        if (!bom || !bom.components || bom.components.length === 0) {
          // Product doesn't need manufacturing - skip
          console.log(
            `ℹ️ Product ${productId} has no BOM - skipping production order`
          );
          continue;
        }

        // Get product details
        const product = await Product.findById(productId).session(session || null);
        if (!product) {
          console.log(`⚠️ Product ${productId} not found - skipping`);
          continue;
        }

        // Only create production orders for products that are for sale (sale or both)
        if (product.productType !== "sale" && product.productType !== "both") {
          console.log(
            `ℹ️ Product ${product.productName} is not for sale (productType: ${product.productType}) - skipping production order`
          );
          continue;
        }

        // Check inventory for the finished product
        const finishedProductInventory = await Inventory.findOne({
          companyId: customerOrder.companyId,
          productId: productId,
        }).session(session || null);

        const availableQuantity = finishedProductInventory?.quantity || 0;
        const requiredQuantity = orderItem.quantity || 0;

        // If we have enough in stock, no need to produce
        if (availableQuantity >= requiredQuantity) {
          console.log(
            `✅ Product ${product.productName} has enough stock (${availableQuantity} >= ${requiredQuantity}) - skipping production`
          );
          continue;
        }

        // Calculate how many we need to produce
        const quantityToProduce = requiredQuantity - availableQuantity;

        // Check component availability
        const availabilityCheck = await checkComponentAvailability(
          bom,
          quantityToProduce,
          customerOrder.companyId,
          session
        );

        // Create production order
        const productionOrder = new ProductionOrder({
          companyId: customerOrder.companyId,
          productId: productId,
          productName: product.productName,
          quantity: quantityToProduce,
          bomId: bom._id,
          customerOrderId: customerOrder._id,
          dueDate: customerOrder.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
          components: availabilityCheck.components,
          missingComponents: availabilityCheck.missingComponents,
          estimatedCost: availabilityCheck.totalEstimatedCost,
          priority: availabilityCheck.allComponentsAvailable ? "high" : "urgent",
          status: availabilityCheck.allComponentsAvailable ? "Pending" : "On Hold",
          notes: `Created automatically from customer order #${customerOrder._id.toString().slice(-6)}`,
        });

        console.log(`💾 Saving production order for product ${product.productName}...`);
        await productionOrder.save({ session });
        console.log(`✅ Production order saved: ${productionOrder.orderNumber}`);

        productionOrders.push(productionOrder);

        console.log(
          `✅ Created production order ${productionOrder.orderNumber} for ${quantityToProduce} units of ${product.productName}`
        );

        // Create notifications for missing components
        if (availabilityCheck.missingComponents.length > 0) {
          const missingText = availabilityCheck.missingComponents
            .map(
              (comp) =>
                `${comp.componentName}: נדרש ${comp.required}, זמין ${comp.available}, חסר ${comp.missing}`
            )
            .join("\n");

          await notifyAdminsAndManagers({
            companyId: customerOrder.companyId,
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
        console.error(`❌ Error processing order item:`, itemError);
        console.error(`❌ Item error details:`, {
          productId: orderItem.product?._id || orderItem.productId,
          error: itemError.message,
          stack: itemError.stack
        });
        // Continue with next item even if this one fails
      }
    }

    console.log(`✅ Successfully created ${productionOrders.length} production order(s)`);
    return productionOrders;
  } catch (error) {
    console.error("❌ Error creating production orders from customer order:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Get all production orders
 */
export const getProductionOrders = async (req, res) => {
  try {
    // Use decoded token from middleware (protectRoute sets req.decoded)
    const decodedToken = req.decoded || req.user;
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from userId or user object
    if (!companyId) {
      if (decodedToken.userId) {
        const Employee = (await import("../models/employees.model.js")).default;
        const user = await Employee.findById(decodedToken.userId);
        if (user) {
          companyId = user.companyId || user.company;
          console.log(`🔍 [GET PROD ORDERS] Got companyId from user: ${companyId}`);
        }
      } else if (req.user && req.user.companyId) {
        companyId = req.user.companyId;
        console.log(`🔍 [GET PROD ORDERS] Got companyId from req.user: ${companyId}`);
      }
    }

    if (!companyId) {
      console.error(`❌ [GET PROD ORDERS] No companyId found in token or user`);
      return res.status(400).json({ 
        success: false, 
        message: "Company ID not found" 
      });
    }

    const { status, priority, search } = req.query;

    let query = { companyId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    console.log(`🔍 [GET PROD ORDERS] Query:`, JSON.stringify(query, null, 2));
    console.log(`🔍 [GET PROD ORDERS] CompanyId: ${companyId}`);

    // First, check total count without filters
    const totalCount = await ProductionOrder.countDocuments({ companyId });
    console.log(`📊 [GET PROD ORDERS] Total production orders for company: ${totalCount}`);

    const orders = await ProductionOrder.find(query)
      .populate("productId", "productName sku")
      .populate("customerOrderId", "orderDate orderTotal")
      .populate("assignedTo", "name lastName email")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    console.log(`✅ [GET PROD ORDERS] Found ${orders.length} production orders matching query`);

    // Filter by search term if provided
    let filteredOrders = orders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = orders.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.productName?.toLowerCase().includes(searchLower) ||
          (order.customerOrderId?._id?.toString().includes(searchLower))
      );
      console.log(`🔍 [GET PROD ORDERS] After search filter: ${filteredOrders.length} orders`);
    }

    // Log first few orders for debugging
    if (filteredOrders.length > 0) {
      console.log(`📋 [GET PROD ORDERS] First order:`, {
        id: filteredOrders[0]._id.toString(),
        orderNumber: filteredOrders[0].orderNumber,
        productName: filteredOrders[0].productName,
        status: filteredOrders[0].status,
        priority: filteredOrders[0].priority,
        companyId: filteredOrders[0].companyId?.toString(),
      });
    } else if (totalCount > 0) {
      // If we have orders but they don't match the query, log why
      const allOrders = await ProductionOrder.find({ companyId }).limit(5);
      console.log(`⚠️ [GET PROD ORDERS] Found ${totalCount} orders but none match query. Sample orders:`, 
        allOrders.map(o => ({
          id: o._id.toString(),
          orderNumber: o.orderNumber,
          status: o.status,
          priority: o.priority,
          companyId: o.companyId?.toString(),
        }))
      );
    }

    res.status(200).json({ success: true, data: filteredOrders });
  } catch (error) {
    console.error("❌ [GET PROD ORDERS] Error fetching production orders:", error);
    console.error("❌ [GET PROD ORDERS] Error stack:", error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get production order by ID
 */
export const getProductionOrderById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("productId", "productName sku productDescription")
      .populate("customerOrderId")
      .populate("assignedTo", "name lastName email")
      .populate("departmentId", "name")
      .populate("components.componentId", "productName sku unitPrice")
      .populate("missingComponents.componentId", "productName sku");

    if (!order) {
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching production order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create production order manually
 */
export const createProductionOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { productId, quantity, dueDate, priority, notes, customerOrderId, departmentId, assignedTo } = req.body;

    // Get product
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Only allow production orders for products that are for sale (sale or both)
    if (product.productType !== "sale" && product.productType !== "both") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot create production order for a product that is not for sale. Product type must be 'sale' or 'both'.",
      });
    }

    // Get BOM
    const bom = await productTree
      .findOne({ productId, companyId })
      .session(session);

    if (!bom || !bom.components || bom.components.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Product has no Bill of Materials (BOM). Cannot create production order.",
      });
    }

    // Check component availability
    const availabilityCheck = await checkComponentAvailability(
      bom,
      quantity,
      companyId,
      session
    );

    // Create production order
    const productionOrder = new ProductionOrder({
      companyId,
      productId,
      productName: product.productName,
      quantity,
      bomId: bom._id,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: priority || "medium",
      notes,
      customerOrderId,
      departmentId,
      assignedTo: assignedTo || [],
      components: availabilityCheck.components,
      missingComponents: availabilityCheck.missingComponents,
      estimatedCost: availabilityCheck.totalEstimatedCost,
      status: availabilityCheck.allComponentsAvailable ? "Pending" : "On Hold",
    });

    await productionOrder.save({ session });

    await session.commitTransaction();

    // Populate before returning
    await productionOrder.populate([
      { path: "productId", select: "productName sku" },
      { path: "customerOrderId", select: "orderDate orderTotal" },
      { path: "assignedTo", select: "name lastName email" },
      { path: "departmentId", select: "name" },
    ]);

    res.status(201).json({ success: true, data: productionOrder });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating production order:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Update production order status
 */
export const updateProductionOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { status } = req.body;
    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    const oldStatus = order.status;

    // Handle status transitions
    if (status === "In Progress" && oldStatus === "Pending") {
      // Check if there are missing components - prevent start if critical components are missing
      if (order.missingComponents && order.missingComponents.length > 0) {
        const criticalMissing = order.missingComponents.filter(
          (missing) => (missing.missing || 0) > 0
        );
        
        if (criticalMissing.length > 0) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `לא ניתן להתחיל ייצור - יש ${criticalMissing.length} רכיבים חסרים. אנא צור הזמנת רכש או בדוק זמינות מחדש.`,
            missingComponents: criticalMissing.map((m) => ({
              componentName: m.componentName,
              missing: m.missing,
            })),
          });
        }
      }

      // Re-check component availability before starting
      const availabilityCheck = await checkComponentAvailability(
        order.bomId ? await productTree.findById(order.bomId).session(session) : null,
        order.quantity,
        companyId,
        session
      );

      if (!availabilityCheck.allComponentsAvailable) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "לא ניתן להתחיל ייצור - לא כל הרכיבים זמינים במלאי",
          missingComponents: availabilityCheck.missingComponents,
        });
      }

      // Reserve components from inventory
      if (!order.inventoryReserved) {
        for (const component of order.components || []) {
          if (!component.componentId) {
            console.warn(`⚠️ Component missing componentId, skipping`);
            continue;
          }
          
          const inventory = await Inventory.findOne({
            companyId,
            productId: component.componentId,
          }).session(session);

          if (inventory) {
            const reservedQty = Math.min(
              component.requiredQuantity || 0,
              inventory.quantity
            );

            if (reservedQty > 0) {
              inventory.quantity -= reservedQty;
              await inventory.save({ session });

              // Update component reserved quantity
              component.reservedQuantity = reservedQty;
              component.availableQuantity = inventory.quantity;
              
              // Mark the components array as modified so Mongoose saves the changes
              order.markModified('components');

              // Get product name for inventory history
              let componentName = component.componentName || "Unknown Component";
              try {
                const componentProduct = await Product.findById(component.componentId).session(session);
                if (componentProduct) {
                  componentName = componentProduct.productName || componentName;
                }
              } catch (productError) {
                console.warn(`⚠️ Error fetching product ${component.componentId}:`, productError.message);
              }

              // Create inventory history
              try {
                const historyEntry = new InventoryHistory({
                  companyId,
                  productId: component.componentId,
                  productName: componentName,
                  oldQuantity: inventory.quantity + reservedQty,
                  newQuantity: inventory.quantity,
                  changeAmount: -reservedQty,
                  reason: "Stock Adjustment",
                  notes: `Production Order ${order.orderNumber} - Component Reserved`,
                  orderId: order._id.toString(),
                  timestamp: new Date(),
                });
                await historyEntry.save({ session });
              } catch (historyError) {
                console.error(`❌ Error creating inventory history for component ${component.componentId}:`, historyError);
                throw historyError; // Re-throw to trigger transaction rollback
              }

              // Create InventoryMovement for component withdrawal
              try {
                const movementNumber = `MOV-PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const movement = new InventoryMovement({
                  companyId,
                  movementNumber,
                  movementType: "Production",
                  movementDate: new Date(),
                  productId: component.componentId,
                  inventoryId: inventory._id,
                  productName: componentName,
                  quantity: -reservedQty, // שלילי = יציאה
                  unitCost: component.unitCost || 0,
                  totalCost: (component.unitCost || 0) * reservedQty,
                  fromWarehouseId: inventory.warehouseId,
                  sourceDocument: {
                    type: "ProductionOrder",
                    documentId: order._id,
                    documentNumber: order.orderNumber,
                  },
                  productionOrderId: order._id,
                  description: `Component withdrawal for Production Order ${order.orderNumber}`,
                  status: "Completed",
                  performedBy: decodedToken.employeeId || decodedToken.userId,
                });
                await movement.save({ session });

                // Add to ProductionOrder inventoryMovements
                if (!order.inventoryMovements) {
                  order.inventoryMovements = [];
                }
                order.inventoryMovements.push({
                  movementId: movement._id,
                  componentId: component.componentId,
                  componentName: componentName,
                  quantity: reservedQty,
                  movementDate: new Date(),
                  movementType: "Component Withdrawal",
                });
                order.markModified('inventoryMovements');
              } catch (movementError) {
                console.error(`❌ Error creating inventory movement for component ${component.componentId}:`, movementError);
                // Don't throw - we don't want to fail the whole operation if movement creation fails
              }
            }
          }
        }

        order.inventoryReserved = true;
        order.inventoryReservedAt = new Date();
        order.startDate = new Date();
      }

      // Update order status
      order.status = "In Progress";

      // Log who started the production
      const startedBy = decodedToken.employeeId || decodedToken.userId || "System";
      if (!order.notes) {
        order.notes = "";
      }
      order.notes += `\n[${new Date().toLocaleString("he-IL")}] ייצור התחיל על ידי: ${startedBy}`;

      // Update customer order status if linked
      if (order.customerOrderId) {
        try {
          const customerOrder = await CustomerOrder.findById(order.customerOrderId).session(session);
          if (customerOrder && customerOrder.status !== "In Production" && customerOrder.status !== "Shipped" && customerOrder.status !== "Delivered") {
            customerOrder.status = "In Production";
            await customerOrder.save({ session });
            console.log(`✅ Updated customer order ${customerOrder._id} status to In Production`);
          }
        } catch (customerOrderError) {
          console.error(`⚠️ Error updating customer order status:`, customerOrderError);
          // Don't fail the whole operation if customer order update fails
        }
      }

      // Create tasks for assigned employees
      if (order.assignedTo && order.assignedTo.length > 0) {
        try {
          for (const employeeId of order.assignedTo) {
            const task = new Task({
              companyId,
              departmentId: order.departmentId || null,
              title: `התחל ייצור - ${order.productName}`,
              description: `הזמנת ייצור ${order.orderNumber} - כמות: ${order.quantity} יחידות\nתאריך יעד: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString("he-IL") : "לא צוין"}`,
              status: "in progress",
              priority: order.priority === "urgent" ? "high" : order.priority || "medium",
              dueDate: order.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              startDate: new Date(),
              assignedTo: [employeeId],
            });
            await task.save({ session });
            console.log(`✅ Created task ${task._id} for employee ${employeeId}`);
          }
        } catch (taskError) {
          console.error(`⚠️ Error creating tasks for assigned employees:`, taskError);
          // Don't fail the whole operation if task creation fails
        }
      }

      // Send notifications
      try {
        // Notify admins and managers
        await notifyAdminsAndManagers({
          companyId,
          title: "🏭 ייצור התחיל",
          content: `הזמנת ייצור ${order.orderNumber} (${order.productName}) התחילה. כמות: ${order.quantity} יחידות`,
          type: "Info",
          category: "production",
          priority: "medium",
          relatedEntity: {
            entityType: "ProductionOrder",
            entityId: order._id.toString(),
          },
          actionUrl: `/dashboard/production/${order._id}`,
          actionLabel: "צפה בהזמנה",
        });

        // Notify assigned employees
        if (order.assignedTo && order.assignedTo.length > 0) {
          for (const employeeId of order.assignedTo) {
            try {
              const employee = await Employee.findById(employeeId).session(session);
              if (employee && employee.userId) {
                await Notification.create({
                  companyId,
                  userId: employee.userId,
                  title: "📋 הוקצית להזמנת ייצור",
                  content: `הוקצית להזמנת ייצור ${order.orderNumber} (${order.productName}). כמות: ${order.quantity} יחידות`,
                  type: "Info",
                  category: "production",
                  priority: "medium",
                  relatedEntity: {
                    entityType: "ProductionOrder",
                    entityId: order._id.toString(),
                  },
                  actionUrl: `/dashboard/production/${order._id}`,
                  actionLabel: "צפה בהזמנה",
                });
              }
            } catch (employeeNotifError) {
              console.error(`⚠️ Error notifying employee ${employeeId}:`, employeeNotifError);
            }
          }
        }
      } catch (notifError) {
        console.error(`⚠️ Error sending notifications:`, notifError);
        // Don't fail the whole operation if notifications fail
      }
    } else if (status === "Completed" && oldStatus !== "Completed") {
      // Add finished product to inventory
      const finishedProductInventory = await Inventory.findOne({
        companyId,
        productId: order.productId,
      }).session(session);

      if (finishedProductInventory) {
        finishedProductInventory.quantity += order.quantity;
        await finishedProductInventory.save({ session });

        // Get product name for inventory history
        let productName = order.productName || "Unknown Product";
        try {
          const finishedProduct = await Product.findById(order.productId).session(session);
          if (finishedProduct) {
            productName = finishedProduct.productName || productName;
          }
        } catch (productError) {
          console.warn(`⚠️ Error fetching product ${order.productId}:`, productError.message);
        }

        // Create inventory history
        try {
          const historyEntry = new InventoryHistory({
            companyId,
            productId: order.productId,
            productName: productName,
            oldQuantity: finishedProductInventory.quantity - order.quantity,
            newQuantity: finishedProductInventory.quantity,
            changeAmount: order.quantity,
            reason: "Stock Adjustment",
            notes: `Production Order ${order.orderNumber} - Finished Product Added`,
            orderId: order._id.toString(),
            timestamp: new Date(),
          });
          await historyEntry.save({ session });
        } catch (historyError) {
          console.error(`❌ Error creating inventory history:`, historyError);
          throw historyError; // Re-throw to trigger transaction rollback
        }

        // Create InventoryMovement for finished product completion
        try {
          const movementNumber = `MOV-PROD-COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const movement = new InventoryMovement({
            companyId,
            movementNumber,
            movementType: "Production",
            movementDate: new Date(),
            productId: order.productId,
            inventoryId: finishedProductInventory._id,
            productName: productName,
            quantity: order.quantity, // חיובי = כניסה
            unitCost: order.actualCost / order.quantity || 0,
            totalCost: order.actualCost || 0,
            toWarehouseId: finishedProductInventory.warehouseId,
            sourceDocument: {
              type: "ProductionOrder",
              documentId: order._id,
              documentNumber: order.orderNumber,
            },
            productionOrderId: order._id,
            description: `Finished product completion for Production Order ${order.orderNumber}`,
            status: "Completed",
            performedBy: decodedToken.employeeId || decodedToken.userId,
          });
          await movement.save({ session });

          // Add to ProductionOrder inventoryMovements
          if (!order.inventoryMovements) {
            order.inventoryMovements = [];
          }
          order.inventoryMovements.push({
            movementId: movement._id,
            componentId: order.productId,
            componentName: productName,
            quantity: order.quantity,
            movementDate: new Date(),
            movementType: "Product Completion",
          });
          order.markModified('inventoryMovements');
        } catch (movementError) {
          console.error(`❌ Error creating inventory movement for finished product:`, movementError);
          // Don't throw - we don't want to fail the whole operation if movement creation fails
        }
      } else {
        // Create new inventory entry
        const newInventory = new Inventory({
          companyId,
          productId: order.productId,
          quantity: order.quantity,
          minStockLevel: 10,
          reorderQuantity: 20,
        });
        await newInventory.save({ session });

        // Get product name for inventory history
        let productName = order.productName || "Unknown Product";
        try {
          const finishedProduct = await Product.findById(order.productId).session(session);
          if (finishedProduct) {
            productName = finishedProduct.productName || productName;
          }
        } catch (productError) {
          console.warn(`⚠️ Error fetching product ${order.productId}:`, productError.message);
        }

        try {
          const historyEntry = new InventoryHistory({
            companyId,
            productId: order.productId,
            productName: productName,
            oldQuantity: 0,
            newQuantity: order.quantity,
            changeAmount: order.quantity,
            reason: "Stock Adjustment",
            notes: `Production Order ${order.orderNumber} - Finished Product Added`,
            orderId: order._id.toString(),
            timestamp: new Date(),
          });
          await historyEntry.save({ session });
        } catch (historyError) {
          console.error(`❌ Error creating inventory history:`, historyError);
          throw historyError; // Re-throw to trigger transaction rollback
        }
      }

      order.completedDate = new Date();

      // Update customer order status if linked - check if all production orders are completed
      if (order.customerOrderId) {
        try {
          const customerOrder = await CustomerOrder.findById(order.customerOrderId).session(session);
          
          if (customerOrder) {
            // Check if all production orders for this customer order are completed
            const allProductionOrders = await ProductionOrder.find({
              customerOrderId: order.customerOrderId,
              companyId: companyId
            }).session(session);

            const allCompleted = allProductionOrders.every(po => po.status === "Completed");
            
            if (allCompleted && customerOrder.preparationStatus !== "Ready to Ship") {
              console.log(`✅ [PROD ORDER] All production orders completed for customer order ${customerOrder._id}, updating status to Ready to Ship`);
              customerOrder.preparationStatus = "Ready to Ship";
              await customerOrder.save({ session });
              
              // Send notification
              await notifyAdminsAndManagers({
                companyId: companyId,
                title: "✅ הזמנה מוכנה למשלוח",
                content: `כל הזמנות הייצור עבור הזמנה #${customerOrder._id.toString().slice(-6)} הושלמו. ההזמנה מוכנה למשלוח.`,
                type: "Success",
                category: "customers",
                priority: "medium",
                relatedEntity: {
                  entityType: "CustomerOrder",
                  entityId: customerOrder._id.toString()
                },
                actionUrl: `/dashboard/orders/management/${customerOrder._id}`,
                actionLabel: "צפה בהזמנה"
              });
            } else if (!allCompleted) {
              console.log(`ℹ️ [PROD ORDER] Not all production orders completed yet (${allProductionOrders.filter(po => po.status === "Completed").length}/${allProductionOrders.length})`);
            }
          }
        } catch (customerOrderError) {
          console.error(`❌ Error updating customer order status:`, customerOrderError);
          // Don't throw - we don't want to fail the production order completion if this fails
        }
      }
    }

    // Only update status if it's not already set (for In Progress we set it earlier)
    if (status !== "In Progress" || oldStatus === "In Progress") {
      order.status = status;
    }
    await order.save({ session });

    await session.commitTransaction();

    // Return detailed response for In Progress status
    if (status === "In Progress" && oldStatus === "Pending") {
      return res.status(200).json({
        success: true,
        message: "ייצור התחיל בהצלחה",
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            startDate: order.startDate,
            inventoryReserved: order.inventoryReserved,
          },
          componentsReserved: order.components?.filter(c => c.reservedQuantity > 0).length || 0,
          tasksCreated: order.assignedTo?.length || 0,
          notificationsSent: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating production order status:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Update production order
 */
export const updateProductionOrder = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    // Update allowed fields
    const allowedUpdates = [
      "quantity",
      "dueDate",
      "priority",
      "notes",
      "assignedTo",
      "departmentId",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    // If quantity changed, recalculate components
    if (req.body.quantity && req.body.quantity !== order.quantity) {
      const bom = await productTree.findOne({
        productId: order.productId,
        companyId,
      });

      if (bom) {
        const availabilityCheck = await checkComponentAvailability(
          bom,
          req.body.quantity,
          companyId
        );

        order.components = availabilityCheck.components;
        order.missingComponents = availabilityCheck.missingComponents;
        order.estimatedCost = availabilityCheck.totalEstimatedCost;
      }
    }

    await order.save();

    await order.populate([
      { path: "productId", select: "productName sku" },
      { path: "customerOrderId", select: "orderDate orderTotal" },
      { path: "assignedTo", select: "name lastName email" },
      { path: "departmentId", select: "name" },
    ]);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error updating production order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete production order
 */
export const deleteProductionOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    // If order is in progress, release reserved components
    if (order.status === "In Progress" && order.inventoryReserved) {
      for (const component of order.components) {
        if (component.reservedQuantity > 0) {
          const inventory = await Inventory.findOne({
            companyId,
            productId: component.componentId,
          }).session(session);

          if (inventory) {
            inventory.quantity += component.reservedQuantity;
            await inventory.save({ session });
          }
        }
      }
    }

    await ProductionOrder.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();

    res.status(200).json({ success: true, message: "Production order deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting production order:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Recheck component availability for a production order
 */
export const recheckAvailability = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("bomId")
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    if (!order.bomId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Production order has no BOM" });
    }

    // Recheck availability
    const availabilityCheck = await checkComponentAvailability(
      order.bomId,
      order.quantity,
      companyId,
      session
    );

    // Update order with new availability data
    order.components = availabilityCheck.components;
    order.missingComponents = availabilityCheck.missingComponents;
    order.estimatedCost = availabilityCheck.totalEstimatedCost;

    // Update status based on availability
    if (availabilityCheck.allComponentsAvailable) {
      if (order.status === "On Hold") {
        order.status = "Pending";
        order.priority = order.priority === "urgent" ? "high" : order.priority;
      }
    } else {
      order.status = "On Hold";
      order.priority = "urgent";
    }

    await order.save({ session });
    await session.commitTransaction();

    // Send notification if components are now available
    if (availabilityCheck.allComponentsAvailable && order.missingComponents?.length === 0) {
      await notifyAdminsAndManagers({
        companyId,
        title: "✅ כל הרכיבים זמינים",
        content: `הזמנת ייצור ${order.orderNumber} - כל הרכיבים כעת זמינים וניתן להתחיל בייצור`,
        type: "Success",
        category: "inventory",
        priority: "medium",
        relatedEntity: {
          entityType: "ProductionOrder",
          entityId: order._id.toString(),
        },
        actionUrl: `/dashboard/production/${order._id}`,
        actionLabel: "צפה בהזמנת ייצור",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order,
        availabilityCheck,
        statusChanged: availabilityCheck.allComponentsAvailable,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error rechecking availability:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Create procurement order from missing components
 */
export const createProcurementFromMissingComponents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { supplierId, warehouseId, deliveryDate, notes } = req.body;

    const order = await ProductionOrder.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("missingComponents.componentId")
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Production order not found" });
    }

    if (!order.missingComponents || order.missingComponents.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No missing components to procure" });
    }

    if (!supplierId || !warehouseId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Supplier and warehouse are required" });
    }

    // Get supplier details
    const supplier = await Supplier.findOne({
      _id: supplierId,
      companyId,
    }).session(session);

    if (!supplier) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Prepare products for procurement
    const products = [];
    let totalCost = 0;

    for (const missingComponent of order.missingComponents) {
      const component = missingComponent.componentId;
      if (!component) continue;

      // Get product details
      const product = await Product.findById(component._id || component).session(session);
      if (!product) continue;

      // Get current price from inventory or use default
      const inventory = await Inventory.findOne({
        companyId,
        productId: component._id || component,
      }).session(session);

      const unitPrice = inventory?.unitCost || product.unitPrice || 0;
      const quantity = missingComponent.missing || missingComponent.required - missingComponent.available;
      const productTotal = unitPrice * quantity;

      products.push({
        productId: component._id || component,
        productName: product.productName || missingComponent.componentName,
        sku: product.sku || "N/A",
        category: product.category || "Other",
        unitPrice,
        quantity,
        total: productTotal,
      });

      totalCost += productTotal;
    }

    if (products.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No valid products to procure" });
    }

    // Generate purchase order number
    const year = new Date().getFullYear();
    const count = await Procurement.countDocuments({ companyId }).session(session);
    const PurchaseOrder = `PO-${year}-${String(count + 1).padStart(6, "0")}`;

    // Create procurement order
    const procurement = new Procurement({
      companyId,
      supplierId,
      supplierName: supplier.SupplierName,
      warehouseId,
      PurchaseOrder,
      products,
      PaymentMethod: "Bank Transfer", // Default
      PaymentTerms: "Net 30 days", // Default
      DeliveryAddress: supplier.Address || "",
      purchaseDate: new Date(),
      deliveryDate: deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderStatus: "Pending",
      approvalStatus: "Pending Approval",
      notes: notes || `נוצר אוטומטית מהזמנת ייצור ${order.orderNumber} - רכיבים חסרים`,
      paymentStatus: "Unpaid",
      totalCost,
      summeryProcurement: "", // Will be generated if needed
      status: "pending",
      relatedProductionOrderIds: [order._id], // Link to production order
    });

    await procurement.save({ session });

    // Update production order notes
    if (!order.notes) {
      order.notes = "";
    }
    order.notes += `\nהזמנת רכש ${PurchaseOrder} נוצרה עבור רכיבים חסרים ב-${new Date().toLocaleString("he-IL")}`;
    await order.save({ session });

    await session.commitTransaction();

    // Send notification
    await notifyAdminsAndManagers({
      companyId,
      title: "📦 הזמנת רכש נוצרה",
      content: `הזמנת רכש ${PurchaseOrder} נוצרה עבור רכיבים חסרים מהזמנת ייצור ${order.orderNumber}`,
      type: "Info",
      category: "procurement",
      priority: "medium",
      relatedEntity: {
        entityType: "Procurement",
        entityId: procurement._id.toString(),
      },
      actionUrl: `/dashboard/procurement/${procurement._id}`,
      actionLabel: "צפה בהזמנת רכש",
    });

    res.status(201).json({
      success: true,
      data: {
        procurement,
        productionOrder: order,
        productsCreated: products.length,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating procurement from missing components:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get all missing components across all production orders
 */
export const getAllMissingComponents = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // Get all production orders with missing components
    const orders = await ProductionOrder.find({
      companyId,
      missingComponents: { $exists: true, $ne: [] },
    })
      .populate("productId", "productName sku")
      .populate("missingComponents.componentId", "productName sku unitPrice")
      .sort({ createdAt: -1 });

    // Aggregate missing components
    const missingComponentsMap = new Map();

    // First pass: collect all required quantities per component
    for (const order of orders) {
      if (!order.missingComponents || order.missingComponents.length === 0) continue;

      for (const missing of order.missingComponents) {
        const componentId = missing.componentId?._id?.toString() || missing.componentId?.toString();
        if (!componentId) continue;

        const key = componentId;
        if (!missingComponentsMap.has(key)) {
          missingComponentsMap.set(key, {
            componentId,
            componentName: missing.componentName || missing.componentId?.productName || "Unknown",
            sku: missing.componentId?.sku || "N/A",
            unitPrice: missing.componentId?.unitPrice || 0,
            totalRequired: 0,
            totalAvailable: 0, // Will be set from inventory
            totalMissing: 0,
            affectedOrders: [],
          });
        }

        const aggregated = missingComponentsMap.get(key);
        // Sum up required quantities from all orders
        aggregated.totalRequired += missing.required || 0;
        
        // Store individual order details
        aggregated.affectedOrders.push({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          productName: order.productName,
          required: missing.required || 0,
          available: missing.available || 0, // This is per-order, for display only
          missing: missing.missing || 0, // This is per-order, for display only
        });
      }
    }

    // Second pass: get actual available quantity from inventory and calculate ordered quantities
    const componentIds = Array.from(missingComponentsMap.keys());
    
    // Get all procurement orders that contain these components and are not cancelled
    const procurementOrders = await Procurement.find({
      companyId,
      "products.productId": { $in: componentIds },
      orderStatus: { $in: ["Pending", "In Progress", "Delivered"] },
    }).select("products orderStatus PurchaseOrder _id");

    // Create a map to track ordered quantities per component
    const orderedQuantitiesMap = new Map();
    const procurementOrdersMap = new Map(); // Track which procurements are related to each component

    for (const procurement of procurementOrders) {
      for (const product of procurement.products || []) {
        const productId = product.productId?.toString();
        if (!componentIds.includes(productId)) continue;

        // Use receivedQuantity if available and order is Delivered, otherwise use quantity
        const orderedQty = 
          procurement.orderStatus === "Delivered" && product.receivedQuantity 
            ? product.receivedQuantity 
            : product.quantity || 0;

        if (!orderedQuantitiesMap.has(productId)) {
          orderedQuantitiesMap.set(productId, 0);
          procurementOrdersMap.set(productId, []);
        }

        orderedQuantitiesMap.set(
          productId,
          orderedQuantitiesMap.get(productId) + orderedQty
        );

        procurementOrdersMap.get(productId).push({
          procurementId: procurement._id.toString(),
          PurchaseOrder: procurement.PurchaseOrder,
          orderStatus: procurement.orderStatus,
          quantity: orderedQty,
        });
      }
    }

    // Update aggregated data with inventory and ordered quantities
    for (const [componentId, aggregated] of missingComponentsMap.entries()) {
      try {
        const inventory = await Inventory.findOne({
          companyId,
          productId: componentId,
        });

        // Set the actual available quantity from inventory (not accumulated)
        aggregated.totalAvailable = inventory?.quantity || 0;
        
        // Get ordered quantity for this component
        const totalOrdered = orderedQuantitiesMap.get(componentId) || 0;
        aggregated.totalOrdered = totalOrdered;
        aggregated.procurementOrders = procurementOrdersMap.get(componentId) || [];
        
        // Calculate total missing: required - available - ordered
        aggregated.totalMissing = Math.max(0, aggregated.totalRequired - aggregated.totalAvailable - totalOrdered);
      } catch (inventoryError) {
        console.error(`Error fetching inventory for component ${componentId}:`, inventoryError);
        // If we can't get inventory, keep the aggregated available from orders
        aggregated.totalOrdered = orderedQuantitiesMap.get(componentId) || 0;
        aggregated.procurementOrders = procurementOrdersMap.get(componentId) || [];
        aggregated.totalMissing = Math.max(0, aggregated.totalRequired - aggregated.totalAvailable - (aggregated.totalOrdered || 0));
      }
    }

    // Filter out components that are not actually missing (totalMissing <= 0)
    const missingComponents = Array.from(missingComponentsMap.values()).filter(
      (component) => component.totalMissing > 0
    );

    res.status(200).json({
      success: true,
      data: {
        missingComponents,
        totalUniqueComponents: missingComponents.length,
        totalProductionOrders: orders.length,
      },
    });
  } catch (error) {
    console.error("Error fetching all missing components:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create procurement order from multiple missing components
 */
export const createProcurementFromMultipleMissingComponents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Starting...");
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Request body:", JSON.stringify(req.body, null, 2));

    const token = req.cookies["auth_token"];
    if (!token) {
      await session.abortTransaction();
      console.error("❌ [CREATE PROCUREMENT FROM MISSING] No token");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { componentIds, supplierId, warehouseId, deliveryDate, notes, signers, ...procurementFormData } = req.body;
    
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Component IDs:", componentIds);
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Supplier ID:", supplierId);
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Warehouse ID:", warehouseId);

    if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No components selected" });
    }

    if (!supplierId || !warehouseId) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Supplier and warehouse are required" });
    }

    // Get supplier details
    const supplier = await Supplier.findOne({
      _id: supplierId,
      companyId,
    }).session(session);

    if (!supplier) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Get all production orders with missing components
    const orders = await ProductionOrder.find({
      companyId,
      missingComponents: { $exists: true, $ne: [] },
    })
      .populate("missingComponents.componentId")
      .session(session);

    // Collect all missing components for selected componentIds
    const selectedComponents = new Map();
    const affectedOrderIds = new Set();

    for (const order of orders) {
      if (!order.missingComponents || order.missingComponents.length === 0) continue;

      for (const missing of order.missingComponents) {
        const componentId = missing.componentId?._id?.toString() || missing.componentId?.toString();
        if (!componentIds.includes(componentId)) continue;

        if (!selectedComponents.has(componentId)) {
          selectedComponents.set(componentId, {
            componentId,
            componentName: missing.componentName || missing.componentId?.productName || "Unknown",
            totalRequired: 0,
            totalAvailable: 0,
            totalMissing: 0,
            affectedOrders: [],
          });
        }

        const aggregated = selectedComponents.get(componentId);
        aggregated.totalRequired += missing.required || 0;
        aggregated.totalAvailable = missing.available || 0; // Will be updated from inventory
        aggregated.totalMissing += missing.missing || 0;
        aggregated.affectedOrders.push({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          required: missing.required || 0,
          missing: missing.missing || 0,
        });
        affectedOrderIds.add(order._id.toString());
      }
    }

    // Get actual inventory for each component
    const products = [];
    let totalCost = 0;

    for (const [componentId, aggregated] of selectedComponents.entries()) {
      // Get product details
      const product = await Product.findById(componentId).session(session);
      if (!product) continue;

      // Get current price from inventory
      const inventory = await Inventory.findOne({
        companyId,
        productId: componentId,
      }).session(session);

      const unitPrice = inventory?.unitCost || product.unitPrice || procurementFormData.products?.find(p => p.productId === componentId)?.unitPrice || 0;
      const quantity = aggregated.totalMissing;
      const productTotal = unitPrice * quantity;

      products.push({
        productId: componentId,
        productName: product.productName || aggregated.componentName,
        sku: product.sku || "N/A",
        category: product.category || "Other",
        unitPrice,
        quantity,
        total: productTotal,
      });

      totalCost += productTotal;
    }

    if (products.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No valid products to procure" });
    }

    // Generate purchase order number
    const year = new Date().getFullYear();
    const count = await Procurement.countDocuments({ companyId }).session(session);
    const PurchaseOrder = `PO-${year}-${String(count + 1).padStart(6, "0")}`;

    // Prepare delivery address
    let effectiveDeliveryAddress = "";
    if (procurementFormData.DeliveryAddress) {
      effectiveDeliveryAddress = procurementFormData.DeliveryAddress;
    } else if (procurementFormData.shippingAddress && procurementFormData.shippingAddress.street) {
      effectiveDeliveryAddress = formatAddressString(procurementFormData.shippingAddress);
    } else if (supplier.Address) {
      effectiveDeliveryAddress = supplier.Address;
    }

    if (!effectiveDeliveryAddress || effectiveDeliveryAddress.trim() === "") {
      await session.abortTransaction();
      console.error("❌ [CREATE PROCUREMENT FROM MISSING] No delivery address");
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    // Prepare procurement data
    const procurementData = {
      companyId,
      supplierId,
      supplierName: supplier.SupplierName,
      warehouseId,
      PurchaseOrder,
      products,
      PaymentMethod: procurementFormData.PaymentMethod || "Bank Transfer",
      PaymentTerms: procurementFormData.PaymentTerms || "Net 30 days",
      DeliveryAddress: effectiveDeliveryAddress,
      ShippingMethod: procurementFormData.ShippingMethod || "",
      purchaseDate: procurementFormData.purchaseDate ? new Date(procurementFormData.purchaseDate) : new Date(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : (procurementFormData.deliveryDate ? new Date(procurementFormData.deliveryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      orderStatus: "Pending",
      approvalStatus: "Pending Approval",
      notes: notes || procurementFormData.notes || `נוצר אוטומטית מניהול חוסרים - ${products.length} רכיבים חסרים`,
      paymentStatus: "Unpaid",
      shippingCost: procurementFormData.shippingCost || 0,
      currency: procurementFormData.currency || supplier.baseCurrency || "ILS",
      requiresCustoms: procurementFormData.requiresCustoms || false,
      warrantyExpiration: procurementFormData.warrantyExpiration ? new Date(procurementFormData.warrantyExpiration) : null,
      totalCost: totalCost + (procurementFormData.shippingCost || 0),
      summeryProcurement: procurementFormData.summeryProcurement || "data:application/pdf;base64,", // Empty PDF as placeholder
      status: "pending",
      shippingAddress: procurementFormData.shippingAddress || null,
      contactPerson: procurementFormData.contactPerson || "",
      contactPhone: procurementFormData.contactPhone || "",
      signers: signers || [],
      currentSignatures: 0,
      currentSignerIndex: 0,
      relatedProductionOrderIds: Array.from(affectedOrderIds).map(id => new mongoose.Types.ObjectId(id)), // Link to production orders
    };

    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Procurement data prepared:", {
      PurchaseOrder,
      productsCount: products.length,
      totalCost: procurementData.totalCost,
      signersCount: (signers || []).length,
    });

    // Create procurement order
    console.log("🚀 [CREATE PROCUREMENT FROM MISSING] Creating procurement...");
    const procurement = new Procurement(procurementData);
    await procurement.save({ session });
    console.log("✅ [CREATE PROCUREMENT FROM MISSING] Procurement saved:", procurement._id);

    // Update production orders notes
    for (const orderId of affectedOrderIds) {
      const order = await ProductionOrder.findById(orderId).session(session);
      if (order) {
        if (!order.notes) {
          order.notes = "";
        }
        order.notes += `\nהזמנת רכש ${PurchaseOrder} נוצרה עבור רכיבים חסרים ב-${new Date().toLocaleString("he-IL")}`;
        await order.save({ session });
      }
    }

    await session.commitTransaction();
    console.log("✅ [CREATE PROCUREMENT FROM MISSING] Transaction committed");

    // Send notification (don't fail if notification fails)
    try {
      await notifyAdminsAndManagers({
        companyId,
        title: "📦 הזמנת רכש נוצרה מניהול חוסרים",
        content: `הזמנת רכש ${PurchaseOrder} נוצרה עבור ${products.length} רכיבים חסרים מ-${affectedOrderIds.size} הזמנות ייצור`,
        type: "Info",
        category: "procurement",
        priority: "medium",
        relatedEntity: {
          entityType: "Procurement",
          entityId: procurement._id.toString(),
        },
        actionUrl: `/dashboard/procurement/${procurement._id}`,
        actionLabel: "צפה בהזמנת רכש",
      });
      console.log("✅ [CREATE PROCUREMENT FROM MISSING] Notification sent");
    } catch (notifError) {
      console.error("⚠️ [CREATE PROCUREMENT FROM MISSING] Error sending notification:", notifError);
      // Don't fail the request if notification fails
    }

    console.log("✅ [CREATE PROCUREMENT FROM MISSING] Sending response...");
    const responseData = {
      success: true,
      data: {
        procurement: {
          _id: procurement._id,
          PurchaseOrder: procurement.PurchaseOrder,
          supplierName: procurement.supplierName,
          totalCost: procurement.totalCost,
          orderStatus: procurement.orderStatus,
        },
        productsCreated: products.length,
        affectedOrders: affectedOrderIds.size,
      },
    };
    console.log("✅ [CREATE PROCUREMENT FROM MISSING] Response data:", JSON.stringify(responseData, null, 2));
    res.status(201).json(responseData);
    console.log("✅ [CREATE PROCUREMENT FROM MISSING] Response sent successfully");
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ [CREATE PROCUREMENT FROM MISSING] Error:", error);
    console.error("❌ [CREATE PROCUREMENT FROM MISSING] Error name:", error.name);
    console.error("❌ [CREATE PROCUREMENT FROM MISSING] Error message:", error.message);
    console.error("❌ [CREATE PROCUREMENT FROM MISSING] Error stack:", error.stack);
    if (error.errors) {
      console.error("❌ [CREATE PROCUREMENT FROM MISSING] Validation errors:", JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  } finally {
    session.endSession();
  }
};

