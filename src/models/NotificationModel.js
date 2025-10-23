import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    bidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bidderName: {
      type: String,
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GigPoster",
    },
    type: {
      type: String,
      enum: ["bid", "message"],
      default: "bid",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);