// inventory.js
// Workflow implementation for inventory page

// Initialize page
function initInventoryPage() {
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
    
    // Set today's date
    document.getElementById('inventoryDateInput').valueAsDate = new Date();
    
    // Handle inventory form submission
    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const form = {
                item: document.getElementById('inventoryItemSelect').value,
                action: document.getElementById('inventoryActionSelect').value,
                supplier: document.getElementById('supplierInput').value,
                qty: parseFloat(document.getElementById('inventoryQuantityInput').value),
                rate: parseFloat(document.getElementById('inventoryRateInput').value) || 0,
                amount: (parseFloat(document.getElementById('inventoryQuantityInput').value) * (parseFloat(document.getElementById('inventoryRateInput').value) || 0)).toFixed(2),
                date: document.getElementById('inventoryDateInput').value,
                notes: document.getElementById('inventoryNotesInput')?.value || `Inventory ${document.getElementById('inventoryActionSelect').value.toLowerCase()} for ${document.getElementById('inventoryItemSelect').value}`,
                syncState: 'QUARANTINED', // Mark as quarantined until synced to server
                createdAtLocal: new Date().toISOString(),
                syncedAtServer: null,
                isManual: true,
                inputSource: 'keyboard',
                deviceId: navigator.userAgent,
                operatorId: state.auth.user?.id || 'current_user'
            };
            
            const newEntry = {
                ...form,
                id: Date.now().toString()
            };
            
            // Add to state
            state.inventory.push(newEntry);
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending records count
            state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending count display
            document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
            
            // Show notification
            alert(`${form.action} of ${form.qty} ${form.item} recorded. Amount: ₹${form.amount}`);
            
            // Reset form
            document.getElementById('inventoryForm').reset();
            document.getElementById('inventoryDateInput').valueAsDate = new Date();
            
            // Update inventory levels display
            updateInventoryLevels();
        });
    }
    
    // Update inventory stats and levels
    updateInventoryStats();
    updateInventoryLevels();
}

// Update inventory statistics
function updateInventoryStats() {
    // Calculate total inventory value
    const totalValue = state.inventory.reduce((sum, item) => {
        if (item.action === 'Purchase') {
            return sum + parseFloat(item.amount || 0);
        } else if (item.action === 'Sale' || item.action === 'Consumption') {
            return sum - parseFloat(item.amount || 0);
        }
        return sum;
    }, 0);
    
    // Calculate feed stock
    const feedEntries = state.inventory.filter(i => i.item === 'Feed');
    const feedPurchased = feedEntries.filter(i => i.action === 'Purchase').reduce((sum, i) => sum + parseFloat(i.qty || 0), 0);
    const feedSold = feedEntries.filter(i => i.action === 'Sale' || i.action === 'Consumption').reduce((sum, i) => sum + parseFloat(i.qty || 0), 0);
    const feedCurrent = feedPurchased - feedSold;
    
    // Calculate ghee stock
    const gheeEntries = state.inventory.filter(i => i.item === 'Ghee');
    const gheePurchased = gheeEntries.filter(i => i.action === 'Purchase').reduce((sum, i) => sum + parseFloat(i.qty || 0), 0);
    const gheeSold = gheeEntries.filter(i => i.action === 'Sale' || i.action === 'Consumption').reduce((sum, i) => sum + parseFloat(i.qty || 0), 0);
    const gheeCurrent = gheePurchased - gheeSold;
    
    // Update displays
    document.getElementById('totalItems').textContent = state.inventory.length;
    document.getElementById('inventoryValue').textContent = formatCurrency(totalValue);
    document.getElementById('feedStock').textContent = `${feedCurrent.toFixed(2)} Bags`;
    document.getElementById('gheeStock').textContent = `${gheeCurrent.toFixed(2)} Kg`;
}

// Update inventory levels display
function updateInventoryLevels() {
    const inventoryLevels = document.getElementById('inventoryLevels');
    if (inventoryLevels) {
        inventoryLevels.innerHTML = '';
        
        // Group inventory by item type
        const inventoryByItem = {};
        state.inventory.forEach(item => {
            if (!inventoryByItem[item.item]) {
                inventoryByItem[item.item] = { purchased: 0, sold: 0, consumed: 0, value: 0 };
            }
            
            if (item.action === 'Purchase') {
                inventoryByItem[item.item].purchased += parseFloat(item.qty || 0);
                inventoryByItem[item.item].value += parseFloat(item.amount || 0);
            } else if (item.action === 'Sale') {
                inventoryByItem[item.item].sold += parseFloat(item.qty || 0);
            } else if (item.action === 'Consumption') {
                inventoryByItem[item.item].consumed += parseFloat(item.qty || 0);
            }
        });
        
        if (Object.keys(inventoryByItem).length > 0) {
            Object.entries(inventoryByItem).forEach(([item, data]) => {
                const currentStock = data.purchased - data.sold - data.consumed;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-black">${item}</td>
                    <td class="py-4 font-bold text-slate-500">${data.purchased.toFixed(2)} Units</td>
                    <td class="py-4 font-bold text-slate-500">${(data.sold + data.consumed).toFixed(2)} Units</td>
                    <td class="py-4 font-black text-slate-700">${currentStock.toFixed(2)} Units</td>
                    <td class="py-4 font-black text-green-600">${formatCurrency(data.value)}</td>
                    <td class="py-4 text-right font-black ${currentStock > 10 ? 'text-green-600' : 'text-amber-600'}">
                        ${currentStock > 10 ? 'Adequate' : 'Low Stock'}
                    </td>
                `;
                inventoryLevels.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="6" className="py-8 text-center text-slate-500">No inventory items recorded yet</td>';
            inventoryLevels.appendChild(row);
        }
    }
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initInventoryPage);