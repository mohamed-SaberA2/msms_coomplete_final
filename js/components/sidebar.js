class SidebarComponent {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.init();
    }
    init() {
        document.addEventListener('click', (e) => {
            if (!this.sidebar.contains(e.target) && !e.target.closest('.menu-toggle')) {
                this.close();
            }
        });
    }
    open() {
        if (this.sidebar) this.sidebar.classList.add('open');
    }
    close() {
        if (this.sidebar) this.sidebar.classList.remove('open');
    }
    toggle() {
        if (this.sidebar) this.sidebar.classList.toggle('open');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.sidebarComponent = new SidebarComponent();
});
