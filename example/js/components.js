/**
 * Shared Components for Traking Transfers Dashboard
 * Handles sidebar, mobile menu, language toggle, and common functionality
 */

// Mock user data
const currentUser = {
    id: 'user123',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+351 900 000 000',
    initials: 'JD'
};

// Current language
let currentLang = localStorage.getItem('language') || 'en';

/**
 * Initialize the dashboard layout
 * @param {string} activePage - The currently active page ('dashboard', 'bookings', 'track', 'contacts', 'profile')
 */
function initDashboard(activePage) {
    renderMobileHeader();
    renderSidebar(activePage);
    setupLanguageToggle();
    setupMobileMenu();
    updateUserInfo();
}

/**
 * Render the mobile header
 */
function renderMobileHeader() {
    const header = document.querySelector('.mobile-header');
    if (!header) return;
    
    header.innerHTML = `
        <button class="mobile-menu-btn" onclick="toggleSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
        <a href="customer.html" class="sidebar-logo">Traking</a>
        <div style="width: 40px;"></div>
    `;
}

/**
 * Render the sidebar navigation
 * @param {string} activePage - The currently active page
 */
function renderSidebar(activePage) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const isActive = (page) => page === activePage ? 'active' : '';

    sidebar.innerHTML = `
        <a href="customer.html" class="sidebar-logo">Traking</a>

        <nav class="nav-section">
            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="customer.html" class="nav-link ${isActive('dashboard')}" data-en="Dashboard" data-pt="Painel">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a href="bookings.html" class="nav-link ${isActive('bookings')}" data-en="My Bookings" data-pt="As Minhas Reservas">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"></path>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        My Bookings
                    </a>
                </li>
                <li class="nav-item">
                    <a href="track.html" class="nav-link ${isActive('track')}" data-en="Track Luggage" data-pt="Rastrear Bagagem">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        Track Luggage
                    </a>
                </li>
                <li class="nav-item">
                    <a href="contacts.html" class="nav-link ${isActive('contacts')}" data-en="Contact Us" data-pt="Contacte-nos">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Contact Us
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link language-toggle-item" onclick="event.preventDefault();">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
                        </svg>
                        <span class="language-toggle">
                            <button class="${currentLang === 'en' ? 'active' : ''}" data-lang="en" onclick="setLanguage('en')">EN</button>
                            <span>|</span>
                            <button class="${currentLang === 'pt' ? 'active' : ''}" data-lang="pt" onclick="setLanguage('pt')">PT</button>
                        </span>
                    </a>
                </li>
            </ul>
        </nav>

        <div class="sidebar-footer">
            <a href="profile.html" class="user-card" style="text-decoration: none;">
                <div class="user-avatar">${currentUser.initials}</div>
                <div class="user-info">
                    <div class="user-name">${currentUser.fullName}</div>
                    <div class="user-email">${currentUser.email}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-light);">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </a>
        </div>
    `;

    // Apply current language
    applyLanguage(currentLang);
}

/**
 * Set the language and update UI
 * @param {string} lang - 'en' or 'pt'
 */
function setLanguage(lang) {
    if (lang === currentLang) return;
    
    currentLang = lang;
    localStorage.setItem('language', lang);
    
    // Update toggle buttons
    document.querySelectorAll('.language-toggle button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update all translatable elements
    applyLanguage(lang);
}

/**
 * Apply translations to all elements with data-en and data-pt attributes
 * @param {string} lang - 'en' or 'pt'
 */
function applyLanguage(lang) {
    document.querySelectorAll('[data-en][data-pt]').forEach(el => {
        const translation = el.getAttribute(`data-${lang}`);
        if (translation) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                } else {
                    el.value = translation;
                }
            } else if (el.tagName === 'OPTION') {
                el.textContent = translation;
            } else {
                // For elements with children (like nav-links with SVGs), 
                // only update the text node, not the entire content
                const hasSVG = el.querySelector('svg');
                if (hasSVG) {
                    // Find the text node after the SVG and update only that
                    const textNodes = Array.from(el.childNodes).filter(
                        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                    );
                    if (textNodes.length > 0) {
                        textNodes[textNodes.length - 1].textContent = translation;
                    }
                } else if (!el.querySelector('[data-en][data-pt]')) {
                    el.textContent = translation;
                }
            }
        }
    });
}

/**
 * Setup language toggle event listeners
 */
function setupLanguageToggle() {
    // Event listeners are added via inline onclick in renderSidebar
    // This function is kept for any additional setup if needed
}

/**
 * Setup mobile menu toggle
 */
function setupMobileMenu() {
    // Close sidebar when clicking on a link (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024 && !link.classList.contains('language-toggle-item')) {
                toggleSidebar();
            }
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        }
    });
}

/**
 * Toggle sidebar open/closed (mobile)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

/**
 * Update user info display
 */
function updateUserInfo() {
    const userNameElements = document.querySelectorAll('.user-name-display');
    userNameElements.forEach(el => {
        el.textContent = currentUser.fullName;
    });
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} lang - Language ('en' or 'pt')
 * @returns {string} Formatted date string
 */
function formatDate(date, lang = currentLang) {
    const d = new Date(date);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-US', options);
}

/**
 * Show a notification/toast
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning'
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--color-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'success'});
        color: white;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Show loading state on a button
 * @param {HTMLElement} button - The button element
 * @param {boolean} loading - Whether to show loading state
 */
function setButtonLoading(button, loading) {
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.innerHTML = `<svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"></circle></svg> Loading...`;
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || button.textContent;
        button.disabled = false;
    }
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Export functions for use in page-specific scripts
window.initDashboard = initDashboard;
window.toggleSidebar = toggleSidebar;
window.setLanguage = setLanguage;
window.applyLanguage = applyLanguage;
window.formatDate = formatDate;
window.showNotification = showNotification;
window.setButtonLoading = setButtonLoading;
window.currentUser = currentUser;
window.currentLang = currentLang;
