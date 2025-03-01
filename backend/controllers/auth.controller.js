import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateLoginToken } from "../config/utils/generateToken.js";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";

export const signUp = async (req, res) => {
  try {
    const {
      name,
      lastName,
      email,
      password,
      role,
      gender,
      identity,
      phone,
      department,
      address,
    } = req.body;

    const profileImageFile = req.file;

    // בדיקה בסיסית שכל השדות ההכרחיים מולאו
    if (
      !name ||
      !lastName ||
      !email ||
      !gender ||
      !identity ||
      !password ||
      !phone ||
      !address
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required ",
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
        message: "Address must include street, city, postal code and country",
      });
    }

    // העלאת התמונה לענן (Cloudinary למשל) אם נשלחה
    let profileImageURL = "";
    if (profileImageFile) {
      try {
        const imageResult = await uploadToCloudinary(profileImageFile);
        profileImageURL = imageResult.url;
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        return res.status(500).json({
          success: false,
          message: "Error uploading image to Cloudinary",
        });
      }
    }

    // ========================
    // שליפת מזהה החברה (companyId)
    // ========================
    let companyId;

    // 1) קודם כל בודקים אם הוא מגיע דרך ה־Query Param / Param
    //    למשל /sign-up/:companyId או /sign-up?companyId=xxx
    companyId =
      req.params.companyId || req.query.companyId || req.body.companyId;
    console.log("companyId:", companyId);

    // 2) אם לא הגיע companyId בפרמטרים, נבדוק אם יש Token עם companyId
    if (!companyId) {
      const token =
        req.cookies["email_approved_jwt"] || req.cookies["auth_token"];

      // אם אין טוקן – לא נוכל לשלוף מזהה חברה ונחזיר שגיאה
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
        return res
          .status(401)
          .json({ success: false, message: "Invalid token" });
      }
    }

    // עכשיו companyId אמור להיות מוגדר אם הגיע מטוקן או מהלינק
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "No company ID provided" });
    }

    // שליפת החברה מה־DB לבדיקה
    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // בדיקת סטטוס חברה, במידה ורלוונטי
    if (company.status !== "Active") {
      return res
        .status(403)
        .json({ success: false, message: "Company is not approved yet" });
    }

    // בדיקה אם כבר קיים מנהל (Admin) תחת החברה הזו
    const existingAdmin = await Employee.findOne({ companyId, role: "Admin" });
    if (existingAdmin && role === "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin already exists for this company",
      });
    }

    // בדיקה האם המייל הזה כבר תפוס תחת אותה חברה
    const existingUser = await Employee.findOne({ companyId, email, identity });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists under this company",
      });
    }

    // Hashing לסיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // יצירת עובד חדש
    const newEmployee = new Employee({
      companyId,
      name,
      lastName,
      email,
      gender,
      identity,
      password: hashedPassword,
      department,
      role,
      phone,
      address,
      profileImage: profileImageURL,
    });

    await newEmployee.save();

    // ניקוי הטוקן (אם קיים) של אימות המייל
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
      },
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
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
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        profileImage: user.profileImage,
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
    // User is already attached to req by protectRoute middleware
    const user = req.user;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        employeeId: user._id,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: user.companyId,
        profileImage: user.profileImage,
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
