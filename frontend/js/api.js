/**
 * API Communication Module
 * Handles all HTTP requests to the backend
 */

class APIClient {
    constructor(baseUrl = 'http://127.0.0.1:5000/api') {
        this.baseUrl = baseUrl;
    }
    
    getHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
    
    async request(method, endpoint, data = null) {
        try {
            const options = {
                method,
                headers: this.getHeaders()
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                console.log('Token expired - redirecting to login');
                window.location.href = '/';
                return null;
            }
            
            if (!response.ok) {
                console.warn(`API Error: ${response.status} ${response.statusText}`);
                try {
                    const error = await response.json();
                    console.error('API Error Details:', error);
                } catch (e) {
                    console.error('Could not parse error response');
                }
                return null;
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            return null;
        }
    }
    
    // Authentication
    async login(email, password) {
        return this.request('POST', '/auth/login', { email, password });
    }
    
    async getCurrentUser() {
        return this.request('GET', '/auth/me');
    }
    
    async logout() {
        return this.request('POST', '/auth/logout');
    }
    
    // Patients
    async getPatients(page = 1, limit = 10) {
        return this.request('GET', `/patients?page=${page}&limit=${limit}`);
    }
    
    async getPatient(id) {
        return this.request('GET', `/patients/${id}`);
    }
    
    async createPatient(data) {
        return this.request('POST', '/patients', data);
    }
    
    async updatePatient(id, data) {
        return this.request('PUT', `/patients/${id}`, data);
    }
    
    async deletePatient(id) {
        return this.request('DELETE', `/patients/${id}`);
    }
    
    async searchPatients(query) {
        return this.request('GET', `/patients/search?q=${encodeURIComponent(query)}`);
    }
    
    // Doctors
    async getDoctors(page = 1, limit = 10) {
        return this.request('GET', `/doctors?page=${page}&limit=${limit}`);
    }
    
    async getDoctor(id) {
        return this.request('GET', `/doctors/${id}`);
    }
    
    async createDoctor(data) {
        return this.request('POST', '/doctors', data);
    }
    
    async updateDoctor(id, data) {
        return this.request('PUT', `/doctors/${id}`, data);
    }
    
    async getAvailableSlots(doctorId, date) {
        return this.request('GET', `/doctors/${doctorId}/slots?date=${date}`);
    }
    
    // Appointments
    async getAppointments(page = 1, limit = 10, status = null) {
        let url = `/appointments?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return this.request('GET', url);
    }
    
    async getAppointment(id) {
        return this.request('GET', `/appointments/${id}`);
    }
    
    async createAppointment(data) {
        return this.request('POST', '/appointments', data);
    }
    
    async updateAppointment(id, data) {
        return this.request('PUT', `/appointments/${id}`, data);
    }
    
    async cancelAppointment(id) {
        return this.request('DELETE', `/appointments/${id}`);
    }
    
    async getTodayAppointments() {
        return this.request('GET', '/appointments/today');
    }
    
    // Medical Records
    async getRecords(page = 1, limit = 10) {
        return this.request('GET', `/records?page=${page}&limit=${limit}`);
    }
    
    async getRecord(id) {
        return this.request('GET', `/records/${id}`);
    }
    
    async createRecord(data) {
        return this.request('POST', '/records', data);
    }
    
    async updateRecord(id, data) {
        return this.request('PUT', `/records/${id}`, data);
    }
    
    async getPatientRecords(patientId) {
        return this.request('GET', `/records/patient/${patientId}`);
    }
    
    // Billing
    async getInvoices(page = 1, limit = 10, status = null) {
        let url = `/billing?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return this.request('GET', url);
    }
    
    async getInvoice(id) {
        return this.request('GET', `/billing/${id}`);
    }
    
    async createInvoice(data) {
        return this.request('POST', '/billing', data);
    }
    
    async updateInvoiceStatus(id, status, paidDate = null) {
        return this.request('PUT', `/billing/${id}`, { status, paidDate });
    }
    
    async generateInvoice(appointmentId, data) {
        return this.request('POST', `/billing/generate/${appointmentId}`, data);
    }
    
    async getBillingStats() {
        return this.request('GET', '/billing/stats');
    }
    
    // Dashboard
    async getDashboardStats() {
        return this.request('GET', '/dashboard/stats');
    }
    
    async getRecentActivity(limit = 10) {
        return this.request('GET', `/dashboard/activity?limit=${limit}`);
    }
}

// Create global API client instance
window.api = new APIClient();
