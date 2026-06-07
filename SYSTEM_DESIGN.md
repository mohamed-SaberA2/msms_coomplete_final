# Hospital Management System - System Design Document

## Executive Summary

This document outlines the architecture and design of a professional Hospital Management System built with a traditional full-stack approach: HTML/CSS/JavaScript (frontend), Node.js/Express (backend), and MySQL (database). The system provides comprehensive management of patients, doctors, appointments, medical records, and billing with role-based access control and a technical blueprint aesthetic.

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JavaScript | Responsive UI with blueprint aesthetic |
| Backend | Node.js + Express 4 | RESTful API server |
| Database | MySQL 8+ | Persistent data storage |
| Authentication | Session-based (JWT tokens) | Secure user authentication |
| Server Runtime | Node.js 18+ | JavaScript runtime environment |

---

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── config.js                 # Database and app configuration
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── patients.js          # Patient management routes
│   │   ├── doctors.js           # Doctor management routes
│   │   ├── appointments.js      # Appointment routes
│   │   ├── records.js           # Medical records routes
│   │   └── billing.js           # Billing/invoice routes
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── patientController.js # Patient logic
│   │   ├── doctorController.js  # Doctor logic
│   │   ├── appointmentController.js
│   │   ├── recordController.js
│   │   └── billingController.js
│   ├── models/
│   │   └── db.js                # Database connection and queries
│   ├── utils/
│   │   ├── validators.js        # Input validation
│   │   └── helpers.js           # Utility functions
│   └── package.json
│
├── frontend/
│   ├── index.html               # Main HTML file
│   ├── css/
│   │   ├── style.css            # Main stylesheet (blueprint aesthetic)
│   │   ├── dashboard.css        # Dashboard specific styles
│   │   ├── forms.css            # Form styles
│   │   └── responsive.css       # Responsive design
│   ├── js/
│   │   ├── app.js               # Main application logic
│   │   ├── auth.js              # Authentication handling
│   │   ├── api.js               # API communication
│   │   ├── pages/
│   │   │   ├── dashboard.js
│   │   │   ├── patients.js
│   │   │   ├── doctors.js
│   │   │   ├── appointments.js
│   │   │   ├── records.js
│   │   │   └── billing.js
│   │   ├── components/
│   │   │   ├── sidebar.js
│   │   │   ├── navbar.js
│   │   │   ├── modal.js
│   │   │   └── table.js
│   │   └── utils/
│   │       ├── storage.js       # LocalStorage management
│   │       └── helpers.js       # Frontend utilities
│   └── images/                  # Icons and graphics
│
└── database/
    └── schema.sql               # MySQL database schema
```

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('admin', 'staff', 'doctor', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Doctors Table
```sql
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  office_location TEXT,
  available_hours JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Patients Table
```sql
CREATE TABLE patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergency_contact VARCHAR(255),
  medical_history JSON,
  allergies TEXT,
  current_medications JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

#### Medical Records Table
```sql
CREATE TABLE medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  visit_date DATETIME NOT NULL,
  diagnosis TEXT,
  prescriptions JSON,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

#### Invoices Table
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  appointment_id INT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status ENUM('paid', 'unpaid', 'pending') DEFAULT 'pending',
  issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Patients
- `GET /api/patients` - List all patients (admin/staff)
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create new patient (admin/staff)
- `PUT /api/patients/:id` - Update patient (admin/staff)
- `DELETE /api/patients/:id` - Delete patient (admin only)
- `GET /api/patients/search?q=name` - Search patients

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create doctor (admin only)
- `PUT /api/doctors/:id` - Update doctor (admin/self)
- `GET /api/doctors/:id/slots` - Get available slots
- `PUT /api/doctors/:id/schedule` - Update schedule

### Appointments
- `GET /api/appointments` - List appointments (filtered by role)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Reschedule appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/doctor/:doctorId` - Get doctor's appointments
- `GET /api/appointments/patient/:patientId` - Get patient's appointments

### Medical Records
- `GET /api/records` - List records (filtered by role)
- `GET /api/records/:id` - Get record details
- `POST /api/records` - Create record (doctor)
- `PUT /api/records/:id` - Update record (doctor)
- `GET /api/records/patient/:patientId` - Get patient's records

### Billing
- `GET /api/billing` - List invoices (filtered by role)
- `GET /api/billing/:id` - Get invoice details
- `POST /api/billing` - Create invoice (staff/admin)
- `PUT /api/billing/:id` - Update invoice status
- `POST /api/billing/generate/:appointmentId` - Auto-generate from appointment
- `GET /api/billing/stats` - Get billing statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard metrics
- `GET /api/dashboard/activity` - Get recent activity

---

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules; manage users, doctors, staff |
| **Staff** | Manage patients, view appointments, generate invoices |
| **Doctor** | View assigned patients, manage own appointments, create medical records |
| **User** | View own profile and appointment history |

---

## Frontend Design: Technical Blueprint Aesthetic

### Color Palette
- Primary Background: Deep Royal Blue (#0F2847)
- Grid Overlay: Subtle white grid pattern (opacity: 0.05)
- Text: White (#FFFFFF)
- Accent: Bright Cyan (#00D9FF)
- Secondary: Light Gray (#E8E8E8)

### Typography
- Font Family: Inter, system sans-serif
- Headings: Bold, white, 24-32px
- Body: Regular, white, 14-16px
- Technical labels: Monospace for codes/IDs

### Visual Elements
- Dimension markers and rectangular frames
- Technical line drawings for section dividers
- Grid background pattern
- Minimal shadows, clean edges
- Precise spacing and alignment

---

## Security Considerations

1. **Password Security**: Bcrypt hashing with salt
2. **Session Management**: JWT tokens with expiration
3. **Input Validation**: Server-side validation for all inputs
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS**: Configured for same-origin requests
6. **Role-Based Access**: Enforced at API level
7. **Error Handling**: Generic error messages to prevent information leakage

---

## Development Workflow

### Phase 1: Backend Setup
1. Initialize Node.js project with Express
2. Configure MySQL connection
3. Create database schema
4. Implement authentication system
5. Build API routes and controllers
6. Add middleware for auth and error handling

### Phase 2: Frontend Setup
1. Create HTML structure with blueprint aesthetic
2. Implement CSS with technical design
3. Build navigation and layout components
4. Implement API communication layer
5. Create page-specific JavaScript modules

### Phase 3: Feature Implementation
1. Implement each module (Patients, Doctors, Appointments, Records, Billing)
2. Test CRUD operations
3. Verify role-based access control
4. Test search and filtering

### Phase 4: Integration & Testing
1. End-to-end testing
2. Performance optimization
3. Security audit
4. Deployment preparation

---

## Success Criteria

✓ All nine features fully implemented and functional
✓ Role-based access control strictly enforced
✓ Dashboard displays exactly four required metrics
✓ Technical blueprint aesthetic consistently applied
✓ All management pages protected by authentication
✓ Responsive design works on desktop and tablet
✓ No console errors or warnings
✓ All API endpoints working correctly
✓ Data validation on both frontend and backend

