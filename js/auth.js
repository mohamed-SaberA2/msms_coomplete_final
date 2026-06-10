class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
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

  logout() {
    this.clearToken();
    if (window.app) {
      window.app.showPage('login');
    }
    history.pushState({}, "", "/");
  }
}

window.authManager = new AuthManager();
