/**
 * API Communication Module (Production Ready)
 * Handles all HTTP requests to the backend
 */

class APIClient {
    constructor(baseUrl = '/api') {
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

            // 🔐 Unauthorized handling
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return null;
            }

            // ❌ Handle errors
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                return null;
            }

            return await response.json();

        } catch (error) {
            console.error('Network Error:', error);
            return null;
        }
    }

    // ================= AUTH =================
    login(email, password) {
        return this.request('POST', '/auth/login', { email, password });
    }

    getCurrentUser() {
        return this.request('GET', '/auth/me');
    }

    logout() {
        return this.request('POST', '/auth/logout');
    }

    // ================= PATIENTS =================
    getPatients(page = 1, limit = 10) {
        return this.request('GET', `/patients?page=${page}&limit=${limit}`);
    }

    getPatient(id) {
        return this.request('GET', `/patients/${id}`);
    }

    createPatient(data) {
        return this.request('POST', '/patients', data);
    }

    updatePatient(id, data) {
        return this.request('PUT', `/patients/${id}`, data);
    }

    deletePatient(id) {
        return this.request('DELETE', `/patients/${id}`);
    }

    searchPatients(query) {
        return this.request('GET', `/patients/search?q=${encodeURIComponent(query)}`);
    }

    // ================= DOCTORS =================
    getDoctors(page = 1, limit = 10) {
        return this.request('GET', `/doctors?page=${page}&limit=${limit}`);
    }

    getDoctor(id) {
        return this.request('GET', `/doctors/${id}`);
    }

    createDoctor(data) {
        return this.request('POST', '/doctors', data);
    }

    updateDoctor(id, data) {
        return this.request('PUT', `/doctors/${id}`, data);
    }

    // ================= APPOINTMENTS =================
    getAppointments(page = 1, limit = 10, status = null) {
        let url = `/appointments?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return this.request('GET', url);
    }

    createAppointment(data) {
        return this.request('POST', '/appointments', data);
    }

    updateAppointment(id, data) {
        return this.request('PUT', `/appointments/${id}`, data);
    }

    cancelAppointment(id) {
        return this.request('DELETE', `/appointments/${id}`);
    }

    // ================= RECORDS =================
    getRecords(page = 1, limit = 10) {
        return this.request('GET', `/records?page=${page}&limit=${limit}`);
    }

    createRecord(data) {
        return this.request('POST', '/records', data);
    }

    // ================= BILLING =================
    getInvoices(page = 1, limit = 10) {
        return this.request('GET', `/billing?page=${page}&limit=${limit}`);
    }

    createInvoice(data) {
        return this.request('POST', '/billing', data);
    }

    updateInvoiceStatus(id, status) {
        return this.request('PUT', `/billing/${id}`, { status });
    }

    // ================= DASHBOARD =================
    getDashboardStats() {
        return this.request('GET', '/dashboard/stats');
    }
}

// 🌐 Global instance
window.api = new APIClient();
