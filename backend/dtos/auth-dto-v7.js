/**
 * Authentication DTOs - v7.0 CORRECTED
 * 🔥 FIXES: Password not sanitized, uses raw password value
 */

import { sanitizeString, sanitizeEmail, sanitizeRequestBody } from '../utils/sanitizer-v7.js';
import { ValidationError, WeakPasswordError, DuplicateEmailError } from '../utils/errors-v5.js';
import bcrypt from 'bcryptjs';

/**
 * ✅ FIXED: Register Request DTO
 * - Password is NOT sanitized - uses raw value
 * - All errors are custom errors
 */
export class RegisterRequestDTO {
    constructor(data) {
        // Sanitize input - password type prevents sanitization
        const sanitized = sanitizeRequestBody(data, {
            name: { type: 'string' },
            email: { type: 'email' },
            password: { type: 'password' }, // ✅ FIXED: Password type
            role: { type: 'enum', values: ['admin', 'staff', 'doctor', 'user'] }
        });
        
        // Validate
        this.validate(sanitized);
        
        // Assign sanitized values
        this.name = sanitized.name;
        this.email = sanitized.email;
        // ✅ FIXED: Use raw password, not sanitized
        this.password = data.password;
        this.role = sanitized.role || 'user';
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.name || data.name.length < 2 || data.name.length > 255) {
            errors.push({ field: 'name', message: 'Name must be 2-255 characters' });
        }
        
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        
        if (!this.password || this.password.length < 8) {
            throw new WeakPasswordError('Password must be at least 8 characters');
        }
        
        // Check password strength: uppercase, lowercase, numbers
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.password)) {
            throw new WeakPasswordError('Password must contain uppercase, lowercase, and numbers');
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
    
    /**
     * Hash password with bcrypt
     * 10 salt rounds (industry standard)
     */
    async hashPassword() {
        const saltRounds = 10;
        this.passwordHash = await bcrypt.hash(this.password, saltRounds);
        // Clear plain password from memory
        this.password = undefined;
        return this.passwordHash;
    }
}

/**
 * ✅ FIXED: Login Request DTO
 * - Password is NOT sanitized
 * - All errors are custom errors
 */
export class LoginRequestDTO {
    constructor(data) {
        // Sanitize input - password type prevents sanitization
        const sanitized = sanitizeRequestBody(data, {
            email: { type: 'email' },
            password: { type: 'password' } // ✅ FIXED: Password type
        });
        
        // Validate
        this.validate(sanitized);
        
        // Assign sanitized values
        this.email = sanitized.email;
        // ✅ FIXED: Use raw password, not sanitized
        this.password = data.password;
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.email) {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        
        if (!this.password) {
            errors.push({ field: 'password', message: 'Password is required' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
    
    /**
     * Compare password with hash
     * Uses bcrypt.compare() for timing attack protection
     */
    async verifyPassword(passwordHash) {
        return await bcrypt.compare(this.password, passwordHash);
    }
}

/**
 * ✅ FIXED: Refresh Token Request DTO
 * - All errors are custom errors
 */
export class RefreshTokenRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.refreshToken = data.refreshToken;
    }
    
    validate(data) {
        if (!data.refreshToken || typeof data.refreshToken !== 'string') {
            throw new ValidationError('Refresh token is required', [
                { field: 'refreshToken', message: 'Token must be provided' }
            ]);
        }
    }
}

/**
 * ✅ FIXED: Change Password Request DTO
 * - Passwords are NOT sanitized
 * - All errors are custom errors
 */
export class ChangePasswordRequestDTO {
    constructor(data) {
        // Sanitize input - password types prevent sanitization
        const sanitized = sanitizeRequestBody(data, {
            oldPassword: { type: 'password' }, // ✅ FIXED: Password type
            newPassword: { type: 'password' }  // ✅ FIXED: Password type
        });
        
        // Validate
        this.validate(sanitized);
        
        // Assign sanitized values
        // ✅ FIXED: Use raw passwords, not sanitized
        this.oldPassword = data.oldPassword;
        this.newPassword = data.newPassword;
    }
    
    validate(data) {
        const errors = [];
        
        if (!this.oldPassword) {
            errors.push({ field: 'oldPassword', message: 'Current password is required' });
        }
        
        if (!this.newPassword || this.newPassword.length < 8) {
            throw new WeakPasswordError('New password must be at least 8 characters');
        }
        
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.newPassword)) {
            throw new WeakPasswordError('New password must contain uppercase, lowercase, and numbers');
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
    
    async hashNewPassword() {
        const saltRounds = 10;
        this.newPasswordHash = await bcrypt.hash(this.newPassword, saltRounds);
        this.newPassword = undefined;
        return this.newPasswordHash;
    }
}

/**
 * ✅ FIXED: Update Profile Request DTO
 * - All errors are custom errors
 */
export class UpdateProfileRequestDTO {
    constructor(data) {
        // Sanitize input
        const sanitized = sanitizeRequestBody(data, {
            name: { type: 'string' },
            email: { type: 'email' }
        });
        
        // Validate
        this.validate(sanitized);
        
        // Assign sanitized values
        this.name = sanitized.name || undefined;
        this.email = sanitized.email || undefined;
    }
    
    validate(data) {
        const errors = [];
        
        if (data.name && (data.name.length < 2 || data.name.length > 255)) {
            errors.push({ field: 'name', message: 'Name must be 2-255 characters' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * User Response DTO
 */
export class UserResponseDTO {
    constructor(user) {
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.role = user.role;
        this.createdAt = user.created_at;
    }
}

/**
 * Login Response DTO
 */
export class LoginResponseDTO {
    constructor(user, accessToken) {
        this.user = new UserResponseDTO(user);
        this.accessToken = accessToken;
        // refreshToken is sent via HttpOnly cookie, not in response body
    }
}

/**
 * Refresh Token Response DTO
 */
export class RefreshTokenResponseDTO {
    constructor(accessToken) {
        this.accessToken = accessToken;
        // refreshToken is sent via HttpOnly cookie, not in response body
    }
}

export default {
    RegisterRequestDTO,
    LoginRequestDTO,
    RefreshTokenRequestDTO,
    ChangePasswordRequestDTO,
    UpdateProfileRequestDTO,
    UserResponseDTO,
    LoginResponseDTO,
    RefreshTokenResponseDTO
};
