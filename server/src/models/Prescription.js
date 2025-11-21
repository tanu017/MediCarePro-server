import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String }, // external id if needed
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  medications: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      duration: { type: String, required: true },
      instructions: { type: String }
    }
  ],
  notes: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model("Prescription", prescriptionSchema);
