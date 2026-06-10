/**
 * Hospital Management System - Main Application File
 * Handles page routing, navigation, and overall app state
 */

class HospitalApp {
    constructor() {
        this.currentPage = 'login';
        this.currentUser = null;
        this.apiUrl = 'http://127.0.0.1:5000/api';
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
            console.log('Loading screen hidden');
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Menu toggle for mobile
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
    
    async checkAuthentication() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.log('No token found - showing login page');
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
                if (data && (data.user || data.id)) {
                    this.currentUser = data.user || data;
                    console.log('User authenticated:', this.currentUser);
                    this.showPage('dashboard');
                    this.updateUserInfo();
                } else {
                    console.log('Invalid user data - showing login');
                    localStorage.removeItem('authToken');
                    this.showPage('login');
                }
            } else if (response.status === 401) {
                console.log('Token expired - showing login');
                localStorage.removeItem('authToken');
                this.showPage('login');
            } else {
                console.log('Auth check failed with status:', response.status);
                this.showPage('login');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            console.log('Error during auth check - showing login page');
            this.showPage('login');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }
        
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
                    this.currentUser = data.user || { email };
                    console.log('Login successful');
                    this.showPage('dashboard');
                    this.updateUserInfo();
                    this.showToast('Login successful!', 'success');
                } else {
                    this.showToast('Login failed: No token received', 'error');
                }
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please check your connection.', 'error');
        }
    }
    
    async logout() {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch(`${this.apiUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.showPage('login');
        this.showToast('Logged out successfully', 'info');
    }
    
    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        this.showPage(page);
    }
    
    showPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.add('hidden');
        });
        
        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.add('hidden');
        });
        
        // Remove active state from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (page === 'login') {
            document.getElementById('login-page').classList.remove('hidden');
            this.currentPage = 'login';
        } else {
            document.getElementById('dashboard-page').classList.remove('hidden');
            const contentSection = document.getElementById(`${page}-content`);
            if (contentSection) {
                contentSection.classList.remove('hidden');
            }
            
            // Set active nav item
            const navItem = document.querySelector(`[data-page="${page}"]`);
            if (navItem) {
                navItem.classList.add('active');
            }
            
            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = this.formatPageTitle(page);
            }
            
            this.currentPage = page;
            
            // Load page data
            this.loadPageData(page);
        }
        
        // Close sidebar on mobile
        this.closeSidebar();
    }
    
    formatPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            patients: 'Patients',
            doctors: 'Doctors',
            appointments: 'Appointments',
            records: 'Medical Records',
            billing: 'Billing & Invoices'
        };
        return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
    }
    
    loadPageData(page) {
        // Dispatch page-specific loading
        const event = new CustomEvent('pageLoad', { detail: { page } });
        document.dispatchEvent(event);
    }
    
    updateUserInfo() {
        if (this.currentUser) {
            const userNameEl = document.getElementById('user-name');
            const userRoleEl = document.getElementById('user-role');
            
            if (userNameEl) {
                userNameEl.textContent = this.currentUser.fullName || this.currentUser.name || this.currentUser.email || 'User';
            }
            if (userRoleEl) {
                userRoleEl.textContent = (this.currentUser.role || 'user').toUpperCase();
            }
        }
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast ${type}`;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HospitalApp();
});

// Also try initializing immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.app) {
            window.app = new HospitalApp();
        }
    });
} else {
    if (!window.app) {
        window.app = new HospitalApp();
    }
}
