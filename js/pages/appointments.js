/**
 * Appointments Page Module
 */

class AppointmentsPage {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'appointments') {
                this.loadAppointments();
            }
        });
    }
    
    async loadAppointments() {
        try {
            const result = await window.api.getAppointments(1, 10);
            this.displayAppointments(result.data);
        } catch (error) {
            console.error('Failed to load appointments:', error);
            window.app.showToast('Failed to load appointments', 'error');
        }
    }
    
    displayAppointments(appointments) {
        const container = document.getElementById('appointments-list');
        
        if (!appointments || appointments.length === 0) {
            container.innerHTML = '<div class="no-data"><p>No appointments found</p></div>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointments.map(apt => `
                        <tr>
                            <td>${apt.first_name} ${apt.last_name}</td>
                            <td>${apt.doctor_name}</td>
                            <td>${new Date(apt.appointment_date).toLocaleString()}</td>
                            <td><span class="status-badge ${apt.status}">${apt.status}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-view btn-sm">View</button>
                                    <button class="btn btn-edit btn-sm">Reschedule</button>
                                    <button class="btn btn-danger btn-sm">Cancel</button>
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
    window.appointmentsPage = new AppointmentsPage();
});
