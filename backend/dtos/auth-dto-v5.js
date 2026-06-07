/**
 * Authentication DTOs - v5.0 Production Ready
 * GAP 5 FIX: Data Transfer Objects for input/output validation
 */

import { sanitizeString, sanitizeEmail } from '../utils/sanitizer-v5.js';
import { ValidationError, WeakPasswordError } from '../utils/errors-v5.js';

/**
 * Register Request DTO
 */
export class RegisterRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.name = sanitizeString(data.name);
        this.email = sanitizeEmail(data.email);
        this.password = data.password; // Don't sanitize passwords
        this.role = data.role || 'user';
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string') {
            errors.push({ field: 'name', message: 'Name is required' });
        } else if (data.name.length < 2 || data.name.length > 255) {
            errors.push({ field: 'name', message: 'Name must be 2-255 characters' });
        }
        
        if (!data.email || typeof data.email !== 'string') {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        
        if (!data.password || typeof data.password !== 'string') {
            errors.push({ field: 'password', message: 'Password is required' });
        } else if (data.password.length < 8) {
            throw new WeakPasswordError('Password must be at least 8 characters');
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
            throw new WeakPasswordError('Password must contain uppercase, lowercase, and numbers');
        }
        
        if (data.role && !['admin', 'staff', 'doctor', 'user'].includes(data.role)) {
            errors.push({ field: 'role', message: 'Invalid role' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * Login Request DTO
 */
export class LoginRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.email = sanitizeEmail(data.email);
        this.password = data.password; // Don't sanitize passwords
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.email || typeof data.email !== 'string') {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        
        if (!data.password || typeof data.password !== 'string') {
            errors.push({ field: 'password', message: 'Password is required' });
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * Refresh Token Request DTO
 */
export class RefreshTokenRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.refreshToken = data.refreshToken;
    }
    
    validate(data) {
        if (!data.refreshToken || typeof data.refreshToken !== 'string') {
            throw new ValidationError('Refresh token is required');
        }
    }
}

/**
 * Change Password Request DTO
 */
export class ChangePasswordRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.oldPassword = data.oldPassword;
        this.newPassword = data.newPassword;
    }
    
    validate(data) {
        const errors = [];
        
        if (!data.oldPassword || typeof data.oldPassword !== 'string') {
            errors.push({ field: 'oldPassword', message: 'Current password is required' });
        }
        
        if (!data.newPassword || typeof data.newPassword !== 'string') {
            errors.push({ field: 'newPassword', message: 'New password is required' });
        } else if (data.newPassword.length < 8) {
            throw new WeakPasswordError('New password must be at least 8 characters');
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
            throw new WeakPasswordError('New password must contain uppercase, lowercase, and numbers');
        }
        
        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }
}

/**
 * Update Profile Request DTO
 */
export class UpdateProfileRequestDTO {
    constructor(data) {
        this.validate(data);
        
        this.name = data.name ? sanitizeString(data.name) : undefined;
        this.email = data.email ? sanitizeEmail(data.email) : undefined;
    }
    
    validate(data) {
        const errors = [];
        
        if (data.name && (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 255)) {
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
    constructor(user, accessToken, refreshToken) {
        this.user = new UserResponseDTO(user);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}

/**
 * Refresh Token Response DTO
 */
export class RefreshTokenResponseDTO {
    constructor(accessToken) {
        this.accessToken = accessToken;
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
