import Joi from "joi";

export const companyValidationSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      "any.required": "Phone is required",
      "string.pattern.base": "Invalid phone number format",
    }),
  website: Joi.string().uri().optional().messages({
    "string.uri": "Invalid website URL",
  }),
  logo: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().required().messages({
      "any.required": "Street is required",
    }),
    city: Joi.string().required().messages({
      "any.required": "City is required",
    }),
    state: Joi.string().optional(),
    postalCode: Joi.string()
      .pattern(/^[A-Za-z0-9\s\-]{3,10}$/)
      .messages({
        "string.pattern.base": "Invalid postal code format",
      }),
    country: Joi.string().required().messages({
      "any.required": "Country is required",
    }),
  })
    .required()
    .messages({
      "any.required": "Address is required",
    }),
  industry: Joi.string()
    .valid(
      "Technology",
      "Retail",
      "Finance",
      "Healthcare",
      "Education",
      "Real Estate",
      "Manufacturing",
      "Other"
    )
    .required()
    .messages({
      "any.required": "Industry is required",
      "any.only": "Invalid industry type",
    }),
  taxId: Joi.string()
    .pattern(/^\d{9}$/)
    .required()
    .messages({
      "any.required": "Tax ID is required",
      "string.pattern.base": "Invalid Tax ID format",
    }),
});
