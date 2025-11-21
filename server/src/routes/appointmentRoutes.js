import express from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin and Receptionist routes
router.post("/", protect, authorize("ADMIN", "RECEPTIONIST"), appointmentController.createAppointment);
router.get("/", protect, authorize("ADMIN", "RECEPTIONIST", "DOCTOR"), appointmentController.getAllAppointments);
router.get("/:id", protect, authorize("ADMIN", "RECEPTIONIST", "DOCTOR", "PATIENT"), appointmentController.getAppointmentById);
router.put("/:id", protect, authorize("ADMIN", "RECEPTIONIST"), appointmentController.updateAppointment);
router.put("/:id/cancel", protect, authorize("PATIENT", "RECEPTIONIST"), appointmentController.cancelAppointment);
router.delete("/:id", protect, authorize("ADMIN"), appointmentController.deleteAppointment);

// Patient routes
router.post("/book", protect, authorize("PATIENT"), appointmentController.bookAppointment);
router.get("/patient/my-appointments", protect, authorize("PATIENT"), appointmentController.getPatientAppointments);

// Doctor availability routes
router.get("/availability/:doctorId/:date", protect, appointmentController.getDoctorAvailability);

export default router;