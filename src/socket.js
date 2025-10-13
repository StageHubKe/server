import { Server } from "socket.io";
import Message from "./models/MessageModel.js";
import Conversation from "./models/ConversationModel.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Map of userId -> socket.id
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // User connected
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);

      // Emit online status to everyone
      io.emit("user_status", { userId, online: true });
      console.log(`✅ User ${userId} connected`);
    });

    // Send a message
    socket.on("send_message", async ({ conversationId, senderId, text }) => {
      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          text,
          read: false,
        });

        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversationId,
          { lastMessage: text, updatedAt: Date.now() },
          { new: true }
        ).populate("participants", "name email");

        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "name email"
        );

        const conversation = await Conversation.findById(conversationId);
        conversation.participants.forEach(async (participantId) => {
          io.to(participantId.toString()).emit("receive_message", populatedMessage);
          io.to(participantId.toString()).emit(
            "conversation_updated",
            updatedConversation
          );

          // Emit updated unread count
          const unreadCount = await Message.countDocuments({
            conversation: { $in: [conversationId] },
            sender: { $ne: participantId },
            read: false,
          });
          io.to(participantId.toString()).emit("unread_count_updated", {
            count: unreadCount,
          });
        });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Mark message as read
    socket.on("mark_as_read", async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        message.read = true;
        await message.save();

        const conversation = await Conversation.findById(message.conversation);
        conversation.participants.forEach(async (participantId) => {
          io.to(participantId.toString()).emit("message_read", {
            messageId,
            conversationId: message.conversation,
          });

          // Update unread count
          const unreadCount = await Message.countDocuments({
            conversation: { $in: [message.conversation] },
            sender: { $ne: participantId },
            read: false,
          });
          io.to(participantId.toString()).emit("unread_count_updated", {
            count: unreadCount,
          });
        });
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    });

    // User disconnected
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          // Emit user_status for offline
          io.emit("user_status", { userId, online: false });
          console.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};
