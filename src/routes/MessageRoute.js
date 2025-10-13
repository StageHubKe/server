import express from "express";
import {
  getConversationMessages,
  getOrCreateConversation,
  getUserConversations,
  getOrCreateConversationWithArtist,
  sendMessage,
  markMessageAsRead,
  getUnreadMessageCount,
} from "../controllers/MessageController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/conversation", protect, getOrCreateConversation);
router.post("/conversation/artist", protect, getOrCreateConversationWithArtist);
router.get("/conversations", protect, getUserConversations);
router.get("/conversation/:conversationId/messages", protect, getConversationMessages);
router.post("/message", protect, sendMessage);
router.put("/message/:messageId/read", protect, markMessageAsRead);
router.get("/unreadCount", protect, getUnreadMessageCount);

export default router;