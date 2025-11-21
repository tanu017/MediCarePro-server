import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";

// Create a new doctor (ADMIN only)
export const createDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, specialization, department, yearsOfExperience, availability } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "DOCTOR",
      phone,
    });

    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      department,
      yearsOfExperience,
      availability,
    });

    const populated = await Doctor.findById(doctor._id).populate("userId", "name email role phone");

    res.status(201).json({
      success: true,
      doctor: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("userId", "name email role phone");
    res.status(200).json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId", "name email role phone");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // DOCTOR role can see only their own profile
    if (req.user.role === "DOCTOR" && req.user._id.toString() !== doctor.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access other doctors" });
    }

    res.status(200).json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor (ADMIN only)
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const { name, email, phone, password, specialization, department, yearsOfExperience, availability } = req.body;

    if (name !== undefined) doctor.userId.name = name;
    if (email !== undefined) doctor.userId.email = email;
    if (phone !== undefined) doctor.userId.phone = phone;
    if (password) doctor.userId.password = await bcrypt.hash(password, 10);
    await doctor.userId.save();

    if (specialization !== undefined) doctor.specialization = specialization;
    if (department !== undefined) doctor.department = department;
    if (yearsOfExperience !== undefined) doctor.yearsOfExperience = yearsOfExperience;
    if (availability !== undefined) doctor.availability = availability;

    await doctor.save();

    const populated = await Doctor.findById(doctor._id).populate("userId", "name email role phone");

    res.status(200).json({
      success: true,
      doctor: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete doctor (ADMIN only)
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await User.deleteOne({ _id: doctor.userId });
    await doctor.deleteOne();

    res.status(200).json({
      success: true,
      message: "Doctor and linked user deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor profile (for authenticated doctor)
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate("userId", "name email role phone profileImage");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Combine doctor and user data for frontend
    const profileData = {
      _id: doctor._id,
      name: doctor.userId.name,
      email: doctor.userId.email,
      phone: doctor.userId.phone,
      contactNumber: doctor.contactNumber,
      profileImage: doctor.userId.profileImage,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      availability: doctor.availability,
      department: doctor.department,
      yearsOfExperience: doctor.yearsOfExperience,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    };

    res.status(200).json({
      success: true,
      doctor: profileData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor profile (for authenticated doctor)
export const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate("userId");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const { contactNumber, consultationFee, availability, profileImage } = req.body;

    // Only allow updating specific fields
    if (contactNumber !== undefined) {
      doctor.contactNumber = contactNumber;
    }

    if (consultationFee !== undefined) {
      doctor.consultationFee = consultationFee;
    }

    if (availability !== undefined) {
      doctor.availability = availability;
    }

    if (profileImage !== undefined) {
      doctor.userId.profileImage = profileImage;
    }

    await doctor.save();
    await doctor.userId.save();

    // Return updated profile
    const updatedDoctor = await Doctor.findOne({ userId: req.user._id }).populate("userId", "name email role phone profileImage");

    const profileData = {
      _id: updatedDoctor._id,
      name: updatedDoctor.userId.name,
      email: updatedDoctor.userId.email,
      phone: updatedDoctor.userId.phone,
      contactNumber: updatedDoctor.contactNumber,
      profileImage: updatedDoctor.userId.profileImage,
      specialization: updatedDoctor.specialization,
      qualification: updatedDoctor.qualification,
      experienceYears: updatedDoctor.experienceYears,
      consultationFee: updatedDoctor.consultationFee,
      availability: updatedDoctor.availability,
      department: updatedDoctor.department,
      yearsOfExperience: updatedDoctor.yearsOfExperience,
      createdAt: updatedDoctor.createdAt,
      updatedAt: updatedDoctor.updatedAt
    };

    res.status(200).json({
      success: true,
      doctor: profileData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password (for authenticated doctor)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor's appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      // FIX: Removed the redundant/incorrect populate line.
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor dashboard statistics
export const getDoctorDashboardStats = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's appointments
    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    // Get all appointments for this doctor
    const allAppointments = await Appointment.find({ doctorId: doctor._id });

    // Get unique patients count
    const uniquePatients = await Appointment.distinct("patientId", { doctorId: doctor._id });

    // Get prescriptions written by this doctor
    const prescriptions = await Prescription.find({ doctorId: doctor._id });

    // Calculate consultation hours (assuming 30 minutes per appointment)
    const consultationHours = (allAppointments.length * 0.5).toFixed(1);

    // Get total patients count
    const totalPatients = await Patient.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        todayAppointments: todayAppointments.length,
        totalAppointments: allAppointments.length,
        uniquePatients: uniquePatients.length,
        totalPatients,
        prescriptionsWritten: prescriptions.length,
        consultationHours: parseFloat(consultationHours)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update appointment status (doctor only)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if the appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot update other doctors' appointments" });
    }

    const { status } = req.body;

    if (!status || !['booked', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'booked', 'completed', or 'cancelled'" });
    }

    appointment.status = status;
    await appointment.save();

    // Populate the updated appointment
    const updatedAppointment = await Appointment.findById(appointment._id)
      // FIX: Removed the redundant/incorrect populate line.
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      });

    res.status(200).json({
      success: true,
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available doctors for patients to book appointments
export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name email")
      .select("specialization qualification experienceYears consultationFee availability");

    // Filter out doctors without availability or consultation fee
    const availableDoctors = doctors.filter(doctor =>
      doctor.availability &&
      doctor.availability.length > 0 &&
      doctor.consultationFee > 0
    );

    // Format the response
    const formattedDoctors = availableDoctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.userId.name,
      email: doctor.userId.email,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      availability: doctor.availability
    }));

    res.status(200).json({
      success: true,
      doctors: formattedDoctors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};