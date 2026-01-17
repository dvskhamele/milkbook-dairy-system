// assets/db.js
// IndexedDB wrapper for offline-first storage

// Database configuration
const DB_NAME = 'milkbook_db';
const DB_VERSION = 1;
const STORES = ['milkEntries', 'farmers', 'payments', 'sales', 'inventory'];

let db = null;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('IndexedDB not supported in this browser');
      reject(new Error('IndexedDB not supported'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('Database opened successfully');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Create object stores if they don't exist
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('farmerId', 'farmerId', { unique: false });
          store.createIndex('syncState', 'syncState', { unique: false });
          store.createIndex('createdAtLocal', 'createdAtLocal', { unique: false });
        }
      });
      
      // Create a sync metadata store
      if (!db.objectStoreNames.contains('syncMeta')) {
        const syncStore = db.createObjectStore('syncMeta', { keyPath: 'key' });
      }
    };
  });
}

// Add record to store
function addRecord(storeName, record) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Add metadata to record
    const newRecord = {
      ...record,
      id: record.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAtLocal: new Date().toISOString(),
      syncState: 'QUARANTINED', // Mark as quarantined until synced to server
      syncedAtServer: null,
      isManual: true, // Flag for manual entry
      inputSource: 'keyboard' // 'scale' or 'keyboard'
    };
    
    const request = store.add(newRecord);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get all records from store
function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get records by sync state
function getRecordsBySyncState(storeName, syncState) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('syncState');
    const request = index.getAll(syncState);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get records by date range
function getRecordsByDate(storeName, startDate, endDate) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('date');
    
    // Create range for date filtering
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.getAll(range);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Update record sync status
function updateSyncStatus(storeName, id, serverTimestamp) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.syncState = 'SYNCED';
        record.syncedAtServer = serverTimestamp;
        
        const updateRequest = store.put(record);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        reject(new Error('Record not found'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Get pending records count
function getPendingRecordsCount() {
  return new Promise(async (resolve) => {
    try {
      const counts = {};
      for (const storeName of STORES) {
        const pendingRecords = await getRecordsBySyncState(storeName, 'QUARANTINED');
        counts[storeName] = pendingRecords.length;
      }
      counts.total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      resolve(counts);
    } catch (error) {
      console.error('Error getting pending records count:', error);
      resolve({ total: 0 });
    }
  });
}

// Update sync metadata
function updateSyncMeta(meta) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction(['syncMeta'], 'readwrite');
    const store = transaction.objectStore('syncMeta');
    
    const request = store.put(meta);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get sync metadata
function getSyncMeta(key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction(['syncMeta'], 'readonly');
    const store = transaction.objectStore('syncMeta');
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initialize database when script loads
initDB().catch(console.error);

// Export functions for use in other files
window.initDB = initDB;
window.addRecord = addRecord;
window.getAllRecords = getAllRecords;
window.getRecordsBySyncState = getRecordsBySyncState;
window.getRecordsByDate = getRecordsByDate;
window.updateSyncStatus = updateSyncStatus;
window.getPendingRecordsCount = getPendingRecordsCount;
window.updateSyncMeta = updateSyncMeta;
window.getSyncMeta = getSyncMeta;