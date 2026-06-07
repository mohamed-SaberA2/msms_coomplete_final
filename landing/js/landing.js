// ============================================
// HOSPITAL MANAGEMENT SYSTEM - LANDING PAGE
// Interactive JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeScrollAnimations();
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a, .hero-buttons a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add hover effects to benefit items
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Add hover effects to module cards
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderColor = '#00D9FF';
            this.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.2)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.borderColor = '#2a4a62';
            this.style.boxShadow = 'none';
        });
    });

    // Add hover effects to security items
    const securityItems = document.querySelectorAll('.security-item');
    securityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.borderColor = '#00D9FF';
            this.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.2)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.borderColor = '#2a4a62';
            this.style.boxShadow = 'none';
        });
    });

    // Add hover effects to pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('featured')) {
                this.style.borderColor = '#00D9FF';
                this.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.2)';
                this.style.transform = 'translateY(-10px)';
            }
        });
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('featured')) {
                this.style.borderColor = '#2a4a62';
                this.style.boxShadow = 'none';
                this.style.transform = 'translateY(0)';
            }
        });
    });

    // Add hover effects to info items
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.borderColor = '#00D9FF';
            this.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.2)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.borderColor = '#2a4a62';
            this.style.boxShadow = 'none';
        });
    });
}

// ============ FORM HANDLING ============
function handleContactFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const hospitalName = this.querySelector('input[placeholder="Hospital Name"]').value;
    const email = this.querySelector('input[placeholder="Email Address"]').value;
    const phone = this.querySelector('input[placeholder="Phone Number"]').value;
    const message = this.querySelector('textarea').value;

    // Validate form
    if (!hospitalName || !email || !phone || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Validate phone
    if (!isValidPhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }

    // Simulate form submission
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    setTimeout(() => {
        // Simulate successful submission
        showNotification('Message sent successfully! We will contact you soon.', 'success');
        this.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }, 1500);
}

// ============ VALIDATION FUNCTIONS ============
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// ============ NOTIFICATION SYSTEM ============
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
        color: white;
        border-radius: 4px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============ SCROLL ANIMATIONS ============
function initializeScrollAnimations() {
    // Observe elements for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });

    // Observe all benefit items
    document.querySelectorAll('.benefit-item').forEach(item => {
        item.style.opacity = '0';
        observer.observe(item);
    });

    // Observe all module cards
    document.querySelectorAll('.module-card').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });

    // Observe all security items
    document.querySelectorAll('.security-item').forEach(item => {
        item.style.opacity = '0';
        observer.observe(item);
    });

    // Observe all pricing cards
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.style.opacity = '0';
        observer.observe(card);
    });
}

// ============ ANIMATIONS ============
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// ============ UTILITY FUNCTIONS ============

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button if needed
window.addEventListener('scroll', throttle(() => {
    if (window.scrollY > 300) {
        // You can add a scroll-to-top button here if needed
    }
}, 100));

// ============ ANALYTICS TRACKING ============
function trackEvent(eventName, eventData = {}) {
    // This can be integrated with Google Analytics or other tracking services
    console.log(`Event: ${eventName}`, eventData);
}

// Track button clicks
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function() {
        trackEvent('button_click', {
            buttonText: this.textContent,
            buttonClass: this.className
        });
    });
});

// Track navigation clicks
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', function() {
        trackEvent('nav_click', {
            linkText: this.textContent,
            linkHref: this.href
        });
    });
});

console.log('Landing page initialized successfully!');
