import mongoose from "mongoose";

const receptionistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // New fields per spec
  contactNumber: { type: String },
  email: { type: String },
  shiftTimings: { type: String },
  shift: { type: String, enum: ["morning", "night"] },

  // Profile fields
  qualification: { type: String },
  department: { type: String },
  experienceYears: { type: Number },
  profileImage: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  workSchedule: {
    startTime: { type: String },
    endTime: { type: String },
    workingDays: [{ type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] }]
  }
}, { timestamps: true });

// Pre-save middleware to automatically set shift timings
receptionistSchema.pre('save', function (next) {
  if (this.shift && !this.shiftTimings) {
    if (this.shift === 'morning') {
      this.shiftTimings = '9:00 AM - 8:00 PM';
    } else if (this.shift === 'night') {
      this.shiftTimings = '8:00 PM - 7:00 AM';
    }
  }
  next();
});

export default mongoose.model("Receptionist", receptionistSchema);
