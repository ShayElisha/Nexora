import { body, validationResult } from "express-validator";
import Companies from "../models/companies.model.js"; // Adjust the import path to your actual Companies model

// Middleware for validation
export const validateCompany = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (value) => {
      const existingCompany = await Companies.findOne({ email: value });
      if (existingCompany) {
        throw new Error("Company with this email already exists");
      }
    }),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  body("website")
    .optional()
    .matches(
      /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    )
    .withMessage("Invalid website format"),
  body("taxId")
    .notEmpty()
    .withMessage("Tax ID is required")
    .matches(/^\d{9}$/)
    .withMessage("Invalid Tax ID format")
    .custom(async (value) => {
      const existingCompany = await Companies.findOne({ taxId: value });
      if (existingCompany) {
        throw new Error("Company with this tax ID already exists");
      }
    }),
  body("industry").notEmpty().withMessage("Industry is required"),
  body("address.street").notEmpty().withMessage("Street is required"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("address.country").notEmpty().withMessage("Country is required"),

  // Handle validation errors
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Extract the first error message only
      const firstError = errors.array()[0].msg;

      return res.status(400).json({
        success: false,
        error: firstError, // Return only the error message
      });
    }
    next();
  },
];
