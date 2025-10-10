import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import helmet from "helmet";
import morgan  from "morgan";
import authRoutes from "./src/routes/authRoute.js"
import artistProfileRoutes from "./src/routes/artistProfileRoutes.js"

dotenv.config();
const app = express();

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

app.listen(port, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${port}`)
);


