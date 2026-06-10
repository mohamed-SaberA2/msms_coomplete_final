/**
 * API Client - GitHub Pages Compatible
 * ✅ Creates window.apiClient globally
 */

class APIClient {
  constructor(baseUrl = 'https://msmscoompletefinal--ms1464684.replit.app/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        if (window.app) {
          window.app.showPage('login');
        }
        throw new Error('Unauthorized');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error(`API Error:`, error);
      throw error;
    }
  }

  // ============= AUTH ENDPOINTS =============
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ============= DASHBOARD ENDPOINTS =============
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getDashboardActivity(limit = 10) {
    return this.request(`/dashboard/activity?limit=${limit}`);
  }

  // ============= PATIENT ENDPOINTS =============
  async getPatients(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    return this.request(endpoint);
  }

  async getPatient(id) {
    return this.request(`/patients/${id}`);
  }

  async createPatient(patientData) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id, patientData) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id) {
    return this.request(`/patients/${id}`, { method: 'DELETE' });
  }

  // ============= DOCTORS ENDPOINTS =============
  async getDoctors() {
    return this.request('/doctors');
  }

  async getDoctor(id) {
    return this.request(`/doctors/${id}`);
  }

  async createDoctor(doctorData) {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  // ============= APPOINTMENTS ENDPOINTS =============
  async getAppointments() {
    return this.request('/appointments');
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id, appointmentData) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  // ============= MEDICAL RECORDS ENDPOINTS =============
  async getRecords() {
    return this.request('/records');
  }

  async getRecord(id) {
    return this.request(`/records/${id}`);
  }

  async createRecord(recordData) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // ============= BILLING ENDPOINTS =============
  async getInvoices() {
    return this.request('/billing');
  }

  async getInvoice(id) {
    return this.request(`/billing/${id}`);
  }

  async createInvoice(invoiceData) {
    return this.request('/billing', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }
}

// ✅ IMPORTANT: Create the global instance
window.apiClient = new APIClient();

// Log to confirm it loaded
console.log('✅ API Client loaded successfully', window.apiClient);
