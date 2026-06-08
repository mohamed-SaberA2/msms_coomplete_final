/**
 * API Client - Production-Ready
 * 
 * Uses relative URLs (/api) for universal compatibility:
 * ✅ Works on localhost
 * ✅ Works on Replit
 * ✅ Works on any remote server
 * ✅ No hardcoded URLs needed
 */

class APIClient {
  constructor(baseUrl = 'https://msmscoompletefinal--ms1464684.replit.app/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
    this.csrfToken = this.getCSRFToken();
  }

  /**
   * Extract CSRF token from meta tag or cookie
   */
  getCSRFToken() {
    // Try meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Try cookie as fallback
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  /**
   * Build request headers with authentication and CSRF protection
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token if available
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  /**
   * Generic request method with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers || {}),
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - please log in again');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      }

      // Handle server errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse and return response
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
   * Handle unauthorized access (redirect to login)
   */
  handleUnauthorized() {
    localStorage.removeItem('authToken');
    this.token = null;
    window.location.href = '/login';
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.setToken(null);
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Login user
   */
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Register new user
   */
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    const response = await this.request('/auth/refresh', { method: 'POST' });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  // ============= DASHBOARD ENDPOINTS =============

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  /**
   * Get dashboard activity
   */
  async getDashboardActivity(limit = 10) {
    return this.request(`/dashboard/activity?limit=${limit}`);
  }

  /**
   * Alias for getDashboardActivity (for backward compatibility)
   */
  async getRecentActivity(limit = 10) {
    return this.getDashboardActivity(limit);
  }

  // ============= PATIENT ENDPOINTS =============

  /**
   * Get all patients
   */
  async getPatients(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    return this.request(endpoint);
  }

  /**
   * Get patient by ID
   */
  async getPatient(id) {
    return this.request(`/patients/${id}`);
  }

  /**
   * Create new patient
   */
  async createPatient(patientData) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  /**
   * Update patient
   */
  async updatePatient(id, patientData) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  /**
   * Delete patient
   */
  async deletePatient(id) {
    return this.request(`/patients/${id}`, { method: 'DELETE' });
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(id) {
    return this.request(`/patients/${id}/history`);
  }

  /**
   * Add medical record to patient
   */
  async addMedicalRecord(patientId, recordData) {
    return this.request(`/patients/${patientId}/records`, {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // ============= APPOINTMENT ENDPOINTS =============

  /**
   * Get all appointments
   */
  async getAppointments(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';
    return this.request(endpoint);
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  /**
   * Update appointment
   */
  async updateAppointment(id, appointmentData) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id) {
    return this.request(`/appointments/${id}`, { method: 'DELETE' });
  }

  // ============= STAFF/DOCTORS ENDPOINTS =============

  /**
   * Get all staff members (alias: getDoctors)
   */
  async getStaff(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    return this.request(endpoint);
  }

  /**
   * Get staff member by ID
   */
  async getStaffMember(id) {
    return this.request(`/staff/${id}`);
  }

  /**
   * Create new staff member
   */
  async createStaffMember(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  /**
   * Update staff member
   */
  async updateStaffMember(id, staffData) {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  /**
   * Delete staff member
   */
  async deleteStaffMember(id) {
    return this.request(`/staff/${id}`, { method: 'DELETE' });
  }

  /**
   * Alias for getStaff (doctors are staff members)
   */
  async getDoctors(filters = {}) {
    return this.getStaff(filters);
  }

  // ============= MEDICAL RECORDS ENDPOINTS =============

  /**
   * Get all medical records
   */
  async getRecords(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/records?${queryString}` : '/records';
    return this.request(endpoint);
  }

  /**
   * Get medical record by ID
   */
  async getRecord(id) {
    return this.request(`/records/${id}`);
  }

  /**
   * Create new medical record
   */
  async createRecord(recordData) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  /**
   * Update medical record
   */
  async updateRecord(id, recordData) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  }

  /**
   * Delete medical record
   */
  async deleteRecord(id) {
    return this.request(`/records/${id}`, { method: 'DELETE' });
  }

  // ============= BILLING ENDPOINTS =============

  /**
   * Get all invoices (backend endpoint: /billing)
   */
  async getInvoices(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/billing?${queryString}` : '/billing';
    return this.request(endpoint);
  }

  /**
   * Get invoice by ID (backend endpoint: /billing)
   */
  async getInvoice(id) {
    return this.request(`/billing/${id}`);
  }

  /**
   * Create new invoice (backend endpoint: /billing)
   */
  async createInvoice(invoiceData) {
    return this.request('/billing', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Update invoice (backend endpoint: /billing)
   */
  async updateInvoice(id, invoiceData) {
    return this.request(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Get payment status (backend endpoint: /billing)
   */
  async getPaymentStatus(invoiceId) {
    return this.request(`/billing/${invoiceId}/payment-status`);
  }

  // ============= REPORTS ENDPOINTS =============

  /**
   * Generate report
   */
  async generateReport(reportType, filters = {}) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, filters }),
    });
  }

  /**
   * Get report by ID
   */
  async getReport(id) {
    return this.request(`/reports/${id}`);
  }

  /**
   * Export report
   */
  async exportReport(id, format = 'pdf') {
    return this.request(`/reports/${id}/export?format=${format}`);
  }

  // ============= FILE UPLOAD ENDPOINTS =============

  /**
   * Upload file (for documents, images, etc.)
   */
  async uploadFile(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });

    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set it for FormData

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

  /**
   * Download file
   */
  async downloadFile(fileId) {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // ============= HEALTH CHECK =============

  /**
   * Check API health status
   */
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}

// Create global instance for browser use
if (typeof window !== 'undefined') {
  window.apiClient = new APIClient();
  window.api = window.apiClient; // Alias for compatibility
}
