import mongoose from "mongoose";

const BidSchema = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GigPoster",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agreedToBudget: {
      type: Boolean,
      default: false,
    },
    proposedBudget: {
      type: Number,
      required: function () {
        return !this.agreedToBudget;
      },
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bid", BidSchema);
