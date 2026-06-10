/**
 * Auth Manager - Simple authentication helper
 * ✅ No redirects to /login
 * ✅ Works with SPA pattern
 */

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  logout() {
    this.clearToken();
    
    // ✅ CORRECT: Use app.showPage() instead of redirect
    if (window.app && typeof window.app.showPage === 'function') {
      window.app.showPage('login');
    }
    
    // ✅ Keep URL clean
    if (window.history && window.history.pushState) {
      window.history.pushState({}, "", "/");
    }
  }
}

// Create global instance
window.authManager = new AuthManager();
