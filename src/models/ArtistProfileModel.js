import mongoose from "mongoose";

const artistProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stageName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    experienceYears: {
      type: Number,
    },
    location: {
      type: String,
    },
    socialLinks: {
      instagram: { type: String },
      twitter: { type: String },
      youtube: { type: String },
      tiktok: { type: String },
    },
    videos: [
      {
        url: { type: String },
        title: { type: String },
        description: { type: String },
      },
    ],
    coverImage: {
      type: String,
    },
    availability: {
      type: String,
      enum: ["available", "booked", "unavailable"],
      default: "available",
    },
    pricing: {
      minRate: { type: Number },
      maxRate: { type: Number },
      currency: { type: String, default: "USD" },
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ArtistProfile = mongoose.model("ArtistProfile", artistProfileSchema);
export default ArtistProfile;
