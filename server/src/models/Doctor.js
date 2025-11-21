import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // New fields per spec
  specialization: { type: String },
  qualification: { type: String },
  experienceYears: { type: Number },
  contactNumber: { type: String },
  email: { type: String },
  consultationFee: { type: Number },
  availability: [
    {
      day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      from: String,
      to: String
    }
  ],

  // Legacy fields retained for compatibility
  department: { type: String },
  yearsOfExperience: { type: Number },
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);
