import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import { createGoogleMeet } from "../controllers/MeetsController.js";

const router = express.Router();

router.post("/create", protect, createGoogleMeet);

export default router;
