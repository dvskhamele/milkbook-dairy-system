// farmers.js
// Workflow implementation for farmers page

// Initialize page
function initFarmersPage() {
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
        currentScreen: 'farmers',
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
    
    // Populate farmers dropdown in milk collection form if it exists
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
    
    // Handle farmer registration form
    const farmerForm = document.getElementById('farmerForm');
    if (farmerForm) {
        farmerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const farmerData = {
                id: Date.now().toString(),
                name: document.getElementById('farmerName').value,
                mobile: document.getElementById('farmerMobile').value,
                address: document.getElementById('farmerAddress').value,
                advance: parseFloat(document.getElementById('farmerAdvance').value) || 0,
                active: true,
                createdAt: new Date().toISOString(),
                syncState: 'QUARANTINED', // Mark as quarantined until synced to server
                createdAtLocal: new Date().toISOString(),
                syncedAtServer: null,
                isManual: true,
                inputSource: 'keyboard',
                deviceId: navigator.userAgent,
                operatorId: state.auth.user?.id || 'current_user'
            };

            // Add to state
            state.farmers.push(farmerData);
            localStorage.setItem('milkbook_data', JSON.stringify(state));

            // Update pending records count
            state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
            localStorage.setItem('milkbook_data', JSON.stringify(state));

            // Update pending count display
            document.getElementById('pendingCount').textContent = state.settings.pendingRecords;

            // Show notification
            alert(`Farmer ${farmerData.name} registered successfully`);

            // Reset form
            document.getElementById('farmerForm').reset();

            // Update all farmer dropdowns across the application
            updateFarmerDropdowns(state);

            // Update farmers list display
            updateFarmersList();
        });
    }

    // Add address autocomplete functionality
    const addressInput = document.getElementById('farmerAddress');
    const addressSuggestions = document.getElementById('addressSuggestions');

    if (addressInput && addressSuggestions) {
        // Sample address database for autocomplete
        const sampleAddresses = [
            'Village Road, District',
            'Main Street, Town',
            'Near Temple, Village',
            'Market Area, City',
            'Railway Station, District',
            'Bus Stand, Town',
            'Post Office, Village',
            'School Road, City',
            'Hospital Lane, District',
            'Police Station, Town',
            'Court Complex, Village',
            'Mandi, City',
            'Dairy Colony, District',
            'Milk Collection Center, Town',
            'Cooperative Society, Village'
        ];

        addressInput.addEventListener('input', function() {
            const inputValue = this.value.toLowerCase();

            if (inputValue.length < 2) {
                addressSuggestions.classList.add('hidden');
                return;
            }

            const filteredAddresses = sampleAddresses.filter(addr =>
                addr.toLowerCase().includes(inputValue)
            ).slice(0, 10);

            if (filteredAddresses.length > 0) {
                addressSuggestions.innerHTML = '';
                filteredAddresses.forEach(address => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0';
                    suggestionItem.textContent = address;
                    suggestionItem.onclick = () => {
                        addressInput.value = address;
                        addressSuggestions.classList.add('hidden');
                    };
                    addressSuggestions.appendChild(suggestionItem);
                });

                addressSuggestions.classList.remove('hidden');
            } else {
                addressSuggestions.classList.add('hidden');
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!addressInput.contains(e.target) && !addressSuggestions.contains(e.target)) {
                addressSuggestions.classList.add('hidden');
            }
        });
    }
    
    // Update farmers list display
    function updateFarmersList() {
        const farmersList = document.getElementById('farmersList');
        if (farmersList) {
            farmersList.innerHTML = '';
            
            const activeFarmers = state.farmers.filter(f => f.active !== false);
            if (activeFarmers.length > 0) {
                activeFarmers.slice(0, 15).forEach(farmer => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="py-4 font-black">${farmer.name}</td>
                        <td class="py-4 font-bold text-slate-500">${farmer.mobile}</td>
                        <td class="py-4 font-bold text-slate-500">${farmer.address || 'N/A'}</td>
                        <td class="py-4 font-black text-rose-600">₹${farmer.advance.toFixed(2)}</td>
                        <td class="py-4 text-right space-x-3">
                            <button class="text-blue-600 font-bold hover:underline text-sm">Edit</button>
                            <button class="text-red-600 font-bold hover:underline text-sm">Delete</button>
                        </td>
                    `;
                    farmersList.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colSpan="5" className="py-8 text-center text-slate-500">No farmers registered yet</td>';
                farmersList.appendChild(row);
            }
        }
    }
    
    // Update evidence records display
    function updateEvidenceRecords() {
        const evidenceRecords = document.getElementById('evidenceRecords');
        if (evidenceRecords) {
            evidenceRecords.innerHTML = '';
            
            if (state.evidenceRecords && state.evidenceRecords.length > 0) {
                state.evidenceRecords.slice(0, 15).forEach(record => {
                    const difference = Math.abs(parseFloat(record.calculatedAmount) - parseFloat(record.actualAmount));
                    const status = difference > 0.01 ? '⚠️ Mismatch' : '✓ Verified';
                    const statusColor = difference > 0.01 ? 'text-amber-600' : 'text-green-600';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="py-4 font-bold text-slate-500">${record.date}</td>
                        <td class="py-4 font-black">${record.shift}</td>
                        <td class="py-4 font-black text-slate-700">${record.qty} L</td>
                        <td class="py-4 font-black text-amber-600">${record.fat}</td>
                        <td class="py-4 font-bold text-slate-500">${record.snf}</td>
                        <td class="py-4 font-black text-blue-600">₹${record.rate}</td>
                        <td class="py-4 font-black text-green-600">₹${record.calculatedAmount}</td>
                        <td class="py-4 font-black text-rose-600">₹${record.actualAmount}</td>
                        <td class="py-4 text-right font-black ${statusColor}">${status}</td>
                    `;
                    evidenceRecords.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colSpan="9" className="py-8 text-center text-slate-500">No evidence records captured yet</td>';
                evidenceRecords.appendChild(row);
            }
        }
    }
    
    // Update income statistics
    function updateIncomeStats() {
        if (state.evidenceRecords && state.evidenceRecords.length > 0) {
            // Calculate total income
            const totalIncome = state.evidenceRecords.reduce((sum, record) => sum + parseFloat(record.actualAmount || 0), 0);
            
            // Calculate average daily income
            const uniqueDates = [...new Set(state.evidenceRecords.map(r => r.date))];
            const avgDailyIncome = uniqueDates.length > 0 ? totalIncome / uniqueDates.length : 0;
            
            // Calculate consistency index (based on regularity of entries)
            const consistencyIndex = Math.min(100, Math.floor((uniqueDates.length / 30) * 100)); // Assuming 30 days as benchmark
            
            // Calculate verified months
            const months = [...new Set(state.evidenceRecords.map(r => r.date.substring(0, 7)))]; // YYYY-MM
            
            // Update displays
            document.getElementById('avgDailyIncomeProof').textContent = formatCurrency(avgDailyIncome);
            document.getElementById('monthlyIncomeProof').textContent = formatCurrency(totalIncome);
            document.getElementById('consistencyIndexProof').textContent = `${consistencyIndex}%`;
            document.getElementById('verifiedMonthsProof').textContent = months.length;
        }
    }
    
    // Tab switching functionality
    function switchTab(tabName) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.classList.add('hidden');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-blue-600', 'text-blue-600');
            button.classList.add('border-transparent', 'text-slate-500');
        });
        
        // Show selected tab content
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // Add active class to clicked button
        document.getElementById(`${tabName}TabBtn`).classList.add('active', 'border-blue-600', 'text-blue-600');
        document.getElementById(`${tabName}TabBtn`).classList.remove('border-transparent', 'text-slate-500');
    }
    
    // Update calculated amount when inputs change
    document.getElementById('evidenceQuantity').addEventListener('input', updateEvidenceCalculatedAmount);
    document.getElementById('evidenceRate').addEventListener('input', updateEvidenceCalculatedAmount);
    
    function updateEvidenceCalculatedAmount() {
        const qty = parseFloat(document.getElementById('evidenceQuantity').value) || 0;
        const rate = parseFloat(document.getElementById('evidenceRate').value) || 0;
        const calculatedAmount = (qty * rate).toFixed(2);
        document.getElementById('evidenceCalculatedAmount').value = calculatedAmount;
    }
    
    // Capture evidence function
    function captureEvidence() {
        const evidenceData = {
            date: document.getElementById('evidenceDate').value,
            shift: document.getElementById('evidenceShift').value,
            qty: parseFloat(document.getElementById('evidenceQuantity').value) || 0,
            fat: parseFloat(document.getElementById('evidenceFat').value) || 0,
            snf: parseFloat(document.getElementById('evidenceSnf').value) || 0,
            rate: parseFloat(document.getElementById('evidenceRate').value) || 0,
            calculatedAmount: parseFloat(document.getElementById('evidenceCalculatedAmount').value) || 0,
            actualAmount: parseFloat(document.getElementById('evidenceActualAmount').value) || 0,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'camera', // Could be 'scale' or 'camera' or 'keyboard'
            deviceId: navigator.userAgent,
            operatorId: state.auth.user?.id || 'current_user'
        };
        
        const newEvidence = {
            ...evidenceData,
            id: Date.now().toString()
        };
        
        // Add to state
        if (!state.evidenceRecords) {
            state.evidenceRecords = [];
        }
        state.evidenceRecords.push(newEvidence);
        localStorage.setItem('milkbook_data', JSON.stringify(state));
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        localStorage.setItem('milkbook_data', JSON.stringify(state));
        
        // Update pending count display
        document.getElementById('pendingCount').textContent = state.settings.pendingRecords;
        
        // Show notification
        const difference = Math.abs(parseFloat(newEvidence.calculatedAmount) - parseFloat(newEvidence.actualAmount));
        if (difference > 0.01) {
            alert(`⚠️ EVIDENCE CAPTURED WITH DISCREPANCY!\nExpected: ₹${newEvidence.calculatedAmount}\nReceived: ₹${newEvidence.actualAmount}\nDifference: ₹${difference.toFixed(2)}`);
        } else {
            alert(`✓ Evidence captured for ${newEvidence.qty}L milk at ${newEvidence.fat}% fat. Amount: ₹${newEvidence.calculatedAmount}`);
        }
        
        // Reset form
        document.getElementById('evidenceSlipUpload').value = '';
        document.getElementById('evidenceDate').valueAsDate = new Date();
        document.getElementById('evidenceQuantity').value = '';
        document.getElementById('evidenceFat').value = '';
        document.getElementById('evidenceSnf').value = '';
        document.getElementById('evidenceRate').value = '';
        document.getElementById('evidenceCalculatedAmount').value = '';
        document.getElementById('evidenceActualAmount').value = '';
        
        // Update evidence records display
        updateEvidenceRecords();
    }
    
    // Verify payment function
    function verifyPayment() {
        const calculatedAmount = parseFloat(document.getElementById('evidenceCalculatedAmount').value) || 0;
        const actualAmount = parseFloat(document.getElementById('evidenceActualAmount').value) || 0;
        const difference = calculatedAmount - actualAmount;
        
        if (Math.abs(difference) > 0.01) {
            alert(`⚠️ PAYMENT VERIFICATION FAILED!\nCalculated: ₹${calculatedAmount}\nActual: ₹${actualAmount}\nDifference: ₹${Math.abs(difference).toFixed(2)} (${difference > 0 ? 'SHORT' : 'EXCESS'})`);
        } else {
            alert(`✓ Payment verified. Amounts match: ₹${calculatedAmount}`);
        }
    }
    
    // Reconcile payment function
    function reconcilePayment() {
        const expectedAmount = parseFloat(document.getElementById('expectedAmount').value) || 0;
        const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
        const difference = expectedAmount - receivedAmount;
        
        const verificationResult = document.getElementById('verificationResult');
        const verificationMessage = document.getElementById('verificationMessage');
        
        if (Math.abs(difference) > 0.01) {
            verificationMessage.innerHTML = `
                <strong>⚠️ PAYMENT RECONCILIATION FAILED!</strong><br>
                Expected Total: ₹${expectedAmount.toFixed(2)}<br>
                Received Total: ₹${receivedAmount.toFixed(2)}<br>
                Difference: ₹${Math.abs(difference).toFixed(2)} ${difference > 0 ? 'SHORT' : 'EXCESS'}
            `;
            verificationResult.classList.remove('hidden');
        } else {
            verificationMessage.innerHTML = `<strong>✓ Payment reconciliation successful. Amounts match.</strong>`;
            verificationResult.classList.remove('hidden');
        }
    }
    
    // Generate income certificate function
    function generateIncomeCertificate() {
        const startDate = document.getElementById('incomeCertStart').value;
        const endDate = document.getElementById('incomeCertEnd').value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        // Calculate income statistics for the period
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let totalIncome = 0;
        let totalDays = 0;
        
        if (state.evidenceRecords) {
            const periodRecords = state.evidenceRecords.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= start && recordDate <= end;
            });
            
            totalIncome = periodRecords.reduce((sum, r) => sum + parseFloat(r.actualAmount || 0), 0);
            totalDays = [...new Set(periodRecords.map(r => r.date))].length; // Count unique days
        }
        
        const avgDailyIncome = totalDays > 0 ? totalIncome / totalDays : 0;
        
        // Update income proof displays
        document.getElementById('avgDailyIncomeProof').textContent = formatCurrency(avgDailyIncome);
        document.getElementById('monthlyIncomeProof').textContent = formatCurrency(totalIncome);
        
        // In a real implementation, this would generate a PDF certificate
        alert(`Income Certificate Generated\nPeriod: ${startDate} to ${endDate}\nTotal Income: ₹${totalIncome.toFixed(2)}\nAvg Daily: ₹${avgDailyIncome.toFixed(2)}`);
    }
    
    // Format currency function
    function formatCurrency(val) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
    }
    
    // Initial updates
    updateFarmersList();
    updateEvidenceRecords();
    updateIncomeStats();
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initFarmersPage);