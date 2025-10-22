import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    eventType: {
      type: String,
      enum: ["concert", "festival", "exhibition", "party", "other"],
      default: "other",
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    image: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
