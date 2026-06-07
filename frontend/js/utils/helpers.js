/**
 * Helper Utilities
 */

class Helpers {
    // Date formatting
    static formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    static formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static formatTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Currency formatting
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    // Phone formatting
    static formatPhone(phone) {
        if (!phone) return '-';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    }
    
    // Email validation
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Phone validation
    static isValidPhone(phone) {
        const re = /^\d{10}$/;
        return re.test(phone.replace(/\D/g, ''));
    }
    
    // Generate unique ID
    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Capitalize string
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // Truncate string
    static truncate(str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
    
    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    // Merge objects
    static merge(target, source) {
        return { ...target, ...source };
    }
    
    // Get query parameters
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const obj = {};
        for (let [key, value] of params) {
            obj[key] = value;
        }
        return obj;
    }
    
    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Array utilities
    static unique(arr) {
        return [...new Set(arr)];
    }
    
    static groupBy(arr, key) {
        return arr.reduce((result, obj) => {
            const group = obj[key];
            if (!result[group]) result[group] = [];
            result[group].push(obj);
            return result;
        }, {});
    }
    
    // Pagination helper
    static paginate(arr, page, pageSize) {
        const start = (page - 1) * pageSize;
        return arr.slice(start, start + pageSize);
    }
}

// Export for global use
window.Helpers = Helpers;
