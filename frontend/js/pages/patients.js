/**
 * Patients Page Module
 * Manages patient list, search, create, and edit functionality
 */

class PatientsPage {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.init();
    }
    
    init() {
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'patients') {
                this.loadPatients();
                this.setupEventListeners();
            }
        });
    }
    
    setupEventListeners() {
        const addBtn = document.getElementById('add-patient-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddPatientForm());
        }
    }
    
    async loadPatients() {
        try {
            const result = await window.api.getPatients(this.currentPage, this.pageSize);
            this.displayPatients(result.data);
        } catch (error) {
            console.error('Failed to load patients:', error);
            window.app.showToast('Failed to load patients', 'error');
        }
    }
    
    displayPatients(patients) {
        const container = document.getElementById('patients-list');
        
        if (!patients || patients.length === 0) {
            container.innerHTML = '<div class="no-data"><p>No patients found</p></div>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.map(patient => `
                        <tr>
                            <td>${patient.first_name} ${patient.last_name}</td>
                            <td>${patient.email || '-'}</td>
                            <td>${patient.phone || '-'}</td>
                            <td>${patient.gender || '-'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-view btn-sm" onclick="window.patientsPage.editPatient(${patient.id})">Edit</button>
                                    <button class="btn btn-delete btn-sm" onclick="window.patientsPage.deletePatient(${patient.id})">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    showAddPatientForm() {
        const form = `
            <form id="patient-form" class="stacked-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="first-name">First Name *</label>
                        <input type="text" id="first-name" name="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="last-name">Last Name *</label>
                        <input type="text" id="last-name" name="lastName" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email">
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="dob">Date of Birth</label>
                        <input type="date" id="dob" name="dateOfBirth">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" name="gender">
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="address">Address</label>
                    <textarea id="address" name="address"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="emergency">Emergency Contact</label>
                    <input type="text" id="emergency" name="emergencyContact">
                </div>
                
                <div class="form-group">
                    <label for="allergies">Allergies</label>
                    <textarea id="allergies" name="allergies"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Patient</button>
                </div>
            </form>
        `;
        
        window.app.showModal('Add New Patient', form);
        
        document.getElementById('patient-form').addEventListener('submit', (e) => {
            this.savePatient(e);
        });
    }
    
    async savePatient(e) {
        e.preventDefault();
        
        const form = document.getElementById('patient-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            await window.api.createPatient(data);
            window.app.closeModal();
            window.app.showToast('Patient created successfully', 'success');
            this.loadPatients();
        } catch (error) {
            console.error('Failed to save patient:', error);
            window.app.showToast('Failed to save patient', 'error');
        }
    }
    
    async editPatient(id) {
        try {
            const patient = await window.api.getPatient(id);
            
            const form = `
                <form id="patient-form" class="stacked-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="first-name">First Name *</label>
                            <input type="text" id="first-name" name="firstName" value="${patient.first_name}" required>
                        </div>
                        <div class="form-group">
                            <label for="last-name">Last Name *</label>
                            <input type="text" id="last-name" name="lastName" value="${patient.last_name}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${patient.email || ''}">
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone</label>
                            <input type="tel" id="phone" name="phone" value="${patient.phone || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="dob">Date of Birth</label>
                            <input type="date" id="dob" name="dateOfBirth" value="${patient.date_of_birth || ''}">
                        </div>
                        <div class="form-group">
                            <label for="gender">Gender</label>
                            <select id="gender" name="gender">
                                <option value="">Select Gender</option>
                                <option value="male" ${patient.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${patient.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${patient.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" name="address">${patient.address || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="emergency">Emergency Contact</label>
                        <input type="text" id="emergency" name="emergencyContact" value="${patient.emergency_contact || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="allergies">Allergies</label>
                        <textarea id="allergies" name="allergies">${patient.allergies || ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="window.app.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Patient</button>
                    </div>
                </form>
            `;
            
            window.app.showModal('Edit Patient', form);
            
            document.getElementById('patient-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = document.getElementById('patient-form');
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                try {
                    await window.api.updatePatient(id, data);
                    window.app.closeModal();
                    window.app.showToast('Patient updated successfully', 'success');
                    this.loadPatients();
                } catch (error) {
                    console.error('Failed to update patient:', error);
                    window.app.showToast('Failed to update patient', 'error');
                }
            });
        } catch (error) {
            console.error('Failed to load patient:', error);
            window.app.showToast('Failed to load patient', 'error');
        }
    }
    
    async deletePatient(id) {
        if (!confirm('Are you sure you want to delete this patient?')) return;
        
        try {
            await window.api.deletePatient(id);
            window.app.showToast('Patient deleted successfully', 'success');
            this.loadPatients();
        } catch (error) {
            console.error('Failed to delete patient:', error);
            window.app.showToast('Failed to delete patient', 'error');
        }
    }
}

// Initialize patients page
document.addEventListener('DOMContentLoaded', () => {
    window.patientsPage = new PatientsPage();
});                                                                                                                                                

