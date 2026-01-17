// dashboard.js
// Workflow implementation for dashboard page

// Initialize page
function initDashboardPage() {
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
    const savedData = localStorage.getItem(STORAGE_KEY);
    let state;
    try {
        state = savedData ? JSON.parse(savedData) : { ...INITIAL_STATE };
    } catch (e) {
        console.error('Error parsing state:', e);
        state = { ...INITIAL_STATE };
    }
    
    // Ensure state structure is correct
    if (!state.farmers) state.farmers = [];
    if (!state.milkEntries) state.milkEntries = [];
    if (!state.payments) state.payments = [];
    if (!state.sales) state.sales = [];
    if (!state.inventory) state.inventory = [];
    if (!state.evidenceRecords) state.evidenceRecords = [];
    if (!state.settings) state.settings = INITIAL_STATE.settings;
    
    // Update header info
    document.getElementById('dairyName').textContent = state.dairyInfo?.name || 'Milk Collection Center';
    document.getElementById('userName').textContent = state.auth?.user?.name || 'User';
    document.getElementById('userInitial').textContent = (state.auth?.user?.name || 'U').charAt(0).toUpperCase();
    document.getElementById('pendingCount').textContent = state.settings?.pendingRecords || 0;
    
    // Update dashboard metrics
    updateDashboardMetrics(state);
    
    // Update recent collections display
    updateRecentCollections(state);
    
    // Update active farmers display
    updateActiveFarmers(state);
    
    // Set up periodic updates (every 30 seconds)
    setInterval(() => {
        const updatedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(INITIAL_STATE));
        updateDashboardMetrics(updatedState);
        updateRecentCollections(updatedState);
        updateActiveFarmers(updatedState);
    }, 30000);
}

// Update dashboard metrics
function updateDashboardMetrics(state) {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's milk volume
    const todayEntries = state.milkEntries.filter(e => e.date === today);
    const totalVolume = todayEntries.reduce((sum, entry) => sum + (parseFloat(entry.qty) || 0), 0);
    document.querySelector('.text-4xl.font-black.tracking-tighter:nth-child(2)').textContent = `${totalVolume.toFixed(1)} `;
    
    // Calculate today's acquisition cost
    const totalCost = todayEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    document.querySelector('.text-4xl.font-black.tracking-tighter:nth-child(2) ~ .text-4xl.font-black.tracking-tighter').textContent = `₹${totalCost.toFixed(2)}`;
    
    // Calculate efficiency index (cost per liter)
    const efficiencyIndex = totalVolume > 0 ? totalCost / totalVolume : 0;
    document.querySelector('.text-4xl.font-black.tracking-tighter.text-slate-800:nth-child(2)').textContent = `₹${efficiencyIndex.toFixed(2)}`;
    
    // Calculate active farmers
    const activeFarmers = state.farmers.filter(f => f.active !== false).length;
    document.querySelector('.text-4xl.font-black.tracking-tighter.text-slate-800:last-child').textContent = activeFarmers;
}

// Update recent collections display
function updateRecentCollections(state) {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = state.milkEntries.filter(e => e.date === today);
    
    const recentCollections = document.querySelector('#recentCollections tbody');
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

// Update active farmers display
function updateActiveFarmers(state) {
    const activeFarmers = state.farmers.filter(f => f.active !== false);
    const activeFarmersList = document.querySelector('#activeFarmers tbody');
    
    if (activeFarmersList) {
        activeFarmersList.innerHTML = '';
        
        if (activeFarmers.length > 0) {
            activeFarmers.slice(0, 10).forEach(farmer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-black">${farmer.name}</td>
                    <td class="py-4 font-bold text-slate-500">${farmer.mobile}</td>
                    <td class="py-4 font-bold text-slate-500">${farmer.address || 'N/A'}</td>
                    <td class="py-4 font-black text-rose-600">₹${(farmer.advance || 0).toFixed(2)}</td>
                    <td class="py-4 text-right space-x-3">
                        <button class="text-blue-600 font-bold hover:underline text-sm">Edit</button>
                        <button class="text-red-600 font-bold hover:underline text-sm">Delete</button>
                    </td>
                `;
                activeFarmersList.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="5" className="py-8 text-center text-slate-500">No farmers registered yet</td>';
            activeFarmersList.appendChild(row);
        }
    }
}

// Update sync status display
function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        if (navigator.onLine) {
            syncStatus.textContent = 'Online';
            syncStatus.parentElement.classList.remove('bg-green-600');
            syncStatus.parentElement.classList.add('bg-blue-600');
        } else {
            syncStatus.textContent = 'Offline';
            syncStatus.parentElement.classList.remove('bg-blue-600');
            syncStatus.parentElement.classList.add('bg-green-600');
        }
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboardPage);

// Listen for online/offline events
window.addEventListener('online', updateSyncStatus);
window.addEventListener('offline', updateSyncStatus);