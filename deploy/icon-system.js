// icon-system.js
// Standardized visual icon system for MilkBook

// Define the ActionIcon class for consistent icon usage
class ActionIcon {
    constructor(type, size = 'md', color = 'primary') {
        this.type = type;
        this.size = size;
        this.color = color;
    }
    
    // Get icon HTML based on type
    getIconHTML() {
        const sizeClasses = this.getSizeClass();
        const colorClasses = this.getColorClass();
        
        switch(this.type) {
            case 'milk-entry':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">water_drop</span>`;
            case 'ledger':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">receipt_long</span>`;
            case 'payment':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">payments</span>`;
            case 'passbook':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">book_2</span>`;
            case 'inventory':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">inventory_2</span>`;
            case 'report':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">bar_chart</span>`;
            case 'backup':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">cloud_upload</span>`;
            case 'settings':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">settings</span>`;
            case 'farmer':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">person</span>`;
            case 'sales':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">shopping_bag</span>`;
            case 'whatsapp':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">chat</span>`;
            case 'print':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">print</span>`;
            case 'save':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">save</span>`;
            case 'edit':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">edit</span>`;
            case 'delete':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">delete</span>`;
            case 'correction':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">edit_square</span>`;
            case 'dashboard':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">dashboard</span>`;
            case 'logout':
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">logout</span>`;
            default:
                return `<span class="material-symbols-outlined ${sizeClasses} ${colorClasses}">help</span>`;
        }
    }
    
    // Get size class based on size parameter
    getSizeClass() {
        switch(this.size) {
            case 'sm':
                return 'text-2xl';
            case 'md':
                return 'text-4xl';
            case 'lg':
                return 'text-6xl';
            case 'xl':
                return 'text-8xl';
            default:
                return 'text-4xl';
        }
    }
    
    // Get color class based on color parameter
    getColorClass() {
        switch(this.color) {
            case 'primary':
                return 'text-primary';
            case 'success':
                return 'text-success-green';
            case 'danger':
                return 'text-danger-red';
            case 'warning':
                return 'text-warning-amber';
            case 'secondary':
                return 'text-text-secondary';
            default:
                return 'text-primary';
        }
    }
    
    // Render icon as HTML string
    render() {
        return this.getIconHTML();
    }
}

// Function to create an icon element
function createIcon(type, size = 'md', color = 'primary') {
    const icon = new ActionIcon(type, size, color);
    return icon.render();
}

// Function to update all icons on the page based on data attributes
function updatePageIcons() {
    // Find all elements with data-icon attribute
    const iconElements = document.querySelectorAll('[data-icon]');
    
    iconElements.forEach(element => {
        const iconType = element.getAttribute('data-icon');
        const iconSize = element.getAttribute('data-icon-size') || 'md';
        const iconColor = element.getAttribute('data-icon-color') || 'primary';
        
        // Clear existing content and add new icon
        element.innerHTML = createIcon(iconType, iconSize, iconColor);
    });
}

// Function to initialize the icon system
function initIconSystem() {
    // Update all icons on the page when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updatePageIcons);
    } else {
        updatePageIcons();
    }
    
    // Also update icons when new content is added to the page
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node has icon attributes
                        if (node.hasAttribute && node.hasAttribute('data-icon')) {
                            updatePageIcons();
                        }
                        
                        // Check child nodes for icon attributes
                        const childIcons = node.querySelectorAll && node.querySelectorAll('[data-icon]');
                        if (childIcons && childIcons.length > 0) {
                            updatePageIcons();
                        }
                    }
                });
            }
        });
    });
    
    // Observe changes to the DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize the icon system when the script loads
document.addEventListener('DOMContentLoaded', initIconSystem);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ActionIcon,
        createIcon,
        updatePageIcons,
        initIconSystem
    };
}