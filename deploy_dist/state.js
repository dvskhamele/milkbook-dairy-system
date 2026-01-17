// assets/state.js
// State management for MilkBook application

// Storage key
const STORAGE_KEY = 'milkbook_data';

// Initial state
const INITIAL_STATE = {
  auth: { 
    isAuthenticated: false, 
    user: null,
    role: 'owner' // 'owner' or 'labour'
  },
  currentScreen: 'login',
  dairyInfo: { 
    name: '', 
    owner: '', 
    mobile: '', 
    address: '', 
    rateType: 'Fat_SNF', // 'Fat_SNF', 'Fat', 'SNF'
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

// Format currency
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

// Calculate milk amount
const calculateMilkAmount = (qty, fat, snf, rateType, rates, type) => {
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
};

// Calculate farmer balances
const calculateFarmerBalances = (farmers, milkEntries, payments) => {
  return farmers.map(farmer => {
    const totalMilkValue = milkEntries
      .filter(entry => entry.farmerId === farmer.id)
      .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    
    const totalPayments = payments
      .filter(payment => payment.farmerId === farmer.id && payment.type === 'Payment')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    const totalBonuses = payments
      .filter(payment => payment.farmerId === farmer.id && payment.type === 'Bonus')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    const totalDeductions = payments
      .filter(payment => payment.farmerId === farmer.id && payment.type === 'Deduction')
      .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    return {
      ...farmer,
      totalMilkValue,
      totalPayments,
      totalBonuses,
      totalDeductions,
      balance: totalMilkValue - totalPayments + totalBonuses - totalDeductions
    };
  });
};

// Get pending records count
const getPendingRecordsCount = (state) => {
  // In a real implementation, this would check for records that need to be synced to server
  // For now, we'll return a mock count based on recent entries
  const today = new Date().toISOString().split('T')[0];
  const recentEntries = state.milkEntries.filter(entry => entry.date === today);
  return recentEntries.length;
};

// Check if we're in rush hours
const isRushHour = () => {
  const hour = new Date().getHours();
  return (hour >= 5 && hour <= 10) || (hour >= 17 && hour <= 20); // Morning 5-10AM, Evening 5-8PM
};

// Export functions for use in other files
window.STORAGE_KEY = STORAGE_KEY;
window.INITIAL_STATE = INITIAL_STATE;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.calculateMilkAmount = calculateMilkAmount;
window.calculateFarmerBalances = calculateFarmerBalances;
window.getPendingRecordsCount = getPendingRecordsCount;
window.isRushHour = isRushHour;