import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import { sendResetPasswordEmail } from "../utils/resetPass.js";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const userRegistration = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const newUser = new User({ name, email, password });
    const verifyToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    newUser.verifyToken = verifyToken;
    await newUser.save();

    await sendVerificationEmail(email, verifyToken);

    return res.status(200).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email is already verified." });
    }

    if (user.verifyToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    user.isVerified = true;
    user.verifyToken = null;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(400).json({
      success: false,
      message: "Verification failed or link expired.",
    });
  }
};

// LOGIN USER (ONLY IF VERIFIED)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter email and password" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    if (!existingUser.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
 console.log("token:", token);

    existingUser.token = token;
    await existingUser.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -token");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Token expired or invalid" });
  }
};

// LOGOUT USER
export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "No active session found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.token = null;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error during logout" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User with this email does not exist",
        });
    }

    // Generate token valid for 1 hour
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetPasswordEmail(email, resetToken);

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending reset email",
    });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully!",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(400)
      .json({ success: false, message: "Reset link expired or invalid" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body; 
    console.log("Received Google credential:", credential);
    if (!credential)
      return res.status(400).json({ success: false, message: "Missing token" });

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        isVerified: true,
        profilePicture: picture,
        authProvider: "google",
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("google token:", token);

    user.token = token;
    await user.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
