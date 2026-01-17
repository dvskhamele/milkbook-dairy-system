// ledger.js
// Workflow implementation for ledger page

// Initialize page
function initLedgerPage() {
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
    
    // Populate farmers dropdown
    const farmerFilter = document.getElementById('farmerFilter');
    if (farmerFilter) {
        farmerFilter.innerHTML = '<option value="">All Farmers</option>';
        state.farmers.filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            farmerFilter.appendChild(option);
        });
    }
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('startDateFilter').valueAsDate = firstDayOfMonth;
    document.getElementById('endDateFilter').valueAsDate = today;
    
    // Update ledger entries display
    updateLedgerEntries();
}

// Update ledger entries display
function updateLedgerEntries() {
    const ledgerEntries = document.getElementById('ledgerEntries');
    if (ledgerEntries) {
        ledgerEntries.innerHTML = '';
        
        // Combine milk entries, payments, and sales for ledger
        const allEntries = [];
        
        // Add milk collection entries
        state.milkEntries.forEach(entry => {
            const farmer = state.farmers.find(f => f.id === entry.farmerId);
            allEntries.push({
                date: entry.date,
                farmerId: entry.farmerId,
                farmerName: farmer?.name || 'Unknown',
                description: `Milk collection - ${entry.qty}L at ${entry.fat}% fat`,
                debit: 0,
                credit: parseFloat(entry.amount),
                balanceAfter: 0, // Would be calculated in real implementation
                type: 'Collection',
                shift: entry.shift,
                createdAtLocal: entry.createdAtLocal
            });
        });
        
        // Add payment entries
        state.payments.forEach(payment => {
            const farmer = state.farmers.find(f => f.id === payment.farmerId);
            allEntries.push({
                date: payment.date,
                farmerId: payment.farmerId,
                farmerName: farmer?.name || 'Unknown',
                description: `${payment.type} ${payment.reason ? `(${payment.reason})` : ''}`,
                debit: payment.type === 'Deduction' ? parseFloat(payment.amount) : 0,
                credit: (payment.type === 'Payment' || payment.type === 'Bonus') ? parseFloat(payment.amount) : 0,
                balanceAfter: 0, // Would be calculated in real implementation
                type: payment.type,
                shift: 'Payment',
                createdAtLocal: payment.createdAtLocal
            });
        });
        
        // Sort by date (most recent first)
        allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (allEntries.length > 0) {
            allEntries.slice(0, 20).forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-bold text-slate-500">${entry.date}</td>
                    <td class="py-4 font-black">${entry.farmerName}</td>
                    <td class="py-4 font-bold text-slate-500">${entry.description}</td>
                    <td class="py-4 font-black text-rose-600">${entry.debit > 0 ? formatCurrency(entry.debit) : ''}</td>
                    <td class="py-4 font-black text-green-600">${entry.credit > 0 ? formatCurrency(entry.credit) : ''}</td>
                    <td class="py-4 text-right font-black text-blue-600">${formatCurrency(entry.balanceAfter)}</td>
                `;
                ledgerEntries.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="6" className="py-8 text-center text-slate-500">No transactions recorded yet</td>';
            ledgerEntries.appendChild(row);
        }
    }
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initLedgerPage);