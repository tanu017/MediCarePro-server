import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  gender: { type: String, enum: ["male", "female", "other"] },
  dateOfBirth: { type: Date }, // Standardized to this field
  contactNumber: { type: String },
  email: { type: String }, // Note: email is usually on the User model
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  medicalHistory: [{ type: String }],
  bloodGroup: { type: String },
  
  // Removed the duplicate 'dob' field
  
}, { timestamps: true });

// Pre-save middleware to handle address conversion (optional, but good practice)
patientSchema.pre('save', function (next) {
  if (this.isModified('address') && this.address && typeof this.address === 'string' && this.address.trim()) {
    const addressParts = this.address.split(',').map(part => part.trim());
    this.address = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      pincode: addressParts[3] || ''
    };
  }
  next();
});

export default mongoose.model("Patient", patientSchema);