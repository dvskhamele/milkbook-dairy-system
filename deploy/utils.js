// utils.js
// Utility functions for the MilkBook application

// Format currency
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Format datetime
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN');
}

// Calculate milk amount based on rates
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

// Validate mobile number
function validateMobile(mobile) {
    const regex = /^[0-9]{10}$/;
    return regex.test(mobile);
}

// Validate email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Debounce function
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

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if it's rush hour (when auto-lock should be enforced)
function isRushHour() {
    const hour = new Date().getHours();
    return (hour >= 5 && hour <= 10) || (hour >= 17 && hour <= 20); // Morning 5-10AM, Evening 5-8PM
}

// Format weight (for feed, ghee, etc.)
function formatWeight(weight, unit = 'kg') {
    return `${weight} ${unit}`;
}

// Format volume (for milk)
function formatVolume(volume, unit = 'L') {
    return `${volume} ${unit}`;
}

// Check if user is owner
function isOwner() {
    const session = sessionStorage.getItem('milkbook_session');
    if (session) {
        const userData = JSON.parse(session);
        return userData.role === 'owner';
    }
    return false;
}

// Check if user is labour
function isLabour() {
    const session = sessionStorage.getItem('milkbook_session');
    if (session) {
        const userData = JSON.parse(session);
        return userData.role === 'labour';
    }
    return false;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Get first day of current month
function getFirstDayOfCurrentMonth() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
}

// Calculate farmer balance
function calculateFarmerBalance(farmerId, milkEntries, payments) {
    const farmerMilkEntries = milkEntries.filter(entry => entry.farmerId === farmerId);
    const farmerPayments = payments.filter(payment => payment.farmerId === farmerId);
    
    const totalMilkValue = farmerMilkEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    const totalPayments = farmerPayments
        .filter(payment => payment.type === 'Payment')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const totalBonuses = farmerPayments
        .filter(payment => payment.type === 'Bonus')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const totalDeductions = farmerPayments
        .filter(payment => payment.type === 'Deduction')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    return {
        totalMilkValue,
        totalPayments,
        totalBonuses,
        totalDeductions,
        balance: totalMilkValue - totalPayments + totalBonuses - totalDeductions
    };
}

// Format farmer name for display
function formatFarmerName(farmer) {
    return farmer.name || farmer.mobile || 'Unknown Farmer';
}

// Check if farmer has pending payments
function hasPendingPayments(farmerId, payments) {
    return payments.some(payment => 
        payment.farmerId === farmerId && 
        payment.status === 'Pending'
    );
}

// Get farmer by ID
function getFarmerById(farmers, id) {
    return farmers.find(farmer => farmer.id === id);
}

// Get milk entry by ID
function getMilkEntryById(entries, id) {
    return entries.find(entry => entry.id === id);
}

// Get payment by ID
function getPaymentById(payments, id) {
    return payments.find(payment => payment.id === id);
}

// Get sale by ID
function getSaleById(sales, id) {
    return sales.find(sale => sale.id === id);
}

// Get inventory item by ID
function getInventoryById(inventory, id) {
    return inventory.find(item => item.id === id);
}

// Update all farmer dropdowns across the application
function updateFarmerDropdowns(newState) {
    // Update dropdowns on current page if they exist
    const farmerDropdowns = document.querySelectorAll('select[id*="farmer"], select[id*="Farmer"], select[name*="farmer"], select[name*="Farmer"], select[id*="FarmerId"], select[name*="farmerId"]');

    farmerDropdowns.forEach(dropdown => {
        // Save current selection if possible
        const currentSelection = dropdown.value;

        // Clear existing options except the first placeholder
        dropdown.innerHTML = '<option value="">Select Farmer</option>';

        // Add all active farmers
        (newState?.farmers || []).filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            dropdown.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (currentSelection) {
            dropdown.value = currentSelection;
        }
    });
}

// Listen for storage events to update farmer dropdowns in real-time across tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'milkbook_data' && e.newValue) {
        try {
            const newState = JSON.parse(e.newValue);
            if (newState && newState.farmers) {
                updateFarmerDropdowns(newState);
            }
        } catch (error) {
            console.error('Error updating farmer dropdowns from storage event:', error);
        }
    }
});

// Update all farmer dropdowns across the application (enhanced version)
function updateFarmerDropdowns(newState) {
    // Update dropdowns on current page if they exist
    const farmerDropdowns = document.querySelectorAll('select[id*="farmer"], select[id*="Farmer"], select[name*="farmer"], select[name*="Farmer"], select[id*="FarmerId"], select[name*="farmerId"], select[data-target*="farmer"], select[data-target*="Farmer"]');

    farmerDropdowns.forEach(dropdown => {
        // Save current selection if possible
        const currentSelection = dropdown.value;

        // Clear existing options except the first placeholder
        dropdown.innerHTML = '<option value="">Select Farmer</option>';

        // Add all active farmers
        (newState?.farmers || []).filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            dropdown.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (currentSelection) {
            dropdown.value = currentSelection;
        }
    });
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Format date function
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Format datetime function
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN');
}

// Validate mobile number
function validateMobile(mobile) {
    const regex = /^[0-9]{10}$/;
    return regex.test(mobile);
}

// Validate email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Generate unique ID
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Debounce function
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

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if it's rush hour (when auto-lock should be enforced)
function isRushHour() {
    const hour = new Date().getHours();
    return (hour >= 5 && hour <= 10) || (hour >= 17 && hour <= 20); // Morning 5-10AM, Evening 5-8PM
}

// Format weight (for feed, ghee, etc.)
function formatWeight(weight, unit = 'kg') {
    return `${weight} ${unit}`;
}

// Format volume (for milk)
function formatVolume(volume, unit = 'L') {
    return `${volume} ${unit}`;
}

// Check if user is owner
function isOwner() {
    const session = sessionStorage.getItem('milkbook_session');
    if (session) {
        const userData = JSON.parse(session);
        return userData.role === 'owner';
    }
    return false;
}

// Check if user is labour
function isLabour() {
    const session = sessionStorage.getItem('milkbook_session');
    if (session) {
        const userData = JSON.parse(session);
        return userData.role === 'labour';
    }
    return false;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Get first day of current month
function getFirstDayOfCurrentMonth() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
}

// Calculate farmer balance
function calculateFarmerBalance(farmerId, milkEntries, payments) {
    const farmerEntries = milkEntries.filter(entry => entry.farmerId === farmerId);
    const farmerPayments = payments.filter(payment => payment.farmerId === farmerId);

    const totalMilkValue = farmerEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    const totalPayments = farmerPayments
        .filter(payment => payment.type === 'Payment')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const totalBonuses = farmerPayments
        .filter(payment => payment.type === 'Bonus')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const totalDeductions = farmerPayments
        .filter(payment => payment.type === 'Deduction')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    return {
        totalMilkValue,
        totalPayments,
        totalBonuses,
        totalDeductions,
        balance: totalMilkValue - totalPayments + totalBonuses - totalDeductions
    };
}

// Format farmer name for display
function formatFarmerName(farmer) {
    return farmer.name || farmer.mobile || 'Unknown Farmer';
}

// Check if farmer has pending payments
function hasPendingPayments(farmerId, payments) {
    return payments.some(payment =>
        payment.farmerId === farmerId &&
        payment.status === 'Pending'
    );
}

// Get farmer by ID
function getFarmerById(farmers, id) {
    return farmers.find(farmer => farmer.id === id);
}

// Get milk entry by ID
function getMilkEntryById(entries, id) {
    return entries.find(entry => entry.id === id);
}

// Get payment by ID
function getPaymentById(payments, id) {
    return payments.find(payment => payment.id === id);
}

// Get sale by ID
function getSaleById(sales, id) {
    return sales.find(sale => sale.id === id);
}

// Get inventory item by ID
function getInventoryById(inventory, id) {
    return inventory.find(item => item.id === id);
}

// Listen for storage events to update farmer dropdowns in real-time
window.addEventListener('storage', function(e) {
    if (e.key === 'milkbook_data' && e.newValue) {
        try {
            const newState = JSON.parse(e.newValue);
            if (newState && newState.farmers) {
                updateFarmerDropdowns(newState);
            }
        } catch (error) {
            console.error('Error updating farmer dropdowns from storage event:', error);
        }
    }
});