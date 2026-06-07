-- ============================================
-- Hospital Management System - MySQL Schema
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'doctor', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ DOCTORS TABLE ============
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    office_location VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_specialization (specialization),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ PATIENTS TABLE ============
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    medical_history TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ APPOINTMENTS TABLE ============
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    reason TEXT,
    status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ MEDICAL RECORDS TABLE ============
CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    visit_date DATE NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    prescriptions TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ INVOICES TABLE ============
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    due_date DATE,
    payment_status ENUM('pending', 'paid', 'unpaid', 'overdue') DEFAULT 'pending',
    payment_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ AUDIT LOGS TABLE ============
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============ INSERT SAMPLE DATA ============

-- Insert sample users
-- Password for all users: admin123
-- Hash: $2a$10$eR6nhOgfQCCM0qqyogPN4eJT3G4reyzBbjITB4a8qkluHmx/c2vg6
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@hospital.com', '$2a$10$eR6nhOgfQCCM0qqyogPN4eJT3G4reyzBbjITB4a8qkluHmx/c2vg6', 'admin'),
('Staff User', 'staff@hospital.com', '$2a$10$eR6nhOgfQCCM0qqyogPN4eJT3G4reyzBbjITB4a8qkluHmx/c2vg6', 'staff'),
('Dr. John Smith', 'doctor@hospital.com', '$2a$10$eR6nhOgfQCCM0qqyogPN4eJT3G4reyzBbjITB4a8qkluHmx/c2vg6', 'doctor'),
('Patient User', 'patient@hospital.com', '$2a$10$eR6nhOgfQCCM0qqyogPN4eJT3G4reyzBbjITB4a8qkluHmx/c2vg6', 'user');

-- Insert sample doctors
INSERT INTO doctors (first_name, last_name, email, phone, specialization, license_number, office_location, is_active) VALUES
('John', 'Smith', 'john.smith@hospital.com', '555-0101', 'Cardiology', 'LIC001', 'Building A, Floor 2', 1),
('Sarah', 'Johnson', 'sarah.johnson@hospital.com', '555-0102', 'Neurology', 'LIC002', 'Building B, Floor 3', 1),
('Michael', 'Brown', 'michael.brown@hospital.com', '555-0103', 'Orthopedics', 'LIC003', 'Building A, Floor 1', 1),
('Emily', 'Davis', 'emily.davis@hospital.com', '555-0104', 'Pediatrics', 'LIC004', 'Building C, Floor 2', 1),
('Robert', 'Wilson', 'robert.wilson@hospital.com', '555-0105', 'General Surgery', 'LIC005', 'Building B, Floor 1', 1);

-- Insert sample patients
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, emergency_contact, emergency_phone) VALUES
('James', 'Anderson', 'james.anderson@email.com', '555-1001', '1980-05-15', 'male', '123 Main St, City', 'Hypertension, Diabetes', 'Mary Anderson', '555-1002'),
('Patricia', 'Martinez', 'patricia.martinez@email.com', '555-1003', '1975-08-22', 'female', '456 Oak Ave, City', 'Asthma', 'Carlos Martinez', '555-1004'),
('Christopher', 'Garcia', 'christopher.garcia@email.com', '555-1005', '1990-03-10', 'male', '789 Pine Rd, City', 'None', 'Linda Garcia', '555-1006'),
('Jennifer', 'Rodriguez', 'jennifer.rodriguez@email.com', '555-1007', '1985-11-30', 'female', '321 Elm St, City', 'Migraine', 'David Rodriguez', '555-1008'),
('Daniel', 'Lee', 'daniel.lee@email.com', '555-1009', '1992-07-18', 'male', '654 Maple Dr, City', 'None', 'Susan Lee', '555-1010');

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, notes) VALUES
(1, 1, CURDATE(), '09:00:00', 'Heart checkup', 'scheduled', 'Regular checkup'),
(2, 2, CURDATE(), '10:30:00', 'Headache consultation', 'scheduled', 'Recurring headaches'),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', 'Knee pain', 'scheduled', 'Sports injury'),
(4, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Child vaccination', 'scheduled', 'Annual checkup'),
(5, 5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '15:30:00', 'Pre-surgery consultation', 'scheduled', 'Appendix removal');

-- Insert sample medical records
INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, treatment, prescriptions, notes, follow_up_date) VALUES
(1, 1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'Hypertension', 'Medication and lifestyle changes', 'Lisinopril 10mg daily', 'Patient responding well to treatment', DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'Migraine', 'Preventive therapy', 'Sumatriptan 50mg as needed', 'Consider MRI if symptoms persist', DATE_ADD(CURDATE(), INTERVAL 15 DAY)),
(3, 3, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Knee sprain', 'Physical therapy', 'Ibuprofen 400mg twice daily', 'Rest and ice recommended', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(4, 4, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'Healthy', 'Vaccination', 'Routine vaccines', 'All vaccines up to date', DATE_ADD(CURDATE(), INTERVAL 365 DAY)),
(5, 5, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Appendicitis', 'Surgery scheduled', 'Pre-operative medications', 'Patient cleared for surgery', CURDATE());

-- Insert sample invoices
INSERT INTO invoices (patient_id, amount, description, due_date, payment_status, payment_date, payment_method) VALUES
(1, 150.00, 'Cardiology consultation', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'pending', NULL, NULL),
(2, 100.00, 'Neurology consultation', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'paid', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Credit Card'),
(3, 200.00, 'Orthopedic treatment', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'pending', NULL, NULL),
(4, 75.00, 'Pediatric checkup', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'paid', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'Insurance'),
(5, 500.00, 'Pre-surgery consultation', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'unpaid', NULL, NULL);

-- ============ CREATE INDEXES FOR PERFORMANCE ============
CREATE INDEX idx_appointment_patient_doctor ON appointments(patient_id, doctor_id);
CREATE INDEX idx_medical_record_dates ON medical_records(visit_date, follow_up_date);
CREATE INDEX idx_invoice_status_date ON invoices(payment_status, created_at);

-- ============ VERIFY TABLES ============
SHOW TABLES;
SELECT 'Database setup complete!' as status;
