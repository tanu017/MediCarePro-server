import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Receptionist from "../models/Receptionist.js";
import Billing from "../models/Billing.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

// Get admin dashboard statistics
export const getAdminDashboardStats = async (req, res) => {
    try {
        // Get counts for all entities
        const [
            totalDoctors,
            totalPatients,
            totalReceptionists,
            totalUsers,
            totalBills,
            totalAppointments
        ] = await Promise.all([
            Doctor.countDocuments(),
            Patient.countDocuments(),
            Receptionist.countDocuments(),
            User.countDocuments(),
            Billing.countDocuments(),
            Appointment.countDocuments()
        ]);

        // Get billing statistics
        const bills = await Billing.find();
        const totalRevenue = bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const paidBills = bills.filter(bill => bill.paymentStatus === 'paid');
        const pendingBills = bills.filter(bill => bill.paymentStatus === 'pending');
        const paidRevenue = paidBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const pendingRevenue = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentDoctors = await Doctor.find({ createdAt: { $gte: sevenDaysAgo } })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentPatients = await Patient.find({ createdAt: { $gte: sevenDaysAgo } })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentBills = await Billing.find({ createdAt: { $gte: sevenDaysAgo } })
            .populate('patientId', 'userId')
            .populate('doctorId', 'userId')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get appointment statistics
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayAppointments = await Appointment.find({
            date: { $gte: startOfDay, $lt: endOfDay }
        });

        const upcomingAppointments = await Appointment.find({
            date: { $gte: today },
            status: 'booked'
        }).sort({ date: 1 }).limit(5);

        res.status(200).json({
            success: true,
            stats: {
                totalDoctors,
                totalPatients,
                totalReceptionists,
                totalUsers,
                totalBills,
                totalAppointments,
                totalRevenue,
                paidRevenue,
                pendingRevenue,
                paidBills: paidBills.length,
                pendingBills: pendingBills.length,
                todayAppointments: todayAppointments.length,
                upcomingAppointments: upcomingAppointments.length
            },
            recent: {
                doctors: recentDoctors,
                patients: recentPatients,
                bills: recentBills,
                appointments: upcomingAppointments
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users with their roles (for admin user management)
export const getAllUsersWithRoles = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        // Get additional info for each user based on their role
        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                let additionalInfo = {};

                switch (user.role) {
                    case 'DOCTOR':
                        const doctor = await Doctor.findOne({ userId: user._id });
                        additionalInfo = {
                            specialization: doctor?.specialization,
                            department: doctor?.department,
                            yearsOfExperience: doctor?.yearsOfExperience || doctor?.experienceYears
                        };
                        break;
                    case 'PATIENT':
                        const patient = await Patient.findOne({ userId: user._id });
                        additionalInfo = {
                            dob: patient?.dob,
                            gender: patient?.gender,
                            bloodGroup: patient?.bloodGroup
                        };
                        break;
                    case 'RECEPTIONIST':
                        const receptionist = await Receptionist.findOne({ userId: user._id });
                        additionalInfo = {
                            shift: receptionist?.shift || receptionist?.shiftTimings,
                            department: receptionist?.department
                        };
                        break;
                }

                return {
                    ...user.toObject(),
                    additionalInfo
                };
            })
        );

        res.status(200).json({
            success: true,
            users: usersWithDetails
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
