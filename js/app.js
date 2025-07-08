// ZEDSON WATCHCRAFT - Main Application

/**
 * Main Application Controller
 * Initializes all modules and handles core functionality
 */

/**
 * Navigation function
 */
function showSection(sectionId, button) {
    // Check permissions
    if (!AuthModule.hasPermission(sectionId)) {
        Utils.showNotification('You do not have permission to access this section.');
        return;
    }

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Mark clicked button as active
    if (button) {
        button.classList.add('active');
    }

    // Update section-specific data
    updateSectionData(sectionId);
}

/**
 * Update data when switching sections
 */
function updateSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'inventory':
            if (window.InventoryModule) {
                InventoryModule.renderWatchTable();
            }
            break;
        case 'customers':
            if (window.CustomerModule) {
                CustomerModule.renderCustomerTable();
            }
            break;
        case 'users':
            if (AuthModule.getCurrentUser()?.role === 'admin') {
                AuthModule.updateUserTable();
            }
            break;
        case 'sales':
            if (window.SalesModule) {
                SalesModule.renderSalesTable();
            }
            break;
        case 'service':
            if (window.ServiceModule) {
                ServiceModule.renderServiceTable();
            }
            break;
        case 'invoices':
            if (window.InvoiceModule) {
                InvoiceModule.renderInvoiceTable();
            }
            break;
    }
}

/**
 * Update dashboard statistics
 */
function updateDashboard() {
    // Update statistics cards with safe checks
    if (window.InventoryModule) {
        const inventoryStats = InventoryModule.getInventoryStats();
        document.getElementById('totalWatches').textContent = inventoryStats.totalWatches;
    }
    
    if (window.CustomerModule) {
        const customerStats = CustomerModule.getCustomerStats();
        document.getElementById('totalCustomers').textContent = customerStats.totalCustomers;
    }
    
    // Update sales and services if modules are available
    if (window.SalesModule) {
        const salesStats = SalesModule.getSalesStats();
        document.getElementById('totalSales').textContent = Utils.formatCurrency(salesStats.totalSales);
    }
    
    if (window.ServiceModule) {
        const serviceStats = ServiceModule.getServiceStats();
        document.getElementById('totalServices').textContent = Utils.formatCurrency(serviceStats.totalRevenue);
        document.getElementById('incompleteServices').textContent = serviceStats.incompleteServices;
    }

    if (window.InvoiceModule) {
        const invoiceStats = InvoiceModule.getInvoiceStats();
        document.getElementById('totalInvoices').textContent = invoiceStats.totalInvoices;
    }

    // Update recent activities
    updateRecentActivities();
}

/**
 * Update recent activities on dashboard
 */
function updateRecentActivities() {
    // Update recent sales
    const recentSalesDiv = document.getElementById('recentSales');
    if (recentSalesDiv && window.SalesModule) {
        const recentSales = SalesModule.getRecentSales(3);
        if (recentSales.length > 0) {
            recentSalesDiv.innerHTML = recentSales.map(sale => 
                `<div style="padding: 10px; border-left: 3px solid #ffd700; margin-bottom: 10px;">
                    <strong>${Utils.sanitizeHtml(sale.customerName)}</strong> - ${Utils.sanitizeHtml(sale.watchName)}<br>
                    <span style="color: #1a237e;">${Utils.formatCurrency(sale.totalAmount)}</span>
                </div>`
            ).join('');
        } else {
            recentSalesDiv.innerHTML = 'No sales yet';
        }
    }

    // Update incomplete services
    const incompleteServicesDiv = document.getElementById('incompleteServicesList');
    if (incompleteServicesDiv && window.ServiceModule) {
        const incompleteServices = ServiceModule.getIncompleteServices(3);
        if (incompleteServices.length > 0) {
            incompleteServicesDiv.innerHTML = incompleteServices.map(service => 
                `<div style="padding: 10px; border-left: 3px solid #ffd700; margin-bottom: 10px;">
                    <strong>${Utils.sanitizeHtml(service.customerName)}</strong> - ${Utils.sanitizeHtml(service.brand)} ${Utils.sanitizeHtml(service.model)}<br>
                    <span style="color: #1a237e;">${Utils.sanitizeHtml(service.issue)} (${Utils.sanitizeHtml(service.status)})</span>
                </div>`
            ).join('');
        } else {
            incompleteServicesDiv.innerHTML = 'No incomplete services';
        }
    }
}

/**
 * Open Sales Filter Modal
 */
function openSalesFilter() {
    document.getElementById('salesFilterModal').style.display = 'block';
    
    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('salesYear');
    yearSelect.innerHTML = '';
    for (let year = currentYear; year >= currentYear - 5; year--) {
        yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
    
    // Set current month
    const currentMonth = new Date().getMonth();
    document.getElementById('salesMonth').value = currentMonth;
    
    // Reset and show all sales initially
    resetSalesFilter();
}

/**
 * Open Service Filter Modal
 */
function openServiceFilter() {
    document.getElementById('serviceFilterModal').style.display = 'block';
    
    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('serviceYear');
    yearSelect.innerHTML = '';
    for (let year = currentYear; year >= currentYear - 5; year--) {
        yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
    }
    
    // Set current month
    const currentMonth = new Date().getMonth();
    document.getElementById('serviceMonth').value = currentMonth;
    
    // Reset and show all services initially
    resetServiceFilter();
}

/**
 * Toggle Sales Filter Inputs
 */
function toggleSalesFilterInputs() {
    const filterType = document.getElementById('salesFilterType').value;
    const dateRangeInputs = document.getElementById('salesDateRangeInputs');
    const monthGroup = document.getElementById('salesMonthGroup');
    const yearGroup = document.getElementById('salesYearGroup');
    
    // Hide all inputs first
    dateRangeInputs.style.display = 'none';
    monthGroup.style.display = 'none';
    
    if (filterType === 'dateRange') {
        dateRangeInputs.style.display = 'grid';
        yearGroup.style.display = 'none';
    } else if (filterType === 'monthly') {
        monthGroup.style.display = 'block';
        yearGroup.style.display = 'block';
    } else {
        yearGroup.style.display = 'block';
    }
}

/**
 * Toggle Service Filter Inputs
 */
function toggleServiceFilterInputs() {
    const filterType = document.getElementById('serviceFilterType').value;
    const dateRangeInputs = document.getElementById('serviceDateRangeInputs');
    const monthGroup = document.getElementById('serviceMonthGroup');
    const yearGroup = document.getElementById('serviceYearGroup');
    
    // Hide all inputs first
    dateRangeInputs.style.display = 'none';
    monthGroup.style.display = 'none';
    
    if (filterType === 'dateRange') {
        dateRangeInputs.style.display = 'grid';
        yearGroup.style.display = 'none';
    } else if (filterType === 'monthly') {
        monthGroup.style.display = 'block';
        yearGroup.style.display = 'block';
    } else {
        yearGroup.style.display = 'block';
    }
}

/**
 * Apply Sales Filter
 */
function applySalesFilter() {
    if (!window.SalesModule) return;
    
    const filterType = document.getElementById('salesFilterType').value;
    const resultsDiv = document.getElementById('salesFilterResults');
    let filteredSales = [];
    let title = '';
    
    if (filterType === 'dateRange') {
        const fromDate = document.getElementById('salesFromDate').value;
        const toDate = document.getElementById('salesToDate').value;
        
        if (!fromDate || !toDate) {
            Utils.showNotification('Please select both from and to dates.');
            return;
        }
        
        filteredSales = SalesModule.filterSalesByDateRange(fromDate, toDate);
        title = `Sales from ${Utils.formatDate(fromDate)} to ${Utils.formatDate(toDate)}`;
        
    } else if (filterType === 'monthly') {
        const month = document.getElementById('salesMonth').value;
        const year = document.getElementById('salesYear').value;
        
        filteredSales = SalesModule.filterSalesByMonth(month, year);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        title = `Sales for ${monthNames[month]} ${year}`;
        
    } else {
        filteredSales = SalesModule.sales;
        title = 'All Sales';
    }
    
    // Calculate totals
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = filteredSales.length;
    
    // Display results
    resultsDiv.innerHTML = `
        <div class="filter-results">
            <h3>${title}</h3>
            <div class="stats" style="margin: 20px 0;">
                <div class="stat-card" style="margin: 10px;">
                    <h3>${totalTransactions}</h3>
                    <p>Total Transactions</p>
                </div>
                <div class="stat-card" style="margin: 10px;">
                    <h3>${Utils.formatCurrency(totalAmount)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Watch</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSales.map(sale => `
                            <tr>
                                <td>${Utils.sanitizeHtml(sale.date)}</td>
                                <td>${Utils.sanitizeHtml(sale.customerName)}</td>
                                <td>${Utils.sanitizeHtml(sale.watchName)}</td>
                                <td>${Utils.formatCurrency(sale.totalAmount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Apply Service Filter
 */
function applyServiceFilter() {
    if (!window.ServiceModule) return;
    
    const filterType = document.getElementById('serviceFilterType').value;
    const resultsDiv = document.getElementById('serviceFilterResults');
    let filteredServices = [];
    let title = '';
    
    if (filterType === 'dateRange') {
        const fromDate = document.getElementById('serviceFromDate').value;
        const toDate = document.getElementById('serviceToDate').value;
        
        if (!fromDate || !toDate) {
            Utils.showNotification('Please select both from and to dates.');
            return;
        }
        
        filteredServices = ServiceModule.filterServicesByDateRange(fromDate, toDate);
        title = `Services from ${Utils.formatDate(fromDate)} to ${Utils.formatDate(toDate)}`;
        
    } else if (filterType === 'monthly') {
        const month = document.getElementById('serviceMonth').value;
        const year = document.getElementById('serviceYear').value;
        
        filteredServices = ServiceModule.filterServicesByMonth(month, year);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        title = `Services for ${monthNames[month]} ${year}`;
        
    } else {
        filteredServices = ServiceModule.services;
        title = 'All Services';
    }
    
    // Calculate totals
    const totalAmount = filteredServices.reduce((sum, service) => sum + service.cost, 0);
    const totalRequests = filteredServices.length;
    const completedServices = filteredServices.filter(s => s.status === 'completed').length;
    
    // Display results
    resultsDiv.innerHTML = `
        <div class="filter-results">
            <h3>${title}</h3>
            <div class="stats" style="margin: 20px 0;">
                <div class="stat-card" style="margin: 10px;">
                    <h3>${totalRequests}</h3>
                    <p>Total Requests</p>
                </div>
                <div class="stat-card" style="margin: 10px;">
                    <h3>${completedServices}</h3>
                    <p>Completed</p>
                </div>
                <div class="stat-card" style="margin: 10px;">
                    <h3>${Utils.formatCurrency(totalAmount)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Watch</th>
                            <th>Status</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredServices.map(service => `
                            <tr>
                                <td>${Utils.sanitizeHtml(service.date)}</td>
                                <td>${Utils.sanitizeHtml(service.customerName)}</td>
                                <td>${Utils.sanitizeHtml(service.watchName)}</td>
                                <td><span class="status ${service.status}">${service.status}</span></td>
                                <td>${Utils.formatCurrency(service.cost)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Reset Sales Filter
 */
function resetSalesFilter() {
    document.getElementById('salesFilterType').value = 'all';
    document.getElementById('salesFilterResults').innerHTML = '';
    toggleSalesFilterInputs();
    applySalesFilter();
}

/**
 * Reset Service Filter
 */
function resetServiceFilter() {
    document.getElementById('serviceFilterType').value = 'all';
    document.getElementById('serviceFilterResults').innerHTML = '';
    toggleServiceFilterInputs();
    applyServiceFilter();
}

/**
 * Modal functions
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Generic delete function for table rows
 */
function deleteItem(button) {
    if (confirm('Are you sure you want to delete this item?')) {
        const row = button.closest('tr');
        if (row) {
            row.remove();
            Utils.showNotification('Item deleted successfully!');
            updateDashboard();
        }
    }
}

/**
 * Confirmation prompts for transactions - moved before action
 */
function confirmTransaction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

/**
 * Load modal templates
 */
function loadModalTemplates() {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) return;

    const modalTemplates = `
        <!-- Add Watch Modal -->
        <div id="addWatchModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('addWatchModal')">&times;</span>
                <h2>Add New Watch</h2>
                <form onsubmit="InventoryModule.addNewWatch(event)">
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Brand:</label>
                            <input type="text" id="watchBrand" required onchange="InventoryModule.updateWatchCode()">
                        </div>
                        <div class="form-group">
                            <label>Code:</label>
                            <input type="text" id="watchCode" required placeholder="Auto-generated">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Model:</label>
                        <input type="text" id="watchModel" required>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Price (₹):</label>
                            <input type="number" id="watchPrice" required min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Quantity:</label>
                            <input type="number" id="watchQuantity" value="1" required min="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="watchDescription" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn">Add Watch</button>
                </form>
            </div>
        </div>

        <!-- Add Customer Modal -->
        <div id="addCustomerModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('addCustomerModal')">&times;</span>
                <h2>Add Customer</h2>
                <form onsubmit="CustomerModule.addNewCustomer(event)">
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" id="customerName" required>
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="customerEmail" required>
                    </div>
                    <div class="form-group">
                        <label>Phone:</label>
                        <input type="tel" id="customerPhone" required>
                    </div>
                    <div class="form-group">
                        <label>Address:</label>
                        <textarea id="customerAddress" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn">Add Customer</button>
                </form>
            </div>
        </div>

        <!-- Add User Modal -->
        <div id="addUserModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('addUserModal')">&times;</span>
                <h2>Add New User</h2>
                <form onsubmit="AuthModule.addNewUser(event)">
                    <div class="form-group">
                        <label>Username:</label>
                        <input type="text" id="newUsername" required placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password:</label>
                        <input type="password" id="newPassword" required placeholder="Enter password">
                    </div>
                    <div class="form-group">
                        <label>Role:</label>
                        <select id="newUserRole" required>
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Full Name:</label>
                        <input type="text" id="newUserFullName" required placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="newUserEmail" required placeholder="Enter email">
                    </div>
                    <button type="submit" class="btn">Add User</button>
                </form>
            </div>
        </div>
    `;

    modalsContainer.innerHTML = modalTemplates;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Handle escape key to close modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

/**
 * Initialize sample data
 */
function initializeSampleData() {
    // Initialize all modules with safe checks
    if (window.InventoryModule) {
        InventoryModule.initializeInventory();
    }
    
    if (window.CustomerModule) {
        CustomerModule.initializeCustomers();
    }
    
    if (window.SalesModule) {
        SalesModule.initializeSales();
    }
    
    if (window.ServiceModule) {
        ServiceModule.initializeServices();
    }
    
    if (window.InvoiceModule) {
        InvoiceModule.initializeInvoices();
    }
    
    // Update dashboard
    updateDashboard();
    
    console.log('Sample data initialized');
}

/**
 * Initialize application
 */
function initializeApp() {
    console.log('Initializing ZEDSON WATCHCRAFT Management System...');
    
    try {
        // Load modal templates
        loadModalTemplates();
        
        // Initialize sample data
        initializeSampleData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Ensure login screen is shown initially
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').classList.remove('logged-in');
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during application initialization:', error);
        Utils.showNotification('Error starting application. Please refresh the page.');
    }
}

/**
 * Make global functions available
 */
window.showSection = showSection;
window.closeModal = closeModal;
window.deleteItem = deleteItem;
window.updateDashboard = updateDashboard;
window.confirmTransaction = confirmTransaction;
window.openSalesFilter = openSalesFilter;
window.openServiceFilter = openServiceFilter;
window.toggleSalesFilterInputs = toggleSalesFilterInputs;
window.toggleServiceFilterInputs = toggleServiceFilterInputs;
window.applySalesFilter = applySalesFilter;
window.applyServiceFilter = applyServiceFilter;
window.resetSalesFilter = resetSalesFilter;
window.resetServiceFilter = resetServiceFilter;

// Assign authentication functions to global scope
window.handleLogin = AuthModule.handleLogin;
window.logout = AuthModule.logout;

// Assign functions that need to be globally accessible
window.openAddUserModal = function() {
    if (window.AuthModule) {
        AuthModule.openAddUserModal();
    }
};

window.editUser = function(username) {
    if (window.AuthModule) {
        AuthModule.editUser(username);
    }
};

window.deleteUser = function(username) {
    if (window.AuthModule) {
        AuthModule.deleteUser(username);
    }
};

// Assign inventory functions to global scope
window.openAddWatchModal = function() {
    if (window.InventoryModule) {
        InventoryModule.openAddWatchModal();
    }
};

window.editWatch = function(watchId) {
    if (window.InventoryModule) {
        InventoryModule.editWatch(watchId);
    }
};

window.deleteWatch = function(watchId) {
    if (window.InventoryModule) {
        InventoryModule.deleteWatch(watchId);
    }
};

window.searchWatches = function(query) {
    if (window.InventoryModule) {
        InventoryModule.searchWatches(query);
    }
};

// Assign customer functions to global scope
window.openAddCustomerModal = function() {
    if (window.CustomerModule) {
        CustomerModule.openAddCustomerModal();
    }
};

window.editCustomer = function(customerId) {
    if (window.CustomerModule) {
        CustomerModule.editCustomer(customerId);
    }
};

window.deleteCustomer = function(customerId) {
    if (window.CustomerModule) {
        CustomerModule.deleteCustomer(customerId);
    }
};

window.searchCustomers = function(query) {
    if (window.CustomerModule) {
        CustomerModule.searchCustomers(query);
    }
};

window.initiateSaleFromCustomer = function(customerId) {
    if (window.CustomerModule) {
        CustomerModule.initiateSaleFromCustomer(customerId);
    }
};

window.initiateServiceFromCustomer = function(customerId) {
    if (window.CustomerModule) {
        CustomerModule.initiateServiceFromCustomer(customerId);
    }
};

// Assign sales functions to global scope
window.openNewSaleModal = function() {
    if (window.SalesModule) {
        SalesModule.openNewSaleModal();
    } else {
        Utils.showNotification('Sales module is loading. Please try again in a moment.');
    }
};

window.editSale = function(saleId) {
    if (window.SalesModule) {
        SalesModule.editSale(saleId);
    }
};

window.deleteSale = function(saleId) {
    if (window.SalesModule) {
        SalesModule.deleteSale(saleId);
    }
};

// Assign service functions to global scope
window.openNewServiceModal = function() {
    if (window.ServiceModule) {
        ServiceModule.openNewServiceModal();
    }
};

window.deleteService = function(serviceId) {
    if (window.ServiceModule) {
        ServiceModule.deleteService(serviceId);
    }
};

window.updateServiceStatus = function(serviceId, status) {
    if (window.ServiceModule) {
        ServiceModule.updateServiceStatus(serviceId, status);
    }
};

window.editService = function(serviceId) {
    if (window.ServiceModule) {
        ServiceModule.editService(serviceId);
    }
};

/**
 * Start the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Export for other modules
window.AppController = {
    showSection,
    updateDashboard,
    updateSectionData,
    initializeApp,
    openSalesFilter,
    openServiceFilter
};