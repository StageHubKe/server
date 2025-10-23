// routes/artistProfileRoutes.js
import express from "express";
import {
  createArtistProfile,
  deleteArtistProfile,
  getAllArtistProfiles,
  getArtistProfile,
  getArtistProfileById,
  getArtistProfileByUserId,
  updateArtistProfile,
} from "../controllers/artistProfileController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/createArtistProfile", protect, createArtistProfile);
router.get("/getArtistProfile", protect, getArtistProfile);
router.get("/getAllArtistProfiles", getAllArtistProfiles);
router.get("/getArtistProfileById/:id", getArtistProfileById);
router.put("/updateArtistProfile", protect, updateArtistProfile);
router.delete("/deleteArtistProfile/:id", protect, deleteArtistProfile);
router.get("/getArtistProfileByUserId/:userId", protect, getArtistProfileByUserId);


export default router;
