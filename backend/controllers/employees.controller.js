import Employee from "../models/employees.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";

// Helper function to extract Cloudinary public ID from URL
export const extractPublicId = (url) => {
  const start = url.indexOf("/upload/") + 8;
  let publicIdWithExtension = url.substring(start);
  const versionRegex = /^v\d+\//;
  if (versionRegex.test(publicIdWithExtension)) {
    publicIdWithExtension = publicIdWithExtension.replace(versionRegex, "");
  }
  return publicIdWithExtension.replace(/\.[^/.]+$/, "");
};

// Create a new employee
export const createEmployee = async (req, res) => {
  const data = req.body;

  // Handle file upload
  let profileImageUrl = data.profileImageUrl || "";
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file);
      profileImageUrl = result.secure_url;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error uploading profile image",
        error: error.message,
      });
    }
  }

  // Prepare employee data
  const employeeData = {
    companyId: data.companyId,
    name: data.name,
    lastName: data.lastName,
    gender: data.gender,
    identity: data.identity,
    email: data.email,
    password: await bcrypt.hash(data.password, 10),
    phone: data.phone,
    address: {
      city: data.address?.city,
      street: data.address?.street,
      country: data.address?.country,
      postalCode: data.address?.postalCode,
    },
    role: data.role || "",
    department: data.department || null,
    paymentType: data.paymentType,
    hourlySalary: data.hourlySalary || null,
    globalSalary: data.globalSalary || null,
    expectedHours: data.expectedHours || null,
    profileImage: profileImageUrl,
    status: "active",
  };

  // Validate salary fields based on paymentType
  if (employeeData.paymentType === "Hourly") {
    if (employeeData.hourlySalary == null || employeeData.hourlySalary < 0) {
      return res.status(400).json({
        success: false,
        message:
          "hourlySalary is required and must be non-negative for Hourly payment type",
      });
    }
    employeeData.globalSalary = null;
    employeeData.expectedHours = null;
  } else if (employeeData.paymentType === "Global") {
    if (employeeData.globalSalary == null || employeeData.globalSalary < 0) {
      return res.status(400).json({
        success: false,
        message:
          "globalSalary is required and must be non-negative for Global payment type",
      });
    }
    if (employeeData.expectedHours == null || employeeData.expectedHours < 0) {
      return res.status(400).json({
        success: false,
        message:
          "expectedHours is required and must be non-negative for Global payment type",
      });
    }
    employeeData.hourlySalary = null;
  } else if (employeeData.paymentType === "Commission-Based") {
    employeeData.hourlySalary = null;
    employeeData.globalSalary = null;
    employeeData.expectedHours = null;
  }

  try {
    const employee = new Employee(employeeData);
    await employee.save();
    const populatedEmployee = await Employee.findById(employee._id)
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    res.status(201).json({ success: true, data: populatedEmployee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating employee",
      error: error.message,
    });
  }
};

// Pull all employees
export const getAllEmployees = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken?.companyId;
    const employees = await Employee.find({ companyId })
      .populate("projects.projectId", "name")
      .populate("companyId", "name")
      .populate("department", "name");

    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employees",
      error: error.message,
    });
  }
};

// Pull employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = decodedToken.employeeId;
    const employee = await Employee.findById(id)
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employee",
      error: error.message,
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  const updates = req.body;

  // Log req.file safely
  console.log("req file:", req.file ? req.file.path : "No file uploaded");
  console.log("Updates:", updates);

  // List of allowed fields for updates
  const allowedUpdates = [
    "name",
    "lastName",
    "email",
    "password",
    "address.city",
    "address.street",
    "address.country",
    "address.postalCode",
    "phone",
    "role",
    "profileImage",
    "projects",
    "status",
    "hourlySalary",
    "globalSalary", // Added for new schema
    "expectedHours", // Added for new schema
    "paymentType",
  ];

  // Flatten the updates object to handle nested fields like address
  let flattenedUpdates = {};
  for (let key in updates) {
    if (key === "address" && typeof updates[key] === "object") {
      Object.keys(updates.address).forEach((subKey) => {
        flattenedUpdates[`address.${subKey}`] = updates.address[subKey];
      });
    } else {
      flattenedUpdates[key] = updates[key];
    }
  }

  // Validate that all update fields are allowed
  const isValidUpdate = Object.keys(flattenedUpdates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields" });
  }

  // Validate salary fields based on paymentType
  if (flattenedUpdates.paymentType === "Hourly") {
    if (
      flattenedUpdates.hourlySalary == null ||
      flattenedUpdates.hourlySalary < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "hourlySalary is required and must be non-negative for Hourly payment type",
      });
    }
    // Clear global fields
    flattenedUpdates.globalSalary = null;
    flattenedUpdates.expectedHours = null;
  } else if (flattenedUpdates.paymentType === "Global") {
    if (
      flattenedUpdates.globalSalary == null ||
      flattenedUpdates.globalSalary < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "globalSalary is required and must be non-negative for Global payment type",
      });
    }
    if (
      flattenedUpdates.expectedHours == null ||
      flattenedUpdates.expectedHours < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "expectedHours is required and must be non-negative for Global payment type",
      });
    }
    // Clear hourly field
    flattenedUpdates.hourlySalary = null;
  } else if (flattenedUpdates.paymentType === "Commission-Based") {
    // Clear all salary fields
    flattenedUpdates.hourlySalary = null;
    flattenedUpdates.globalSalary = null;
    flattenedUpdates.expectedHours = null;
  }

  try {
    // Find the existing employee
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Handle password update
    if (flattenedUpdates.password) {
      flattenedUpdates.password = await bcrypt.hash(
        flattenedUpdates.password,
        10
      );
    }

    // Handle profile image update only if a file is provided
    if (req.file) {
      // Delete the old image from Cloudinary if it exists
      if (employee.profileImage) {
        const publicId = extractPublicId(employee.profileImage);
        console.log("publicId:", publicId);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload the new image to Cloudinary
      const result = await uploadToCloudinary(req.file);
      flattenedUpdates.profileImage = result.secure_url;
    }

    // Update the employee in the database
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: flattenedUpdates },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    if (!updatedEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating employee",
      error: error.message,
    });
  }
};

// Soft delete employee by ID
export const deleteEmployee = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Perform soft delete
    employee.status = "deleted";
    employee.deletedAt = new Date();
    await employee.save();

    res
      .status(200)
      .json({ success: true, message: "Employee soft deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error soft deleting employee",
      error: error.message,
    });
  }
};
