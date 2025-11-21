import Prescription from "../models/Prescription.js";

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId, medications, notes } = req.body;

    const prescription = await Prescription.create({
      appointmentId,
      doctorId,
      patientId,
      medications,
      notes,
    });

    res.status(201).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("appointmentId");

    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("appointmentId");

    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    if (req.user.role === "PATIENT" && req.user._id.toString() !== prescription.patientId.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access other patients' prescriptions" });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    const { appointmentId, doctorId, patientId, medications, notes } = req.body;
    if (appointmentId !== undefined) prescription.appointmentId = appointmentId;
    if (doctorId !== undefined) prescription.doctorId = doctorId;
    if (patientId !== undefined) prescription.patientId = patientId;
    if (medications !== undefined) prescription.medications = medications;
    if (notes !== undefined) prescription.notes = notes;

    await prescription.save();

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    await prescription.deleteOne();
    res.status(200).json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient's prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    // First find the patient record that corresponds to the user
    const Patient = (await import("../models/Patient.js")).default;
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email" } })
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


