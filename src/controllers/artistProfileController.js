import ArtistProfile from "../models/ArtistProfileModel.js";

// Create artist profile
export const createArtistProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      stageName,
      genre,
      type,
      bio,
      experienceYears,
      location,
      socialLinks,
      videos,
      coverImage,
      pricing,
    } = req.body;

    const existingProfile = await ArtistProfile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Artist profile already exists",
      });
    }

    const newProfile = await ArtistProfile.create({
      user: userId,
      stageName,
      genre,
      type,
      bio,
      experienceYears,
      location,
      socialLinks,
      videos,
      coverImage,
      pricing,
    });

    return res.status(201).json({
      success: true,
      message: "Artist profile created successfully",
      profile: newProfile,
    });
  } catch (error) {
    console.error("Error creating artist profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating artist profile",
    });
  }
};

//Get all artist profiles
export const getAllArtistProfiles = async (req, res)=>{
  try {
    const profiles = await ArtistProfile.find().populate("user", "name email role");
    return res.status(200).json({
      success: true,
      profiles
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching artist profiles",
    })
  }
}
// Get artist profile
export const getArtistProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await ArtistProfile.findOne({ user: userId }).populate(
      "user",
      "name email role"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Artist profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching artist profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching artist profile",
    });
  }
};

// Update artist profile
export const updateArtistProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Update payload:", req.body);

    const profile = await ArtistProfile.findOneAndUpdate(
      { user: userId },
      { $set: req.body },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating artist profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating artist profile",
    });
  }
};

// Delete artist profile
export const deleteArtistProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await ArtistProfile.findOneAndDelete({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting artist profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting artist profile",
    });
  }
};

//get artist by id

export const getArtistProfileById = async (req, res)=> {
  try {
    const artistId = req.params.id;
    const profile = await ArtistProfile.findById(artistId).populate("user", "name email role");
    if(!profile){
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });

    }else{
      return res.status(200).json({
        success: true,
        profile
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching artist profile",
    });
  }
}
