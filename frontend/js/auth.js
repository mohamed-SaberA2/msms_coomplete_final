class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = null;
    }
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }
    getToken() {
        return this.token;
    }
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
    isAuthenticated() {
        return !!this.token;
    }
}
window.authManager = new AuthManager();
