class HospitalApp {
  constructor() {
    this.currentPage = 'login';
    this.currentUser = null;
    this.apiUrl = 'https://msmscoompletefinal--ms1464684.replit.app/api';
    this.init();
  }

  init() {
    console.log('Initializing Hospital Management System...');
    this.setupEventListeners();
    this.hideLoadingScreen();
    this.checkAuthentication();
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
  }

  async checkAuthentication() {
    const token = localStorage.getItem('authToken');

    if (!token) {
      this.showPage('login');
      return;
    }

    try {
      const res = await fetch(`${this.apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      this.currentUser = data.user || data;

      this.showPage('dashboard');
      this.updateUserInfo();
    } catch (err) {
      localStorage.removeItem('authToken');
      this.showPage('login');
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      alert('Login failed');
      return;
    }

    const data = await res.json();
    localStorage.setItem('authToken', data.token);

    this.currentUser = data.user;
    this.showPage('dashboard');
  }

  logout() {
    localStorage.removeItem('authToken');
    this.showPage('login');
  }

  handleNavigation(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    this.showPage(page);
  }

  showPage(page) {
    // ❌ مهم: يمنع /login و /dashboard في URL
    history.pushState({}, "", "/");

    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));

    if (page === 'login') {
      document.getElementById('login-page').classList.remove('hidden');
      this.currentPage = 'login';
      return;
    }

    document.getElementById('dashboard-page').classList.remove('hidden');

    const section = document.getElementById(`${page}-content`);
    if (section) section.classList.remove('hidden');

    this.currentPage = page;
  }

  updateUserInfo() {
    if (!this.currentUser) return;

    const name = document.getElementById('user-name');
    const role = document.getElementById('user-role');

    if (name) name.textContent = this.currentUser.name || this.currentUser.email;
    if (role) role.textContent = (this.currentUser.role || 'user').toUpperCase();
  }

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new HospitalApp();
});
