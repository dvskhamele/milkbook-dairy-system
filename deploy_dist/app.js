// assets/app.js
// Global application state and functionality

// Global state object
window.MilkBook = {
  currentUser: null,
  role: 'owner', // 'owner' or 'labour'
  mode: 'normal', // 'normal' or 'collection'
  currentShift: null,
  lastSyncTime: null,
  quarantineCount: 0,
  isRushHour: function() {
    const hour = new Date().getHours();
    return (hour >= 5 && hour <= 10) || (hour >= 17 && hour <= 20); // Morning 5-10AM, Evening 5-8PM
  }
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  const session = sessionStorage.getItem('milkbook_session');
  if (!session) {
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
      window.location.href = 'index.html';
    }
  } else {
    const sessionData = JSON.parse(session);
    if (sessionData.authenticated) {
      window.MilkBook.currentUser = sessionData.user;
      window.MilkBook.role = sessionData.role || 'owner';
    } else {
      window.location.href = 'index.html';
    }
  }
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // Update UI based on role
  updateUIForRole();
  
  // Set up navigation guards
  setupNavigationGuards();
  
  // Update header information
  updateHeaderInfo();
});

// Update UI based on user role
function updateUIForRole() {
  if (window.MilkBook.role === 'labour') {
    // Hide non-essential navigation items for labour
    document.querySelectorAll('.sidebar-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href.includes('collection') && !href.includes('dashboard')) {
        item.style.display = 'none';
      }
    });
  }
}

// Set up navigation guards
function setupNavigationGuards() {
  // Add click handlers to sidebar items
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Prevent navigation during rush hours if in labour mode
      if (window.MilkBook.role === 'labour' && window.MilkBook.isRushHour() && 
          !['collection.html', 'dashboard.html'].some(page => href.includes(page))) {
        e.preventDefault();
        alert('Navigation locked during collection hours');
        return false;
      }
      
      // Allow navigation for owner role or during non-rush hours
    });
  });
}

// Update header information
function updateHeaderInfo() {
  if (window.MilkBook.currentUser) {
    document.getElementById('userName')?.textContent = window.MilkBook.currentUser.name;
    document.getElementById('userInitial')?.textContent = window.MilkBook.currentUser.name.charAt(0).toUpperCase();
    
    // Update dairy name if available in state
    const storedData = localStorage.getItem('milkbook_data');
    if (storedData) {
      const state = JSON.parse(storedData);
      document.getElementById('dairyName')?.textContent = state.dairyInfo.name || 'Milk Collection Center';
    }
  }
  
  // Update current date
  document.getElementById('currentDate')?.textContent = new Date().toLocaleDateString('en-IN');
  
  // Update pending records count
  const pendingCount = document.getElementById('pendingCount');
  if (pendingCount) {
    const storedData = localStorage.getItem('milkbook_data');
    if (storedData) {
      const state = JSON.parse(storedData);
      pendingCount.textContent = state.settings.pendingRecords || 0;
    }
  }
}

// Calculate milk amount
function calculateMilkAmount(qty, fat, snf, rateType, rates, type) {
  const baseRate = type === 'Cow' ? rates.cow.base : rates.buffalo.base;
  const fatRef = type === 'Cow' ? rates.cow.fatRef : rates.buffalo.fatRef;
  const snfRef = type === 'Cow' ? rates.cow.snfRef : rates.buffalo.snfRef;

  let calculatedRate = Number(baseRate);
  if (rateType === 'Fat_SNF') {
    const fatDiff = (fat - fatRef) * 2;
    const snfDiff = (snf - snfRef) * 1.5;
    calculatedRate = Number(baseRate) + fatDiff + snfDiff;
  } else if (rateType === 'Fat') {
    calculatedRate = (baseRate / fatRef) * fat;
  }

  return {
    rate: Math.max(calculatedRate, 10).toFixed(2),
    amount: (qty * Math.max(calculatedRate, 10)).toFixed(2)
  };
}

// Show notification
function showNotification(message, type = 'success') {
  // Remove any existing notifications
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) existingNotif.remove();
  
  // Create notification element
  const notif = document.createElement('div');
  notif.className = `notification ${type === 'error' ? 'error' : ''}`;
  notif.innerHTML = `
    <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" style="width: 20px; height: 20px;"></i>
    <span class="font-bold">${message}</span>
  `;
  
  // Add to page
  document.body.appendChild(notif);
  
  // Initialize icon
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notif.parentNode) {
      notif.style.opacity = '0';
      setTimeout(() => {
        if (notif.parentNode) notif.remove();
      }, 300);
    }
  }, 3000);
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR' 
  }).format(value || 0);
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN');
}