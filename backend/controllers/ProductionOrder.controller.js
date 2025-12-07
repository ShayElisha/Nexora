import ProductionOrder from "../models/ProductionOrder.model.js";
import Product from "../models/product.model.js";
import productTree from "../models/productTree.model.js";
import Inventory from "../models/inventory.model.js";
import InventoryMovement from "../models/InventoryMovement.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Notification from "../models/notification.model.js";
import Employee from "../models/employees.model.js";
import InventoryHistory from "../models/InventoryHistory.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { notifyAdminsAndManagers } from "./notification.controller.js";

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
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { status, priority, search } = req.query;

    let query = { companyId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const orders = await ProductionOrder.find(query)
      .populate("productId", "productName sku")
      .populate("customerOrderId", "orderDate orderTotal")
      .populate("assignedTo", "name lastName email")
      .populate("departmentId", "name")
      .sort({ createdAt: -1 });

    // Filter by search term if provided
    let filteredOrders = orders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.productName.toLowerCase().includes(searchLower) ||
          (order.customerOrderId?._id?.toString().includes(searchLower))
      );
    }

    res.status(200).json({ success: true, data: filteredOrders });
  } catch (error) {
    console.error("Error fetching production orders:", error);
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
    } else if (status === "Cancelled" && oldStatus !== "Cancelled") {
      // Release reserved components back to inventory
      if (order.inventoryReserved) {
        for (const component of order.components || []) {
          if (!component.componentId || !component.reservedQuantity || component.reservedQuantity <= 0) {
            continue;
          }
          
          const inventory = await Inventory.findOne({
            companyId,
            productId: component.componentId,
          }).session(session);

          if (inventory) {
            inventory.quantity += component.reservedQuantity;
            await inventory.save({ session });

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

            try {
              const historyEntry = new InventoryHistory({
                companyId,
                productId: component.componentId,
                productName: componentName,
                oldQuantity: inventory.quantity - component.reservedQuantity,
                newQuantity: inventory.quantity,
                changeAmount: component.reservedQuantity,
                reason: "Stock Adjustment",
                notes: `Production Order ${order.orderNumber} - Component Released (Cancelled)`,
                orderId: order._id.toString(),
                timestamp: new Date(),
              });
              await historyEntry.save({ session });
            } catch (historyError) {
              console.error(`❌ Error creating inventory history for component ${component.componentId}:`, historyError);
              throw historyError; // Re-throw to trigger transaction rollback
            }
          }
        }

        order.inventoryReserved = false;
      }
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Error updating production order status:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    if (error.errors) {
      console.error("❌ Validation errors:", JSON.stringify(error.errors, null, 2));
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

