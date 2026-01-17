// backup.js
// Workflow implementation for backup page

// Initialize page
function initBackupPage() {
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
    
    // Update last backup time display
    if (state.settings.lastBackup) {
        document.getElementById('lastBackupTime').textContent = new Date(state.settings.lastBackup).toLocaleString('en-IN');
    }
}

// Backup data function
function backupData() {
    try {
        // Create backup of all data
        const backupData = {
            ...state,
            backupTimestamp: new Date().toISOString(),
            backupVersion: 'v1.0'
        };
        
        localStorage.setItem('milkbook_backup_v1', JSON.stringify(backupData));
        state.settings.lastBackup = new Date().toISOString();
        localStorage.setItem('milkbook_data', JSON.stringify(state));
        
        alert('Backup Secured Locally');
    } catch (error) {
        console.error('Backup failed:', error);
        alert('Backup failed. Check console for details.');
    }
}

// Restore data function
function restoreData() {
    const backupData = localStorage.getItem('milkbook_backup_v1');
    if (backupData) {
        if (confirm('Wipe current data and restore from backup? This will permanently replace all current data.')) {
            try {
                const parsedData = JSON.parse(backupData);
                localStorage.setItem('milkbook_data', JSON.stringify(parsedData));
                window.location.reload();
            } catch (error) {
                console.error('Restore failed:', error);
                alert('Restore failed. Invalid backup data.');
            }
        }
    } else {
        alert('No backup found');
    }
}

// Export data function
function exportData() {
    try {
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `milkbook_data_export_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        alert('Data exported successfully');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Check console for details.');
    }
}

// Factory reset function
function factoryReset() {
    if (confirm('ABSOLUTE WIPE? This will permanently erase ALL data including farmers, collections, payments, and settings.')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initBackupPage);