import express from "express";
import * as prescriptionController from "../controllers/prescriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient routes
router.get("/patient/my-prescriptions", protect, authorize("PATIENT"), prescriptionController.getPatientPrescriptions);

// Admin and Doctor routes
router.post("/", protect, authorize("ADMIN", "DOCTOR"), prescriptionController.createPrescription);
router.get("/", protect, authorize("ADMIN", "RECEPTIONIST", "DOCTOR"), prescriptionController.getAllPrescriptions);
router.get("/:id", protect, authorize("ADMIN", "RECEPTIONIST", "DOCTOR", "PATIENT"), prescriptionController.getPrescriptionById);
router.put("/:id", protect, authorize("ADMIN", "DOCTOR"), prescriptionController.updatePrescription);
router.delete("/:id", protect, authorize("ADMIN"), prescriptionController.deletePrescription);

export default router;


