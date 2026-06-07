# Hospital Management System - Complete Setup Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** 14+ installed
- **MySQL** 5.7+ installed and running
- **npm** or **yarn** package manager

---

## 📋 Step 1: Database Setup

### 1.1 Create Database
```bash
# Open MySQL
mysql -u root -p

# Run the schema
SOURCE /path/to/hospital-management-system/database/schema.sql;

# Verify
SHOW DATABASES;
USE hospital_management;
SHOW TABLES;
```

### 1.2 Verify Sample Data
```sql
SELECT * FROM users;
SELECT * FROM doctors;
SELECT * FROM patients;
```

---

## 🔧 Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd /home/ubuntu/hospital-management-system/backend
npm install
```

### 2.2 Configure Environment
```bash
# Copy and edit .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required .env variables:**
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_management
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### 2.3 Start Backend Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**Expected output:**
```
==================================================
Hospital Management System - Backend Server
==================================================
Server running on http://localhost:5000
Environment: development
Database: hospital_management
==================================================
```

---

## 🎨 Step 3: Frontend Setup

### 3.1 Navigate to Frontend
```bash
cd /home/ubuntu/hospital-management-system/frontend
```

### 3.2 Start Frontend Server
```bash
# Using Python 3
python3 -m http.server 3000

# Or using Node.js http-server
npx http-server -p 3000

# Or using PHP
php -S localhost:3000
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 3000 ...
```

---

## 🌐 Step 4: Access Application

### Open in Browser
```
http://localhost:3000
```

### Login with Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | admin123 |
| Staff | staff@hospital.com | admin123 |
| Doctor | doctor@hospital.com | admin123 |
| Patient | patient@hospital.com | admin123 |

---

## 📊 API Endpoints Reference

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user (Protected)
```

### Patients
```
GET    /api/patients               - List all patients
GET    /api/patients/:id           - Get patient details
POST   /api/patients               - Create new patient
PUT    /api/patients/:id           - Update patient
DELETE /api/patients/:id           - Delete patient
GET    /api/patients/search/:query - Search patients
```

### Doctors
```
GET    /api/doctors                - List all doctors
GET    /api/doctors/:id            - Get doctor details
POST   /api/doctors                - Create new doctor (Admin only)
PUT    /api/doctors/:id            - Update doctor (Admin only)
```

### Appointments
```
GET    /api/appointments           - List all appointments
GET    /api/appointments/:id       - Get appointment details
POST   /api/appointments           - Create appointment
PUT    /api/appointments/:id       - Update appointment
```

### Medical Records
```
GET    /api/records                - List all records
GET    /api/records/:id            - Get record details
POST   /api/records                - Create record (Doctor/Admin only)
PUT    /api/records/:id            - Update record
```

### Billing
```
GET    /api/billing                - List all invoices (Staff/Admin only)
GET    /api/billing/:id            - Get invoice details
POST   /api/billing                - Create invoice (Staff/Admin only)
PUT    /api/billing/:id            - Update invoice status
```

### Dashboard
```
GET    /api/dashboard/stats        - Get dashboard statistics
```

---

## 🧪 Testing the System

### 1. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

### 2. Test Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Create Patient
```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "address": "123 Main St"
  }'
```

---

## 🔐 User Roles & Permissions

### Admin
- ✅ Full access to all modules
- ✅ Manage users and staff
- ✅ Create/edit/delete doctors
- ✅ View all data

### Staff
- ✅ Manage patients
- ✅ View appointments
- ✅ Create invoices
- ✅ Track billing

### Doctor
- ✅ View assigned patients
- ✅ Manage appointments
- ✅ Create medical records
- ✅ View patient history

### User (Patient)
- ✅ View own profile
- ✅ View appointment history
- ✅ View medical records

---

## 📁 Project Structure

```
hospital-management-system/
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   ├── .env                       # Configuration
│   ├── controllers/              # Business logic
│   ├── routes/                   # API routes
│   ├── middleware/               # Auth & error handling
│   └── models/                   # Database queries
├── frontend/
│   ├── index.html                # Main HTML
│   ├── css/                      # Stylesheets
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   ├── forms.css
│   │   └── responsive.css
│   └── js/                       # JavaScript
│       ├── app.js
│       ├── api.js
│       ├── auth.js
│       ├── pages/
│       ├── components/
│       └── utils/
├── database/
│   └── schema.sql                # MySQL schema
├── landing/                      # Landing page
│   ├── index.html
│   ├── css/landing.css
│   └── js/landing.js
└── README.md                     # Documentation
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" on port 5000
**Solution:** Make sure backend server is running
```bash
cd backend
npm start
```

### Issue: "Cannot GET /" on port 3000
**Solution:** Make sure frontend server is running
```bash
cd frontend
python3 -m http.server 3000
```

### Issue: "Database connection failed"
**Solution:** Check MySQL is running and credentials are correct
```bash
mysql -u root -p
```

### Issue: "Login fails with 401"
**Solution:** Verify credentials in database
```sql
SELECT * FROM users WHERE email = 'admin@hospital.com';
```

### Issue: CORS errors
**Solution:** Update CORS_ORIGIN in .env to match frontend URL
```
CORS_ORIGIN=http://localhost:3000
```

---

## 📈 Performance Tips

1. **Database Indexing**: Indexes are already created in schema.sql
2. **Connection Pooling**: Backend uses connection pooling by default
3. **Pagination**: Implement pagination for large datasets
4. **Caching**: Consider caching frequently accessed data
5. **Compression**: Enable gzip compression in production

---

## 🚢 Production Deployment

### Backend Deployment (Node.js)
```bash
# 1. Install dependencies
npm install

# 2. Build (if applicable)
npm run build

# 3. Set production environment
export NODE_ENV=production

# 4. Use process manager (PM2)
npm install -g pm2
pm2 start server.js --name "hospital-api"
pm2 save
pm2 startup
```

### Frontend Deployment
```bash
# 1. Build assets (if using build tools)
npm run build

# 2. Serve with production server (nginx/Apache)
# Copy frontend files to /var/www/html/

# 3. Configure reverse proxy for API calls
```

### Database Backup
```bash
# Backup
mysqldump -u root -p hospital_management > backup.sql

# Restore
mysql -u root -p hospital_management < backup.sql
```

---

## 📞 Support & Documentation

- **API Documentation**: See API Endpoints Reference section
- **Database Schema**: See database/schema.sql
- **Frontend Code**: See frontend/js/ directory
- **Backend Code**: See backend/ directory

---

## ✅ Verification Checklist

- [ ] MySQL database created and populated
- [ ] Backend dependencies installed
- [ ] .env file configured with database credentials
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Can login with admin@hospital.com / admin123
- [ ] Dashboard loads with statistics
- [ ] Can view patients, doctors, appointments
- [ ] Can create new records

---

## 🎉 You're All Set!

The Hospital Management System is now ready to use. Start managing your hospital efficiently!

For questions or issues, refer to the troubleshooting section or check the code comments.

**Happy managing!** 🏥
