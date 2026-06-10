/**
 * Local Storage Management Utility
 */

class StorageManager {
    constructor(prefix = 'hms_') {
        this.prefix = prefix;
    }
    
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    // Specific storage methods
    setUser(user) {
        return this.set('user', user);
    }
    
    getUser() {
        return this.get('user');
    }
    
    setToken(token) {
        return this.set('token', token);
    }
    
    getToken() {
        return this.get('token');
    }
    
    setUserPreferences(prefs) {
        return this.set('preferences', prefs);
    }
    
    getUserPreferences() {
        return this.get('preferences') || {};
    }
}

// Create global storage instance
window.storage = new StorageManager();
