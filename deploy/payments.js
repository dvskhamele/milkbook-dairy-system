// payments.js
// Workflow implementation for payments page

// Initialize page
function initPaymentsPage() {
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
    const paymentFarmerSelect = document.getElementById('paymentFarmerSelect');
    if (paymentFarmerSelect) {
        paymentFarmerSelect.innerHTML = '<option value="">Select Farmer</option>';
        state.farmers.filter(f => f.active !== false).forEach(farmer => {
            const option = document.createElement('option');
            option.value = farmer.id;
            option.textContent = farmer.name;
            paymentFarmerSelect.appendChild(option);
        });
    }
    
    // Set today's date
    document.getElementById('paymentDateInput').valueAsDate = new Date();
    
    // Handle payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const form = {
                farmerId: document.getElementById('paymentFarmerSelect').value,
                amount: parseFloat(document.getElementById('paymentAmountInput').value),
                date: document.getElementById('paymentDateInput').value,
                mode: document.getElementById('paymentModeSelect').value,
                type: document.getElementById('paymentTypeSelect').value,
                notes: document.getElementById('paymentNotesInput')?.value || `Payment for ${document.getElementById('paymentAmountInput').value}`,
                status: 'Completed',
                syncState: 'QUARANTINED', // Mark as quarantined until synced to server
                createdAtLocal: new Date().toISOString(),
                syncedAtServer: null,
                isManual: true,
                inputSource: 'keyboard',
                deviceId: navigator.userAgent,
                operatorId: state.auth.user?.id || 'current_user'
            };
            
            const newPayment = {
                ...form,
                id: Date.now().toString()
            };
            
            // Add to state
            state.payments.push(newPayment);
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending records count
            state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
            localStorage.setItem('milkbook_data', JSON.stringify(state));
            
            // Update pending count display
            document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
            
            // Show notification
            const farmer = state.farmers.find(f => f.id === form.farmerId);
            alert(`${form.type} of ₹${form.amount} recorded for ${farmer?.name || 'Farmer'}`);
            
            // Reset form
            document.getElementById('paymentForm').reset();
            document.getElementById('paymentDateInput').valueAsDate = new Date();
            
            // Update payment transactions display
            updatePaymentTransactions();
        });
    }
    
    // Update payment transactions display
    updatePaymentTransactions();
}

// Update payment transactions display
function updatePaymentTransactions() {
    const paymentTransactions = document.getElementById('paymentTransactions');
    if (paymentTransactions) {
        paymentTransactions.innerHTML = '';
        
        if (state.payments.length > 0) {
            state.payments.slice(0, 15).forEach(payment => {
                const farmer = state.farmers.find(f => f.id === payment.farmerId);
                const isDeduction = payment.type === 'Deduction';
                const isBonus = payment.type === 'Bonus';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="py-4 font-bold text-slate-500">${payment.date}</td>
                    <td class="py-4 font-black">${farmer?.name || 'Unknown'}</td>
                    <td class="py-4 font-bold text-slate-500">${payment.type} ${payment.reason ? `(${payment.reason})` : ''}</td>
                    <td class="py-4 font-black ${isDeduction ? 'text-rose-600' : isBonus ? 'text-green-600' : 'text-blue-600'}">
                        ${isDeduction ? '-' : ''}${formatCurrency(payment.amount)}
                    </td>
                    <td class="py-4 font-bold text-slate-500">${payment.mode || 'N/A'}</td>
                    <td class="py-4 text-right font-black text-green-600">${payment.status || 'Completed'}</td>
                `;
                paymentTransactions.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colSpan="6" className="py-8 text-center text-slate-500">No transactions recorded yet</td>';
            paymentTransactions.appendChild(row);
        }
    }
}

// Format currency function
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPaymentsPage);