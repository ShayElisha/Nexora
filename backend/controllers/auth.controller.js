import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateLoginToken } from "../config/utils/generateToken.js";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";
import Payment from "../models/payment.model.js";

export const signUp = async (req, res) => {
  try {
    const {
      name,
      lastName,
      email,
      password,
      gender,
      identity,
      phone,
      department,
      dateOfBirth,
      address,
      role,
      paymentType,
      hourlySalary,
      globalSalary,
      expectedHours,
    } = req.body;

    const profileImageFile = req.file;
    const profileImageUrl = req.body.profileImageUrl || "";

    // Basic validation for required fields
    if (
      !name ||
      !lastName ||
      !email ||
      !gender ||
      !identity ||
      !dateOfBirth ||
      !password ||
      !phone ||
      !address ||
      !paymentType
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (
      !address.street ||
      !address.city ||
      !address.country ||
      !address.postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Address must include street, city, country, and postal code",
      });
    }

    // Validate paymentType and salary fields
    if (!["Hourly", "Global", "Commission-Based"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    if (paymentType === "Hourly") {
      if (hourlySalary == null || hourlySalary < 0) {
        return res.status(400).json({
          success: false,
          message:
            "hourlySalary is required and must be non-negative for Hourly payment type",
        });
      }
    } else if (paymentType === "Global") {
      if (globalSalary == null || globalSalary < 0) {
        return res.status(400).json({
          success: false,
          message:
            "globalSalary is required and must be non-negative for Global payment type",
        });
      }
      if (expectedHours == null || expectedHours < 0) {
        return res.status(400).json({
          success: false,
          message:
            "expectedHours is required and must be non-negative for Global payment type",
        });
      }
    }

    // Handle profile image upload
    let finalProfileImageUrl = profileImageUrl;
    if (profileImageFile) {
      try {
        const imageResult = await uploadToCloudinary(profileImageFile);
        finalProfileImageUrl = imageResult.url;
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        return res.status(500).json({
          success: false,
          message: "Error uploading image to Cloudinary",
        });
      }
    }

    // Resolve companyId
    let companyId =
      req.params.companyId || req.query.companyId || req.body.companyId;

    if (!companyId) {
      const token =
        req.cookies["email_approved_jwt"] || req.cookies["auth_token"];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - No token or companyId provided",
        });
      }

      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        companyId = decodedToken.companyId;
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "No company ID provided",
      });
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check company status
    if (company.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Company is not approved yet",
      });
    }

    // Check for existing admin
    const existingAdmin = await Employee.findOne({ companyId, role: "Admin" });
    if (existingAdmin && role === "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin already exists for this company",
      });
    }

    // Check for duplicate email or identity
    const existingUser = await Employee.findOne({ companyId, email, identity });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or identity already exists under this company",
      });
    }

    // Set role to Admin for the first employee
    let finalRole = role || "";
    const firstEmp = await Employee.find({ companyId });
    if (firstEmp.length === 0) {
      finalRole = "Admin";
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new employee
    const newEmployee = new Employee({
      companyId,
      name,
      lastName,
      email,
      gender,
      identity,
      password: hashedPassword,
      department: department || null,
      role: finalRole,
      phone,
      dateOfBirth,
      address,
      profileImage: finalProfileImageUrl,
      paymentType,
      hourlySalary: paymentType === "Hourly" ? hourlySalary : null,
      globalSalary: paymentType === "Global" ? globalSalary : null,
      expectedHours: paymentType === "Global" ? expectedHours : null,
      status: "active",
    });

    await newEmployee.save();

    // Clear email approval token if present
    if (req.cookies["email_approved_jwt"]) {
      res.clearCookie("email_approved_jwt");
    }

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      Employee: {
        name: newEmployee.name,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        role: newEmployee.role,
        companyId: newEmployee.companyId,
        paymentType: newEmployee.paymentType,
      },
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Find the user by email
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const imageURL = user.profileImage ? user.profileImage : "";

    // Generate a JWT token and set cookie
    generateLoginToken(
      user._id,
      user.companyId,
      user.role,
      imageURL,
      user._id,
      res
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        employeeId: user._Id,
        lastName: user.lastName || null,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null,
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const logout = (req, res) => {
  res.clearCookie("auth_token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // בדוק אם יש companyId לפני חיפוש ב-Payment
    const pack = user.companyId
      ? await Payment.findOne({ companyId: user.companyId })
      : null;
    console.log("User:", user);
    console.log("Payment:", pack);

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        employeeId: user._id,
        lastName: user.lastName || null,
        email: user.email,
        role: user.role,
        company: user.companyId || null,
        profileImage: user.profileImage,
        pack: pack?.planName || null,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const switchCompany = async (req, res) => {
  try {
    const { newCompanyId } = req.body; // מזהה החברה החדשה
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const userInCompany = await Employee.findOne({
      email: decodedToken.email,
      companyId: newCompanyId,
    });

    if (!userInCompany) {
      return res.status(404).json({
        success: false,
        message: "User not found in the selected company",
      });
    }

    const updatedToken = jwt.sign(
      {
        email: userInCompany.email,
        companyId: newCompanyId,
        employeeId: userInCompany._id,
        role: userInCompany.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("auth_token", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ success: true, message: "Switched company successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error switching company",
      error: error.message,
    });
  }
};
