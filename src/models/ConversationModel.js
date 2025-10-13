import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "At least one participant is required"],
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

conversationSchema.pre("save", function (next) {
  if (this.participants.length < 2) {
    return next(new Error("Conversation must have at least two participants"));
  }
  next();
});

export default mongoose.model("Conversation", conversationSchema);