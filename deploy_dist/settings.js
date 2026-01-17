// settings.js
// Workflow implementation for settings page

// Initialize page
function initSettingsPage() {
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
    
    // Set initial values
    document.getElementById('dairyNameInput').value = state.dairyInfo.name || '';
    document.getElementById('ownerNameInput').value = state.dairyInfo.owner || '';
    document.getElementById('mobileInput').value = state.dairyInfo.mobile || '';
    document.getElementById('addressInput').value = state.dairyInfo.address || '';
    document.getElementById('rateTypeSelect').value = state.dairyInfo.rateType || 'Fat_SNF';
    
    // Set rate values
    document.getElementById('cowBaseRate').value = state.rates.cow.base;
    document.getElementById('cowFatRef').value = state.rates.cow.fatRef;
    document.getElementById('cowSnfRef').value = state.rates.cow.snfRef;
    document.getElementById('buffaloBaseRate').value = state.rates.buffalo.base;
    document.getElementById('buffaloFatRef').value = state.rates.buffalo.fatRef;
    document.getElementById('buffaloSnfRef').value = state.rates.buffalo.snfRef;
    
    // Handle settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Update dairy info
            state.dairyInfo = {
                ...state.dairyInfo,
                name: document.getElementById('dairyNameInput').value,
                owner: document.getElementById('ownerNameInput').value,
                mobile: document.getElementById('mobileInput').value,
                address: document.getElementById('addressInput').value,
                rateType: document.getElementById('rateTypeSelect').value
            };
            
            // Update rates
            state.rates = {
                cow: {
                    base: parseFloat(document.getElementById('cowBaseRate').value),
                    fatRef: parseFloat(document.getElementById('cowFatRef').value),
                    snfRef: parseFloat(document.getElementById('cowSnfRef').value)
                },
                buffalo: {
                    base: parseFloat(document.getElementById('buffaloBaseRate').value),
                    fatRef: parseFloat(document.getElementById('buffaloFatRef').value),
                    snfRef: parseFloat(document.getElementById('buffaloSnfRef').value)
                }
            };
            
            // Save to localStorage
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending records count
            state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending count display
            document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
            
            // Show notification
            alert('Settings updated successfully');
            
            // Update header displays
            document.getElementById('dairyName').textContent = state.dairyInfo.name;
        });
    }
}

// Save rates function
function saveRates() {
    // Update rates from form inputs
    state.rates = {
        cow: {
            base: parseFloat(document.getElementById('cowBaseRate').value),
            fatRef: parseFloat(document.getElementById('cowFatRef').value),
            snfRef: parseFloat(document.getElementById('cowSnfRef').value)
        },
        buffalo: {
            base: parseFloat(document.getElementById('buffaloBaseRate').value),
            fatRef: parseFloat(document.getElementById('buffaloFatRef').value),
            snfRef: parseFloat(document.getElementById('buffaloSnfRef').value)
        }
    };
    
    // Save to localStorage
    localStorage.setItem('milkbook_data', JSON.stringify(state));
    
    // Update pending records count
    state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
    localStorage.setItem('milkbook_data', JSON.stringify(state));
    
    // Update pending count display
    document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
    
    // Show notification
    alert('System rates recalibrated successfully');
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettingsPage);