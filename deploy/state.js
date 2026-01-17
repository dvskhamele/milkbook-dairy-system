// state.js
// State management for MilkBook application

// Initialize application state
async function initState() {
    // Initialize database
    await initDB();

    // Load initial state from localStorage with multi-dairy support
    const currentDairyId = getCurrentDairyId();
    const dairyData = getCurrentDairyData();

    const state = {
        auth: {
            isAuthenticated: false,
            user: null,
            role: 'labour' // 'labour' or 'owner'
        },
        dairyInfo: dairyData ? dairyData.dairyInfo : {
            name: 'Gopal Dairy Shop',
            owner: 'Ramesh Kumar',
            mobile: '9876543210',
            address: '',
            rateType: 'Fat_SNF',
            language: 'EN'
        },
        currentScreen: 'dashboard',
        settings: dairyData ? dairyData.settings : {
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

    // Add data arrays to state
    state.farmers = dairyData ? dairyData.farmers : [];
    state.milkEntries = dairyData ? dairyData.milkEntries : [];
    state.payments = dairyData ? dairyData.payments : [];
    state.sales = dairyData ? dairyData.sales : [];
    state.inventory = dairyData ? dairyData.inventory : [];
    state.evidenceRecords = dairyData ? dairyData.evidenceRecords : [];

    return state;
}

// Save state to dairy-specific storage
function saveStateToStorage(state) {
    const currentDairyId = getCurrentDairyId();
    const key = `dairy_data_${currentDairyId}`;

    const dairyData = {
        dairyInfo: state.dairyInfo,
        settings: state.settings,
        farmers: state.farmers,
        milkEntries: state.milkEntries,
        payments: state.payments,
        sales: state.sales,
        inventory: state.inventory,
        evidenceRecords: state.evidenceRecords
    };

    localStorage.setItem(key, JSON.stringify(dairyData));
}

// Get current dairy ID
function getCurrentDairyId() {
    return localStorage.getItem('current_dairy_id') || 'default_dairy';
}

// Set current dairy ID
function setCurrentDairyId(dairyId) {
    localStorage.setItem('current_dairy_id', dairyId);
    // Initialize data bucket for this dairy if needed
    initializeDairyDataBucket(dairyId);
}

// Get all dairy configurations
function getAllDairies() {
    const configsStr = localStorage.getItem('dairy_configs');
    return configsStr ? JSON.parse(configsStr) : {};
}

// Get current dairy configuration
function getCurrentDairyConfig() {
    const allDairies = getAllDairies();
    const currentDairyId = getCurrentDairyId();
    return allDairies[currentDairyId] || null;
}

// Initialize data bucket for a dairy
function initializeDairyDataBucket(dairyId) {
    const key = `dairy_data_${dairyId}`;
    if (!localStorage.getItem(key)) {
        const initialData = {
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
            payments: [],
            sales: [],
            inventory: [],
            evidenceRecords: [],
            settings: {
                backupEnabled: true,
                lastBackup: null,
                printerName: 'Default',
                syncState: 'QUARANTINED',
                lastServerSync: null,
                pendingRecords: 0,
                lastSyncTime: null,
                localRecordsToday: 0
            }
        };
        localStorage.setItem(key, JSON.stringify(initialData));
    }
}

// Get data for current dairy
function getCurrentDairyData() {
    const currentDairyId = getCurrentDairyId();
    const key = `dairy_data_${currentDairyId}`;
    const dataStr = localStorage.getItem(key);
    return dataStr ? JSON.parse(dataStr) : null;
}

// Set data for current dairy
function setCurrentDairyData(data) {
    const currentDairyId = getCurrentDairyId();
    const key = `dairy_data_${currentDairyId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Switch to a different dairy
function switchToDairy(dairyId) {
    const allDairies = getAllDairies();
    if (allDairies[dairyId]) {
        // Update previous dairy's active status
        const prevDairyId = getCurrentDairyId();
        if (prevDairyId && allDairies[prevDairyId]) {
            allDairies[prevDairyId].isActive = false;
        }

        // Update new dairy's active status
        allDairies[dairyId].isActive = true;
        localStorage.setItem('dairy_configs', JSON.stringify(allDairies));

        // Switch to the new dairy
        setCurrentDairyId(dairyId);

        return true;
    }
    return false;
}

// Initialize dairy management system
function initDairyManager() {
    // Create dairy data structure if it doesn't exist
    if (!localStorage.getItem('dairy_configs')) {
        const defaultDairy = {
            id: 'default_dairy',
            name: 'Gopal Dairy Shop',
            owner: 'Ramesh Kumar',
            mobile: '9876543210',
            address: '',
            rateType: 'Fat_SNF',
            language: 'EN',
            isActive: true
        };

        const dairyConfigs = {
            [defaultDairy.id]: defaultDairy
        };

        localStorage.setItem('dairy_configs', JSON.stringify(dairyConfigs));
        localStorage.setItem('current_dairy_id', defaultDairy.id);
    }

    // Initialize data bucket for the default dairy if not present
    const currentDairyId = getCurrentDairyId();
    initializeDairyDataBucket(currentDairyId);
}

// Initialize dairy manager when the script loads
initDairyManager();

// Get all farmers
async function getAllFarmers() {
    try {
        return await getAllData('farmers');
    } catch (error) {
        console.error('Error getting farmers:', error);
        return [];
    }
}

// Add farmer
async function addFarmer(farmerData) {
    try {
        const id = Date.now().toString();

        // Generate a unique token for the farmer (3-4 digit number)
        const token = generateUniqueFarmerToken();

        const newFarmer = {
            ...farmerData,
            id,
            token, // Add unique token for quick selection
            active: true,
            createdAt: new Date().toISOString(),
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };

        await addData('farmers', newFarmer);

        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;

        return newFarmer;
    } catch (error) {
        console.error('Error adding farmer:', error);
        throw error;
    }
}

// Generate unique farmer token
function generateUniqueFarmerToken() {
    // Generate a random 3-4 digit number
    let token;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 100) {  // Prevent infinite loop
        token = Math.floor(Math.random() * 9000) + 1000; // 4-digit number between 1000-9999
        isUnique = !state.farmers.some(farmer => farmer.token === token);
        attempts++;
    }

    // If we couldn't find a unique token after 100 attempts, use timestamp-based
    if (!isUnique) {
        token = Date.now() % 10000; // Last 4 digits of timestamp
    }

    return token;
}

// Get farmer by token
function getFarmerByToken(token) {
    return state.farmers.find(farmer => farmer.token === parseInt(token));
}

// Get all milk collections
async function getAllMilkCollections() {
    try {
        return await getAllData('milk_collections');
    } catch (error) {
        console.error('Error getting milk collections:', error);
        return [];
    }
}

// Add milk collection
async function addMilkCollection(collectionData) {
    try {
        const id = Date.now().toString();
        const newCollection = {
            ...collectionData,
            id,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };
        
        await addData('milk_collections', newCollection);
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        
        return newCollection;
    } catch (error) {
        console.error('Error adding milk collection:', error);
        throw error;
    }
}

// Get all ledger entries
async function getAllLedgerEntries() {
    try {
        return await getAllData('ledger_entries');
    } catch (error) {
        console.error('Error getting ledger entries:', error);
        return [];
    }
}

// Add ledger entry
async function addLedgerEntry(entryData) {
    try {
        const id = Date.now().toString();
        const newEntry = {
            ...entryData,
            id,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };
        
        await addData('ledger_entries', newEntry);
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        
        return newEntry;
    } catch (error) {
        console.error('Error adding ledger entry:', error);
        throw error;
    }
}

// Get all payments
async function getAllPayments() {
    try {
        return await getAllData('payments');
    } catch (error) {
        console.error('Error getting payments:', error);
        return [];
    }
}

// Add payment
async function addPayment(paymentData) {
    try {
        const id = Date.now().toString();
        const newPayment = {
            ...paymentData,
            id,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };
        
        await addData('payments', newPayment);
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        
        return newPayment;
    } catch (error) {
        console.error('Error adding payment:', error);
        throw error;
    }
}

// Get all milk sales
async function getAllMilkSales() {
    try {
        return await getAllData('milk_sales');
    } catch (error) {
        console.error('Error getting milk sales:', error);
        return [];
    }
}

// Add milk sale
async function addMilkSale(saleData) {
    try {
        const id = Date.now().toString();
        const newSale = {
            ...saleData,
            id,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };
        
        await addData('milk_sales', newSale);
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        
        return newSale;
    } catch (error) {
        console.error('Error adding milk sale:', error);
        throw error;
    }
}

// Get all inventory items
async function getAllInventory() {
    try {
        return await getAllData('inventory');
    } catch (error) {
        console.error('Error getting inventory:', error);
        return [];
    }
}

// Add inventory item
async function addInventoryItem(itemData) {
    try {
        const id = Date.now().toString();
        const newItem = {
            ...itemData,
            id,
            syncState: 'QUARANTINED', // Mark as quarantined until synced to server
            createdAtLocal: new Date().toISOString(),
            syncedAtServer: null,
            isManual: true,
            inputSource: 'keyboard',
            deviceId: navigator.userAgent,
            operatorId: state.auth?.user?.id || 'current_user'
        };
        
        await addData('inventory', newItem);
        
        // Update pending records count
        state.settings.pendingRecords = (state.settings.pendingRecords || 0) + 1;
        
        return newItem;
    } catch (error) {
        console.error('Error adding inventory item:', error);
        throw error;
    }
}

// Update settings
async function updateSettings(settingsData) {
    try {
        const id = 'app_settings';
        const settings = {
            ...settingsData,
            id,
            updatedAt: new Date().toISOString()
        };
        
        await updateData('settings', settings);
        return settings;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}

// Get settings
async function getSettings() {
    try {
        const settings = await getData('settings', 'app_settings');
        return settings || {};
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}