// milk-sales.js
// Workflow implementation for milk sales page

// Initialize page
function initMilkSalesPage() {
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
    document.getElementById('salesDateInput').valueAsDate = new Date();
    
    // Handle sales form submission
    const salesForm = document.getElementById('salesForm');
    if (salesForm) {
        salesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const form = {
                customer: document.getElementById('customerInput').value,
                productType: document.getElementById('productSelect').value,
                date: document.getElementById('salesDateInput').value,
                qty: parseFloat(document.getElementById('salesQuantityInput').value),
                rate: parseFloat(document.getElementById('salesRateInput').value),
                amount: (parseFloat(document.getElementById('salesQuantityInput').value) * parseFloat(document.getElementById('salesRateInput').value)).toFixed(2),
                status: 'Completed',
                syncState: 'QUARANTINED', // Mark as quarantined until synced to server
                createdAtLocal: new Date().toISOString(),
                syncedAtServer: null,
                isManual: true,
                inputSource: 'keyboard',
                deviceId: navigator.userAgent,
                operatorId: state.auth.user?.id || 'current_user'
            };
            
            const newSale = {
                ...form,
                id: Date.now().toString()
            };
            
            // Add to state
            state.sales.push(newSale);
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending records count
            state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending count display
            document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
            
            // Show notification
            alert(`Sale of ${form.productType} for ₹${form.amount} recorded for ${form.customer}`);
            
            // Reset form
            document.getElementById('salesForm').reset();
            document.getElementById('salesDateInput').valueAsDate = new Date();
            
            // Update sales entries display
            updateRecentSales();
        });
    }
    
    // Update sales stats
    updateSalesStats();
    updateRecentSales();
}

// Update sales statistics
function updateSalesStats() {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = state.sales.filter(s => s.date === today);
    
    const totalSales = todaySales.reduce((sum, sale) => sum + parseFloat(sale.amount || 0), 0);
    const totalVolume = todaySales
        .filter(s => s.productType === 'Milk')
        .reduce((sum, sale) => sum + parseFloat(sale.qty || 0), 0);
    
    const uniqueCustomers = [...new Set(todaySales.map(s => s.customer))].length;
    const pendingOrders = state.sales.filter(s => s.status === 'Pending').length;
    
    document.getElementById('todaysSales').textContent = formatCurrency(totalSales);
    document.getElementById('milkVolume').textContent = `${totalVolume.toFixed(2)} L`;
    document.getElementById('customerCount').textContent = uniqueCustomers;
    document.getElementById('pendingOrders').textContent = pendingOrders;
}

// Update recent sales display
function updateRecentSales() {
    const recentSales = document.getElementById('recentSales');
    if (recentSales) {
        recentSales.innerHTML = '';
        
        if (state.sales.length > 0) {
            state.sales.slice(0, 15).forEach(sale => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-bold text-slate-500">${sale.date}</td>
                    <td class="py-4 font-black">${sale.customer}</td>
                    <td class="py-4 font-bold text-slate-500">${sale.productType}</td>
                    <td class="py-4 font-black text-slate-700">${sale.qty} ${sale.productType === 'Milk' ? 'L' : sale.productType === 'Feed' ? 'Bags' : sale.productType === 'Ghee' ? 'Kg' : 'Units'}</td>
                    <td class="py-4 font-black text-blue-600">${formatCurrency(parseFloat(sale.rate))}</td>
                    <td class="py-4 text-right font-black text-green-600">${formatCurrency(sale.amount)}</td>
                `;
                recentSales.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="6" className="py-8 text-center text-slate-500">No sales recorded yet</td>';
            recentSales.appendChild(row);
        }
    }
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initMilkSalesPage);