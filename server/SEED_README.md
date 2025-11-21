# Database Seeding

This directory contains a seed file to populate the database with sample data for development and testing.

## What gets seeded

- **1 Admin user**: admin@example.com
- **2 Receptionists**: receptionist1@example.com, receptionist2@example.com
- **4 Doctors**: doctor1@example.com through doctor4@example.com
- **12 Patients**: patient1@example.com through patient12@example.com (3 patients per doctor)

## How to run

Make sure you have your `.env` file configured with the correct `DB_URI`:

```bash
# Navigate to the server directory
cd server

# Run the seed script
npm run seed
```

## Default credentials

All users are created with the password: `password123`

## User details

### Admin
- Email: admin@example.com
- Role: ADMIN

### Receptionists
- Email: receptionist1@example.com (Morning shift)
- Email: receptionist2@example.com (Evening shift)

### Doctors
- doctor1@example.com - Dr. John Smith (Cardiology)
- doctor2@example.com - Dr. Sarah Johnson (Neurology)
- doctor3@example.com - Dr. Michael Brown (Orthopedics)
- doctor4@example.com - Dr. Emily Davis (Pediatrics)

### Patients
- patient1@example.com through patient12@example.com
- Each doctor has 3 patients assigned
- Patients have realistic sample data including addresses, emergency contacts, and medical history

## Notes

- The seed script will clear all existing data before seeding
- All users have hashed passwords using bcryptjs
- Patient data includes realistic sample information like addresses, emergency contacts, and medical history
- Doctors have availability schedules and consultation fees
