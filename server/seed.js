import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Doctor from "./src/models/Doctor.js";
import Patient from "./src/models/Patient.js";
import Receptionist from "./src/models/Receptionist.js";
import Appointment from "./src/models/Appointment.js";
import Prescription from "./src/models/Prescription.js";
import Billing from "./src/models/Billing.js";

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("✅ MongoDB connected for seeding");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear ALL existing data and drop collections to remove indexes
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
        await Receptionist.deleteMany({});
        await Appointment.deleteMany({});
        await Prescription.deleteMany({});
        await Billing.deleteMany({});

        // Drop the billing collection to remove any existing indexes
        try {
            await mongoose.connection.db.collection('billings').drop();
            console.log("🗑️  Dropped billings collection to remove indexes");
        } catch (error) {
            console.log("ℹ️  Billings collection didn't exist or couldn't be dropped");
        }

        console.log("🗑️  Cleared all existing data");

        // Hash password for all users
        const hashedPassword = await bcrypt.hash("password123", 12);

        // 1. Create Admin User
        const adminUser = new User({
            name: "Admin User",
            email: "admin1@example.com",
            password: hashedPassword,
            role: "ADMIN",
            phone: "+1234567890"
        });
        await adminUser.save();
        console.log("✅ Created 1 admin user");

        // 2. Create 2 Receptionists
        const receptionists = [];
        for (let i = 1; i <= 2; i++) {
            const receptionistUser = new User({
                name: `Receptionist ${i}`,
                email: `receptionist${i}@example.com`,
                password: hashedPassword,
                role: "RECEPTIONIST",
                phone: `+123456789${i}`
            });
            await receptionistUser.save();

            const receptionistProfile = new Receptionist({
                userId: receptionistUser._id,
                contactNumber: `+123456789${i}`,
                email: `receptionist${i}@example.com`,
                shiftTimings: i === 1 ? "morning" : "evening"
            });
            await receptionistProfile.save();
            receptionists.push(receptionistUser);
        }
        console.log("✅ Created 2 receptionists");

        // 3. Create 4 Doctors
        const doctors = [
            {
                name: "Dr. John Smith",
                email: "doctor1@example.com",
                specialization: "Cardiology",
                qualification: "MD, Cardiology",
                experienceYears: 8,
                consultationFee: 8000,
                department: "Cardiology Department"
            },
            {
                name: "Dr. Sarah Johnson",
                email: "doctor2@example.com",
                specialization: "Neurology",
                qualification: "MD, Neurology",
                experienceYears: 12,
                consultationFee: 1000,
                department: "Neurology Department"
            },
            {
                name: "Dr. Michael Brown",
                email: "doctor3@example.com",
                specialization: "Orthopedics",
                qualification: "MD, Orthopedics",
                experienceYears: 6,
                consultationFee: 6000,
                department: "Orthopedics Department"
            },
            {
                name: "Dr. Emily Davis",
                email: "doctor4@example.com",
                specialization: "Pediatrics",
                qualification: "MD, Pediatrics",
                experienceYears: 10,
                consultationFee: 7000,
                department: "Pediatrics Department"
            }
        ];

        const doctorUsers = [];
        const doctorProfiles = [];

        for (const doctorData of doctors) {
            // Create User for doctor
            const doctorUser = new User({
                name: doctorData.name,
                email: doctorData.email,
                password: hashedPassword,
                role: "DOCTOR",
                phone: `+1234567${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            });
            await doctorUser.save();
            doctorUsers.push(doctorUser);

            // Create Doctor profile
            const doctorProfile = new Doctor({
                userId: doctorUser._id,
                specialization: doctorData.specialization,
                qualification: doctorData.qualification,
                experienceYears: doctorData.experienceYears,
                contactNumber: doctorUser.phone,
                email: doctorData.email,
                consultationFee: doctorData.consultationFee,
                department: doctorData.department,
                availability: [
                    { day: "Mon", from: "09:00", to: "17:00" },
                    { day: "Tue", from: "09:00", to: "17:00" },
                    { day: "Wed", from: "09:00", to: "17:00" },
                    { day: "Thu", from: "09:00", to: "17:00" },
                    { day: "Fri", from: "09:00", to: "17:00" },
                    { day: "Sat", from: "10:00", to: "14:00" }
                ]
            });
            await doctorProfile.save();
            doctorProfiles.push(doctorProfile);
        }
        console.log("✅ Created 4 doctors");

        // 4. Create 20 Patients (5 for each doctor)
        const patientNames = [
            "Alice Wilson", "Bob Anderson", "Carol Martinez", "David Thompson", "Eva Garcia",
            "Frank Miller", "Grace Lee", "Henry Taylor", "Ivy Chen", "Jack Wilson",
            "Kate Rodriguez", "Liam Johnson", "Maya Patel", "Noah Singh", "Olivia Kim",
            "Paul Davis", "Quinn Brown", "Rachel Green", "Sam Wilson", "Tina Lee"
        ];

        const genders = ["male", "female", "other"];
        const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

        const patientUsers = [];
        const patientProfiles = [];

        for (let i = 0; i < 20; i++) {
            const doctorIndex = Math.floor(i / 5); // Each doctor gets 5 patients
            const patientNumber = i + 1;

            // Create User for patient
            const patientUser = new User({
                name: patientNames[i],
                email: `patient${patientNumber}@example.com`,
                password: hashedPassword,
                role: "PATIENT",
                phone: `+1234567${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            });
            await patientUser.save();
            patientUsers.push(patientUser);

            // Create Patient profile
            const patientProfile = new Patient({
                userId: patientUser._id,
                gender: genders[i % 3],
                dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                contactNumber: patientUser.phone,
                email: `patient${patientNumber}@example.com`,
                address: {
                    street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
                    city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][Math.floor(Math.random() * 5)],
                    state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
                    pincode: `${Math.floor(Math.random() * 90000) + 10000}`
                },
                emergencyContact: {
                    name: `Emergency Contact ${patientNumber}`,
                    phone: `+1234567${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    relation: ["Spouse", "Parent", "Sibling", "Friend"][Math.floor(Math.random() * 4)]
                },
                medicalHistory: ["Diabetes", "Hypertension", "Asthma", "None"][Math.floor(Math.random() * 4)] === "None" ? [] : ["Diabetes", "Hypertension", "Asthma"][Math.floor(Math.random() * 3)],
                bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)]
            });
            await patientProfile.save();
            patientProfiles.push(patientProfile);
        }
        console.log("✅ Created 20 patients (5 for each doctor)");

        // 5. Create Appointments for each doctor
        const appointmentReasons = [
            "General Consultation", "Follow-up", "Check-up", "Pain Management",
            "Medication Review", "Diagnostic Test", "Treatment Plan", "Emergency Visit"
        ];

        let appointmentCount = 0;
        let prescriptionCount = 0;
        let billingCount = 0;

        for (let doctorIndex = 0; doctorIndex < 4; doctorIndex++) {
            const doctor = doctorProfiles[doctorIndex];
            const doctorPatients = patientProfiles.slice(doctorIndex * 5, (doctorIndex + 1) * 5);

            // Create 5 booked appointments (today and future)
            for (let i = 0; i < 5; i++) {
                const appointmentDate = new Date();
                appointmentDate.setDate(appointmentDate.getDate() + i);
                appointmentDate.setHours(9 + (i * 2), 0, 0, 0); // 9 AM, 11 AM, 1 PM, 3 PM, 5 PM

                const appointment = new Appointment({
                    patientId: doctorPatients[i]._id,
                    doctorId: doctor._id,
                    receptionistId: receptionists[0]._id,
                    date: appointmentDate,
                    timeSlot: `${9 + (i * 2)}:00`,
                    status: "booked",
                    reason: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)]
                });
                await appointment.save();
                appointmentCount++;
            }

            // Create 8 completed appointments (past dates)
            for (let i = 0; i < 8; i++) {
                const appointmentDate = new Date();
                appointmentDate.setDate(appointmentDate.getDate() - (i + 1));
                appointmentDate.setHours(9 + (i % 4) * 2, 0, 0, 0);

                const appointment = new Appointment({
                    patientId: doctorPatients[i % 5]._id,
                    doctorId: doctor._id,
                    receptionistId: receptionists[0]._id,
                    date: appointmentDate,
                    timeSlot: `${9 + (i % 4) * 2}:00`,
                    status: "completed",
                    reason: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)]
                });
                await appointment.save();
                appointmentCount++;

                // Create prescription for completed appointment
                const prescription = new Prescription({
                    appointmentId: appointment._id,
                    doctorId: doctor._id,
                    patientId: doctorPatients[i % 5]._id,
                    medications: [
                        {
                            name: ["Paracetamol", "Ibuprofen", "Amoxicillin", "Omeprazole"][Math.floor(Math.random() * 4)],
                            dosage: ["500mg", "400mg", "250mg", "20mg"][Math.floor(Math.random() * 4)],
                            duration: ["7 days", "5 days", "10 days", "14 days"][Math.floor(Math.random() * 4)],
                            instructions: ["Take with food", "Take twice daily", "Take as directed", "Take before meals"][Math.floor(Math.random() * 4)]
                        }
                    ],
                    notes: `Prescription for ${doctorPatients[i % 5].userId.name} - ${appointment.reason}`
                });
                await prescription.save();
                prescriptionCount++;

                // Create billing for completed appointment
                const billing = new Billing({
                    appointmentId: appointment._id,
                    patientId: doctorPatients[i % 5]._id,
                    doctorId: doctor._id,
                    amount: doctor.consultationFee,
                    paymentStatus: "paid"
                });
                await billing.save();
                billingCount++;
            }

            // Create 2 cancelled appointments
            for (let i = 0; i < 2; i++) {
                const appointmentDate = new Date();
                appointmentDate.setDate(appointmentDate.getDate() - (i + 10));
                appointmentDate.setHours(10 + i, 0, 0, 0);

                const appointment = new Appointment({
                    patientId: doctorPatients[i]._id,
                    doctorId: doctor._id,
                    receptionistId: receptionists[0]._id,
                    date: appointmentDate,
                    timeSlot: `${10 + i}:00`,
                    status: "cancelled",
                    reason: appointmentReasons[Math.floor(Math.random() * appointmentReasons.length)]
                });
                await appointment.save();
                appointmentCount++;
            }
        }

        console.log("✅ Created appointments, prescriptions, and billing");
        console.log(`   📅 ${appointmentCount} appointments (5 booked + 8 completed + 2 cancelled per doctor)`);
        console.log(`   💊 ${prescriptionCount} prescriptions (for completed appointments)`);
        console.log(`   💰 ${billingCount} bills (₹500 each for completed appointments)`);

        console.log("\n🎉 Seeding completed successfully!");
        console.log("\n📊 Summary:");
        console.log("👤 1 Admin user");
        console.log("👥 2 Receptionists");
        console.log("👨‍⚕️ 4 Doctors");
        console.log("🏥 20 Patients (5 per doctor)");
        console.log("📅 60 Appointments (15 per doctor: 5 booked + 8 completed + 2 cancelled)");
        console.log("💊 32 Prescriptions (for completed appointments)");
        console.log("💰 32 Bills (₹500 each for completed appointments)");

        console.log("\n🔑 All users have password: password123");
        console.log("\n📧 Login Credentials:");
        console.log("👤 Admin: admin1@example.com");
        console.log("👥 Receptionists: receptionist1@example.com, receptionist2@example.com");
        console.log("👨‍⚕️ Doctors: doctor1@example.com, doctor2@example.com, doctor3@example.com, doctor4@example.com");
        console.log("🏥 Patients: patient1@example.com through patient20@example.com");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
    } finally {
        mongoose.connection.close();
        console.log("🔌 Database connection closed");
    }
};

// Run the seeding
connectDB().then(() => {
    seedData();
});