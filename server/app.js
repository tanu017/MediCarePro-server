import express from "express";
import cors from "cors";
import morgan from "morgan";

import errorMiddleware from "./src/middleware/errorMiddleware.js";
import authRoutes from "./src/routes/authRoutes.js"
import patientRoutes from "./src/routes/patientRoutes.js";
import doctorRoutes from "./src/routes/doctorRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import billingRoutes from "./src/routes/billingRoutes.js";
import prescriptionRoutes from "./src/routes/prescriptionRoutes.js";
import receptionistRoutes from "./src/routes/receptionistRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

const app = express();

// ====================================================
// UPDATED CORS CONFIGURATION
// ====================================================
app.use(cors({
  origin: [
    "http://localhost:5173",             // Your local Vite frontend
    "http://localhost:3000",             // React default (backup)
    "https://your-project-name.vercel.app" // ⚠️ REPLACE THIS later with your actual Vercel URL
  ],
  credentials: true // Allows cookies/headers to be sent
}));

//  Global Middlewares
app.use(express.json());          // parse JSON request bodies
app.use(morgan("dev"));           // logging requests

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/admin", adminRoutes);

//  Health check route (Perfect for Render!)
app.get("/", (req, res) => {
  res.send("Hospital Management API is running 🚑");
});

app.use(errorMiddleware);

export default app;