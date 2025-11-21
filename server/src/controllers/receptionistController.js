import Receptionist from "../models/Receptionist.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Create a new receptionist (ADMIN only)
export const createReceptionist = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      shift,
      shiftTimings,
      contactNumber,
      qualification,
      department,
      experienceYears,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "RECEPTIONIST",
      phone,
    });

    let autoShiftTimings = shiftTimings;
    if (shift && !shiftTimings) {
      if (shift === "morning") {
        autoShiftTimings = "9:00 AM - 8:00 PM";
      } else if (shift === "night") {
        autoShiftTimings = "8:00 PM - 7:00 AM";
      }
    }

    const receptionist = await Receptionist.create({
      userId: user._id,
      shift,
      shiftTimings: autoShiftTimings,
      contactNumber,
      email,
      qualification,
      department,
      experienceYears,
    });

    const populated = await Receptionist.findById(receptionist._id).populate(
      "userId",
      "name email role phone"
    );

    res.status(201).json({ success: true, receptionist: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all receptionists (ADMIN, DOCTOR can view basic directory)
export const getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find().populate(
      "userId",
      "name email role phone"
    );
    res.status(200).json({ success: true, receptionists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get receptionist by ID
export const getReceptionistById = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.params.id).populate(
      "userId",
      "name email role phone"
    );
    if (!receptionist)
      return res.status(404).json({ message: "Receptionist not found" });

    if (
      req.user.role === "RECEPTIONIST" &&
      req.user._id.toString() !== receptionist.userId._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: Cannot access other receptionists" });
    }

    res.status(200).json({ success: true, receptionist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update receptionist (ADMIN only)
export const updateReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.params.id).populate(
      "userId"
    );
    if (!receptionist)
      return res.status(404).json({ message: "Receptionist not found" });

    const {
      name,
      email,
      phone,
      password,
      shift,
      shiftTimings,
      contactNumber,
      department,
      qualification,
      experienceYears,
    } = req.body;

    // Update the associated User document
    if (name !== undefined) receptionist.userId.name = name;
    if (email !== undefined) receptionist.userId.email = email;
    if (phone !== undefined) receptionist.userId.phone = phone;
    if (password)
      receptionist.userId.password = await bcrypt.hash(password, 10);
    await receptionist.userId.save();

    // Update the Receptionist document
    if (shift !== undefined) {
      receptionist.shift = shift;
      if (shift === "morning") {
        receptionist.shiftTimings = "9:00 AM - 8:00 PM";
      } else if (shift === "night") {
        receptionist.shiftTimings = "8:00 PM - 7:00 AM";
      }
    }
    if (shiftTimings !== undefined && shift === undefined) {
      receptionist.shiftTimings = shiftTimings;
    }
    if (contactNumber !== undefined) receptionist.contactNumber = contactNumber;
    if (email !== undefined) receptionist.email = email;
    if (department !== undefined) receptionist.department = department;
    if (qualification !== undefined) receptionist.qualification = qualification;
    if (experienceYears !== undefined)
      receptionist.experienceYears = experienceYears;

    await receptionist.save();

    const populated = await Receptionist.findById(receptionist._id).populate(
      "userId",
      "name email role phone"
    );
    res.status(200).json({ success: true, receptionist: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete receptionist (ADMIN only)
export const deleteReceptionist = async (req, res) => {
  try {
    const receptionist = await Receptionist.findById(req.params.id);
    if (!receptionist)
      return res.status(404).json({ message: "Receptionist not found" });

    await User.deleteOne({ _id: receptionist.userId });
    await receptionist.deleteOne();

    res
      .status(200)
      .json({
        success: true,
        message: "Receptionist and linked user deleted successfully",
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get receptionist profile (RECEPTIONIST only)
export const getProfile = async (req, res) => {
  try {
    const receptionist = await Receptionist.findOne({
      userId: req.user._id,
    }).populate("userId", "name email role phone profileImage");
    if (!receptionist)
      return res.status(404).json({ message: "Receptionist profile not found" });

    const profileData = {
      _id: receptionist._id,
      name: receptionist.userId.name,
      email: receptionist.userId.email,
      phone: receptionist.userId.phone,
      profileImage:
        receptionist.userId.profileImage || receptionist.profileImage,
      contactNumber: receptionist.contactNumber,
      qualification: receptionist.qualification,
      department: receptionist.department,
      experienceYears: receptionist.experienceYears,
      shift: receptionist.shift,
      shiftTimings: receptionist.shiftTimings,
      address: receptionist.address,
      workSchedule: receptionist.workSchedule,
      createdAt: receptionist.createdAt,
      updatedAt: receptionist.updatedAt,
    };

    res.status(200).json({ success: true, ...profileData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update receptionist profile (RECEPTIONIST only)
export const updateProfile = async (req, res) => {
  try {
    const receptionist = await Receptionist.findOne({
      userId: req.user._id,
    }).populate("userId");
    if (!receptionist)
      return res.status(404).json({ message: "Receptionist profile not found" });

    const {
      contactNumber,
      qualification,
      department,
      experienceYears,
      profileImage,
      address,
      workSchedule,
    } = req.body;

    if (contactNumber !== undefined) receptionist.contactNumber = contactNumber;
    if (qualification !== undefined)
      receptionist.qualification = qualification;
    if (department !== undefined) receptionist.department = department;

    // This line correctly assigns the value without any math.
    // The bug you are experiencing means an old version of this file is running on your server.
    if (experienceYears !== undefined) {
        receptionist.experienceYears = experienceYears;
    }

    if (address !== undefined) receptionist.address = address;
    if (workSchedule !== undefined) receptionist.workSchedule = workSchedule;

    if (profileImage !== undefined) {
      receptionist.userId.profileImage = profileImage;
      await receptionist.userId.save();
    }

    await receptionist.save();
    
    // To ensure the front-end gets the latest data, we re-fetch and send it back
    const updatedReceptionist = await Receptionist.findOne({
      userId: req.user._id,
    }).populate("userId", "name email role phone profileImage");

    const profileData = {
      _id: updatedReceptionist._id,
      name: updatedReceptionist.userId.name,
      email: updatedReceptionist.userId.email,
      phone: updatedReceptionist.userId.phone,
      profileImage: updatedReceptionist.userId.profileImage,
      contactNumber: updatedReceptionist.contactNumber,
      qualification: updatedReceptionist.qualification,
      department: updatedReceptionist.department,
      experienceYears: updatedReceptionist.experienceYears,
      shift: updatedReceptionist.shift,
      shiftTimings: updatedReceptionist.shiftTimings,
      address: updatedReceptionist.address,
      workSchedule: updatedReceptionist.workSchedule,
      createdAt: updatedReceptionist.createdAt,
      updatedAt: updatedReceptionist.updatedAt,
    };

    res.status(200).json({ success: true, receptionist: profileData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password (RECEPTIONIST only)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};