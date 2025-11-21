import express from "express";
import * as authController from "../controllers/authController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", authController.patientSignup);
router.post("/register", protect, authorize("ADMIN"), authController.registerUser);
router.post("/login", authController.loginUser);

router.get("/me", protect, authController.getMe);
router.put("/me", protect, authController.updateMe);

router.get("/", protect, authorize("ADMIN"), authController.getAllUsers);
router.get("/:id", protect, authorize("ADMIN"), authController.getUserById);
router.delete("/:id", protect, authorize("ADMIN"), authController.deleteUser);

export default router;
