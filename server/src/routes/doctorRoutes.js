import express from "express";
import * as doctorController from "../controllers/doctorController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Doctor-specific routes (MUST come before generic /:id routes)
router.get("/profile/me", protect, authorize("DOCTOR"), doctorController.getDoctorProfile);
router.put("/profile/me", protect, authorize("DOCTOR"), doctorController.updateDoctorProfile);
router.put("/change-password", protect, authorize("DOCTOR"), doctorController.changePassword);
router.get("/appointments/me", protect, authorize("DOCTOR"), doctorController.getDoctorAppointments);
router.get("/dashboard/stats", protect, authorize("DOCTOR"), doctorController.getDoctorDashboardStats);
router.put("/appointments/:id", protect, authorize("DOCTOR"), doctorController.updateAppointmentStatus);

// Patient routes
router.get("/available", protect, authorize("PATIENT"), doctorController.getAvailableDoctors);

// Admin routes (generic routes come LAST)
router.post("/", protect, authorize("ADMIN"), doctorController.createDoctor);
router.get("/", protect, authorize("ADMIN", "RECEPTIONIST"), doctorController.getAllDoctors);
router.get("/:id", protect, authorize("ADMIN", "RECEPTIONIST", "DOCTOR"), doctorController.getDoctorById);
router.put("/:id", protect, authorize("ADMIN"), doctorController.updateDoctor);
router.delete("/:id", protect, authorize("ADMIN"), doctorController.deleteDoctor);

export default router;
