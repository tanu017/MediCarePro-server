import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String }, // external/idempotent id if needed
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  receptionistId: { type: mongoose.Schema.Types.ObjectId, ref: "Receptionist" },
  date: { type: Date, required: true },
  time: { type: String }, // New field for time
  timeSlot: { type: String }, // Keep for backward compatibility
  status: { type: String, enum: ["pending", "booked", "confirmed", "completed", "cancelled"], default: "pending" },
  reason: { type: String },
  notes: { type: String }, // Additional notes
  cancellationReason: { type: String } // Reason for cancellation
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
