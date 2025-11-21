import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Billing from "../models/Billing.js";
import bcrypt from "bcryptjs";

// Create a new patient (ADMIN or RECEPTIONIST)
export const createPatient = async (req, res) => {
  try {
    // FIX: Added 'contactNumber' to the destructuring
    const { name, email, password, phone, dateOfBirth, gender, address, bloodGroup, medicalHistory, emergencyContact, contactNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "PATIENT",
      phone,
    });

    let parsedAddress = address;
    if (typeof address === 'string' && address.trim()) {
      const addressParts = address.split(',').map(part => part.trim());
      parsedAddress = { street: addressParts[0] || '', city: addressParts[1] || '', state: addressParts[2] || '', pincode: addressParts[3] || '' };
    }

    const patient = await Patient.create({
      userId: user._id,
      dateOfBirth,
      gender,
      address: parsedAddress,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      contactNumber, // FIX: Added 'contactNumber' to the create method
    });

    const populated = await Patient.findById(patient._id).populate("userId", "name email role phone");

    res.status(201).json({
      success: true,
      patient: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all patients (ADMIN, RECEPTIONIST)
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("userId", "name email role phone");
    res.status(200).json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("userId", "name email role phone");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (req.user.role === "PATIENT" && req.user._id.toString() !== patient.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access other patients" });
    }

    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update patient (ADMIN, RECEPTIONIST)
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("userId");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // FIX: Added 'contactNumber' to the destructuring
    const { name, email, phone, password, dateOfBirth, gender, address, bloodGroup, medicalHistory, emergencyContact, contactNumber } = req.body;

    // Update User details
    if (name !== undefined) patient.userId.name = name;
    if (email !== undefined) patient.userId.email = email;
    if (phone !== undefined) patient.userId.phone = phone;
    if (password) patient.userId.password = await bcrypt.hash(password, 10);
    await patient.userId.save();

    let parsedAddress = address;
    if (address !== undefined && typeof address === 'string' && address.trim()) {
      const addressParts = address.split(',').map(part => part.trim());
      parsedAddress = { street: addressParts[0] || '', city: addressParts[1] || '', state: addressParts[2] || '', pincode: addressParts[3] || '' };
    }

    // Update Patient details
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (gender !== undefined) patient.gender = gender;
    if (address !== undefined) patient.address = parsedAddress;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
    if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (contactNumber !== undefined) patient.contactNumber = contactNumber; // FIX: Added logic to update contactNumber

    await patient.save();
    const populated = await Patient.findById(patient._id).populate("userId", "name email role phone");
    res.status(200).json({ success: true, patient: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete patient (ADMIN only)
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    await User.deleteOne({ _id: patient.userId });
    await patient.deleteOne();

    res.status(200).json({ success: true, message: "Patient and linked user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Other functions are unchanged and remain below ---

// Get current patient's profile
export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate("userId", "name email phone profileImage");
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const profileData = {
      _id: patient._id,
      name: patient.userId.name,
      email: patient.userId.email,
      phone: patient.userId.phone,
      profileImage: patient.userId.profileImage,
      dateOfBirth: patient.dateOfBirth,
      contactNumber: patient.contactNumber,
      gender: patient.gender,
      address: patient.address,
      bloodGroup: patient.bloodGroup,
      medicalHistory: patient.medicalHistory,
      emergencyContact: patient.emergencyContact,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt
    };

    res.status(200).json({ success: true, patient: profileData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update current patient's profile
export const updateMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate("userId");
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const { name, email, phone, dateOfBirth, contactNumber, gender, address, emergencyContact, medicalHistory, allergies, currentMedications, profileImage } = req.body;

    // Update linked user fields
    if (name !== undefined) patient.userId.name = name;
    if (email !== undefined) patient.userId.email = email;
    if (phone !== undefined) patient.userId.phone = phone;
    if (profileImage !== undefined) patient.userId.profileImage = profileImage;
    await patient.userId.save();

    let parsedAddress = address;
    if (address !== undefined && typeof address === 'string' && address.trim()) {
      const addressParts = address.split(',').map(part => part.trim());
      parsedAddress = { street: addressParts[0] || '', city: addressParts[1] || '', state: addressParts[2] || '', pincode: addressParts[3] || '' };
    }

    // Update the correct fields on the patient model
    if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
    if (contactNumber !== undefined) patient.contactNumber = contactNumber;
    if (gender !== undefined) patient.gender = gender;
    if (address !== undefined) patient.address = parsedAddress;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
    if (allergies !== undefined) patient.allergies = allergies;
    if (currentMedications !== undefined) patient.currentMedications = currentMedications;

    await patient.save();

    // Re-fetch the updated profile to ensure all data is consistent
    const updatedPatient = await Patient.findOne({ userId: req.user._id }).populate("userId", "name email phone profileImage");

    const profileData = {
      _id: updatedPatient._id,
      name: updatedPatient.userId.name,
      email: updatedPatient.userId.email,
      phone: updatedPatient.userId.phone,
      profileImage: updatedPatient.userId.profileImage,
      dateOfBirth: updatedPatient.dateOfBirth,
      contactNumber: updatedPatient.contactNumber,
      gender: updatedPatient.gender,
      address: updatedPatient.address,
      bloodGroup: updatedPatient.bloodGroup,
      medicalHistory: updatedPatient.medicalHistory,
      emergencyContact: updatedPatient.emergencyContact,
      allergies: updatedPatient.allergies,
      currentMedications: updatedPatient.currentMedications,
      createdAt: updatedPatient.createdAt,
      updatedAt: updatedPatient.updatedAt
    };

    res.status(200).json({ success: true, patient: profileData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change patient password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) return res.status(400).json({ message: "Current password is incorrect" });
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current patient's appointments
export const getMyAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .populate({ path: "receptionistId", populate: { path: "userId", select: "name email" } })
      .sort({ date: -1 });
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current patient's prescriptions
export const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("appointmentId")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current patient's bills
export const getMyBills = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const bills = await Billing.find({ patientId: patient._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("appointmentId")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    const [appointments, prescriptions, bills] = await Promise.all([
      Appointment.find({ patientId: patient._id }),
      Prescription.find({ patientId: patient._id }),
      Billing.find({ patientId: patient._id })
    ]);
    const stats = {
      totalAppointments: appointments.length,
      upcomingAppointments: appointments.filter(apt => apt.status === 'booked').length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      totalPrescriptions: prescriptions.length,
      activePrescriptions: prescriptions.filter(pres => pres.status === 'active').length,
      totalBills: bills.length,
      pendingBills: bills.filter(bill => bill.paymentStatus === 'pending').length,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      paidAmount: bills.filter(bill => bill.paymentStatus === 'paid').reduce((sum, bill) => sum + bill.amount, 0)
    };
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};