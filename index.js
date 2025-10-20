import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import helmet from "helmet";
import morgan  from "morgan";
import authRoutes from "./src/routes/authRoute.js"
import artistProfileRoutes from "./src/routes/artistProfileRoutes.js"
import messageRoutes from "./src/routes/MessageRoute.js";
import gigPosterRoutes from "./src/routes/gigPosterRoutes.js";
import bidRoutes from "./src/routes/bidRoutes.js";
import notificationsRoutes from "./src/routes/notificationRoute.js";

import { setupSocket } from "./src/socket.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


const port = process.env.PORT || 5000;

connectDB();
app.use("/api/auth", authRoutes);
app.use("/api/artistProfile", artistProfileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/gigposter", gigPosterRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/notifications", notificationsRoutes);

const io = setupSocket(server);
app.set("socketio", io);


server.listen(port, "0.0.0.0", () =>
  console.log(`🚀 Server + Socket.IO running on port ${port}`)
);



