import express from "express";
import {
  placeBid,
  getBidsForGig,
  getUserBids,
  updateBidStatus,
  getBidById,
  getReceivedBids,
} from "../controllers/BidController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/place", protect, placeBid);
router.get("/gig/:gigId", protect, getBidsForGig);
router.get("/my-bids", protect, getUserBids);
router.put("/:bidId/status", protect, updateBidStatus);
router.get("/received-bids", protect, getReceivedBids);
router.get("/:bidId", protect, getBidById);

export default router;