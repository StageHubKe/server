import GigPoster from "../models/GigPosterModel.js";

// Create a new gig poster
export const createGigPoster = async (req, res) => {
  try {
    const {
      eventType,
      artistCategory,
      instrumentsProvided,
      performerEquipment,
      guestCount,
      venueAddress,
      eventName,
      eventDescription,
      performanceDuration,
      planningStage,
      budget,
      eventPlannerName,
      contactInfo,
      eventDate,
      posterImage,
    } = req.body;

    if (
      !eventType ||
      !artistCategory ||
      !guestCount ||
      !venueAddress ||
      !eventName ||
      !eventDescription ||
      !performanceDuration ||
      !planningStage ||
      !budget ||
      !eventPlannerName ||
      !contactInfo ||
      !eventDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields including event date",
      });
    }

    const newGigPoster = new GigPoster({
      eventType,
      artistCategory,
      instrumentsProvided,
      performerEquipment,
      guestCount,
      venueAddress,
      eventName,
      eventDescription,
      performanceDuration,
      planningStage,
      budget,
      eventPlannerName,
      contactInfo,
      eventDate,
      posterImage,
      createdBy: req.user?.id || null,
    });

    await newGigPoster.save();

    res.status(201).json({
      success: true,
      message: "Gig poster created successfully",
      gig: newGigPoster,
    });
  } catch (error) {
    console.error("Error creating gig poster:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating gig poster",
    });
  }
};

// Fetch all gig posters
export const getAllGigPosters = async (req, res) => {
  try {
    const gigs = await GigPoster.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
    res.status(200).json({ success: true, gigs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch gig posters" });
  }
};

// Fetch a single gig poster
export const getGigPosterById = async (req, res) => {
  try {
    const gig = await GigPoster.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }
    res.status(200).json({ success: true, gig });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching gig poster" });
  }
};

// Update gig status
export const updateGigStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const gig = await GigPoster.findById(req.params.id);
    if (!gig)
      return res.status(404).json({ success: false, message: "Gig not found" });

    if (!["active", "filled"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    gig.status = status;
    await gig.save();

    res.status(200).json({ success: true, gig });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

// Update gig poster
export const updateGigPoster = async (req, res) => {
  try {
    const gig = await GigPoster.findById(req.params.id);
    if (!gig) {
      return res
        .status(404)
        .json({ success: false, message: "Gig poster not found" });
    }
    const updateGig = await GigPoster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Gig poster updated successfully",
      updateGig,
    });
  } catch (error) {
    console.log(error, "error updating gig poster");
    return res
      .status(500)
      .json({ success: false, message: "Error updating gig poster" });
  }
};

export const deleteGigPoster = async (req, res)=> {
  try {
    const deleteGig = await GigPoster.findByIdAndDelete(req.params.id);
    return res.status(200).json({success: true, message: "Gig poster deleted successfully", deleteGig});
  } catch (error) {
    console.log(error, "error deleting gig poster");
    return res.status(500).json({ success: false, message: "Error deleting gig poster"});
  }
}
