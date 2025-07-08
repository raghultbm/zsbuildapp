// ZEDSON WATCHCRAFT - Sales Management Module

/**
 * Sales Transaction Management System
 */

// Sales database
let sales = [];
let nextSaleId = 1;

/**
 * Open New Sale Modal
 */
function openNewSaleModal() {
    if (!AuthModule.hasPermission('sales')) {
        Utils.showNotification('You do not have permission to create sales.');
        return;
    }
    
    console.log('Opening New Sale Modal');
    
    // Populate customer dropdown
    CustomerModule.populateCustomerDropdown('saleCustomer');
    
    // Populate watch dropdown
    populateWatchDropdown('saleWatch');
    
    document.getElementById('newSaleModal').style.display = 'block';
}

/**
 * Populate watch dropdown with available watches
 */
function populateWatchDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Watch</option>';
    
    if (window.InventoryModule && InventoryModule.watches) {
        const availableWatches = InventoryModule.getAvailableWatches();
        availableWatches.forEach(watch => {
            select.innerHTML += `<option value="${watch.id}" data-price="${watch.price}">
                ${Utils.sanitizeHtml(watch.code)} - ${Utils.sanitizeHtml(watch.brand)} ${Utils.sanitizeHtml(watch.model)} (₹${watch.price})
            </option>`;
        });
    }
}

/**
 * Update price when watch is selected
 */
function updateSalePrice() {
    const watchSelect = document.getElementById('saleWatch');
    const priceInput = document.getElementById('salePrice');
    
    if (watchSelect && priceInput) {
        const selectedOption = watchSelect.options[watchSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            priceInput.value = selectedOption.dataset.price;
        } else {
            priceInput.value = '';
        }
    }
}

/**
 * Add new sale
 */
function addNewSale(event) {
    event.preventDefault();
    
    if (!AuthModule.hasPermission('sales')) {
        Utils.showNotification('You do not have permission to create sales.');
        return;
    }

    // Get form data
    const customerId = parseInt(document.getElementById('saleCustomer').value);
    const watchId = parseInt(document.getElementById('saleWatch').value);
    const price = parseFloat(document.getElementById('salePrice').value);
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 1;
    
    // Validate input
    if (!customerId || !watchId || !price || !paymentMethod) {
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

    // Get customer and watch details
    const customer = CustomerModule.getCustomerById(customerId);
    const watch = InventoryModule.getWatchById(watchId);
    
    if (!customer) {
        Utils.showNotification('Selected customer not found');
        return;
    }

    if (!watch) {
        Utils.showNotification('Selected watch not found');
        return;
    }

    if (watch.quantity < quantity) {
        Utils.showNotification(`Insufficient stock. Only ${watch.quantity} available.`);
        return;
    }

    // Create sale object with time
    const now = new Date();
    const newSale = {
        id: nextSaleId++,
        date: Utils.formatDate(now),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Utils.getCurrentTimestamp(),
        customerId: customerId,
        customerName: customer.name,
        watchId: watchId,
        watchName: `${watch.brand} ${watch.model}`,
        watchCode: watch.code,
        price: price,
        quantity: quantity,
        totalAmount: price * quantity,
        paymentMethod: paymentMethod,
        status: 'completed',
        createdBy: AuthModule.getCurrentUser().username,
        invoiceGenerated: false,
        notes: []
    };

    // Add to sales array
    sales.push(newSale);
    
    // Update inventory (decrease quantity)
    InventoryModule.decreaseWatchQuantity(watchId, quantity);
    
    // Update customer purchase count
    CustomerModule.incrementCustomerPurchases(customerId);
    
    // Generate Sales Invoice automatically
    if (window.InvoiceModule) {
        const invoice = InvoiceModule.generateSalesInvoice(newSale);
        if (invoice) {
            newSale.invoiceGenerated = true;
            newSale.invoiceId = invoice.id;
        }
    }
    
    // Update displays
    renderSalesTable();
    updateDashboard();
    
    // Close modal and reset form
    closeModal('newSaleModal');
    event.target.reset();
    
    Utils.showNotification(`Sale recorded successfully! Sale ID: ${newSale.id}. Invoice automatically generated.`);
    console.log('Sale added:', newSale);
}

/**
 * Edit sale
 */
function editSale(saleId) {
    if (!AuthModule.hasPermission('sales')) {
        Utils.showNotification('You do not have permission to edit sales.');
        return;
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        Utils.showNotification('Sale not found.');
        return;
    }

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editSaleModal';
    editModal.style.display = 'block';
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeEditSaleModal()">&times;</span>
            <h2>Edit Sale</h2>
            <form onsubmit="SalesModule.updateSale(event, ${saleId})">
                <div class="form-group">
                    <label>Customer:</label>
                    <select id="editSaleCustomer" required>
                        <option value="">Select Customer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Watch:</label>
                    <select id="editSaleWatch" required onchange="updateEditSalePrice()">
                        <option value="">Select Watch</option>
                    </select>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Quantity:</label>
                        <input type="number" id="editSaleQuantity" value="${sale.quantity}" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Price (₹):</label>
                        <input type="number" id="editSalePrice" value="${sale.price}" required min="0" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label>Payment Method:</label>
                    <select id="editSalePaymentMethod" required>
                        <option value="Cash" ${sale.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="Card" ${sale.paymentMethod === 'Card' ? 'selected' : ''}>Card</option>
                        <option value="UPI" ${sale.paymentMethod === 'UPI' ? 'selected' : ''}>UPI</option>
                        <option value="Bank Transfer" ${sale.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                    </select>
                </div>
                <button type="submit" class="btn">Update Sale</button>
                <button type="button" class="btn btn-danger" onclick="closeEditSaleModal()">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Populate dropdowns
    CustomerModule.populateCustomerDropdown('editSaleCustomer');
    populateEditWatchDropdown('editSaleWatch');
    
    // Set current values
    setTimeout(() => {
        document.getElementById('editSaleCustomer').value = sale.customerId;
        document.getElementById('editSaleWatch').value = sale.watchId;
    }, 50);
}

/**
 * Populate watch dropdown for edit modal (includes current watch even if out of stock)
 */
function populateEditWatchDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Watch</option>';
    
    if (window.InventoryModule && InventoryModule.watches) {
        InventoryModule.watches.forEach(watch => {
            select.innerHTML += `<option value="${watch.id}" data-price="${watch.price}">
                ${Utils.sanitizeHtml(watch.code)} - ${Utils.sanitizeHtml(watch.brand)} ${Utils.sanitizeHtml(watch.model)} (₹${watch.price})
            </option>`;
        });
    }
}

/**
 * Close edit sale modal
 */
function closeEditSaleModal() {
    const modal = document.getElementById('editSaleModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Update price in edit modal when watch is selected
 */
function updateEditSalePrice() {
    const watchSelect = document.getElementById('editSaleWatch');
    const priceInput = document.getElementById('editSalePrice');
    
    if (watchSelect && priceInput) {
        const selectedOption = watchSelect.options[watchSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            priceInput.value = selectedOption.dataset.price;
        }
    }
}

/**
 * Update sale
 */
function updateSale(event, saleId) {
    event.preventDefault();
    
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        Utils.showNotification('Sale not found.');
        return;
    }

    const customerId = parseInt(document.getElementById('editSaleCustomer').value);
    const watchId = parseInt(document.getElementById('editSaleWatch').value);
    const price = parseFloat(document.getElementById('editSalePrice').value);
    const quantity = parseInt(document.getElementById('editSaleQuantity').value);
    const paymentMethod = document.getElementById('editSalePaymentMethod').value;

    // Validate input
    if (!customerId || !watchId || !price || !paymentMethod || quantity <= 0) {
        Utils.showNotification('Please fill in all required fields correctly');
        return;
    }

    const customer = CustomerModule.getCustomerById(customerId);
    const watch = InventoryModule.getWatchById(watchId);
    
    if (!customer || !watch) {
        Utils.showNotification('Selected customer or watch not found');
        return;
    }

    // Check stock availability (considering the current sale's quantity)
    const availableStock = watch.quantity + sale.quantity; // Add back the current sale quantity
    if (availableStock < quantity) {
        Utils.showNotification(`Insufficient stock. Only ${availableStock} available.`);
        return;
    }

    // Restore previous inventory and customer counts
    InventoryModule.increaseWatchQuantity(sale.watchId, sale.quantity);
    CustomerModule.decrementCustomerPurchases(sale.customerId);

    // Update sale
    sale.customerId = customerId;
    sale.customerName = customer.name;
    sale.watchId = watchId;
    sale.watchName = `${watch.brand} ${watch.model}`;
    sale.watchCode = watch.code;
    sale.price = price;
    sale.quantity = quantity;
    sale.totalAmount = price * quantity;
    sale.paymentMethod = paymentMethod;

    // Apply new inventory and customer counts
    InventoryModule.decreaseWatchQuantity(watchId, quantity);
    CustomerModule.incrementCustomerPurchases(customerId);

    renderSalesTable();
    updateDashboard();
    closeEditSaleModal();
    Utils.showNotification('Sale updated successfully!');
}

/**
 * Delete sale
 */
function deleteSale(saleId) {
    if (!AuthModule.hasPermission('sales')) {
        Utils.showNotification('You do not have permission to delete sales.');
        return;
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        Utils.showNotification('Sale not found.');
        return;
    }

    if (confirm(`Are you sure you want to delete the sale for ${sale.watchName}?`)) {
        // Restore inventory and customer counts
        InventoryModule.increaseWatchQuantity(sale.watchId, sale.quantity);
        CustomerModule.decrementCustomerPurchases(sale.customerId);
        
        // Remove from sales array
        sales = sales.filter(s => s.id !== saleId);
        
        renderSalesTable();
        updateDashboard();
        Utils.showNotification('Sale deleted successfully!');
    }
}

/**
 * View sale invoice
 */
function viewSaleInvoice(saleId) {
    if (!window.InvoiceModule) {
        Utils.showNotification('Invoice module not available.');
        return;
    }
    
    const invoices = InvoiceModule.getInvoicesForTransaction(saleId, 'sale');
    if (invoices.length > 0) {
        InvoiceModule.viewInvoice(invoices[0].id);
    } else {
        Utils.showNotification('No invoice found for this sale.');
    }
}

/**
 * Get sale by ID
 */
function getSaleById(saleId) {
    return sales.find(s => s.id === saleId);
}

/**
 * Get recent sales
 */
function getRecentSales(limit = 5) {
    return sales
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

/**
 * Get sales by customer
 */
function getSalesByCustomer(customerId) {
    return sales.filter(sale => sale.customerId === customerId);
}

/**
 * Get sales statistics
 */
function getSalesStats() {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = sales.length;
    const averageSaleValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Sales by payment method
    const paymentMethods = {};
    sales.forEach(sale => {
        paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.totalAmount;
    });
    
    // Sales by watch brand
    const brandSales = {};
    sales.forEach(sale => {
        const brand = sale.watchName.split(' ')[0]; // Extract brand from watch name
        brandSales[brand] = (brandSales[brand] || 0) + sale.totalAmount;
    });
    
    // Monthly sales (current year)
    const currentYear = new Date().getFullYear();
    const monthlySales = {};
    sales.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        if (saleDate.getFullYear() === currentYear) {
            const month = saleDate.getMonth();
            monthlySales[month] = (monthlySales[month] || 0) + sale.totalAmount;
        }
    });
    
    return {
        totalSales,
        totalTransactions,
        averageSaleValue,
        paymentMethods,
        brandSales,
        monthlySales
    };
}

/**
 * Filter sales by date range
 */
function filterSalesByDateRange(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= from && saleDate <= to;
    });
}

/**
 * Filter sales by month and year
 */
function filterSalesByMonth(month, year) {
    return sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate.getMonth() === parseInt(month) && saleDate.getFullYear() === parseInt(year);
    });
}

/**
 * Search sales
 */
function searchSales(query) {
    const tbody = document.getElementById('salesTableBody');
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
 * Render sales table
 */
function renderSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort sales by date (newest first)
    const sortedSales = sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedSales.forEach((sale, index) => {
        const row = document.createElement('tr');
        
        // Check if invoice exists for this sale
        const hasInvoice = window.InvoiceModule && 
            InvoiceModule.getInvoicesForTransaction(sale.id, 'sale').length > 0;
        
        row.innerHTML = `
            <td class="serial-number">${index + 1}</td>
            <td>${Utils.sanitizeHtml(sale.date)}</td>
            <td>${Utils.sanitizeHtml(sale.time)}</td>
            <td>${Utils.sanitizeHtml(sale.customerName)}</td>
            <td>
                <strong>${Utils.sanitizeHtml(sale.watchName)}</strong><br>
                <small>Code: ${Utils.sanitizeHtml(sale.watchCode)}</small><br>
                <small>Qty: ${sale.quantity}</small>
            </td>
            <td>${Utils.formatCurrency(sale.totalAmount)}</td>
            <td><span class="status available">${Utils.sanitizeHtml(sale.paymentMethod)}</span></td>
            <td>
                <button class="btn" onclick="editSale(${sale.id})" 
                    ${!AuthModule.hasPermission('sales') ? 'disabled' : ''}>Edit</button>
                <button class="btn btn-danger" onclick="confirmTransaction('Are you sure you want to delete this sale?', () => deleteSale(${sale.id}))" 
                    ${!AuthModule.hasPermission('sales') ? 'disabled' : ''}>Delete</button>
                ${hasInvoice ? 
                    `<button class="btn btn-success" onclick="viewSaleInvoice(${sale.id})" title="View Invoice">Invoice</button>` : 
                    ''
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Export sales data (placeholder)
 */
function exportSales(format = 'csv') {
    Utils.showNotification(`Export to ${format.toUpperCase()} functionality coming soon!`);
    // TODO: Implement export functionality
}

/**
 * Initialize sales module
 */
function initializeSales() {
    renderSalesTable();
    console.log('Sales module initialized');
}

// Load modal template for sales
function loadSalesModal() {
    const modalHtml = `
        <!-- New Sale Modal -->
        <div id="newSaleModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('newSaleModal')">&times;</span>
                <h2>New Sale</h2>
                <form onsubmit="SalesModule.addNewSale(event)">
                    <div class="form-group">
                        <label>Customer:</label>
                        <select id="saleCustomer" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Watch:</label>
                        <select id="saleWatch" required onchange="updateSalePrice()">
                            <option value="">Select Watch</option>
                        </select>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Quantity:</label>
                            <input type="number" id="saleQuantity" value="1" required min="1">
                        </div>
                        <div class="form-group">
                            <label>Price (₹):</label>
                            <input type="number" id="salePrice" required min="0" step="0.01" readonly style="background-color: #f0f0f0;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Payment Method:</label>
                        <select id="salePaymentMethod" required>
                            <option value="">Select Payment Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>
                    <button type="submit" class="btn">Record Sale</button>
                </form>
            </div>
        </div>
    `;
    
    // Add to modals container if it exists
    const modalsContainer = document.getElementById('modals-container');
    if (modalsContainer) {
        modalsContainer.innerHTML += modalHtml;
    }
}

// Auto-load modal when module loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        loadSalesModal();
        if (window.SalesModule) {
            SalesModule.initializeSales();
        }
    }, 100);
});

// Export functions for global use
window.SalesModule = {
    openNewSaleModal,
    populateWatchDropdown,
    updateSalePrice,
    addNewSale,
    editSale,
    updateSale,
    deleteSale,
    viewSaleInvoice,
    getSaleById,
    getRecentSales,
    getSalesByCustomer,
    getSalesStats,
    filterSalesByDateRange,
    filterSalesByMonth,
    searchSales,
    renderSalesTable,
    exportSales,
    initializeSales,
    sales // For access by other modules
};

// Make functions globally available
window.updateSalePrice = function() {
    if (window.SalesModule) {
        SalesModule.updateSalePrice();
    }
};

window.updateEditSalePrice = function() {
    const watchSelect = document.getElementById('editSaleWatch');
    const priceInput = document.getElementById('editSalePrice');
    
    if (watchSelect && priceInput) {
        const selectedOption = watchSelect.options[watchSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            priceInput.value = selectedOption.dataset.price;
        }
    }
};

window.closeEditSaleModal = function() {
    const modal = document.getElementById('editSaleModal');
    if (modal) {
        modal.remove();
    }
};

window.viewSaleInvoice = function(saleId) {
    if (window.SalesModule) {
        SalesModule.viewSaleInvoice(saleId);
    }
};