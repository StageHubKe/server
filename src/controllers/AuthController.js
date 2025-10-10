import bcrypt from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
export const userRegistration = async (req, res) => {
  const { name, email, password} = req.body;
  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const newUser = await User.create({
      name,
      email,
      password,
    });
    await newUser.save();
    return res.status(200).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.log("error registering user", error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password",
      });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }
    // Generate JWT Token
    const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Save token in DB
    existingUser.token = token;
    await existingUser.save();

    //Send token via HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      success: true,
      message: "User Logged in successfully",
      token,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -token");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Token expired or invalid" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    // If no token is found, the user is not logged in
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove token from database
    user.token = null;
    await user.save();

    // Clear the HTTP-only cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

