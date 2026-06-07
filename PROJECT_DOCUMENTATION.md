# Hospital Management System - Complete Documentation

## 📚 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Frontend Architecture](#frontend-architecture)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Security Features](#security-features)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

The **Hospital Management System** is a comprehensive web application designed to streamline hospital operations including patient management, doctor scheduling, appointment booking, medical records, and billing.

### Key Features
- ✅ Patient registration and profile management
- ✅ Doctor and staff management
- ✅ Appointment scheduling and tracking
- ✅ Medical records and visit history
- ✅ Invoice generation and billing
- ✅ Dashboard with key statistics
- ✅ Role-based access control
- ✅ Secure authentication with JWT

### Target Users
- Hospital Administrators
- Medical Staff
- Doctors
- Patients

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (HTML/CSS/JS)               │
│                   Port 3000 - Browser                   │
└────────────────────────┬────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────┐
│         Backend (Node.js/Express)                       │
│                   Port 5000                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes & Controllers                           │   │
│  │  - Auth, Patients, Doctors, Appointments        │   │
│  │  - Records, Billing, Dashboard                  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Middleware                                     │   │
│  │  - JWT Authentication                          │   │
│  │  - Role-based Authorization                    │   │
│  │  - Error Handling                              │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
                    MySQL Connection
                         │
┌────────────────────────▼────────────────────────────────┐
│              MySQL Database                             │
│  - Users, Doctors, Patients, Appointments              │
│  - Medical Records, Invoices                           │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) | ES6+ |
| **Backend** | Node.js, Express | 14+, 4.18+ |
| **Database** | MySQL | 5.7+ |
| **Authentication** | JWT (jsonwebtoken) | 9.0+ |
| **Password Hashing** | bcryptjs | 2.4+ |
| **CORS** | cors middleware | 2.8+ |
| **Environment** | dotenv | 16.0+ |

---

## Database Schema

### Tables Overview

#### 1. **users** - User accounts
```sql
- id (PK)
- name
- email (UNIQUE)
- password (hashed)
- role (admin, staff, doctor, user)
- created_at, updated_at
```

#### 2. **doctors** - Doctor profiles
```sql
- id (PK)
- first_name, last_name
- email (UNIQUE)
- phone
- specialization
- license_number (UNIQUE)
- office_location
- is_active
- created_at, updated_at
```

#### 3. **patients** - Patient profiles
```sql
- id (PK)
- first_name, last_name
- email, phone
- date_of_birth
- gender
- address
- medical_history
- emergency_contact, emergency_phone
- created_at, updated_at
```

#### 4. **appointments** - Appointment records
```sql
- id (PK)
- patient_id (FK)
- doctor_id (FK)
- appointment_date
- appointment_time
- reason
- status (scheduled, completed, cancelled, no-show)
- notes
- created_at, updated_at
```

#### 5. **medical_records** - Visit records
```sql
- id (PK)
- patient_id (FK)
- doctor_id (FK)
- visit_date
- diagnosis
- treatment
- prescriptions
- notes
- follow_up_date
- created_at, updated_at
```

#### 6. **invoices** - Billing records
```sql
- id (PK)
- patient_id (FK)
- amount
- description
- due_date
- payment_status (pending, paid, unpaid, overdue)
- payment_date
- payment_method
- created_at, updated_at
```

### Relationships
```
users (1) ──── (many) patients
users (1) ──── (many) doctors
patients (1) ──── (many) appointments
doctors (1) ──── (many) appointments
patients (1) ──── (many) medical_records
doctors (1) ──── (many) medical_records
patients (1) ──── (many) invoices
```

---

## API Reference

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}

Response: 201
{
  "message": "User registered successfully",
  "userId": 1
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hospital.com",
  "password": "admin123"
}

Response: 200
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@hospital.com",
    "role": "admin"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response: 200
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@hospital.com",
  "role": "admin"
}
```

### Patient Endpoints

#### List Patients
```
GET /api/patients
Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "first_name": "James",
    "last_name": "Anderson",
    "email": "james@example.com",
    "phone": "555-1001",
    "date_of_birth": "1980-05-15",
    "gender": "male",
    "address": "123 Main St",
    "medical_history": "Hypertension, Diabetes",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Patient
```
GET /api/patients/{id}
Authorization: Bearer {token}

Response: 200
{
  "id": 1,
  "first_name": "James",
  "last_name": "Anderson",
  ...
}
```

#### Create Patient
```
POST /api/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "phone": "555-2001",
  "date_of_birth": "1985-03-20",
  "gender": "female",
  "address": "456 Oak Ave",
  "medical_history": "Asthma"
}

Response: 201
{
  "message": "Patient created successfully",
  "patientId": 6
}
```

#### Update Patient
```
PUT /api/patients/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  ...
}

Response: 200
{
  "message": "Patient updated successfully"
}
```

#### Delete Patient
```
DELETE /api/patients/{id}
Authorization: Bearer {token}

Response: 200
{
  "message": "Patient deleted successfully"
}
```

### Doctor Endpoints

#### List Doctors
```
GET /api/doctors
Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@hospital.com",
    "phone": "555-0101",
    "specialization": "Cardiology",
    "license_number": "LIC001",
    "office_location": "Building A, Floor 2",
    "is_active": 1
  }
]
```

#### Create Doctor
```
POST /api/doctors
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah@hospital.com",
  "phone": "555-0102",
  "specialization": "Neurology",
  "license_number": "LIC006",
  "office_location": "Building B, Floor 3"
}

Response: 201
{
  "message": "Doctor created successfully",
  "doctorId": 6
}
```

### Appointment Endpoints

#### List Appointments
```
GET /api/appointments
Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 1,
    "appointment_date": "2024-01-20",
    "appointment_time": "09:00:00",
    "reason": "Heart checkup",
    "status": "scheduled",
    "notes": "Regular checkup"
  }
]
```

#### Create Appointment
```
POST /api/appointments
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 1,
  "appointment_date": "2024-01-25",
  "appointment_time": "10:00:00",
  "reason": "Follow-up consultation"
}

Response: 201
{
  "message": "Appointment created successfully",
  "appointmentId": 6
}
```

### Medical Records Endpoints

#### List Records
```
GET /api/records
Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 1,
    "visit_date": "2024-01-15",
    "diagnosis": "Hypertension",
    "treatment": "Medication and lifestyle changes",
    "prescriptions": "Lisinopril 10mg daily",
    "notes": "Patient responding well",
    "follow_up_date": "2024-02-15"
  }
]
```

#### Create Record
```
POST /api/records
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 1,
  "visit_date": "2024-01-20",
  "diagnosis": "Migraine",
  "treatment": "Preventive therapy",
  "prescriptions": "Sumatriptan 50mg as needed",
  "notes": "Consider MRI if symptoms persist",
  "follow_up_date": "2024-02-05"
}

Response: 201
{
  "message": "Medical record created successfully",
  "recordId": 6
}
```

### Billing Endpoints

#### List Invoices
```
GET /api/billing
Authorization: Bearer {token}

Response: 200
[
  {
    "id": 1,
    "patient_id": 1,
    "amount": 150.00,
    "description": "Cardiology consultation",
    "due_date": "2024-02-15",
    "payment_status": "pending",
    "payment_date": null,
    "payment_method": null
  }
]
```

#### Create Invoice
```
POST /api/billing
Authorization: Bearer {token}
Content-Type: application/json

{
  "patient_id": 1,
  "amount": 200.00,
  "description": "Orthopedic treatment",
  "due_date": "2024-02-20"
}

Response: 201
{
  "message": "Invoice created successfully",
  "invoiceId": 6
}
```

### Dashboard Endpoints

#### Get Statistics
```
GET /api/dashboard/stats
Authorization: Bearer {token}

Response: 200
{
  "totalPatients": 5,
  "todayAppointments": 2,
  "pendingBills": 3,
  "activeDoctors": 5
}
```

---

## Frontend Architecture

### Page Structure

```
Frontend/
├── index.html                 # Main HTML file
├── css/
│   ├── style.css             # Core styles (blueprint aesthetic)
│   ├── dashboard.css         # Dashboard specific styles
│   ├── forms.css             # Form components
│   └── responsive.css        # Mobile responsive styles
└── js/
    ├── app.js                # Main app controller
    ├── auth.js               # Authentication logic
    ├── api.js                # API communication
    ├── pages/
    │   ├── dashboard.js      # Dashboard page
    │   ├── patients.js       # Patients page
    │   ├── doctors.js        # Doctors page
    │   ├── appointments.js   # Appointments page
    │   ├── records.js        # Medical records page
    │   └── billing.js        # Billing page
    ├── components/
    │   ├── sidebar.js        # Sidebar navigation
    │   └── modal.js          # Modal forms
    └── utils/
        ├── storage.js        # Local storage helpers
        └── helpers.js        # Utility functions
```

### Key Features

#### Authentication
- Login/Logout functionality
- JWT token storage
- Protected routes
- Session management

#### Navigation
- Sidebar with module links
- Active page highlighting
- Mobile responsive menu toggle
- User info display

#### Data Tables
- Patient list with search
- Doctor directory
- Appointment calendar
- Medical records history
- Invoice tracking

#### Forms
- Modal-based forms
- Client-side validation
- API integration
- Success/error feedback

#### Dashboard
- Key statistics cards
- Today's appointments
- Pending bills
- Active doctors count
- Recent activity feed

---

## User Roles & Permissions

### Admin
- **Access**: Full system access
- **Permissions**:
  - Manage all users
  - Create/edit/delete doctors
  - View all patients
  - Create appointments
  - View all medical records
  - Generate invoices
  - Access dashboard

### Staff
- **Access**: Patient and billing management
- **Permissions**:
  - View/create/edit patients
  - View doctors
  - Create appointments
  - View appointments
  - Create invoices
  - View billing
  - Access dashboard

### Doctor
- **Access**: Patient care and records
- **Permissions**:
  - View assigned patients
  - View appointments
  - Create medical records
  - View medical records
  - View own profile

### User (Patient)
- **Access**: Personal information
- **Permissions**:
  - View own profile
  - View own appointments
  - View own medical records
  - View own invoices

---

## Security Features

### Authentication
- ✅ JWT-based token authentication
- ✅ Secure password hashing with bcryptjs
- ✅ Token expiration (24 hours)
- ✅ Protected API endpoints

### Authorization
- ✅ Role-based access control (RBAC)
- ✅ Route-level authorization
- ✅ Resource-level permissions

### Data Protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error handling without exposing sensitive info

### Best Practices
- ✅ Environment variables for secrets
- ✅ HTTPS ready (configure in production)
- ✅ Secure headers (configure nginx/Apache)
- ✅ Rate limiting (recommended for production)

---

## Deployment Guide

### Production Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure logging
- [ ] Setup monitoring
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Setup SSL certificates
- [ ] Configure firewall rules

### Deployment Steps

1. **Backend Deployment**
   ```bash
   npm install
   npm run build
   pm2 start server.js
   ```

2. **Frontend Deployment**
   ```bash
   # Copy files to web server
   cp -r frontend/* /var/www/html/
   ```

3. **Database Setup**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Change PORT in .env |
| Database connection failed | Verify MySQL is running and credentials are correct |
| CORS errors | Update CORS_ORIGIN in .env |
| Login fails | Check password hashing and user exists in database |
| API returns 403 | Verify user role has required permissions |
| Frontend can't reach API | Check API URL and backend is running |

---

## Support

For issues or questions, refer to:
- SETUP_GUIDE.md - Setup instructions
- README.md - Project overview
- Code comments - Implementation details

---

**Hospital Management System v1.0.0** 🏥
