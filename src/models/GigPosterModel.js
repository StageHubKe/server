import mongoose from "mongoose";

const GigPosterSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "Secular",
        "Religious",
        "Corporate",
        "Wedding",
        "Private",
        "Other",
      ],
    },
    artistCategory: {
      type: String,
      enum: ["Musician", "Comedian", "DJ", "MC", "Band", "Dancer"],
      required: true,
    },

    instrumentsProvided: { type: Boolean, default: false },
    performerEquipment: { type: String, trim: true },
    guestCount: { type: Number, required: true },
    venueAddress: { type: String, required: true, trim: true },
    eventName: { type: String, required: true, trim: true },
    eventDescription: { type: String, required: true, trim: true },
    performanceDuration: { type: String, required: true, trim: true },
    planningStage: {
      type: String,
      required: true,
      enum: [
        "just getting started",
        "finalizing details",
        "ready to hire",
        "ongoing event",
      ],
    },
    budget: { type: Number, required: true, min: 0 },
    eventPlannerName: { type: String, required: true, trim: true },
    contactInfo: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    posterImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "filled"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GigPoster", GigPosterSchema);
