import express from "express";
import { getCurrentUser, loginUser, logoutUser, userRegistration } from "../controllers/AuthController.js";

const router = express.Router();

router.post("/register", userRegistration);
router.post("/login", loginUser);
router.get("/me", getCurrentUser);
router.post("/logout", logoutUser);

export default router;