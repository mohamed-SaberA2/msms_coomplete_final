/**
 * Medical Records Page Module
 */

class RecordsPage {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadRecords();
        this.setupEventListeners();
        
        // Also listen for page load events for re-loading data
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'records') {
                this.loadRecords();
            }
        });
    }
    
    async loadRecords() {
        try {
            const result = await window.api.getRecords(1, 10);
            this.displayRecords(result.data);
        } catch (error) {
            console.error('Failed to load records:', error);
            window.app.showToast('Failed to load records', 'error');
        }
    }
    
    displayRecords(records) {
        const container = document.getElementById('records-list');
        
        if (!records || records.length === 0) {
            container.innerHTML = '<div class="no-data"><p>No medical records found</p></div>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Visit Date</th>
                        <th>Diagnosis</th>
                        <th>Follow-up</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(record => `
                        <tr>
                            <td>${record.first_name} ${record.last_name}</td>
                            <td>${record.doctor_name}</td>
                            <td>${new Date(record.visit_date).toLocaleDateString()}</td>
                            <td>${record.diagnosis ? record.diagnosis.substring(0, 50) + '...' : '-'}</td>
                            <td>${record.follow_up_required ? 'Yes' : 'No'}</td>
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
    window.recordsPage = new RecordsPage();
});                                                                                                                                             

