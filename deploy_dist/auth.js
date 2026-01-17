// auth.js
// Authentication functions for the MilkBook application

// Login function
async function login(credentials) {
    return new Promise((resolve, reject) => {
        // Simulate API call delay
        setTimeout(() => {
            // Basic validation
            if (!credentials.username || !credentials.password) {
                reject(new Error('Username and password are required'));
                return;
            }

            // In a real app, this would be verified against a server
            // For this offline-first app, we'll accept any non-empty credentials
            const user = {
                id: 'user_' + Date.now(),
                name: credentials.username,
                role: credentials.role || 'owner',
                lastLogin: new Date().toISOString()
            };

            // Store session in sessionStorage (not persistent)
            sessionStorage.setItem('milkbook_session', JSON.stringify(user));

            // Update global state
            let state = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
            state.auth = {
                isAuthenticated: true,
                user: user,
                role: credentials.role || 'owner'
            };
            localStorage.setItem('milkbook_data', JSON.stringify(state));

            resolve(user);
        }, 500); // Simulate network delay
    });
}

// Logout function
function logout() {
    // Clear session from sessionStorage only (keep data in localStorage)
    sessionStorage.removeItem('milkbook_session');

    // Update global state
    let state = JSON.parse(localStorage.getItem('milkbook_data') || JSON.stringify(INITIAL_STATE));
    state.auth = {
        isAuthenticated: false,
        user: null,
        role: 'owner'
    };
    localStorage.setItem('milkbook_data', JSON.stringify(state));

    // Redirect to login
    window.location.href = 'index.html';
}

// Check if user is authenticated
function isAuthenticated() {
    const session = sessionStorage.getItem('milkbook_session');
    return !!session;
}

// Get current user
function getCurrentUser() {
    const session = sessionStorage.getItem('milkbook_session');
    return session ? JSON.parse(session) : null;
}

// Get user role
function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : 'owner';
}

// Check if user has owner privileges
function isOwner() {
    return getUserRole() === 'owner';
}

// Check if user has labour privileges
function isLabour() {
    return getUserRole() === 'labour';
}

// Refresh session (extend session timeout)
function refreshSession() {
    const session = sessionStorage.getItem('milkbook_session');
    if (session) {
        // Extend session by updating the timestamp
        const user = JSON.parse(session);
        user.lastActivity = new Date().toISOString();
        sessionStorage.setItem('milkbook_session', JSON.stringify(user));
        return true;
    }
    return false;
}

// Check if session is expired
function isSessionExpired(maxInactiveMinutes = 30) {
    const session = sessionStorage.getItem('milkbook_session');
    if (!session) {
        return true;
    }

    const user = JSON.parse(session);
    const lastActivity = new Date(user.lastActivity || user.lastLogin);
    const now = new Date();
    const minutesInactive = (now - lastActivity) / (1000 * 60);

    return minutesInactive > maxInactiveMinutes;
}

// Initialize auth system
function initAuth() {
    // Don't auto-check expiration on page load - only check on protected routes
    console.log('Auth system initialized');
}

// Protected route handler
function requireAuth(redirectUrl = 'index.html') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Role-based access control
function requireRole(requiredRole, redirectUrl = 'index.html') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }

    const userRole = getUserRole();
    if (userRole !== requiredRole && requiredRole !== 'any') {
        // Optionally show an access denied message
        alert('Access denied. Insufficient privileges.');
        window.location.href = redirectUrl;
        return false;
    }

    return true;
}

// Don't auto-initialize - let pages call auth when needed
// initAuth();