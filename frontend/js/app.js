class HospitalApp {
    constructor() {
        this.currentPage = 'login';

        // ✅ مهم: ربطه بالـ Backend على Replit
        this.apiUrl = 'https://msmscoompletefinal--ms1464684.replit.app/api';

        this.currentUser = null;

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
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    setupEventListeners() {
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
            const response = await fetch(`${this.apiUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user || data;
                this.showPage('dashboard');
            } else {
                localStorage.removeItem('authToken');
                this.showPage('login');
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showPage('login');
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    this.currentUser = data.user;
                    this.showPage('dashboard');

                    console.log('Login successful');
                } else {
                    alert('Login failed');
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            alert('Network error - check backend connection');
        }
    }

    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
        }

        this.currentPage = page;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new HospitalApp();
});
