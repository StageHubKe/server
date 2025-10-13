// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 3️⃣ Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4️⃣ Optionally: check if token matches user's current token in DB
    if (user.token !== token) {
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    // ✅ Attach user info to request
    req.user = user;
    req.userId = user._id.toString(); // controllers need this
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Not authorized" });
  }
};

// Admin middleware
export const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Not Authorized, admin only",
    });
  }
};
