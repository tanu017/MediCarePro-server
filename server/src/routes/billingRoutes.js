import express from "express";
import * as billingController from "../controllers/billingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin and Receptionist routes
router.post("/", protect, authorize("ADMIN", "RECEPTIONIST"), billingController.createBill);
router.get("/", protect, authorize("ADMIN", "RECEPTIONIST"), billingController.getAllBills);
router.get("/:id", protect, authorize("ADMIN", "RECEPTIONIST", "PATIENT"), billingController.getBillById);
router.put("/:id", protect, authorize("ADMIN", "RECEPTIONIST"), billingController.updateBill);
router.delete("/:id", protect, authorize("ADMIN"), billingController.deleteBill);

// Patient routes
router.post("/appointment", protect, authorize("PATIENT", "RECEPTIONIST"), billingController.createAppointmentBill);
router.get("/patient/my-bills", protect, authorize("PATIENT"), billingController.getPatientBills);
router.post("/:id/pay", protect, authorize("PATIENT"), billingController.payBill);

// Doctor routes
router.get("/doctor/my-bills", protect, authorize("DOCTOR"), billingController.getDoctorBills);

export default router;
