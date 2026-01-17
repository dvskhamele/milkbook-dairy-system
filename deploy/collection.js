// collection.js
// Workflow implementation for milk collection page

// Initialize page
function initCollectionPage() {
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
    const STORAGE_KEY = 'milkbook_data';
    const INITIAL_STATE = {
        auth: { 
            isAuthenticated: true, 
            user: { name: 'Ramesh Kumar', mobile: '9876543210', role: 'owner' },
            role: 'owner'
        },
        currentScreen: 'collection',
        dairyInfo: { 
            name: 'Gopal Dairy Shop', 
            owner: 'Ramesh Kumar', 
            mobile: '9876543210', 
            address: '', 
            rateType: 'Fat_SNF', 
            language: 'EN' 
        },
        farmers: [],
        milkEntries: [],
        rates: {
            cow: { base: 40, fatRef: 3.5, snfRef: 8.5 },
            buffalo: { base: 60, fatRef: 6.0, snfRef: 9.0 }
        },
        payments: [],
        sales: [],
        inventory: [],
        evidenceRecords: [], // For MilkLedger Transparent functionality
        settings: { 
            backupEnabled: true, 
            lastBackup: null, 
            printerName: 'Default',
            syncState: 'QUARANTINED', // 'QUARANTINED' | 'SYNCED'
            lastServerSync: null,
            pendingRecords: 0,
            lastSyncTime: null,
            localRecordsToday: 0
        }
    };
    
    let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(INITIAL_STATE));
    
    // Update header info
    document.getElementById('dairyName').textContent = state.dairyInfo.name || 'Milk Collection Center';
    document.getElementById('userName').textContent = state.auth.user?.name || 'User';
    document.getElementById('userInitial').textContent = (state.auth.user?.name || 'U').charAt(0).toUpperCase();
    document.getElementById('pendingCount').textContent = state.settings.pendingRecords || 0;
    
    // Populate farmers dropdown
    const farmerSelect = document.getElementById('farmerSelect');
    if (farmerSelect) {
        farmerSelect.innerHTML = '<option value="">Select Farmer</option>';
        state.farmers.filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            farmerSelect.appendChild(option);
        });
    }
    
    // Set today's date
    document.getElementById('dateInput').valueAsDate = new Date();
    
    // Handle milk collection form submission
    document.getElementById('milkCollectionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const form = {
            farmerId: document.getElementById('farmerSelect').value,
            date: document.getElementById('dateInput').value,
            shift: document.getElementById('shiftSelect').value,
            type: document.getElementById('typeSelect').value,
            qty: parseFloat(document.getElementById('quantityInput').value),
            fat: parseFloat(document.getElementById('fatInput').value),
            snf: parseFloat(document.getElementById('snfInput').value) || 0,
            manualRate: parseFloat(document.getElementById('manualRateInput').value) || null, // Allow manual rate override
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth.user?.id || 'current_user'
        };
        
        // Calculate amount based on either manual rate or automatic calculation
        let calculatedRate, amount;
        if (form.manualRate) {
            // Use manual rate override
            calculatedRate = form.manualRate;
            amount = (form.qty * form.manualRate).toFixed(2);
        } else {
            // Calculate automatically based on fat/SNF
            const calc = calculateMilkAmount(
                form.qty,
                form.fat,
                form.snf,
                state.dairyInfo.rateType,
                state.rates,
                form.type
            );
            calculatedRate = calc.rate;
            amount = calc.amount;
        }
        
        const newEntry = {
            ...form,
            rate: calculatedRate,
            amount: amount,
            id: Date.now().toString()
        };
        
        // Add to state
        state.milkEntries.push(newEntry);
        localStorage.setItem('milkbook_data', JSON.stringify(state));
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        localStorage.setItem('milkbook_data', JSON.stringify(state));
        
        // Update pending count display
        document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
        
        // Show notification
        const farmer = state.farmers.find(f => f.id === form.farmerId);
        const rateType = form.manualRate ? '(Manual Rate)' : '(Auto-Calculated)';
        alert(`Collection recorded for ${farmer?.name || 'Farmer'} - ${form.qty}L at ${form.fat}% fat. Rate: ₹${calculatedRate}/L ${rateType}. Amount: ₹${amount}`);
        
        // Reset form
        document.getElementById('milkCollectionForm').reset();
        document.getElementById('dateInput').valueAsDate = new Date();
        
        // Update all farmer dropdowns in case new farmers were added elsewhere
        updateFarmerDropdowns(state);
        
        // Update recent collections display
        updateRecentCollections();
    });
    
    // Update recent collections display
    function updateRecentCollections() {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = state.milkEntries.filter(e => e.date === today);

        const recentCollections = document.getElementById('recentCollections');
        if (recentCollections) {
            recentCollections.innerHTML = '';

            if (todayEntries.length > 0) {
                todayEntries.slice(0, 10).forEach(entry => {
                    const farmer = state.farmers.find(f => f.id === entry.farmerId);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="py-4 font-bold text-slate-500">${entry.date}</td>
                        <td class="py-4 font-black">${farmer?.name || 'Unknown'}</td>
                        <td class="py-4 font-bold text-slate-500">${entry.shift}</td>
                        <td class="py-4 font-black">${entry.type}</td>
                        <td class="py-4 font-black text-slate-700">${entry.qty} L</td>
                        <td class="py-4 font-black text-amber-600">${entry.fat}</td>
                        <td class="py-4 text-right font-black text-blue-600">₹${entry.amount}</td>
                    `;
                    recentCollections.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colSpan="7" className="py-8 text-center text-slate-500">No collections recorded today</td>';
                recentCollections.appendChild(row);
            }
        }
    }
    
    // Calculate milk amount function
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
    
    // Format currency function
    function formatCurrency(val) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
    }
    
    // Update farmer dropdowns function
    function updateFarmerDropdowns(newState) {
        // Update dropdowns on current page if they exist
        const farmerDropdowns = document.querySelectorAll('select[id*="farmer"], select[id*="Farmer"], select[name*="farmer"], select[name*="Farmer"]');
        
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
    
    // Initial update
    updateRecentCollections();
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initCollectionPage);