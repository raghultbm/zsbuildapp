// ZEDSON WATCHCRAFT - Inventory Management Module

/**
 * Inventory and Watch Management System
 */

// Watch inventory data - Updated with CODE field
let watches = [
    { 
        id: 1, 
        code: "ROL001", 
        brand: "Rolex", 
        model: "Submariner", 
        price: 850000, 
        quantity: 2, 
        description: "Luxury diving watch", 
        status: "available" 
    },
    { 
        id: 2, 
        code: "OMG001", 
        brand: "Omega", 
        model: "Speedmaster", 
        price: 450000, 
        quantity: 1, 
        description: "Professional chronograph", 
        status: "available" 
    },
    { 
        id: 3, 
        code: "CAS001", 
        brand: "Casio", 
        model: "G-Shock", 
        price: 15000, 
        quantity: 5, 
        description: "Sports watch", 
        status: "available" 
    }
];

let nextWatchId = 4;

/**
 * Generate watch code automatically
 */
function generateWatchCode(brand) {
    const brandPrefix = brand.substring(0, 3).toUpperCase();
    const existingCodes = watches
        .filter(w => w.code.startsWith(brandPrefix))
        .map(w => parseInt(w.code.substring(3)))
        .filter(num => !isNaN(num));
    
    const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return `${brandPrefix}${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Open Add Watch Modal
 */
function openAddWatchModal() {
    if (!AuthModule.hasPermission('inventory')) {
        Utils.showNotification('You do not have permission to add watches.');
        return;
    }
    console.log('Opening Add Watch Modal');
    document.getElementById('addWatchModal').style.display = 'block';
}

/**
 * Auto-generate code when brand changes
 */
function updateWatchCode() {
    const brandInput = document.getElementById('watchBrand');
    const codeInput = document.getElementById('watchCode');
    
    if (brandInput && codeInput && brandInput.value.trim()) {
        const suggestedCode = generateWatchCode(brandInput.value.trim());
        codeInput.value = suggestedCode;
    }
}

/**
 * Add new watch to inventory
 */
function addNewWatch(event) {
    event.preventDefault();
    
    if (!AuthModule.hasPermission('inventory')) {
        Utils.showNotification('You do not have permission to add watches.');
        return;
    }

    // Get form data
    const code = document.getElementById('watchCode').value.trim();
    const brand = document.getElementById('watchBrand').value.trim();
    const model = document.getElementById('watchModel').value.trim();
    const price = parseFloat(document.getElementById('watchPrice').value);
    const quantity = parseInt(document.getElementById('watchQuantity').value);
    const description = document.getElementById('watchDescription').value.trim();
    
    // Validate input
    if (!code || !brand || !model || !price || !quantity) {
        Utils.showNotification('Please fill in all required fields');
        return;
    }

    if (price <= 0) {
        Utils.showNotification('Price must be greater than zero');
        return;
    }

    if (quantity <= 0) {
        Utils.showNotification('Quantity must be greater than zero');
        return;
    }

    // Check if code already exists
    if (watches.find(w => w.code === code)) {
        Utils.showNotification('Watch code already exists. Please use a different code.');
        return;
    }

    // Create new watch object
    const newWatch = {
        id: nextWatchId++,
        code: code,
        brand: brand,
        model: model,
        price: price,
        quantity: quantity,
        description: description,
        status: 'available',
        addedDate: Utils.getCurrentTimestamp(),
        addedBy: AuthModule.getCurrentUser().username
    };

    // Add to watches array
    watches.push(newWatch);
    
    // Update display
    renderWatchTable();
    updateDashboard();
    
    // Close modal and reset form
    closeModal('addWatchModal');
    event.target.reset();
    
    Utils.showNotification('Watch added successfully!');
    console.log('Watch added:', newWatch);
}

/**
 * Delete watch from inventory
 */
function deleteWatch(watchId) {
    if (!AuthModule.hasPermission('inventory')) {
        Utils.showNotification('You do not have permission to delete watches.');
        return;
    }

    const watch = watches.find(w => w.id === watchId);
    if (!watch) {
        Utils.showNotification('Watch not found.');
        return;
    }

    if (confirm(`Are you sure you want to delete "${watch.brand} ${watch.model}"?`)) {
        watches = watches.filter(w => w.id !== watchId);
        renderWatchTable();
        updateDashboard();
        Utils.showNotification('Watch deleted successfully!');
    }
}

/**
 * Update watch status
 */
function updateWatchStatus(watchId, newStatus) {
    const watch = watches.find(w => w.id === watchId);
    if (watch) {
        watch.status = newStatus;
        renderWatchTable();
        updateDashboard();
    }
}

/**
 * Decrease watch quantity (used when selling)
 */
function decreaseWatchQuantity(watchId, amount = 1) {
    const watch = watches.find(w => w.id === watchId);
    if (watch) {
        watch.quantity = Math.max(0, watch.quantity - amount);
        if (watch.quantity === 0) {
            watch.status = 'sold';
        }
        renderWatchTable();
        updateDashboard();
    }
}

/**
 * Increase watch quantity (used when returning or restocking)
 */
function increaseWatchQuantity(watchId, amount = 1) {
    const watch = watches.find(w => w.id === watchId);
    if (watch) {
        watch.quantity += amount;
        if (watch.quantity > 0 && watch.status === 'sold') {
            watch.status = 'available';
        }
        renderWatchTable();
        updateDashboard();
    }
}

/**
 * Get available watches for sale
 */
function getAvailableWatches() {
    return watches.filter(w => w.quantity > 0 && w.status === 'available');
}

/**
 * Get watch by ID
 */
function getWatchById(watchId) {
    return watches.find(w => w.id === watchId);
}

/**
 * Search watches by code, brand, or model
 */
function searchWatches(query) {
    const tbody = document.getElementById('watchTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Render watch table with S.No column
 */
function renderWatchTable() {
    const tbody = document.getElementById('watchTableBody');
    if (!tbody) {
        console.error('Watch table body not found');
        return;
    }
    
    console.log('Rendering watch table with', watches.length, 'watches');
    tbody.innerHTML = '';
    
    watches.forEach((watch, index) => {
        const row = document.createElement('tr');
        // Creating 8 columns to match the header: S.No, Code, Brand, Model, Price, Quantity, Status, Actions
        row.innerHTML = `
            <td class="serial-number">${index + 1}</td>
            <td><strong>${Utils.sanitizeHtml(watch.code)}</strong></td>
            <td>${Utils.sanitizeHtml(watch.brand)}</td>
            <td>${Utils.sanitizeHtml(watch.model)}</td>
            <td>${Utils.formatCurrency(watch.price)}</td>
            <td>${watch.quantity}</td>
            <td><span class="status ${watch.status}">${watch.status}</span></td>
            <td>
                <button class="btn" onclick="editWatch(${watch.id})" 
                    ${!AuthModule.hasPermission('inventory') ? 'disabled' : ''}>
                    Edit
                </button>
                <button class="btn btn-danger" onclick="deleteWatch(${watch.id})" 
                    ${!AuthModule.hasPermission('inventory') ? 'disabled' : ''}>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Watch table rendered successfully with S.No column');
}

/**
 * Get low stock alerts
 */

/**
 * Get inventory statistics
 */
function getInventoryStats() {
    const totalWatches = watches.length;
    const availableWatches = watches.filter(w => w.status === 'available').length;
    const soldWatches = watches.filter(w => w.status === 'sold').length;
    const totalValue = watches.reduce((sum, w) => sum + (w.price * w.quantity), 0);
    const lowStockWatches = watches.filter(w => w.quantity <= 2 && w.quantity > 0).length;
    
    return {
        totalWatches,
        availableWatches,
        soldWatches,
        totalValue,
        lowStockWatches
    };
}

/**
 * Edit watch
 */
function editWatch(watchId) {
    if (!AuthModule.hasPermission('inventory')) {
        Utils.showNotification('You do not have permission to edit watches.');
        return;
    }

    const watch = watches.find(w => w.id === watchId);
    if (!watch) {
        Utils.showNotification('Watch not found.');
        return;
    }

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editWatchModal';
    editModal.style.display = 'block';
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('editWatchModal')">&times;</span>
            <h2>Edit Watch</h2>
            <form onsubmit="InventoryModule.updateWatch(event, ${watchId})">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Brand:</label>
                        <input type="text" id="editWatchBrand" value="${watch.brand}" required>
                    </div>
                    <div class="form-group">
                        <label>Code:</label>
                        <input type="text" id="editWatchCode" value="${watch.code}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Model:</label>
                    <input type="text" id="editWatchModel" value="${watch.model}" required>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Price (₹):</label>
                        <input type="number" id="editWatchPrice" value="${watch.price}" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Quantity:</label>
                        <input type="number" id="editWatchQuantity" value="${watch.quantity}" required min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea id="editWatchDescription" rows="3">${watch.description || ''}</textarea>
                </div>
                <button type="submit" class="btn">Update Watch</button>
                <button type="button" class="btn btn-danger" onclick="closeModal('editWatchModal')">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
}

/**
 * Update watch
 */
function updateWatch(event, watchId) {
    event.preventDefault();
    
    const watch = watches.find(w => w.id === watchId);
    if (!watch) {
        Utils.showNotification('Watch not found.');
        return;
    }

    const code = document.getElementById('editWatchCode').value.trim();
    const brand = document.getElementById('editWatchBrand').value.trim();
    const model = document.getElementById('editWatchModel').value.trim();
    const price = parseFloat(document.getElementById('editWatchPrice').value);
    const quantity = parseInt(document.getElementById('editWatchQuantity').value);
    const description = document.getElementById('editWatchDescription').value.trim();

    // Validate input
    if (!code || !brand || !model || !price || quantity < 0) {
        Utils.showNotification('Please fill in all required fields');
        return;
    }

    // Check if code already exists (excluding current watch)
    if (watches.find(w => w.code === code && w.id !== watchId)) {
        Utils.showNotification('Watch code already exists. Please use a different code.');
        return;
    }

    // Update watch
    watch.code = code;
    watch.brand = brand;
    watch.model = model;
    watch.price = price;
    watch.quantity = quantity;
    watch.description = description;
    watch.status = quantity > 0 ? 'available' : 'sold';

    renderWatchTable();
    updateDashboard();
    closeModal('editWatchModal');
    document.getElementById('editWatchModal').remove();
    Utils.showNotification('Watch updated successfully!');
}
function getLowStockAlerts() {
    return watches.filter(w => w.quantity <= 2 && w.quantity > 0);
}

/**
 * Initialize inventory module
 */
function initializeInventory() {
    renderWatchTable();
    console.log('Inventory module initialized');
}

// Export functions for global use
window.InventoryModule = {
    openAddWatchModal,
    addNewWatch,
    editWatch,
    updateWatch,
    deleteWatch,
    updateWatchStatus,
    decreaseWatchQuantity,
    increaseWatchQuantity,
    getAvailableWatches,
    getWatchById,
    searchWatches,
    renderWatchTable,
    getInventoryStats,
    getLowStockAlerts,
    initializeInventory,
    updateWatchCode,
    watches // For access by other modules
};