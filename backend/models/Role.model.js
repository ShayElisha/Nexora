import mongoose from "mongoose";
import { permissionSchema } from "./Permission.model.js";

/**
 * Role Schema
 * Defines roles with granular permissions for employees
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    permissions: [permissionSchema], // Embedded permissions
    isDefault: {
      type: Boolean,
      default: false, // Whether this is a default role
    },
    canEdit: {
      type: Boolean,
      default: true, // Whether this role can be edited
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

// Index for efficient queries
roleSchema.index({ companyId: 1, name: 1 }, { unique: true }); // Unique role name per company
roleSchema.index({ companyId: 1, isDefault: 1 });

const Role = mongoose.model("Role", roleSchema);

export default Role;

