import Bid from "../models/BidModel.js";
import GigPoster from "../models/GigPosterModel.js";
import User from "../models/UserModel.js";

// 🟢 Place a Bid
export const placeBid = async (req, res) => {
  try {
    const { gigId, agreedToBudget, proposedBudget, reason } = req.body;
    const userId = req.user?.id;

    // Ensure userId exists
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: User not found" });
    }

    // Ensure gig exists
    const gig = await GigPoster.findById(gigId).populate(
      "createdBy",
      "name email"
    );
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    // Prevent duplicate bids
    const existingBid = await Bid.findOne({ gig: gigId, bidder: userId });
    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: "You have already placed a bid on this gig",
      });
    }

    // Validate reason and budget
    if (!agreedToBudget && !proposedBudget) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a proposed budget if you disagree with the gig budget",
      });
    }

    if (!agreedToBudget && !reason) {
      return res.status(400).json({
        success: false,
        message: "Reason is required when proposing a different budget",
      });
    }

    // Create bid with conditional reason
    const newBid = await Bid.create({
      gig: gigId,
      bidder: userId,
      agreedToBudget,
      proposedBudget: agreedToBudget ? gig.budget : proposedBudget,
      reason: agreedToBudget ? undefined : reason,
    });

    // Fetch bidder details
    const bidderUser = await User.findById(userId).select("name");
    if (!bidderUser) {
      return res
        .status(404)
        .json({ success: false, message: "Bidder not found" });
    }

    const notificationMessage = `${bidderUser.name} placed a bid on your gig "${gig.eventName}". View profile: /profile/${bidderUser._id}`;

    console.log("Notification:", notificationMessage);

    return res.status(201).json({
      success: true,
      message: "Bid placed successfully and gig poster notified",
      bid: newBid,
    });
  } catch (error) {
    console.error("Error placing bid:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while placing bid" });
  }
};

// 🟡 Get all bids for a specific gig
export const getBidsForGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No user ID provided" });
    }

    // Check if the user is the gig creator
    const gig = await GigPoster.findById(gigId).select("createdBy");
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    if (gig.createdBy.toString() !== userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: You can only view bids for gigs you created",
      });
    }

    const bids = await Bid.find({ gig: gigId })
      .populate("bidder", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bids });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching bids" });
  }
};

// 🔵 Get bids made by a specific user
export const getUserBids = async (req, res) => {
  try {
    const userId = req.user?.id;
    const bids = await Bid.find({ bidder: userId })
      .populate("gig", "eventName budget")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bids });
  } catch (error) {
    console.error("Error fetching user bids:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user bids" });
  }
};

// 🟣 Update bid status (poster approves/rejects)
export const updateBidStatus = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected", "unsuccessful"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bid status" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    bid.status = status;
    await bid.save();

    res.status(200).json({ success: true, message: "Bid status updated", bid });
  } catch (error) {
    console.error("Error updating bid status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating bid" });
  }
};

// 🔴 Get a single bid by ID
export const getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;
    const userId = req.user?.id;

    const bid = await Bid.findById(bidId)
      .populate("bidder", "name email")
      .populate({
        path: "gig",
        select: "eventName budget createdBy",
        populate: { path: "createdBy", select: "_id name email" },
      });

    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    // Authorization: bidder OR gig creator OR user who posted the gig
    const isBidder = bid.bidder?._id?.toString() === userId;
    const isGigCreator = bid.gig?.createdBy?._id?.toString() === userId;
    // user who posted the gig: in this case it's the same as gig.creator, but you can extend if needed
    const isPoster = bid.gig?.createdBy?._id?.toString() === userId;

    if (!isBidder && !isGigCreator && !isPoster) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: You can only view bids you created or bids placed on your gigs.",
      });
    }

    res.status(200).json({ success: true, bid });
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ success: false, message: "Server error fetching bid" });
  }
};


// 🔵 Get all bids received on gigs created by the logged-in user
export const getReceivedBids = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("Logged-in user ID:", userId);

    const gigs = await GigPoster.find({ createdBy: userId }).select("_id");
    console.log("Gigs found:", gigs);

    const gigIds = gigs.map((gig) => gig._id);
    const bids = await Bid.find({ gig: { $in: gigIds } })
      .populate("bidder", "name email")
      .populate("gig", "eventName budget")
      .sort({ createdAt: -1 });

    console.log("Received bids:", bids);

    res.status(200).json({ success: true, bids });
  } catch (error) {
    console.error("Error fetching received bids:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching received bids" });
  }
};
