/**
 * Patient DTOs - v5.0 Production Ready
 * GAP 5 FIX: Data Transfer Objects for patient operations
 */

import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeDate, sanitizeEnum } from '../utils/sanitizer-v5.js';
import { ValidationError, InvalidGenderError } from '../utils/errors-v5.js';

/**
 * Create Patient Request DTO
 */
export class CreatePatientRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.firstName = sanitizeString(data.firstName);
        this.lastName = sanitizeString(data.lastName);
        this.email = sanitizeEmail(data.email);
        this.phone = data.phone ? sanitizePhone(data.phone) : null;
        this.dateOfBirth = data.dateOfBirth ? sanitizeDate(data.dateOfBirth) : null;
        this.gender = sanitizeEnum(data.gender, ['male', 'female', 'other']);
        this.address = data.address ? sanitizeString(data.address) : null;
        this.emergencyContact = data.emergencyContact ? sanitizeString(data.emergencyContact) : null;
        this.emergencyPhone = data.emergencyPhone ? sanitizePhone(data.emergencyPhone) : null;
        this.bloodType = data.bloodType || null;
        this.allergies = data.allergies ? sanitizeString(data.allergies) : null;
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.firstName || typeof data.firstName !== 'string') {
            errors.push({ field: 'firstName', message: 'First name is required' });
        } else if (data.firstName.length < 1 || data.firstName.length > 100) {
            errors.push({ field: 'firstName', message: 'First name must be 1-100 characters' });
        }
        
        if (!data.lastName || typeof data.lastName !== 'string') {
            errors.push({ field: 'lastName', message: 'Last name is required' });
        } else if (data.lastName.length < 1 || data.lastName.length > 100) {
            errors.push({ field: 'lastName', message: 'Last name must be 1-100 characters' });
        }
        
        if (!data.email || typeof data.email !== 'string') {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        
        if (!data.gender || typeof data.gender !== 'string') {
            throw new InvalidGenderError();
        }
        
        if (data.address && data.address.length > 500) {
            errors.push({ field: 'address', message: 'Address must be 500 characters or less' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * Update Patient Request DTO
 */
export class UpdatePatientRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.firstName = data.firstName ? sanitizeString(data.firstName) : undefined;
        this.lastName = data.lastName ? sanitizeString(data.lastName) : undefined;
        this.email = data.email ? sanitizeEmail(data.email) : undefined;
        this.phone = data.phone ? sanitizePhone(data.phone) : undefined;
        this.dateOfBirth = data.dateOfBirth ? sanitizeDate(data.dateOfBirth) : undefined;
        this.gender = data.gender ? sanitizeEnum(data.gender, ['male', 'female', 'other']) : undefined;
        this.address = data.address ? sanitizeString(data.address) : undefined;
        this.emergencyContact = data.emergencyContact ? sanitizeString(data.emergencyContact) : undefined;
        this.emergencyPhone = data.emergencyPhone ? sanitizePhone(data.emergencyPhone) : undefined;
        this.bloodType = data.bloodType || undefined;
        this.allergies = data.allergies ? sanitizeString(data.allergies) : undefined;
    }
    
    validate(data) {
        const errors = [];
        
        if (data.firstName && (typeof data.firstName !== 'string' || data.firstName.length < 1 || data.firstName.length > 100)) {
            errors.push({ field: 'firstName', message: 'First name must be 1-100 characters' });
        }
        
        if (data.lastName && (typeof data.lastName !== 'string' || data.lastName.length < 1 || data.lastName.length > 100)) {
            errors.push({ field: 'lastName', message: 'Last name must be 1-100 characters' });
        }
        
        if (data.gender && typeof data.gender !== 'string') {
            throw new InvalidGenderError();
        }
        
        if (data.address && data.address.length > 500) {
            errors.push({ field: 'address', message: 'Address must be 500 characters or less' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * Patient Response DTO
 */
export class PatientResponseDTO {
    constructor(patient) {
        this.id = patient.id;
        this.firstName = patient.first_name;
        this.lastName = patient.last_name;
        this.email = patient.email;
        this.phone = patient.phone;
        this.dateOfBirth = patient.date_of_birth;
        this.gender = patient.gender;
        this.address = patient.address;
        this.emergencyContact = patient.emergency_contact;
        this.emergencyPhone = patient.emergency_phone;
        this.bloodType = patient.blood_type;
        this.allergies = patient.allergies;
        this.createdAt = patient.created_at;
        this.updatedAt = patient.updated_at;
    }
}

/**
 * Patient List Response DTO
 */
export class PatientListResponseDTO {
    constructor(patients, pagination) {
        this.patients = patients.map(p => new PatientResponseDTO(p));
        this.pagination = pagination;
    }
}

export default {
    CreatePatientRequestDTO,
    UpdatePatientRequestDTO,
    PatientResponseDTO,
    PatientListResponseDTO
};
