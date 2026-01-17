// logout.js
// Workflow implementation for logout page

// Initialize page
function initLogoutPage() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Update header information
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN');
    
    // Check authentication
    const session = sessionStorage.getItem('milkbook_session');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Load state from localStorage
    const state = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    
    // Update header info
    document.getElementById('dairyName').textContent = state.dairyInfo.name || 'Milk Collection Center';
    document.getElementById('userName').textContent = state.auth.user?.name || 'User';
    document.getElementById('userInitial').textContent = (state.auth.user?.name || 'U').charAt(0).toUpperCase();
    document.getElementById('pendingCount').textContent = state.settings.pendingRecords || 0;
    
    // Perform logout
    performLogout();
}

// Perform logout function
function performLogout() {
    // Clear session from sessionStorage only (keep data in localStorage)
    sessionStorage.removeItem('milkbook_session');
    
    // Redirect to login
    window.location.href = 'index.html';
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initLogoutPage);