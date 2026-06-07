class ModalComponent {
    constructor() {
        this.modal = document.getElementById('modal');
        this.init();
    }
    init() {
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }
    open(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        this.modal.classList.remove('hidden');
    }
    close() {
        this.modal.classList.add('hidden');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.modalComponent = new ModalComponent();
});
