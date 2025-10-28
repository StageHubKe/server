import mongoose from "mongoose";

const MeetSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    meetLink: { type: String, required: true },
    topic: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Meet", MeetSchema);
