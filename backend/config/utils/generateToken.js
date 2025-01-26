import jwt from "jsonwebtoken";

export const generateCompanyToken = (companyId, res) => {
  const token = jwt.sign({ companyId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("company_jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // prevent XSS attack cross-site scripting attacks
    sameSite: "strict", // prevent CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
  });
};

export const generateTokenAndSendEmail = (res, companyId) => {
  const token = jwt.sign({ companyId }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("email_approved_jwt", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    httpOnly: true, // prevent XSS attack cross-site scripting attacks
    sameSite: "strict", // prevent CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
  });
};

export const generateLoginToken = (
  userId,
  companyId,
  role,
  imageURL,
  employeeId,
  res
) => {
  const token = jwt.sign(
    { userId, companyId, role, imageURL, employeeId },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  // Set the JWT as a cookie
  res.cookie("auth_token", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // prevent XSS attack cross-site scripting attacks
    sameSite: "strict", // prevent CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
  });
};
