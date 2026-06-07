/**
 * Billing & Invoices Page Module
 */

class BillingPage {
    constructor() {
        this.init();
    }
    
    init() {
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'billing') {
                this.loadInvoices();
            }
        });
    }
    
    async loadInvoices() {
        try {
            const result = await window.api.getInvoices(1, 10);
            this.displayInvoices(result.data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            window.app.showToast('Failed to load invoices', 'error');
        }
    }
    
    displayInvoices(invoices) {
        const container = document.getElementById('billing-list');
        
        if (!invoices || invoices.length === 0) {
            container.innerHTML = '<div class="no-data"><p>No invoices found</p></div>';
            return;
        }
        
        const html = `
            <table>
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Patient</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Issued Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(invoice => `
                        <tr>
                            <td>${invoice.invoice_number}</td>
                            <td>${invoice.first_name} ${invoice.last_name}</td>
                            <td>$${parseFloat(invoice.amount).toFixed(2)}</td>
                            <td><span class="status-badge ${invoice.status}">${invoice.status}</span></td>
                            <td>${new Date(invoice.issued_date).toLocaleDateString()}</td>
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
    window.billingPage = new BillingPage();
});                                                                                                                                            

