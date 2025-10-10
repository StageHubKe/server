// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.token !== token) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Not authorized" });
  }
};


export const adminOnly = async(req, res, next)=>{
  if(req.user && req.user.role === "admin"){
    next();
  }else{
    return res.status(403).json({
      success: false,
      message: "Not Authorized, admin only",
    })
  }
}
