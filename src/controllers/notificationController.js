import Notification from "../models/NotificationModel.js";

// 🟢 Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error fetching notifications" });
  }
};