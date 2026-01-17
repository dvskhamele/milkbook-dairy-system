// reports.js
// Workflow implementation for reports page

// Initialize page
function initReportsPage() {
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
    
    // Set default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('startDateFilter').valueAsDate = firstDayOfMonth;
    document.getElementById('endDateFilter').valueAsDate = today;
    
    // Update all report sections
    updateDashboardStats();
    updateMonthlyTrend();
    updateShiftAnalysis();
}

// Update dashboard statistics
function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = state.milkEntries.filter(e => e.date === today);
    
    const totalVolume = todayEntries.reduce((sum, e) => sum + parseFloat(e.qty || 0), 0);
    const totalValue = todayEntries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const efficiencyIndex = totalVolume > 0 ? totalValue / totalVolume : 0;
    const activeFarmers = [...new Set(todayEntries.map(e => e.farmerId))].length;
    
    document.getElementById('todaysMilk').textContent = `${totalVolume.toFixed(1)} LTRS`;
    document.getElementById('acquisitionCost').textContent = formatCurrency(totalValue);
    document.getElementById('efficiencyIndex').textContent = `${formatCurrency(efficiencyIndex)}/L`;
    document.getElementById('activeFarmers').textContent = activeFarmers;
}

// Update monthly trend display
function updateMonthlyTrend() {
    // Group entries by month
    const monthlyData = {};
    state.milkEntries.forEach(entry => {
        const month = entry.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { collections: 0, volume: 0, value: 0 };
        }
        monthlyData[month].collections += 1;
        monthlyData[month].volume += parseFloat(entry.qty || 0);
        monthlyData[month].value += parseFloat(entry.amount || 0);
    });
    
    const monthlyTrend = document.getElementById('monthlyTrend');
    if (monthlyTrend) {
        monthlyTrend.innerHTML = '';
        
        if (Object.keys(monthlyData).length > 0) {
            Object.entries(monthlyData).forEach(([month, data]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-black">${month}</td>
                    <td class="py-4 font-bold text-slate-500">${data.collections} collections</td>
                    <td class="py-4 font-black text-slate-700">${data.volume.toFixed(1)} L</td>
                    <td class="py-4 text-right font-black text-blue-600">${formatCurrency(data.value)}</td>
                `;
                monthlyTrend.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="4" className="py-8 text-center text-slate-500">No data available yet</td>';
            monthlyTrend.appendChild(row);
        }
    }
}

// Update shift analysis display
function updateShiftAnalysis() {
    const shiftData = { Morning: { collections: 0, volume: 0, investment: 0 }, Evening: { collections: 0, volume: 0, investment: 0 } };
    state.milkEntries.forEach(entry => {
        const shift = entry.shift;
        shiftData[shift].collections += 1;
        shiftData[shift].volume += parseFloat(entry.qty || 0);
        shiftData[shift].investment += parseFloat(entry.amount || 0);
    });
    
    const shiftAnalysis = document.getElementById('shiftAnalysis');
    if (shiftAnalysis) {
        shiftAnalysis.innerHTML = '';
        
        Object.entries(shiftData).forEach(([shift, data]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-4 font-black">${shift}</td>
                <td class="py-4 font-bold text-slate-500">${data.collections} units</td>
                <td class="py-4 font-black text-slate-700">${data.volume.toFixed(1)} L</td>
                <td class="py-4 text-right font-black text-blue-600">${formatCurrency(data.investment)}</td>
            `;
            shiftAnalysis.appendChild(row);
        });
    }
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initReportsPage);