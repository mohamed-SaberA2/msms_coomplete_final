# Hospital Management System

A professional, full-stack Hospital Management System built with HTML, CSS, JavaScript (frontend), Node.js/Express (backend), and MySQL (database). Features role-based access control, patient management, doctor scheduling, appointment booking, medical records, and billing.

## 🎨 Design

**Technical Blueprint Aesthetic**: Deep royal blue background with white grid overlay, bright cyan accents, and technical line drawings for a professional CAD-inspired interface.

## 📋 Features

- **Patient Management**: Register, view, edit, search, and delete patient profiles
- **Doctor & Staff Management**: Add and edit doctor profiles with specialization
- **Appointment Scheduling**: Book, reschedule, and cancel appointments
- **Medical Records**: Create and view patient visit records with diagnosis and prescriptions
- **Billing & Invoices**: Generate invoices and track payment status
- **Dashboard**: Display 4 key metrics (total patients, today's appointments, pending bills, doctor availability)
- **Role-Based Access Control**: Admin, Staff, Doctor, User roles with strict permissions
- **Authentication**: Secure login with JWT tokens
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🗂️ Project Structure

```
hospital-management-system/
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── config.js                 # Configuration management
│   ├── package.json              # Dependencies
│   ├── .env.example              # Environment template
│   ├── controllers/              # Business logic (8 files)
│   ├── routes/                   # API endpoints (7 files)
│   ├── middleware/               # Auth & error handling
│   └── models/                   # Database queries
├── frontend/
│   ├── index.html                # Main HTML
│   ├── css/                      # Stylesheets (4 files)
│   └── js/                       # JavaScript modules
├── database/
│   └── schema.sql                # MySQL schema
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### 1. Setup Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Backend

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Start Backend Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

### 5. Serve Frontend

```bash
cd frontend
python3 -m http.server 3000
# or use any static server
npx http-server -p 3000
```

### 6. Access Application

Open browser: `http://localhost:3000`

## 🔐 Demo Credentials

**Admin User**
- Email: admin@hospital.com
- Password: admin123

**Doctor User**
- Email: doctor@hospital.com
- Password: admin123

**Staff User**
- Email: staff@hospital.com
- Password: admin123

**Patient User**
- Email: patient@hospital.com
- Password: admin123

## 📊 Dashboard Metrics

The dashboard displays exactly 4 required metrics:

1. **Total Patients** - Count of all registered patients
2. **Today's Appointments** - Appointments scheduled for current date
3. **Pending Bills** - Invoices with pending/unpaid status
4. **Doctor Availability** - Count of active doctors

## 🔧 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js 18+, Express 4 |
| Database | MySQL 8+ |
| Authentication | JWT (jsonwebtoken) |
| Password Security | Bcrypt |
| API Pattern | RESTful with role-based access |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (Protected)

### Patients
- `GET /api/patients` - List patients (Admin/Staff)
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create patient (Admin/Staff)
- `PUT /api/patients/:id` - Update patient (Admin/Staff)
- `DELETE /api/patients/:id` - Delete patient (Admin only)
- `GET /api/patients/search?q=` - Search patients (Admin/Staff)

### Doctors
- `GET /api/doctors` - List doctors
- `GET /api/doctors/:id` - Get doctor details
- `POST /api/doctors` - Create doctor (Admin only)
- `PUT /api/doctors/:id` - Update doctor (Admin only)

### Appointments
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment

### Medical Records
- `GET /api/records` - List records
- `GET /api/records/:id` - Get record details
- `POST /api/records` - Create record (Doctor/Admin)
- `PUT /api/records/:id` - Update record (Doctor/Admin)

### Billing
- `GET /api/billing` - List invoices (Admin/Staff)
- `GET /api/billing/:id` - Get invoice details
- `POST /api/billing` - Create invoice (Admin/Staff)
- `PUT /api/billing/:id` - Update invoice status (Admin/Staff)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 👥 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules; manage users, doctors, staff |
| **Staff** | Manage patients, view appointments, generate invoices |
| **Doctor** | View assigned patients, manage appointments, create medical records |
| **User** | View own profile and appointment history |

## 🔒 Security Features

- JWT token-based authentication with expiry
- Bcrypt password hashing with salt rounds
- Parameterized SQL queries (SQL injection prevention)
- Role-based access control at API level
- CORS configuration for same-origin requests
- Error handling without information leakage
- Input validation on both frontend and backend

## 📱 Responsive Design

- **Desktop**: Full layout with sidebar navigation
- **Tablet**: Optimized layout with collapsible sidebar
- **Mobile**: Bottom navigation with single-column layout

## 🎯 Database Schema

### Core Tables
- `users` - User accounts and authentication
- `doctors` - Doctor information and specialization
- `patients` - Patient profiles and medical history
- `appointments` - Appointment scheduling
- `medical_records` - Visit records and diagnoses
- `invoices` - Billing and payment tracking

All tables include:
- Proper indexes for performance
- Foreign key relationships with cascade operations
- Timestamps for audit trails
- ACID compliance

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Patient CRUD operations
- [ ] Doctor management
- [ ] Appointment booking and rescheduling
- [ ] Medical record creation
- [ ] Invoice generation and payment tracking
- [ ] Role-based access control
- [ ] Search and filter functionality
- [ ] Responsive design on mobile/tablet
- [ ] Error handling and validation

## 📈 Performance Optimization

- Database connection pooling
- Query optimization with indexes
- Pagination for large datasets
- Lazy loading for images
- CSS minification and compression
- Efficient DOM manipulation

## 🚢 Deployment

### Backend Deployment
1. Set production environment variables in `.env`
2. Install dependencies: `npm install`
3. Build: `npm run build` (if applicable)
4. Start: `npm start`
5. Use PM2 or similar for process management

### Frontend Deployment
1. Build assets (if using build tools)
2. Serve static files via web server (nginx, Apache, etc.)
3. Configure CORS for backend API
4. Enable gzip compression
5. Set cache headers appropriately

### Database Deployment
1. Create database on production server
2. Run schema.sql to create tables
3. Set up automated backups
4. Configure replication if needed
5. Monitor performance and query logs

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 👨‍💻 Support

For issues or questions, please refer to the documentation or create an issue in the repository.

---

**Built with ❤️ for healthcare professionals**
