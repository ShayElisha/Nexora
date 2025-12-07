import Lead from "../models/Lead.model.js";
import Customer from "../models/customers.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Product from "../models/product.model.js";
import Invoice from "../models/invoice.model.js";
import Finance from "../models/finance.model.js";
import Task from "../models/tasks.model.js";
import Notification from "../models/notification.model.js";
import Department from "../models/department.model.js";
import Project from "../models/project.model.js";
import Employee from "../models/employees.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  linkLeadToDepartment,
  unlinkLeadFromDepartment,
  linkLeadToProject,
  unlinkLeadFromProject,
  assignLeadToEmployees,
} from "../services/RelationshipService.js";

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;

    const {
      name,
      email,
      phone,
      company,
      position,
      website,
      industry,
      address,
      status,
      source,
      estimatedValue,
      currency,
      probability,
      expectedCloseDate,
      leadScore,
      assignedTo,
      tags,
      notes,
      preferredContactMethod,
      nextFollowUp,
      departmentId,
      projectId,
    } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    // Convert companyId to ObjectId if needed
    let finalCompanyId = companyId;
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      finalCompanyId = new mongoose.Types.ObjectId(companyId);
    }

    // Ensure assignedTo is an array
    const assignedToArray = Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : [];

    const newLead = new Lead({
      companyId: finalCompanyId,
      name,
      email,
      phone,
      company,
      position,
      website,
      industry,
      address,
      status: status || "New",
      source: source || "Other",
      estimatedValue: estimatedValue || 0,
      currency: currency || "ILS",
      probability: probability || 10,
      expectedCloseDate,
      leadScore: leadScore || 0,
      assignedTo: assignedToArray,
      tags: tags || [],
      notes,
      preferredContactMethod: preferredContactMethod || "Email",
      nextFollowUp,
      createdBy: employeeId,
      ...(departmentId && { departmentId }),
      ...(projectId && { projectId }),
    });

    await newLead.save();

    // Link relationships
    if (departmentId) {
      await linkLeadToDepartment(newLead._id, departmentId);
    }
    if (projectId) {
      await linkLeadToProject(newLead._id, projectId);
    }

    // Create automatic notifications
    try {
      // Notify assigned employees
      if (assignedToArray.length > 0) {
        for (const assignedEmployeeId of assignedToArray) {
          await Notification.create({
            companyId: finalCompanyId,
            employeeId: assignedEmployeeId,
            title: "🎯 ליד חדש הוקצה לך",
            content: `ליד חדש "${name}" הוקצה לך. ערך משוער: ${estimatedValue || 0} ${currency || "ILS"}`,
            type: "Info",
            category: "customers",
            priority: "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: newLead._id.toString(),
            },
            actionUrl: `/dashboard/leads/${newLead._id}`,
            actionLabel: "צפה בליד",
          });
        }
      }

      // Notify department manager if lead is assigned to department
      if (departmentId) {
        const department = await Department.findById(departmentId).populate("departmentManager");
        if (department?.departmentManager) {
          await Notification.create({
            companyId: finalCompanyId,
            employeeId: department.departmentManager._id,
            title: "🎯 ליד חדש במחלקה",
            content: `ליד חדש "${name}" נוסף למחלקה "${department.name}"`,
            type: "Info",
            category: "customers",
            priority: "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: newLead._id.toString(),
            },
            actionUrl: `/dashboard/leads/${newLead._id}`,
            actionLabel: "צפה בליד",
          });
        }
      }

      // Notify project manager if lead is linked to project
      if (projectId) {
        const project = await Project.findById(projectId).populate("projectManager");
        if (project?.projectManager) {
          await Notification.create({
            companyId: finalCompanyId,
            employeeId: project.projectManager._id,
            title: "🎯 ליד חדש קשור לפרויקט",
            content: `ליד חדש "${name}" קשור לפרויקט "${project.name}"`,
            type: "Info",
            category: "projects",
            priority: "medium",
            relatedEntity: {
              entityType: "Lead",
              entityId: newLead._id.toString(),
            },
            actionUrl: `/dashboard/leads/${newLead._id}`,
            actionLabel: "צפה בליד",
          });
        }
      }

      // Notify sales managers and admins
      const salesManagersAndAdmins = await Employee.find({
        companyId: finalCompanyId,
        role: { $in: ["Admin", "Manager"] },
        status: "active",
      }).select("_id");

      for (const admin of salesManagersAndAdmins) {
        await Notification.create({
          companyId: finalCompanyId,
          employeeId: admin._id,
          title: "🎯 ליד חדש התקבל",
          content: `ליד חדש "${name}" התקבל. ערך משוער: ${estimatedValue || 0} ${currency || "ILS"}`,
          type: "Info",
          category: "customers",
          priority: "low",
          relatedEntity: {
            entityType: "Lead",
            entityId: newLead._id.toString(),
          },
          actionUrl: `/dashboard/leads/${newLead._id}`,
          actionLabel: "צפה בליד",
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating notifications (lead still created):", notificationError);
    }

    // Create automatic tasks for lead follow-up
    try {
      // Task 1: Initial contact task
      if (assignedToArray.length > 0) {
        const contactDueDate = nextFollowUp
          ? new Date(nextFollowUp)
          : new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow or nextFollowUp

        await Task.create({
          companyId: finalCompanyId,
          departmentId: departmentId || null,
          projectId: projectId || null,
          leadId: newLead._id,
          title: `יצירת קשר ראשוני - ${name}`,
          description: `יצירת קשר ראשוני עם הליד "${name}". ${notes ? `הערות: ${notes}` : ""}`,
          status: "pending",
          priority: probability >= 70 ? "high" : probability >= 40 ? "medium" : "low",
          dueDate: contactDueDate,
          assignedTo: assignedToArray,
        });
      }

      // Task 2: Follow-up task if nextFollowUp is set
      if (nextFollowUp && assignedToArray.length > 0) {
        await Task.create({
          companyId: finalCompanyId,
          departmentId: departmentId || null,
          projectId: projectId || null,
          leadId: newLead._id,
          title: `מעקב ליד - ${name}`,
          description: `מעקב אחר הליד "${name}". תאריך מעקב מתוכנן: ${new Date(nextFollowUp).toLocaleDateString("he-IL")}`,
          status: "pending",
          priority: "medium",
          dueDate: new Date(nextFollowUp),
          assignedTo: assignedToArray,
        });
      }

      console.log(`✅ Created automatic tasks for lead ${newLead._id}`);
    } catch (taskError) {
      console.error("❌ Error creating automatic tasks (lead still created):", taskError);
    }

    return res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    console.error("Error creating lead:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all leads
export const getAllLeads = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { status, source, assignedTo, search } = req.query;

    // Build filter
    const filter = { companyId };
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    console.log("Fetching leads with filter:", JSON.stringify(filter, null, 2));

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name lastName email")
      .populate("createdBy", "name lastName")
      .sort({ createdAt: -1 });

    console.log(`Found ${leads.length} leads`);

    return res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get lead by ID
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead id" });
    }

    const lead = await Lead.findById(id)
      .populate("assignedTo", "name lastName email")
      .populate("createdBy", "name lastName")
      .populate("updatedBy", "name lastName")
      .populate("convertedToCustomer");

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to create order from lead
const createOrderFromLead = async (lead, companyId, employeeId) => {
  try {
    console.log(`🛒 Creating order from lead: ${lead._id}`);

    // Check if order already exists for this lead
    if (lead.createdOrderId) {
      const existingOrder = await CustomerOrder.findById(lead.createdOrderId);
      if (existingOrder) {
        console.log(`ℹ️ Order already exists for lead ${lead._id}: ${existingOrder._id}`);
        return existingOrder;
      }
    }

    // Check if lead has order items
    console.log(`🔍 Checking order items for lead ${lead._id}:`, {
      hasOrderItems: !!lead.orderItems,
      orderItemsLength: lead.orderItems?.length || 0,
      orderItems: lead.orderItems,
    });
    
    if (!lead.orderItems || lead.orderItems.length === 0) {
      console.log(`⚠️ Lead ${lead._id} has no order items, skipping order creation`);
      return null;
    }

    // Get or create customer
    let customer = null;
    if (lead.convertedToCustomer) {
      customer = await Customer.findById(lead.convertedToCustomer);
    } else {
      // Create customer from lead
      customer = new Customer({
        companyId: lead.companyId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        website: lead.website,
        industry: lead.industry,
        address: lead.address?.street || lead.address || "",
        status: "Active",
        customerType: "Corporate",
        preferredContactMethod: lead.preferredContactMethod,
        lastContacted: lead.lastContacted,
        customerSince: new Date(),
        notes: lead.notes,
        createdBy: employeeId,
      });
      await customer.save();
      console.log(`✅ Customer created from lead: ${customer._id}`);
      
      // Update lead with customer reference
      lead.convertedToCustomer = customer._id;
      lead.convertedAt = lead.convertedAt || new Date();
    }

    if (!customer) {
      throw new Error("Failed to get or create customer");
    }

    // Process order items
    let computedItems = [];
    let computedOrderTotal = 0;

    console.log(`📦 Processing ${lead.orderItems?.length || 0} order items for lead ${lead._id}`);
    
    if (!lead.orderItems || lead.orderItems.length === 0) {
      console.log(`⚠️ Lead ${lead._id} has no order items after processing`);
      return null;
    }

    for (const item of lead.orderItems) {
      console.log(`🔍 Processing item: product=${item.product}, quantity=${item.quantity}, unitPrice=${item.unitPrice}`);
      
      // Handle both ObjectId and string product IDs
      const productId = item.product?._id || item.product;
      const productDoc = await Product.findById(productId);
      if (!productDoc) {
        console.warn(`⚠️ Product ${productId} not found, skipping item`);
        continue;
      }

      const unitPrice = item.unitPrice || productDoc.unitPrice;
      const discount = lead.globalDiscount > 0 ? 0 : (item.discount || 0);
      const discountedUnitPrice = unitPrice * (1 - discount / 100);
      const totalPrice = discountedUnitPrice * Number(item.quantity);

      computedItems.push({
        product: productId,
        quantity: Number(item.quantity),
        unitPrice,
        discount,
        totalPrice,
      });
      computedOrderTotal += totalPrice;
      console.log(`✅ Item processed: ${productDoc.productName || productDoc.name}, total: ${totalPrice}`);
    }

    if (computedItems.length === 0) {
      throw new Error("No valid order items found");
    }

    // Apply global discount if set
    if (lead.globalDiscount > 0) {
      computedOrderTotal = computedOrderTotal * (1 - Number(lead.globalDiscount) / 100);
    }

    // Calculate tax amount
    const finalTaxRate = Number(lead.taxRate) || 0;
    const taxAmount = (computedOrderTotal * finalTaxRate) / 100;
    const finalOrderTotal = computedOrderTotal + taxAmount;

    // Create order
    // Handle deliveryDate - convert string to Date if needed
    let deliveryDate = null;
    if (lead.deliveryDate) {
      deliveryDate = lead.deliveryDate instanceof Date ? lead.deliveryDate : new Date(lead.deliveryDate);
    }

    const order = new CustomerOrder({
      customer: customer._id,
      companyId: lead.companyId,
      orderDate: new Date(),
      deliveryDate: deliveryDate,
      items: computedItems,
      globalDiscount: Number(lead.globalDiscount) || 0,
      taxRate: finalTaxRate,
      taxAmount: taxAmount,
      orderTotal: finalOrderTotal,
      notes: lead.orderNotes || `Order created from lead "${lead.name}"`,
      paymentTerms: lead.paymentTerms || "Net 30",
    });

    const savedOrder = await order.save();
    console.log(`✅ Order created: ${savedOrder._id}`);

    // Update lead with order reference
    lead.createdOrderId = savedOrder._id;
    await lead.save();

    // Import functions from CustomerOrder controller
    let createInvoiceFromOrder, createFinancialRecordFromOrder, createFinancialRecordFromOrderWithoutInvoice;
    try {
      const customerOrderModule = await import("./CustomerOrder.controller.js");
      createInvoiceFromOrder = customerOrderModule.createInvoiceFromOrder;
      createFinancialRecordFromOrder = customerOrderModule.createFinancialRecordFromOrder;
      createFinancialRecordFromOrderWithoutInvoice = customerOrderModule.createFinancialRecordFromOrderWithoutInvoice;
      console.log(`✅ Successfully imported functions from CustomerOrder.controller.js`);
    } catch (importError) {
      console.error("❌ Error importing functions from CustomerOrder.controller.js:", importError);
      throw new Error(`Failed to import order creation functions: ${importError.message}`);
    }

    // Create invoice from order
    let invoice = null;
    if (createInvoiceFromOrder) {
      try {
        const decodedToken = { employeeId, companyId };
        invoice = await createInvoiceFromOrder(savedOrder, companyId, decodedToken);
        console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
      } catch (invoiceError) {
        console.error("❌ Error creating invoice from order:", invoiceError);
        console.error("❌ Invoice error stack:", invoiceError.stack);
        // Continue even if invoice creation fails
      }
    } else {
      console.warn("⚠️ createInvoiceFromOrder function not available");
    }

    // Create financial record
    let financialRecord = null;
    if (createFinancialRecordFromOrder || createFinancialRecordFromOrderWithoutInvoice) {
      if (invoice && createFinancialRecordFromOrder) {
        try {
          financialRecord = await createFinancialRecordFromOrder(savedOrder, invoice, companyId);
          console.log(`✅ Financial record created: ${financialRecord._id}`);
        } catch (financeError) {
          console.error("❌ Error creating financial record:", financeError);
          console.error("❌ Finance error stack:", financeError.stack);
        }
      } else if (createFinancialRecordFromOrderWithoutInvoice) {
        // Create financial record without invoice
        try {
          financialRecord = await createFinancialRecordFromOrderWithoutInvoice(savedOrder, companyId);
          console.log(`✅ Financial record created (without invoice): ${financialRecord._id}`);
        } catch (financeError) {
          console.error("❌ Error creating financial record:", financeError);
          console.error("❌ Finance error stack:", financeError.stack);
        }
      }
    } else {
      console.warn("⚠️ Financial record creation functions not available");
    }

    // Create task for order fulfillment
    try {
      // Get product names for task orderItems
      const orderItemsForTask = await Promise.all(
        computedItems.map(async (item, index) => {
          const product = await Product.findById(item.product);
          return {
            itemId: item._id || index,
            productId: item.product,
            productName: product?.productName || "Product",
            quantity: item.quantity,
          };
        })
      );

      const task = new Task({
        companyId: lead.companyId,
        title: `Fulfill order from lead "${lead.name}"`,
        description: `Order #${savedOrder._id} created from lead. Total: ${finalOrderTotal} ${lead.currency || "ILS"}`,
        status: "Pending",
        priority: "High",
        dueDate: lead.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedTo: lead.assignedTo ? [lead.assignedTo] : [],
        orderId: savedOrder._id,
        orderItems: orderItemsForTask,
      });
      await task.save();
      console.log(`✅ Task created: ${task._id}`);
    } catch (taskError) {
      console.error("❌ Error creating task:", taskError);
      // Continue even if task creation fails
    }

    return savedOrder;
  } catch (error) {
    console.error("❌ Error creating order from lead:", error);
    throw error;
  }
};

// Update lead
export const updateLead = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead id" });
    }

    // Get current lead to check status change
    const currentLead = await Lead.findById(id);
    if (!currentLead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    const oldStatus = currentLead.status;
    const { status, departmentId, projectId, assignedTo } = req.body;
    
    // Handle assignedTo - ensure it's an array
    if (assignedTo !== undefined) {
      req.body.assignedTo = Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : [];
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: employeeId },
      { new: true, runValidators: true }
    )
      .populate("assignedTo", "name lastName email")
      .populate("updatedBy", "name lastName")
      .populate("orderItems.product", "productName unitPrice");

    if (!updatedLead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // If status changed to "Closed Won" OR if already "Closed Won" but no order exists, create order automatically
    const shouldCreateOrder = 
      (status === "Closed Won" && oldStatus !== "Closed Won") || // Status just changed to Closed Won
      (status === "Closed Won" && oldStatus === "Closed Won" && !updatedLead.createdOrderId); // Already Closed Won but no order exists

    if (shouldCreateOrder) {
      console.log(`🎯 Lead ${id} status is "Closed Won" (${oldStatus !== "Closed Won" ? "just changed" : "already was"}), checking for order creation...`);
      updatedLead.status = "Closed Won";
      updatedLead.convertedAt = updatedLead.convertedAt || new Date();
      await updatedLead.save();

      // Reload lead with orderItems to ensure we have all data
      const leadWithOrderItems = await Lead.findById(id);
      
      console.log(`📋 Lead ${id} orderItems:`, leadWithOrderItems?.orderItems?.length || 0);
      console.log(`📋 Lead ${id} orderItems data:`, JSON.stringify(leadWithOrderItems?.orderItems || []));
      console.log(`📋 Lead ${id} createdOrderId:`, leadWithOrderItems?.createdOrderId);
      
      if (leadWithOrderItems && leadWithOrderItems.orderItems && leadWithOrderItems.orderItems.length > 0) {
        console.log(`✅ Lead ${id} has ${leadWithOrderItems.orderItems.length} order items, creating order...`);
        // Create order in background (non-blocking)
        createOrderFromLead(leadWithOrderItems, companyId, employeeId)
          .then((order) => {
            if (order) {
              console.log(`✅ Order ${order._id} created successfully from lead ${id}`);
            } else {
              console.log(`⚠️ Order creation returned null for lead ${id}`);
            }
          })
          .catch((err) => {
            console.error("❌ Error creating order from lead:", err);
            console.error("❌ Error message:", err.message);
            console.error("❌ Error stack:", err.stack);
          });
      } else {
        console.log(`⚠️ Lead ${id} has no order items (${leadWithOrderItems?.orderItems?.length || 0}), skipping order creation`);
      }
    }

    // Handle relationship updates
    const oldDepartmentId = currentLead.departmentId?.toString();
    const newDepartmentId = departmentId?.toString();
    if (oldDepartmentId !== newDepartmentId) {
      if (oldDepartmentId) {
        await unlinkLeadFromDepartment(id, oldDepartmentId);
      }
      if (newDepartmentId) {
        await linkLeadToDepartment(id, newDepartmentId);
      }
    }

    const oldProjectId = currentLead.projectId?.toString();
    const newProjectId = projectId?.toString();
    if (oldProjectId !== newProjectId) {
      if (oldProjectId) {
        await unlinkLeadFromProject(id, oldProjectId);
      }
      if (newProjectId) {
        await linkLeadToProject(id, newProjectId);
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedLead,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead id" });
    }

    // Get lead before deletion to unlink relationships
    const leadToDelete = await Lead.findById(id);
    if (!leadToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Unlink relationships before deletion
    if (leadToDelete.departmentId) {
      await unlinkLeadFromDepartment(id, leadToDelete.departmentId);
    }
    if (leadToDelete.projectId) {
      await unlinkLeadFromProject(id, leadToDelete.projectId);
    }

    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: deletedLead,
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Convert lead to customer
export const convertLeadToCustomer = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead id" });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Check if already converted
    if (lead.convertedToCustomer) {
      return res.status(400).json({
        success: false,
        message: "Lead already converted to customer",
      });
    }

    // Create customer from lead
    const newCustomer = new Customer({
      companyId: lead.companyId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      website: lead.website,
      industry: lead.industry,
      address: lead.address?.street || lead.address || "",
      status: "Active",
      customerType: "Corporate",
      preferredContactMethod: lead.preferredContactMethod,
      lastContacted: lead.lastContacted,
      customerSince: new Date(),
      notes: lead.notes,
      createdBy: employeeId,
    });

    await newCustomer.save();

    // Update lead
    lead.convertedToCustomer = newCustomer._id;
    lead.convertedAt = new Date();
    lead.status = "Closed Won";
    lead.updatedBy = employeeId;
    await lead.save();

    // Create order from lead if it has order items
    if (lead.orderItems && lead.orderItems.length > 0) {
      createOrderFromLead(lead, companyId, employeeId).catch((err) => {
        console.error("Error creating order from lead:", err);
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        lead,
        customer: newCustomer,
      },
      message: "Lead converted to customer successfully",
    });
  } catch (error) {
    console.error("Error converting lead:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get leads statistics
export const getLeadsStatistics = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const stats = await Lead.aggregate([
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$estimatedValue" },
        },
      },
    ]);

    const sourceStats = await Lead.aggregate([
      { $match: { companyId: companyId } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalLeads = await Lead.countDocuments({ companyId });
    const totalValue = await Lead.aggregate([
      { $match: { companyId: companyId } },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        bySource: sourceStats,
        totalLeads,
        totalValue: totalValue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching leads statistics:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create order from lead manually (for leads already in "Closed Won" status)
export const createOrderFromLeadManually = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lead id" });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Check if order already exists
    if (lead.createdOrderId) {
      const existingOrder = await CustomerOrder.findById(lead.createdOrderId);
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: "Order already exists for this lead",
          data: { orderId: existingOrder._id },
        });
      }
    }

    // Check if lead has order items
    if (!lead.orderItems || lead.orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lead has no order items. Please add order items before creating an order.",
      });
    }

    // Create order
    const order = await createOrderFromLead(lead, companyId, employeeId);

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Failed to create order. Please check lead data.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: { orderId: order._id },
    });
  } catch (error) {
    console.error("❌ Error creating order from lead manually:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || "Error creating order from lead",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

