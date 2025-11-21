import express from "express";
import * as patientController from "../controllers/patientController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN", "RECEPTIONIST"), patientController.createPatient);
router.get("/", protect, authorize("ADMIN", "RECEPTIONIST"), patientController.getAllPatients);
router.get("/:id", protect, authorize("ADMIN", "RECEPTIONIST", "PATIENT"), patientController.getPatientById);
router.put("/:id", protect, authorize("ADMIN", "RECEPTIONIST"), patientController.updatePatient);
router.delete("/:id", protect, authorize("ADMIN"), patientController.deletePatient);

// Patient-specific routes
router.get("/profile/me", protect, authorize("PATIENT"), patientController.getMyProfile);
router.put("/profile/me", protect, authorize("PATIENT"), patientController.updateMyProfile);
router.put("/change-password", protect, authorize("PATIENT"), patientController.changePassword);
router.get("/appointments/me", protect, authorize("PATIENT"), patientController.getMyAppointments);
router.get("/prescriptions/me", protect, authorize("PATIENT"), patientController.getMyPrescriptions);
router.get("/bills/me", protect, authorize("PATIENT"), patientController.getMyBills);
router.get("/dashboard/stats", protect, authorize("PATIENT"), patientController.getDashboardStats);

export default router;
