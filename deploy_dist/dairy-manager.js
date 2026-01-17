// dairy-manager.js
// Multi-dairy support for MilkBook app

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
            isActive: true,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
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

// Add a new dairy
function addNewDairy(dairyConfig) {
    const allDairies = getAllDairies();
    const newDairyId = 'dairy_' + Date.now().toString();
    
    const newDairy = {
        ...dairyConfig,
        id: newDairyId,
        isActive: false,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
    };
    
    allDairies[newDairyId] = newDairy;
    localStorage.setItem('dairy_configs', JSON.stringify(allDairies));
    
    // Initialize data bucket for the new dairy
    initializeDairyDataBucket(newDairyId);
    
    return newDairyId;
}

// Switch to a different dairy
function switchToDairy(dairyId) {
    const allDairies = getAllDairies();
    if (allDairies[dairyId]) {
        // Update previous dairy's last used timestamp
        const prevDairyId = getCurrentDairyId();
        if (prevDairyId && allDairies[prevDairyId]) {
            allDairies[prevDairyId].lastUsed = new Date().toISOString();
        }
        
        // Update new dairy's last used timestamp and activate it
        allDairies[dairyId].lastUsed = new Date().toISOString();
        allDairies[dairyId].isActive = true;
        
        // Deactivate other dairies
        Object.keys(allDairies).forEach(id => {
            if (id !== dairyId) {
                allDairies[id].isActive = false;
            }
        });
        
        localStorage.setItem('dairy_configs', JSON.stringify(allDairies));
        
        // Switch to the new dairy
        setCurrentDairyId(dairyId);
        
        // Update the UI to reflect the change
        updateDairyUI(dairyId, allDairies[dairyId]);
        
        return true;
    }
    return false;
}

// Update UI with dairy information
function updateDairyUI(dairyId, dairyConfig) {
    // Update header dairy name
    const dairyNameElement = document.getElementById('dairyName') || document.getElementById('dairyNameHeader');
    if (dairyNameElement && dairyConfig) {
        dairyNameElement.textContent = dairyConfig.name || 'Dairy Shop';
    }
    
    // Update any other dairy-specific UI elements
    const dairySelectorBtn = document.querySelector('.dairy-selector-btn');
    if (dairySelectorBtn && dairyConfig) {
        dairySelectorBtn.innerHTML = `
            <span class="material-symbols-outlined text-primary" style="width: 20px; height: 20px;">store</span>
            <span class="text-sm font-bold text-text-main dark:text-white">${dairyConfig.name || 'Dairy'}</span>
        `;
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

// Get all data for a specific dairy
function getDairyData(dairyId) {
    const key = `dairy_data_${dairyId}`;
    const dataStr = localStorage.getItem(key);
    return dataStr ? JSON.parse(dataStr) : null;
}

// Set all data for a specific dairy
function setDairyData(dairyId, data) {
    const key = `dairy_data_${dairyId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Merge data from another dairy (for data transfer)
function mergeDairyData(sourceDairyId, targetDairyId) {
    const sourceData = getDairyData(sourceDairyId);
    const targetData = getDairyData(targetDairyId);
    
    if (sourceData && targetData) {
        // Merge farmers (avoid duplicates)
        const mergedFarmers = [...targetData.farmers];
        sourceData.farmers.forEach(sourceFarmer => {
            const exists = mergedFarmers.some(f => f.mobile === sourceFarmer.mobile);
            if (!exists) {
                mergedFarmers.push({...sourceFarmer, id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)});
            }
        });
        
        // Merge other data as needed
        const mergedData = {
            ...targetData,
            farmers: mergedFarmers,
            // Note: We don't merge entries to avoid duplicate transactions
        };
        
        setDairyData(targetDairyId, mergedData);
        return true;
    }
    return false;
}

// Export dairy data
function exportDairyData(dairyId) {
    const dairyData = getDairyData(dairyId);
    const dairyConfig = getAllDairies()[dairyId];
    
    if (dairyData && dairyConfig) {
        const exportData = {
            config: dairyConfig,
            data: dairyData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        // Create download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `${dairyConfig.name}_data_export.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Import dairy data
function importDairyData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.version && importedData.config && importedData.data) {
                    // Create new dairy from imported config
                    const newDairyId = addNewDairy(importedData.config);
                    
                    // Set the data for the new dairy
                    setDairyData(newDairyId, importedData.data);
                    
                    resolve(newDairyId);
                } else {
                    reject(new Error('Invalid import file format'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsText(file);
    });
}

// Initialize dairy manager when the script loads
document.addEventListener('DOMContentLoaded', initDairyManager);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDairyManager,
        getCurrentDairyId,
        setCurrentDairyId,
        getAllDairies,
        getCurrentDairyConfig,
        addNewDairy,
        switchToDairy,
        updateDairyUI,
        getCurrentDairyData,
        setCurrentDairyData,
        getDairyData,
        setDairyData,
        mergeDairyData,
        exportDairyData,
        importDairyData
    };
}