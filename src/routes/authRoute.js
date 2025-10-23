import express from "express";
import { forgotPassword, getCurrentUser, googleAuth, loginUser, logoutUser, resetPassword, userRegistration, verifyEmail } from "../controllers/AuthController.js";

const router = express.Router();

router.post("/register", userRegistration);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.get("/me", getCurrentUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleAuth);


export default router;