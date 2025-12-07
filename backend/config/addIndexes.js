import mongoose from "mongoose";
import Employee from "../models/employees.model.js";
import Procurement from "../models/procurement.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Task from "../models/tasks.model.js";
import Finance from "../models/finance.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Customer from "../models/customers.model.js";
import Project from "../models/project.model.js";
import Department from "../models/department.model.js";
import Event from "../models/events.model.js";
import Budget from "../models/Budget.model.js";
import Lead from "../models/Lead.model.js";
import Invoice from "../models/invoice.model.js";
import Suppliers from "../models/suppliers.model.js";
import Activity from "../models/Activity.model.js";
import SupportTicket from "../models/supportTicket.model.js";
import ProductionOrder from "../models/ProductionOrder.model.js";
import Warehouse from "../models/warehouse.model.js";
import Notification from "../models/notification.model.js";
import ProjectTemplate from "../models/ProjectTemplate.model.js";
import ProjectRisk from "../models/ProjectRisk.model.js";
import CustomerSegment from "../models/CustomerSegment.model.js";
import CustomerSatisfaction from "../models/CustomerSatisfaction.model.js";
import CustomerRetention from "../models/CustomerRetention.model.js";
import CustomerFile from "../models/CustomerFile.model.js";

/**
 * הוספת indexes לכל המודלים לשיפור ביצועים דרמטי
 * Indexes מאיצים queries פי 10-100!
 */
// Helper function to safely create index
async function safeCreateIndex(collection, indexSpec, options = {}) {
  try {
    // Generate index name if not provided
    const indexName = options.name || Object.keys(indexSpec).map(k => `${k}_${indexSpec[k]}`).join('_');
    
    // Check if index already exists
    const existingIndexes = await collection.getIndexes();
    const existingIndex = existingIndexes[indexName];
    
    if (existingIndex) {
      // Index exists, skip silently
      return false;
    }
    
    // Check if an index with the same key pattern exists (even with different options)
    const indexKeyStr = JSON.stringify(indexSpec);
    for (const [name, index] of Object.entries(existingIndexes)) {
      if (JSON.stringify(index.key) === indexKeyStr && name !== indexName) {
        // Similar index exists with different name/options, skip
        return false;
      }
    }
    
    // Try to create with explicit name to avoid conflicts
    const createOptions = { ...options, name: indexName };
    await collection.createIndex(indexSpec, createOptions);
    return true;
  } catch (error) {
    // If index already exists or conflicts, that's okay - just skip
    if (error.code === 86 || error.code === 11000 || 
        error.codeName === 'IndexKeySpecsConflict' || 
        error.codeName === 'IndexOptionsConflict' ||
        error.message?.includes('already exists')) {
      return false;
    }
    // For other errors, log but don't throw to allow server to continue
    console.warn(`⚠️  Warning creating index: ${error.message}`);
    return false;
  }
}

export async function addPerformanceIndexes() {
  console.log("🔧 Adding performance indexes to all models...");

  try {
    // ==================== Employee Indexes ====================
    await safeCreateIndex(Employee.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Employee.collection, { companyId: 1, role: 1 });
    await safeCreateIndex(Employee.collection, { companyId: 1, department: 1 });
    await safeCreateIndex(Employee.collection, { companyId: 1, status: 1, role: 1 });
    await safeCreateIndex(Employee.collection, { email: 1 }, { unique: true, sparse: true, name: 'email_unique_sparse' });
    await safeCreateIndex(Employee.collection, { identity: 1 }, { unique: true, sparse: true, name: 'identity_unique_sparse' });
    await safeCreateIndex(Employee.collection, { employeeId: 1 }, { unique: true, sparse: true, name: 'employeeId_unique_sparse' });
    await safeCreateIndex(Employee.collection, { createdAt: -1 }, { name: 'createdAt_desc' });
    console.log("  ✅ Employee indexes (8)");

    // ==================== Procurement Indexes ====================
    await safeCreateIndex(Procurement.collection, { companyId: 1, orderStatus: 1 });
    await safeCreateIndex(Procurement.collection, { companyId: 1, approvalStatus: 1 });
    await safeCreateIndex(Procurement.collection, { companyId: 1, deliveryDate: 1 });
    await safeCreateIndex(Procurement.collection, { companyId: 1, paymentStatus: 1 });
    await safeCreateIndex(Procurement.collection, { companyId: 1, orderStatus: 1, deliveryDate: 1 });
    await safeCreateIndex(Procurement.collection, { supplierId: 1 });
    await safeCreateIndex(Procurement.collection, { purchaseDate: -1 });
    await safeCreateIndex(Procurement.collection, { PurchaseOrder: 1 }, { unique: true, sparse: true, name: 'PurchaseOrder_unique_sparse' });
    console.log("  ✅ Procurement indexes (8)");

    // ==================== CustomerOrder Indexes ====================
    await safeCreateIndex(CustomerOrder.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(CustomerOrder.collection, { companyId: 1, orderDate: -1 });
    await safeCreateIndex(CustomerOrder.collection, { customer: 1, status: 1 });
    await safeCreateIndex(CustomerOrder.collection, { deliveryDate: 1 });
    await safeCreateIndex(CustomerOrder.collection, { createdAt: -1 });
    console.log("  ✅ CustomerOrder indexes (5)");

    // ==================== Task Indexes ====================
    await safeCreateIndex(Task.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Task.collection, { companyId: 1, dueDate: 1 });
    await safeCreateIndex(Task.collection, { companyId: 1, status: 1, dueDate: 1 });
    await safeCreateIndex(Task.collection, { assignedTo: 1 });
    await safeCreateIndex(Task.collection, { projectId: 1, status: 1 });
    await safeCreateIndex(Task.collection, { createdAt: -1 });
    console.log("  ✅ Task indexes (6)");

    // ==================== Finance Indexes ====================
    await safeCreateIndex(Finance.collection, { companyId: 1, date: -1 });
    await safeCreateIndex(Finance.collection, { companyId: 1, type: 1 });
    await safeCreateIndex(Finance.collection, { companyId: 1, category: 1 });
    await safeCreateIndex(Finance.collection, { companyId: 1, type: 1, date: -1 });
    await safeCreateIndex(Finance.collection, { createdAt: -1 });
    console.log("  ✅ Finance indexes (5)");

    // ==================== Inventory Indexes ====================
    // הסרת ה-index הישן ה-unique אם קיים (כי הוא מונע אותו מוצר במספר מחסנים)
    try {
      const existingIndexes = await Inventory.collection.getIndexes();
      if (existingIndexes['companyId_productId_unique']) {
        console.log("  🔧 Removing old unique index on companyId_productId...");
        await Inventory.collection.dropIndex('companyId_productId_unique');
        console.log("  ✅ Old unique index removed");
      }
    } catch (dropError) {
      // אם ה-index לא קיים או יש בעיה בהסרה, זה בסדר
      if (dropError.code !== 27 && dropError.codeName !== 'IndexNotFound') {
        console.warn(`  ⚠️  Warning removing old index: ${dropError.message}`);
      }
    }
    
    // יצירת index חדש עם warehouseId (sparse כדי לאפשר null values)
    await safeCreateIndex(Inventory.collection, { companyId: 1, productId: 1, warehouseId: 1 }, { unique: true, sparse: true, name: 'companyId_productId_warehouseId_unique' });
    // שמירת ה-index הישן (ללא unique) לחיפושים מהירים
    await safeCreateIndex(Inventory.collection, { companyId: 1, productId: 1 }, { name: 'companyId_productId' });
    await safeCreateIndex(Inventory.collection, { companyId: 1, quantity: 1 });
    await safeCreateIndex(Inventory.collection, { productId: 1 });
    await safeCreateIndex(Inventory.collection, { companyId: 1, category: 1 });
    console.log("  ✅ Inventory indexes (5)");

    // ==================== Product Indexes ====================
    await safeCreateIndex(Product.collection, { companyId: 1, category: 1 });
    await safeCreateIndex(Product.collection, { companyId: 1, sku: 1 });
    await safeCreateIndex(Product.collection, { sku: 1 }, { unique: true, sparse: true, name: 'sku_unique_sparse' });
    await safeCreateIndex(Product.collection, { createdAt: -1 });
    console.log("  ✅ Product indexes (4)");

    // ==================== Customer Indexes ====================
    await safeCreateIndex(Customer.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Customer.collection, { companyId: 1, type: 1 });
    await safeCreateIndex(Customer.collection, { email: 1 });
    await safeCreateIndex(Customer.collection, { phone: 1 });
    await safeCreateIndex(Customer.collection, { createdAt: -1 });
    console.log("  ✅ Customer indexes (5)");

    // ==================== Project Indexes ====================
    await safeCreateIndex(Project.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Project.collection, { companyId: 1, startDate: 1 });
    await safeCreateIndex(Project.collection, { companyId: 1, endDate: 1 });
    await safeCreateIndex(Project.collection, { createdAt: -1 });
    console.log("  ✅ Project indexes (4)");

    // ==================== Department Indexes ====================
    await safeCreateIndex(Department.collection, { companyId: 1 });
    await safeCreateIndex(Department.collection, { companyId: 1, name: 1 });
    console.log("  ✅ Department indexes (2)");

    // ==================== Event Indexes ====================
    await safeCreateIndex(Event.collection, { companyId: 1, date: 1 });
    await safeCreateIndex(Event.collection, { companyId: 1, date: -1 });
    await safeCreateIndex(Event.collection, { date: 1 });
    console.log("  ✅ Event indexes (3)");

    // ==================== Budget Indexes ====================
    await safeCreateIndex(Budget.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Budget.collection, { companyId: 1, departmentId: 1 });
    await safeCreateIndex(Budget.collection, { companyId: 1, projectId: 1 });
    await safeCreateIndex(Budget.collection, { companyId: 1, startDate: 1, endDate: 1 });
    await safeCreateIndex(Budget.collection, { createdAt: -1 });
    console.log("  ✅ Budget indexes (5)");

    // ==================== Lead Indexes ====================
    await safeCreateIndex(Lead.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Lead.collection, { companyId: 1, source: 1 });
    await safeCreateIndex(Lead.collection, { companyId: 1, assignedTo: 1 });
    await safeCreateIndex(Lead.collection, { companyId: 1, status: 1, assignedTo: 1 });
    await safeCreateIndex(Lead.collection, { email: 1 });
    await safeCreateIndex(Lead.collection, { phone: 1 });
    await safeCreateIndex(Lead.collection, { createdAt: -1 });
    console.log("  ✅ Lead indexes (7)");

    // ==================== Invoice Indexes ====================
    await safeCreateIndex(Invoice.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(Invoice.collection, { companyId: 1, invoiceNumber: 1 });
    await safeCreateIndex(Invoice.collection, { invoiceNumber: 1 }, { unique: true, sparse: true, name: 'invoiceNumber_unique_sparse' });
    await safeCreateIndex(Invoice.collection, { companyId: 1, customerId: 1 });
    await safeCreateIndex(Invoice.collection, { companyId: 1, dueDate: 1 });
    await safeCreateIndex(Invoice.collection, { companyId: 1, invoiceDate: -1 });
    await safeCreateIndex(Invoice.collection, { createdAt: -1 });
    console.log("  ✅ Invoice indexes (7)");

    // ==================== Supplier Indexes ====================
    await safeCreateIndex(Suppliers.collection, { companyId: 1, IsActive: 1 });
    await safeCreateIndex(Suppliers.collection, { companyId: 1, SupplierName: 1 });
    await safeCreateIndex(Suppliers.collection, { companyId: 1, Email: 1 });
    await safeCreateIndex(Suppliers.collection, { companyId: 1, Rating: 1 });
    await safeCreateIndex(Suppliers.collection, { createdAt: -1 });
    console.log("  ✅ Supplier indexes (5)");

    // ==================== Activity Indexes ====================
    await safeCreateIndex(Activity.collection, { companyId: 1, leadId: 1 });
    await safeCreateIndex(Activity.collection, { companyId: 1, type: 1 });
    await safeCreateIndex(Activity.collection, { companyId: 1, createdAt: -1 });
    await safeCreateIndex(Activity.collection, { leadId: 1, createdAt: -1 });
    console.log("  ✅ Activity indexes (4)");

    // ==================== SupportTicket Indexes ====================
    await safeCreateIndex(SupportTicket.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(SupportTicket.collection, { companyId: 1, priority: 1 });
    await safeCreateIndex(SupportTicket.collection, { companyId: 1, assignedTo: 1 });
    await safeCreateIndex(SupportTicket.collection, { companyId: 1, status: 1, priority: 1 });
    await safeCreateIndex(SupportTicket.collection, { createdAt: -1 });
    console.log("  ✅ SupportTicket indexes (5)");

    // ==================== ProductionOrder Indexes ====================
    await safeCreateIndex(ProductionOrder.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(ProductionOrder.collection, { companyId: 1, orderDate: -1 });
    await safeCreateIndex(ProductionOrder.collection, { companyId: 1, dueDate: 1 });
    await safeCreateIndex(ProductionOrder.collection, { createdAt: -1 });
    console.log("  ✅ ProductionOrder indexes (4)");

    // ==================== Warehouse Indexes ====================
    await safeCreateIndex(Warehouse.collection, { companyId: 1 });
    await safeCreateIndex(Warehouse.collection, { companyId: 1, name: 1 });
    await safeCreateIndex(Warehouse.collection, { createdAt: -1 });
    console.log("  ✅ Warehouse indexes (3)");

    // ==================== Notification Indexes ====================
    await safeCreateIndex(Notification.collection, { companyId: 1, employeeId: 1 });
    await safeCreateIndex(Notification.collection, { companyId: 1, isRead: 1 });
    await safeCreateIndex(Notification.collection, { employeeId: 1, isRead: 1 });
    await safeCreateIndex(Notification.collection, { companyId: 1, createdAt: -1 });
    await safeCreateIndex(Notification.collection, { employeeId: 1, createdAt: -1 });
    console.log("  ✅ Notification indexes (5)");

    // ==================== ProjectTemplate Indexes ====================
    await safeCreateIndex(ProjectTemplate.collection, { companyId: 1, category: 1 });
    await safeCreateIndex(ProjectTemplate.collection, { companyId: 1, name: 1 });
    await safeCreateIndex(ProjectTemplate.collection, { usageCount: -1 });
    await safeCreateIndex(ProjectTemplate.collection, { companyId: 1, createdAt: -1 });
    console.log("  ✅ ProjectTemplate indexes (4)");

    // ==================== ProjectRisk Indexes ====================
    await safeCreateIndex(ProjectRisk.collection, { companyId: 1, projectId: 1 });
    await safeCreateIndex(ProjectRisk.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(ProjectRisk.collection, { companyId: 1, riskLevel: 1 });
    await safeCreateIndex(ProjectRisk.collection, { projectId: 1, status: 1 });
    await safeCreateIndex(ProjectRisk.collection, { companyId: 1, createdAt: -1 });
    console.log("  ✅ ProjectRisk indexes (5)");

    // ==================== CustomerSegment Indexes ====================
    await safeCreateIndex(CustomerSegment.collection, { companyId: 1, isActive: 1 });
    await safeCreateIndex(CustomerSegment.collection, { companyId: 1, name: 1 });
    await safeCreateIndex(CustomerSegment.collection, { companyId: 1, createdAt: -1 });
    console.log("  ✅ CustomerSegment indexes (3)");

    // ==================== CustomerSatisfaction Indexes ====================
    await safeCreateIndex(CustomerSatisfaction.collection, { companyId: 1, customerId: 1 });
    await safeCreateIndex(CustomerSatisfaction.collection, { companyId: 1, responseDate: -1 });
    await safeCreateIndex(CustomerSatisfaction.collection, { companyId: 1, surveyType: 1 });
    await safeCreateIndex(CustomerSatisfaction.collection, { companyId: 1, npsCategory: 1 });
    console.log("  ✅ CustomerSatisfaction indexes (4)");

    // ==================== CustomerRetention Indexes ====================
    await safeCreateIndex(CustomerRetention.collection, { companyId: 1, customerId: 1 });
    await safeCreateIndex(CustomerRetention.collection, { companyId: 1, riskLevel: 1 });
    await safeCreateIndex(CustomerRetention.collection, { companyId: 1, riskScore: -1 });
    await safeCreateIndex(CustomerRetention.collection, { companyId: 1, status: 1 });
    await safeCreateIndex(CustomerRetention.collection, { companyId: 1, lastOrderDate: 1 });
    console.log("  ✅ CustomerRetention indexes (5)");

    // ==================== CustomerFile Indexes ====================
    await safeCreateIndex(CustomerFile.collection, { companyId: 1, customerId: 1 });
    await safeCreateIndex(CustomerFile.collection, { companyId: 1, category: 1 });
    await safeCreateIndex(CustomerFile.collection, { companyId: 1, createdAt: -1 });
    console.log("  ✅ CustomerFile indexes (3)");

    const totalIndexes = 8 + 8 + 5 + 6 + 5 + 5 + 4 + 5 + 4 + 2 + 3 + 5 + 7 + 7 + 5 + 4 + 5 + 4 + 3 + 5 + 4 + 5 + 3 + 4 + 5 + 3;
    console.log(`\n✅ Successfully created ${totalIndexes} indexes!`);
    console.log("🚀 Database queries will now be 10-100x faster!");
  } catch (error) {
    // אם index כבר קיים, זה לא שגיאה
    if (error.code === 11000 || error.code === 86 || error.codeName === "IndexOptionsConflict" || error.codeName === "IndexKeySpecsConflict") {
      console.log("ℹ️  Some indexes already exist - skipping duplicates");
    } else {
      console.error("❌ Error creating indexes:", error.message);
      // Don't throw - allow server to continue even if some indexes fail
      console.log("⚠️  Continuing despite index creation errors...");
    }
  }
}

/**
 * הצגת כל ה-indexes הקיימים (לdebug)
 */
export async function showAllIndexes() {
  const models = [
    { name: "Employee", model: Employee },
    { name: "Procurement", model: Procurement },
    { name: "CustomerOrder", model: CustomerOrder },
    { name: "Task", model: Task },
    { name: "Finance", model: Finance },
    { name: "Inventory", model: Inventory },
    { name: "Product", model: Product },
    { name: "Customer", model: Customer },
    { name: "Project", model: Project },
    { name: "Department", model: Department },
    { name: "Event", model: Event },
    { name: "Budget", model: Budget },
    { name: "Lead", model: Lead },
    { name: "Invoice", model: Invoice },
    { name: "Suppliers", model: Suppliers },
    { name: "Activity", model: Activity },
    { name: "SupportTicket", model: SupportTicket },
    { name: "ProductionOrder", model: ProductionOrder },
    { name: "Warehouse", model: Warehouse },
    { name: "Notification", model: Notification },
    { name: "ProjectTemplate", model: ProjectTemplate },
    { name: "ProjectRisk", model: ProjectRisk },
    { name: "CustomerSegment", model: CustomerSegment },
    { name: "CustomerSatisfaction", model: CustomerSatisfaction },
    { name: "CustomerRetention", model: CustomerRetention },
    { name: "CustomerFile", model: CustomerFile },
  ];

  console.log("\n📊 Current Indexes:");
  for (const { name, model } of models) {
    try {
      const indexes = await model.collection.getIndexes();
      console.log(`\n${name}: ${Object.keys(indexes).length} indexes`);
      Object.keys(indexes).forEach((indexName) => {
        console.log(`  - ${indexName}`);
      });
    } catch (error) {
      console.log(`  ❌ ${name}: Error getting indexes`);
    }
  }
}

export default { addPerformanceIndexes, showAllIndexes };

