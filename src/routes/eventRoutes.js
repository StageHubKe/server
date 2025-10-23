import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
  updateEvent,
} from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createEvent); 
router.put("/update/:id", protect, updateEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById); 
router.delete("/:id", protect, deleteEvent); 


export default router;
