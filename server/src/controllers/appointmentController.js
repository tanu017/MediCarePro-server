import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, time, timeSlot, reason, notes, status } = req.body;

    // Determine the default status based on who is creating the appointment
    let defaultStatus = 'booked'; // Both receptionist and patient create booked appointments

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      receptionistId: req.user?.role === "RECEPTIONIST" ? req.user._id : undefined,
      date,
      time: time || timeSlot, // Support both time and timeSlot for backward compatibility
      reason,
      notes,
      status: status || defaultStatus, // Use role-based default status
    });

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({
        path: "doctorId",
        select: "specialization department qualification experienceYears consultationFee",
        populate: { path: "userId", select: "name email" }
      })
      .populate({ path: "receptionistId", populate: { path: "userId", select: "name email" } });


    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({
        path: "doctorId",
        select: "specialization department qualification experienceYears consultationFee",
        populate: { path: "userId", select: "name email" }
      })
      .populate({ path: "receptionistId", populate: { path: "userId", select: "name email" } });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.user.role === "PATIENT" && req.user._id.toString() !== appointment.patientId.userId._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access other patients' appointments" });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const { patientId, doctorId, receptionistId, date, reason, status } = req.body;
    if (patientId !== undefined) appointment.patientId = patientId;
    if (doctorId !== undefined) appointment.doctorId = doctorId;
    if (receptionistId !== undefined) appointment.receptionistId = receptionistId;
    if (date !== undefined) appointment.date = date;
    if (reason !== undefined) appointment.reason = reason;
    if (status !== undefined) appointment.status = status;

    await appointment.save();

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "_id" } });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check permissions based on user role
    if (req.user.role === "PATIENT") {
      // Patients can only cancel their own appointments
      if (req.user._id.toString() !== appointment.patientId.userId._id.toString()) {
        return res.status(403).json({ message: "Forbidden: Cannot cancel other patients' appointments" });
      }
    } else if (req.user.role === "RECEPTIONIST") {
      // Receptionists can cancel any appointment
      // No additional permission check needed
    } else {
      return res.status(403).json({ message: "Forbidden: Only patients and receptionists can cancel appointments" });
    }

    // Only allow cancellation of booked or confirmed appointments
    if (!['booked', 'confirmed', 'pending'].includes(appointment.status)) {
      return res.status(400).json({ message: "Only booked, confirmed, or pending appointments can be cancelled" });
    }

    appointment.status = 'cancelled';
    if (req.body.reason) {
      appointment.cancellationReason = req.body.reason;
    }
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor availability for a specific date
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Get doctor's availability schedule
    const Doctor = (await import("../models/Doctor.js")).default;
    const doctor = await Doctor.findById(doctorId).populate("userId", "name");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get day of week for the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'short' });

    // Check if doctor is available on this day
    const dayAvailability = doctor.availability.find(avail => avail.day === dayOfWeek);

    if (!dayAvailability) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Doctor is not available on ${dayOfWeek}`,
        timeSlots: []
      });
    }

    // Get existing appointments for this doctor on this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['booked'] }
    });

    // Generate time slots based on doctor's availability
    const timeSlots = generateTimeSlots(dayAvailability.from, dayAvailability.to);

    // Filter out booked time slots
    const bookedTimes = existingAppointments.map(apt => apt.time);
    const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({
      success: true,
      available: availableSlots.length > 0,
      doctor: {
        name: doctor.userId.name,
        consultationFee: doctor.consultationFee
      },
      timeSlots: availableSlots,
      bookedSlots: bookedTimes,
      allSlots: timeSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Book appointment (for patients)
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, notes } = req.body;

    // First find the patient record that corresponds to the user
    const Patient = (await import("../models/Patient.js")).default;
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const patientId = patient._id;

    // Validate required fields
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: "Doctor ID, date, and time are required" });
    }

    // Check if the time slot is still available
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: { $in: ['booked'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ message: "This time slot is no longer available" });
    }

    // Create the appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: requestedDate,
      time,
      reason,
      notes,
      status: 'booked'
    });

    // Populate the appointment with doctor and patient details
    await appointment.populate([
      { path: "patientId", populate: { path: "userId", select: "name email" } },
      { path: "doctorId", populate: { path: "userId", select: "name email" } }
    ]);

    res.status(201).json({
      success: true,
      appointment,
      message: "Appointment booked successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    // First find the patient record that corresponds to the user
    const Patient = (await import("../models/Patient.js")).default;
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const appointments = await Appointment.find({ patientId: patient._id })
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
        select: "specialization department qualification experienceYears consultationFee",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);

  // 30-minute intervals
  const interval = 30 * 60 * 1000; // 30 minutes in milliseconds

  let current = new Date(start);
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5);
    slots.push(timeString);
    current = new Date(current.getTime() + interval);
  }

  return slots;
}