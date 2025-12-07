import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Centralized Authentication Service
 * Provides unified authentication methods for both Nexora and SuperAdmin
 */
export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare a password with a hashed password
   */
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT access token (short-lived)
   */
  static generateAccessToken(payload, secret = process.env.JWT_SECRET) {
    return jwt.sign(payload, secret, {
      expiresIn: "15m", // Short-lived access token
    });
  }

  /**
   * Generate JWT refresh token (long-lived)
   */
  static generateRefreshToken(payload, secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) {
    return jwt.sign(payload, secret, {
      expiresIn: "7d", // Long-lived refresh token
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload, accessSecret = process.env.JWT_SECRET, refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) {
    return {
      accessToken: this.generateAccessToken(payload, accessSecret),
      refreshToken: this.generateRefreshToken(payload, refreshSecret),
    };
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token, secret = process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token expired");
      }
      throw new Error("Invalid access token");
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token, secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expired");
      }
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Set authentication cookies (for Nexora)
   */
  static setAuthCookies(res, payload, options = {}) {
    const {
      accessTokenName = "auth_token",
      refreshTokenName = "auth_refresh_token",
      accessTokenExpiry = 15 * 60 * 1000, // 15 minutes
      refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000, // 7 days
    } = options;

    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Set access token cookie
    res.cookie(accessTokenName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: accessTokenExpiry,
    });

    // Set refresh token cookie
    res.cookie(refreshTokenName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Clear authentication cookies
   */
  static clearAuthCookies(res, accessTokenName = "auth_token", refreshTokenName = "auth_refresh_token") {
    res.clearCookie(accessTokenName);
    res.clearCookie(refreshTokenName);
  }

  /**
   * Legacy method for Nexora (backward compatibility)
   */
  static generateLoginToken(userId, companyId, role, imageURL, employeeId, res) {
    const payload = { userId, companyId, role, imageURL, employeeId };
    const token = this.generateAccessToken(payload);

    res.cookie("auth_token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (legacy)
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return token;
  }

  /**
   * Generate company token
   */
  static generateCompanyToken(companyId, res) {
    const token = this.generateAccessToken({ companyId });
    
    res.cookie("company_jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return token;
  }

  /**
   * Generate email approval token
   */
  static generateEmailApprovalToken(companyId, res) {
    const token = this.generateAccessToken({ companyId }, process.env.JWT_SECRET);
    
    res.cookie("email_approved_jwt", token, {
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return token;
  }
}

