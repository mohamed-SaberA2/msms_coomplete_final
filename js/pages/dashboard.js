/**
 * Dashboard Page Module
 * Displays key statistics and recent activity
 */

class DashboardPage {
    constructor() {
        this.defaultStats = {
            totalPatients: 0,
            todayAppointments: 0,
            pendingBills: 0,
            availableDoctors: 0
        };
        this.init();
    }
    
    init() {
        document.addEventListener('pageLoad', (e) => {
            if (e.detail.page === 'dashboard') {
                this.loadDashboardData();
            }
        });
    }
    
    async loadDashboardData() {
        console.log('Loading dashboard data...');
        
        try {
            // Load statistics
            const stats = await window.api.getDashboardStats();
            if (stats) {
                console.log('Stats loaded:', stats);
                this.displayStats(stats);
            } else {
                console.log('No stats returned - using defaults');
                this.displayStats(this.defaultStats);
            }
            
            // Load recent activity
            const activity = await window.api.getRecentActivity(10);
            if (activity && Array.isArray(activity)) {
                console.log('Activity loaded:', activity.length, 'items');
                this.displayActivity(activity);
            } else {
                console.log('No activity returned - showing empty');
                this.displayActivity([]);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.displayStats(this.defaultStats);
            this.displayActivity([]);
        }
    }
    
    displayStats(stats) {
        try {
            const statPatients = document.getElementById('stat-patients');
            const statAppointments = document.getElementById('stat-appointments');
            const statBills = document.getElementById('stat-bills');
            const statDoctors = document.getElementById('stat-doctors');
            
            if (statPatients) statPatients.textContent = stats.totalPatients || 0;
            if (statAppointments) statAppointments.textContent = stats.todayAppointments || 0;
            if (statBills) statBills.textContent = stats.pendingBills || 0;
            if (statDoctors) statDoctors.textContent = stats.availableDoctors || 0;
            
            console.log('Stats displayed successfully');
        } catch (error) {
            console.error('Error displaying stats:', error);
        }
    }
    
    displayActivity(activity) {
        try {
            const activityList = document.getElementById('activity-list');
            
            if (!activityList) {
                console.warn('Activity list element not found');
                return;
            }
            
            if (!activity || activity.length === 0) {
                activityList.innerHTML = '<div class="no-data"><p>No recent activity</p></div>';
                return;
            }
            
            activityList.innerHTML = activity.map(item => {
                if (!item) return '';
                return `
                    <div class="activity-item">
                        <div class="activity-type">${this.getActivityIcon(item.type)}</div>
                        <div class="activity-details">
                            <div class="activity-description">${item.description || 'Activity'}</div>
                            <div class="activity-time">${this.formatDate(item.date || new Date())}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log('Activity displayed successfully');
        } catch (error) {
            console.error('Error displaying activity:', error);
            const activityList = document.getElementById('activity-list');
            if (activityList) {
                activityList.innerHTML = '<div class="no-data"><p>Error loading activity</p></div>';
            }
        }
    }
    
    getActivityIcon(type) {
        const icons = {
            'appointment': '📅',
            'record': '📋',
            'invoice': '💳',
            'patient': '👤',
            'doctor': '👨‍⚕️'
        };
        return icons[type] || '📌';
    }
    
    formatDate(date) {
        try {
            if (!date) return 'Unknown time';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'Unknown time';
            
            const now = new Date();
            const diff = now - d;
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
            
            return d.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unknown time';
        }
    }
}

// Initialize dashboard page
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardPage = new DashboardPage();
});
