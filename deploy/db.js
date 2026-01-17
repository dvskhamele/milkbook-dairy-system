// db.js
// IndexedDB implementation for MilkBook

const DB_NAME = 'MilkBookDB';
const DB_VERSION = 1;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Database failed to open:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            window.db = request.result;
            console.log('Database opened successfully');
            resolve(window.db);
        };
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('farmers')) {
                const farmersStore = db.createObjectStore('farmers', { keyPath: 'id' });
                farmersStore.createIndex('mobile', 'mobile', { unique: false });
                farmersStore.createIndex('active', 'active', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('milk_collections')) {
                const collectionsStore = db.createObjectStore('milk_collections', { keyPath: 'id' });
                collectionsStore.createIndex('date', 'date', { unique: false });
                collectionsStore.createIndex('farmer_id', 'farmer_id', { unique: false });
                collectionsStore.createIndex('shift', 'shift', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('ledger_entries')) {
                const ledgerStore = db.createObjectStore('ledger_entries', { keyPath: 'id' });
                ledgerStore.createIndex('farmer_id', 'farmer_id', { unique: false });
                ledgerStore.createIndex('date', 'date', { unique: false });
                ledgerStore.createIndex('type', 'type', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('payments')) {
                const paymentsStore = db.createObjectStore('payments', { keyPath: 'id' });
                paymentsStore.createIndex('farmer_id', 'farmer_id', { unique: false });
                paymentsStore.createIndex('date', 'date', { unique: false });
                paymentsStore.createIndex('type', 'type', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('milk_sales')) {
                const salesStore = db.createObjectStore('milk_sales', { keyPath: 'id' });
                salesStore.createIndex('date', 'date', { unique: false });
                salesStore.createIndex('customer_type', 'customer_type', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('inventory')) {
                const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
                inventoryStore.createIndex('item_type', 'item_type', { unique: false });
                inventoryStore.createIndex('date', 'date', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
            }
        };
    });
}

// Add data to IndexedDB
function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get data from IndexedDB
function getData(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get all data from a store
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Query data with index
function queryData(storeName, indexName, keyRange) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(keyRange);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Update data in IndexedDB
function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Delete data from IndexedDB
function deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Initialize database when page loads
document.addEventListener('DOMContentLoaded', () => {
    initDB().catch(err => {
        console.error('Failed to initialize database:', err);
    });
});