import express from "express";
import * as adminController from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin dashboard statistics
router.get("/dashboard/stats", protect, authorize("ADMIN"), adminController.getAdminDashboardStats);

// Admin user management
router.get("/users", protect, authorize("ADMIN"), adminController.getAllUsersWithRoles);

export default router;
