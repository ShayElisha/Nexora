import mongoose from "mongoose";

/**
 * Permission Schema - Embedded in Role
 * Defines granular permissions at module and action level
 */
const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      enum: [
        "products",
        "suppliers",
        "finance",
        "budgets",
        "procurement",
        "projects",
        "employees",
        "signatures",
        "departments",
        "reports",
        "tasks",
        "customers",
        "events",
        "settings",
        "invoices",
        "inventory",
        "analytics",
        "shifts",
        "salary",
        "ai",
        "roles",
      ],
    },
    actions: {
      type: [String],
      required: true,
      enum: {
        values: ["view", "create", "update", "delete", "approve", "export"],
        message: "Invalid action. Allowed actions: view, create, update, delete, approve, export",
      },
    },
  },
  { _id: false }
);

// Export schema for embedding in Role model
export { permissionSchema };

// Export model for standalone use if needed
const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;

