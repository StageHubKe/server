import express from "express";
import { createGigPoster, deleteGigPoster, getAllGigPosters, getGigPosterById, updateGigPoster, updateGigStatus } from "../controllers/GigPosterController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createGigPoster);
router.get("/", getAllGigPosters);
router.get("/:id", getGigPosterById);
router.patch("/status/:id", protect, updateGigStatus);
router.put("/updatePoster/:id", protect, updateGigPoster);
router.delete("/deletePoster/:id", protect, deleteGigPoster);


export default router;
