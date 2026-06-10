/**
 * API Client - GitHub Pages Compatible
 * ✅ NO redirects to /login (which doesn't exist on GitHub Pages)
 * ✅ Uses SPA page switching instead
 */

class APIClient {
  constructor(baseUrl = 'https://msmscoompletefinal--ms1464684.replit.app/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
    this.csrfToken = this.getCSRFToken();
  }

  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers || {}),
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - please log in again');
      }

      if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: NO window.location.href = '/login'
   * ✅ Uses SPA page switching instead
   */
  handleUnauthorized() {
    localStorage.removeItem('authToken');
    this.token = null;
    
    // ✅ CORRECT: Use app.showPage() instead of redirecting to /login
    if (window.app && typeof window.app.showPage === 'function') {
      window.app.showPage('login');
    }
    
    // ✅ Keep URL clean - no /login in address bar
    if (window.history && window.history.pushState) {
      window.history.pushState({}, "", "/");
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  clearAuth() {
    this.setToken(null);
  }

  // ============= AUTH ENDPOINTS =============
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
      if (window.app && typeof window.app.showPage === 'function') {
        window.app.showPage('login');
      }
      if (window.history && window.history.pushState) {
        window.history.pushState({}, "", "/");
      }
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async refreshToken() {
    const response = await this.request('/auth/refresh', { method: 'POST' });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
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

  async getPatientHistory(id) {
    return this.request(`/patients/${id}/history`);
  }

  async addMedicalRecord(patientId, recordData) {
    return this.request(`/patients/${patientId}/records`, {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // ============= APPOINTMENT ENDPOINTS =============
  async getAppointments(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
    return this.request(endpoint);
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

  async cancelAppointment(id) {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  // ============= STAFF/DOCTORS ENDPOINTS =============
  async getStaff(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    return this.request(endpoint);
  }

  async getStaffMember(id) {
    return this.request(`/staff/${id}`);
  }

  async createStaffMember(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaffMember(id, staffData) {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async deleteStaffMember(id) {
    return this.request(`/staff/${id}`, { method: 'DELETE' });
  }

  async getDoctors(filters = {}) {
    return this.getStaff(filters);
  }

  // ============= MEDICAL RECORDS ENDPOINTS =============
  async getRecords(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/records?${queryString}` : '/records';
    return this.request(endpoint);
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

  async updateRecord(id, recordData) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  }

  async deleteRecord(id) {
    return this.request(`/records/${id}`, { method: 'DELETE' });
  }

  // ============= BILLING ENDPOINTS =============
  async getInvoices(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/billing?${queryString}` : '/billing';
    return this.request(endpoint);
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

  async updateInvoice(id, invoiceData) {
    return this.request(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  async getPaymentStatus(invoiceId) {
    return this.request(`/billing/${invoiceId}/payment-status`);
  }

  // ============= REPORTS ENDPOINTS =============
  async generateReport(reportType, filters = {}) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, filters }),
    });
  }

  async getReport(id) {
    return this.request(`/reports/${id}`);
  }

  async exportReport(id, format = 'pdf') {
    return this.request(`/reports/${id}/export?format=${format}`);
  }

  // ============= FILE UPLOAD ENDPOINTS =============
  async uploadFile(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });

    const headers = this.getHeaders();
    delete headers['Content-Type'];

    try {
      const response = await fetch(`${this.baseUrl}/files/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    return response.blob();
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.apiClient = new APIClient();
}
