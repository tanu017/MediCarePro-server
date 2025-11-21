import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId, amount, paymentStatus, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const bill = await Billing.create({
      appointmentId,
      patientId,
      doctorId,
      amount,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(201).json({
      success: true,
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({
        path: "doctorId",
        select: "specialization department",
        populate: { path: "userId", select: "name email" }
      })
      .populate("appointmentId");

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bill by ID
export const getBillById = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({
        path: "doctorId",
        select: "specialization department",
        populate: { path: "userId", select: "name email" }
      })
      .populate("appointmentId");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (req.user.role === "PATIENT" && req.user._id.toString() !== bill.patientId.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access other patients' bills" });
    }

    res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a bill
export const updateBill = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const { appointmentId, patientId, doctorId, amount, paymentStatus, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (appointmentId !== undefined) bill.appointmentId = appointmentId;
    if (patientId !== undefined) bill.patientId = patientId;
    if (doctorId !== undefined) bill.doctorId = doctorId;
    if (amount !== undefined) bill.amount = amount;
    if (paymentStatus !== undefined) bill.paymentStatus = paymentStatus;
    if (razorpayOrderId !== undefined) bill.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId !== undefined) bill.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature !== undefined) bill.razorpaySignature = razorpaySignature;
    await bill.save();

    res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a bill
export const deleteBill = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await bill.deleteOne();

    res.status(200).json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pay a bill (Patient only)
export const payBill = async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "_id" } });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (req.user._id.toString() !== bill.patientId.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot pay other patients' bills" });
    }

    if (bill.paymentStatus !== 'pending') {
      return res.status(400).json({ message: "Only pending bills can be paid" });
    }
    
    bill.paymentStatus = 'paid';
    bill.paymentMethod = req.body.method || 'card';
    bill.paidAt = new Date();
    bill.razorpayPaymentId = `pay_${Date.now()}`;

    await bill.save();

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create bill for appointment booking
export const createAppointmentBill = async (req, res) => {
  try {
    const { appointmentId, doctorId, amount, patientId } = req.body;

    if (!appointmentId || !doctorId || !amount) {
      return res.status(400).json({ message: "Appointment ID, doctor ID, and amount are required" });
    }

    let patient;
    if (patientId) {
      patient = await Patient.findById(patientId);
    } else {
      patient = await Patient.findOne({ userId: req.user._id });
    }
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const existingBill = await Billing.findOne({ appointmentId });
    if (existingBill) {
      return res.status(400).json({ message: "Bill already exists for this appointment" });
    }

    const bill = await Billing.create({
      appointmentId,
      patientId: patient._id,
      doctorId,
      amount,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      paidAt: new Date(),
      razorpayPaymentId: `pay_${Date.now()}`
    });

    await bill.populate([
      { path: "patientId", populate: { path: "userId", select: "name email" } },
      { path: "doctorId", populate: { path: "userId", select: "name email" } },
      { path: "appointmentId" }
    ]);

    res.status(201).json({
      success: true,
      bill,
      message: "Bill created successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient's bills
export const getPatientBills = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const bills = await Billing.find({ patientId: patient._id })
      // FIX: Added this block to populate the patient's own user details
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      })
      .populate({
        path: "doctorId",
        select: "specialization",
        populate: { path: "userId", select: "name email" }
      })
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor's bills (bills for doctor's patients)
export const getDoctorBills = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const bills = await Billing.find({ doctorId: doctor._id })
      .populate({
        path: "doctorId",
        select: "specialization",
        populate: { path: "userId", select: "name email" }
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" }
      })
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};