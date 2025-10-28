// src/controllers/meetController.js
import dotenv from "dotenv";
dotenv.config(); // Load .env variables at the very top

import { google } from "googleapis";
import Meet from "../models/MeetModel.js";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export const createGoogleMeet = async (req, res) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { topic, startTime, endTime } = req.body;

    const event = {
      summary: topic || `Meeting by ${user.name}`,
      description: "Google Meet auto-created from our platform",
      start: {
        dateTime: startTime || new Date().toISOString(),
        timeZone: "Africa/Nairobi",
      },
      end: {
        dateTime:
          endTime ||
          new Date(new Date().getTime() + 30 * 60 * 1000).toISOString(), // default 30 min
        timeZone: "Africa/Nairobi",
      },
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${user._id}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;
    const newMeet = new Meet({
      creator: user._id,
      meetLink,
      topic: event.summary,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
    });

    await newMeet.save();

    res.status(201).json({
      success: true,
      message: "Google Meet created successfully",
      meetLink,
      event: response.data,
    });
  } catch (error) {
    console.error("Error creating Google Meet:", error);
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: "Google API error",
        error: error.response.data,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create Google Meet",
      error: error.message,
    });
  }
};
