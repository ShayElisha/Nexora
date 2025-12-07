import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AuthService } from "../services/auth.service.js";
import { transporter } from "../config/lib/nodemailer.js";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";
import Payment from "../models/payment.model.js";

const CLIENT_URL = process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || "http://localhost:5173";

const buildResetPasswordEmail = (name = "there", resetURL) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; background-color: #f4f6fb;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Hi ${name},</h2>
      <p style="color: #475569; line-height: 1.6;">
        We received a request to reset the password for your Nexora account. If this was you, please click the button below to set a new password. This link will expire in 30 minutes.
      </p>
      <a href="${resetURL}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: linear-gradient(135deg, #2563eb, #6d28d9); color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600;">Reset Password</a>
      <p style="color: #475569; line-height: 1.6;">
        If the button above doesn't work, copy and paste this link into your browser:
        <br />
        <a href="${resetURL}" style="color: #2563eb;">${resetURL}</a>
      </p>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">© ${new Date().getFullYear()} Nexora</p>
  </div>
`;

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
    const hashedPassword = await AuthService.hashPassword(password);

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
    const isMatch = await AuthService.comparePassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const imageURL = user.profileImage ? user.profileImage : "";

    // Generate tokens and set cookies
    const payload = {
      userId: user._id.toString(),
      companyId: user.companyId?.toString(),
      role: user.role,
      imageURL,
      employeeId: user._id.toString(),
    };

    AuthService.setAuthCookies(res, payload);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        employeeId: user._id,
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
  AuthService.clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies["auth_refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Find the user
    const user = await Employee.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      imageURL: decoded.imageURL,
      employeeId: decoded.employeeId,
    });

    res.cookie("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
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
      sameSite: "lax",
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


export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await Employee.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists for that email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const resetURL = `${CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    try {
      await transporter.sendMail({
        to: normalizedEmail,
        from: process.env.EMAIL_USER,
        subject: "Reset your Nexora password",
        html: buildResetPasswordEmail(user.name || "there", resetURL),
      });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw mailError;
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Token, email, and new password are required",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Employee.findOne({
      email: email.trim().toLowerCase(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await AuthService.hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
