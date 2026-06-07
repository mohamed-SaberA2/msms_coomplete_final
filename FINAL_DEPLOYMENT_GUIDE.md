# Hospital Management System - Final Deployment Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- Node.js 14+ installed
- MySQL 5.7+ installed and running
- Git (optional)

### Step 1: Extract Files
```bash
unzip hospital-management-system-COMPLETE.zip
cd hospital-management-system
```

### Step 2: Setup Database
```bash
mysql -u root -p < database/schema.sql
```
- When prompted for password, enter your MySQL password (or press Enter if no password)
- This creates the `hospital_management` database with all tables and sample data

### Step 3: Install Backend
```bash
cd backend
npm install
```

### Step 4: Configure Backend (Optional)
Edit `backend/.env` if needed:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_management
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Step 5: Start Backend
```bash
npm start
```

Expected output:
```
==================================================
Hospital Management System - Backend Server
==================================================
Server running on http://localhost:5000
Environment: development
Database: hospital_management
==================================================
```

### Step 6: Start Frontend (New Terminal)
```bash
cd frontend
npx http-server -p 3000
```

Expected output:
```
Starting up http-server, serving ./
http://127.0.0.1:3000
```

### Step 7: Open Browser
Navigate to: **http://127.0.0.1:3000**

### Step 8: Login
Use any of these credentials:
- **Email:** admin@hospital.com | **Password:** admin123 | **Role:** Admin
- **Email:** staff@hospital.com | **Password:** admin123 | **Role:** Staff
- **Email:** doctor@hospital.com | **Password:** admin123 | **Role:** Doctor
- **Email:** patient@hospital.com | **Password:** admin123 | **Role:** Patient

---

## 📊 System Overview

### Features
✅ **Patient Management** - Register, view, edit, search patients
✅ **Doctor Management** - Add/edit doctors with specialization
✅ **Appointment Scheduling** - Book, reschedule, cancel appointments
✅ **Medical Records** - Create and view patient visit records
✅ **Billing & Invoices** - Generate invoices and track payments
✅ **Dashboard** - 4 key metrics (patients, appointments, bills, doctors)
✅ **Role-Based Access** - Admin, Staff, Doctor, Patient roles
✅ **Authentication** - JWT-based login system

### Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js 14+, Express 4.18+
- **Database:** MySQL 5.7+
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** Bcryptjs

---

## 🗂️ Project Structure

```
hospital-management-system/
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Dependencies
│   ├── .env                   # Configuration
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth & error handling
│   └── models/                # Database queries
├── frontend/
│   ├── index.html             # Main HTML
│   ├── css/                   # Stylesheets
│   │   ├── style.css          # Main styles
│   │   ├── dashboard.css      # Dashboard styles
│   │   ├── forms.css          # Form styles
│   │   └── responsive.css     # Mobile styles
│   └── js/                    # JavaScript
│       ├── app.js             # Main app logic
│       ├── api.js             # API calls
│       ├── auth.js            # Auth helper
│       ├── pages/             # Page modules
│       ├── components/        # UI components
│       └── utils/             # Utilities
├── database/
│   └── schema.sql             # MySQL schema
├── landing/                   # Landing page
├── README.md                  # Project overview
├── SETUP_GUIDE.md            # Detailed setup
└── PROJECT_DOCUMENTATION.md  # API reference
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/records` - List all records
- `POST /api/records` - Create record
- `GET /api/records/:id` - Get record by ID

### Billing
- `GET /api/billing` - List all invoices
- `POST /api/billing` - Create invoice
- `PUT /api/billing/:id` - Update invoice

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## 🧪 Testing

### Test Login
1. Go to http://127.0.0.1:3000
2. Enter: admin@hospital.com / admin123
3. Click "Sign In"
4. You should see the Dashboard

### Test Patient Management
1. Click "Patients" in sidebar
2. Click "+ Add Patient"
3. Fill in form and submit
4. Patient should appear in list

### Test Other Features
- **Doctors:** Add/edit doctor profiles
- **Appointments:** Book appointments for patients
- **Records:** Create medical records
- **Billing:** Generate invoices

---

## 🐛 Troubleshooting

### "Cannot connect to database"
**Solution:** 
- Ensure MySQL is running
- Check `.env` file credentials
- Verify database was imported: `mysql -u root -p hospital_management`

### "Login fails"
**Solution:**
- Make sure schema.sql was imported
- Use exact credentials: admin@hospital.com / admin123
- Check browser console for errors (F12)

### "Frontend shows Loading..."
**Solution:**
- Hard refresh: Ctrl + F5
- Check backend is running on port 5000
- Check browser console for errors

### "Cannot GET /api"
**Solution:**
- This is normal - the API doesn't have a root endpoint
- Test specific endpoints like: http://127.0.0.1:5000/api/auth/login

### Port Already in Use
**Solution:**
- Backend: Change PORT in .env file
- Frontend: Use different port: `npx http-server -p 3001`

---

## 📱 Responsive Design

The system is fully responsive and works on:
- ✅ Desktop (1920x1080, 1366x768)
- ✅ Tablet (768x1024, 834x1112)
- ✅ Mobile (375x667, 414x896)

---

## 🔒 Security Features

✅ JWT token-based authentication
✅ Bcryptjs password hashing (10 rounds)
✅ SQL injection prevention (parameterized queries)
✅ CORS configuration
✅ Input validation
✅ Error handling
✅ Role-based authorization
✅ Secure session management

---

## 📈 Performance

- Connection pooling (10 connections)
- Database indexes on frequently queried fields
- Optimized queries with pagination
- CSS and JavaScript minification ready
- Lazy loading for large datasets

---

## 🚀 Deployment to Production

### Before Deploying
1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use strong `JWT_SECRET`
4. Configure proper database credentials
5. Enable HTTPS
6. Set up proper error logging

### Deployment Options
- **Heroku:** Use Procfile for deployment
- **AWS:** Use EC2 or Elastic Beanstalk
- **DigitalOcean:** Use App Platform
- **VPS:** Manual deployment with PM2

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review PROJECT_DOCUMENTATION.md for API details
3. Check browser console (F12) for errors
4. Verify all prerequisites are installed

---

## 📝 License

This Hospital Management System is provided as-is for educational and commercial use.

---

**Happy managing!** 🏥✨
