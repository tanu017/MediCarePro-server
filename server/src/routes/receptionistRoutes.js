import express from "express";
import * as receptionistController from "../controllers/receptionistController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), receptionistController.createReceptionist);
router.get("/", protect, authorize("ADMIN", "DOCTOR"), receptionistController.getAllReceptionists);
router.get("/profile", protect, authorize("RECEPTIONIST"), receptionistController.getProfile);
router.put("/profile", protect, authorize("RECEPTIONIST"), receptionistController.updateProfile);
router.put("/change-password", protect, authorize("RECEPTIONIST"), receptionistController.changePassword);
router.get("/:id", protect, authorize("ADMIN", "DOCTOR", "RECEPTIONIST"), receptionistController.getReceptionistById);
router.put("/:id", protect, authorize("ADMIN"), receptionistController.updateReceptionist);
router.delete("/:id", protect, authorize("ADMIN"), receptionistController.deleteReceptionist);

export default router;


