/**
 * Doctors Page Module
 */

class DoctorsPage {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'doctors') {
                this.loadDoctors();
            }
        });
    }
    
    async loadDoctors() {
        try {
            const result = await window.api.getDoctors(1, 10);
            this.displayDoctors(result.data);
        } catch (error) {
            console.error('Failed to load doctors:', error);
            window.app.showToast('Failed to load doctors', 'error');
        }
    }
    
    displayDoctors(doctors) {
        const container = document.getElementById('doctors-list');
        
        if (!doctors || doctors.length === 0) {
            container.innerHTML = '<div class="no-data"><p>No doctors found</p></div>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Specialization</th>
                        <th>License</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${doctors.map(doctor => `
                        <tr>
                            <td>${doctor.full_name}</td>
                            <td>${doctor.specialization}</td>
                            <td>${doctor.license_number}</td>
                            <td>${doctor.phone || '-'}</td>
                            <td><span class="status-badge ${doctor.is_active ? 'active' : 'inactive'}">${doctor.is_active ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-view btn-sm">View</button>
                                    <button class="btn btn-edit btn-sm">Edit</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.doctorsPage = new DoctorsPage();
});
