import Conversation from "../models/ConversationModel.js";
import Message from "../models/MessageModel.js";
import ArtistProfile from "../models/ArtistProfileModel.js";
import mongoose from "mongoose";

export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { participantId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ msg: "Valid participantId is required" });
    }
    if (participantId === userId) {
      return res.status(400).json({ msg: "Cannot create conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    }).populate("participants", "name email");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, participantId],
      });
      await conversation.populate("participants", "name email");
    }

    res.status(200).json({ conversation });
  } catch (err) {
    console.error("Error in getOrCreateConversation:", {
      error: err.message,
      stack: err.stack,
      userId: req.userId,
      participantId: req.body.participantId,
    });
    res.status(500).json({ message: "Server error creating conversation" });
  }
};

export const getOrCreateConversationWithArtist = async (req, res) => {
  try {
    const userId = req.userId;
    const { artistId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid or missing userId:", userId);
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!artistId || !mongoose.Types.ObjectId.isValid(artistId)) {
      console.error("Invalid or missing artistId:", artistId);
      return res.status(400).json({ msg: "Valid artistId is required" });
    }

    const artist = await ArtistProfile.findById(artistId).populate("user");
    if (!artist) {
      console.error("Artist not found for artistId:", artistId);
      return res.status(404).json({ msg: "Artist not found" });
    }
    if (!artist.user || !artist.user._id || !mongoose.Types.ObjectId.isValid(artist.user._id)) {
      console.error("Artist user missing or invalid for artistId:", artistId, "User:", artist.user);
      return res.status(404).json({ msg: "Associated user not found for artist" });
    }

    const participantId = artist.user._id.toString();
    if (participantId === userId) {
      return res.status(400).json({ msg: "Cannot create conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    }).populate("participants", "name email");

    if (!conversation) {
      console.log("Creating new conversation with participants:", [userId, participantId]);
      conversation = await Conversation.create({
        participants: [userId, participantId],
      });
      await conversation.populate("participants", "name email");
    } else {
      console.log("Found existing conversation:", conversation._id);
    }

    res.status(200).json({ conversation });
  } catch (err) {
    console.error("Error in getOrCreateConversationWithArtist:", {
      error: err.message,
      stack: err.stack,
      userId,
      artistId,
      artist: artist ? { _id: artist._id, user: artist.user } : null,
    });
    res.status(500).json({ message: "Server error creating conversation" });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email")
      .sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (err) {
    console.error("Error in getUserConversations:", {
      error: err.message,
      stack: err.stack,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error fetching conversations" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: "Valid conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email");

    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error("Error in getConversationMessages:", {
      error: err.message,
      stack: err.stack,
      conversationId: req.params.conversationId,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ message: "conversationId, senderId, and text are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Valid conversationId and senderId are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      read: false,
    });

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: text,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("participants", "name email");

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email");

    const io = req.app.get("socketio");
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit("receive_message", populatedMessage);
      io.to(participantId.toString()).emit("conversation_updated", updatedConversation);
    });

    res.status(201).json({ message: populatedMessage });
  } catch (err) {
    console.error("Error in sendMessage:", {
      error: err.message,
      stack: err.stack,
      conversationId: req.body.conversationId,
      senderId: req.body.senderId,
    });
    res.status(500).json({ message: "Server error sending message" });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Valid messageId is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.read = true;
    await message.save();

    const io = req.app.get("socketio");
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit("message_read", {
        messageId,
        conversationId: message.conversation,
      });
    });

    res.status(200).json({ message: "Message marked as read" });
  } catch (err) {
    console.error("Error in markMessageAsRead:", {
      error: err.message,
      stack: err.stack,
      messageId: req.params.messageId,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error marking message as read" });
  }
};

export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }

    const conversations = await Conversation.find({ participants: userId });
    const conversationIds = conversations.map((conv) => conv._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: userId },
      read: false,
    });

    res.status(200).json({ count: unreadCount });
  } catch (err) {
    console.error("Error in getUnreadMessageCount:", {
      error: err.message,
      stack: err.stack,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error fetching unread message count" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: "Valid conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Not authorized to delete this conversation" });
    }
    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);
    const io = req.app.get("socketio");
    conversation.participants.forEach((participantId) => {
      io.to(participantId.toString()).emit("conversation_deleted", { conversationId });
    });

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error("Error in deleteConversation:", {
      error: err.message,
      stack: err.stack,
      conversationId: req.params.conversationId,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error deleting conversation" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Valid messageId is required" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.text = text;
    message.updatedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(messageId).populate("sender", "name email");

    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      conversation.lastMessage = text;
      conversation.updatedAt = new Date();
      await conversation.save();

      const io = req.app.get("socketio");
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("message_updated", populatedMessage);
        io.to(participantId.toString()).emit("conversation_updated", conversation);
      });
    }

    res.status(200).json({ message: populatedMessage });
  } catch (err) {
    console.error("Error in editMessage:", {
      error: err.message,
      stack: err.stack,
      messageId: req.params.messageId,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error editing message" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ msg: "Invalid or missing user ID in request" });
    }
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ msg: "Valid messageId is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    const conversationId = message.conversation;
    await Message.findByIdAndDelete(messageId);

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const latestMessage = await Message.findOne({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .limit(1);
      conversation.lastMessage = latestMessage ? latestMessage.text : undefined;
      conversation.updatedAt = new Date();
      await conversation.save();

      const io = req.app.get("socketio");
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("message_deleted", { messageId, conversationId });
        io.to(participantId.toString()).emit("conversation_updated", conversation);
      });
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error in deleteMessage:", {
      error: err.message,
      stack: err.stack,
      messageId: req.params.messageId,
      userId: req.userId,
    });
    res.status(500).json({ message: "Server error deleting message" });
  }
};