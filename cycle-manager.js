// cycle-manager.js
// 15-Day/Monthly Auto Cycle management for MilkBook app

// Define cycle types
const CYCLE_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    BI_WEEKLY: 'bi-weekly', // 15-day
    MONTHLY: 'monthly',
    CUSTOM: 'custom'
};

// Get cycle periods based on type
function getCyclePeriods(cycleType, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periods = [];
    
    switch (cycleType) {
        case CYCLE_TYPES.BI_WEEKLY:
            // Create 15-day periods
            let biWeekStart = new Date(start);
            while (biWeekStart <= end) {
                const biWeekEnd = new Date(biWeekStart);
                biWeekEnd.setDate(biWeekStart.getDate() + 14); // 15 days (0-14)
                
                if (biWeekEnd > end) {
                    biWeekEnd.setTime(end.getTime());
                }
                
                periods.push({
                    label: `${formatDate(biWeekStart)} - ${formatDate(biWeekEnd)}`,
                    startDate: new Date(biWeekStart),
                    endDate: new Date(biWeekEnd)
                });
                
                biWeekStart.setDate(biWeekStart.getDate() + 15);
            }
            break;
            
        case CYCLE_TYPES.MONTHLY:
            // Create monthly periods
            let monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
            while (monthStart <= end) {
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                if (monthEnd > end) {
                    monthEnd.setTime(end.getTime());
                }
                
                periods.push({
                    label: `${monthStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
                    startDate: new Date(monthStart),
                    endDate: new Date(monthEnd)
                });
                
                monthStart.setMonth(monthStart.getMonth() + 1);
            }
            break;
            
        case CYCLE_TYPES.WEEKLY:
            // Create weekly periods
            let weekStart = new Date(start);
            // Set to previous Monday
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            weekStart = new Date(weekStart.setDate(diff));
            
            while (weekStart <= end) {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                if (weekEnd > end) {
                    weekEnd.setTime(end.getTime());
                }
                
                periods.push({
                    label: `Week of ${formatDate(weekStart)}`,
                    startDate: new Date(weekStart),
                    endDate: new Date(weekEnd)
                });
                
                weekStart.setDate(weekStart.getDate() + 7);
            }
            break;
            
        default: // DAILY
            let day = new Date(start);
            while (day <= end) {
                periods.push({
                    label: formatDate(day),
                    startDate: new Date(day),
                    endDate: new Date(day)
                });
                day.setDate(day.getDate() + 1);
            }
    }
    
    return periods;
}

// Format date as DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN');
}

// Calculate summary for a period
function calculatePeriodSummary(period, milkEntries, payments) {
    const periodEntries = milkEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= period.startDate && entryDate <= period.endDate;
    });
    
    const periodPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= period.startDate && paymentDate <= period.endDate;
    });
    
    // Calculate totals
    const totalMilkQty = periodEntries.reduce((sum, entry) => sum + (parseFloat(entry.qty) || parseFloat(entry.quantity) || 0), 0);
    const totalMilkAmount = periodEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    const totalPayments = periodPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    
    return {
        milkCount: periodEntries.length,
        totalMilkQty: parseFloat(totalMilkQty.toFixed(2)),
        totalMilkAmount: parseFloat(totalMilkAmount.toFixed(2)),
        totalPayments: parseFloat(totalPayments.toFixed(2)),
        netAmount: parseFloat((totalMilkAmount - totalPayments).toFixed(2))
    };
}

// Generate auto cycle summary
function generateAutoCycleSummary(cycleType, startDate, endDate, milkEntries, payments) {
    const periods = getCyclePeriods(cycleType, startDate, endDate);
    const summary = {
        cycleType,
        startDate,
        endDate,
        periods: []
    };
    
    periods.forEach(period => {
        const periodSummary = calculatePeriodSummary(period, milkEntries, payments);
        summary.periods.push({
            ...period,
            summary: periodSummary
        });
    });
    
    return summary;
}

// Get cycle selector HTML for UI integration
function getCycleSelectorHTML() {
    return `
        <div class="cycle-selector flex items-center gap-2">
            <label class="text-sm font-medium">Cycle:</label>
            <select id="cycleTypeSelector" class="border rounded px-2 py-1 text-sm">
                <option value="bi-weekly">15-Day</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
            </select>
            <button id="generateCycleReport" class="bg-blue-600 text-white px-3 py-1 rounded text-sm">Generate</button>
        </div>
    `;
}

// Initialize cycle manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add cycle selector to pages that need it
    addCycleSelectorToPages();
});

// Add cycle selector to relevant pages
function addCycleSelectorToPages() {
    // Check if we're on a reports or ledger page
    const isReportsPage = document.querySelector('[data-page="reports"]') || 
                         document.body.innerHTML.includes('report') || 
                         document.querySelector('#totalMilkCollected');
    
    const isLedgerPage = document.body.innerHTML.includes('ledger') || 
                        document.body.innerHTML.includes('passbook') || 
                        document.querySelector('#farmerSelect');
    
    if (isReportsPage || isLedgerPage) {
        // Find a suitable location to insert the cycle selector
        const dateControls = document.querySelector('input[type="date"]')?.closest('.flex') || 
                           document.querySelector('button')?.closest('.flex') ||
                           document.querySelector('header')?.querySelector('.flex');
        
        if (dateControls) {
            const cycleDiv = document.createElement('div');
            cycleDiv.innerHTML = getCycleSelectorHTML();
            cycleDiv.className = 'cycle-controls ml-4';
            
            dateControls.parentNode.insertBefore(cycleDiv, dateControls.nextSibling);
            
            // Add event listeners
            setupCycleSelectorEvents();
        }
    }
}

// Setup events for cycle selector
function setupCycleSelectorEvents() {
    const generateBtn = document.getElementById('generateCycleReport');
    const cycleSelector = document.getElementById('cycleTypeSelector');
    
    if (generateBtn && cycleSelector) {
        generateBtn.addEventListener('click', function() {
            const cycleType = cycleSelector.value;
            // Trigger cycle report generation
            generateCycleReport(cycleType);
        });
    }
}

// Generate cycle report based on selected type
function generateCycleReport(cycleType) {
    // Get current state data
    const STORAGE_KEY = 'milkbook_data';
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    // Use today as end date and 3 months ago as start date as default
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    
    const milkEntries = state.milkEntries || [];
    const payments = state.payments || [];
    
    // Generate summary
    const summary = generateAutoCycleSummary(
        cycleType,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        milkEntries,
        payments
    );
    
    // Display the summary
    displayCycleSummary(summary);
}

// Display cycle summary on the page
function displayCycleSummary(summary) {
    // Create a modal or section to display the summary
    let summaryHtml = `
        <div id="cycleSummaryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Cycle Summary - ${summary.cycleType}</h3>
                    <button id="closeCycleSummary" class="text-gray-500 hover:text-gray-700">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="mb-4 text-sm text-gray-600">
                    Period: ${formatDate(summary.startDate)} to ${formatDate(summary.endDate)}
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milk (L)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments (₹)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net (₹)</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
    `;
    
    summary.periods.forEach(period => {
        summaryHtml += `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${period.label}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${period.summary.milkCount}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${period.summary.totalMilkQty}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">₹${period.summary.totalMilkAmount}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">₹${period.summary.totalPayments}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold">₹${period.summary.netAmount}</td>
            </tr>
        `;
    });
    
    summaryHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', summaryHtml);
    
    // Add close event
    document.getElementById('closeCycleSummary').addEventListener('click', function() {
        document.getElementById('cycleSummaryModal').remove();
    });
    
    // Close when clicking outside
    document.getElementById('cycleSummaryModal').addEventListener('click', function(e) {
        if (e.target.id === 'cycleSummaryModal') {
            this.remove();
        }
    });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        CYCLE_TYPES,
        getCyclePeriods,
        calculatePeriodSummary,
        generateAutoCycleSummary,
        getCycleSelectorHTML,
        generateCycleReport,
        displayCycleSummary
    };
}