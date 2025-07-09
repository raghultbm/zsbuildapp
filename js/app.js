// ZEDSON WATCHCRAFT - Main Application (Fixed)

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
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get today's sales and services revenue
 */
function getTodayRevenue() {
    const today = Utils.formatDate(new Date());
    let salesRevenue = 0;
    let servicesRevenue = 0;
    
    // Get today's sales
    if (window.SalesModule && SalesModule.sales) {
        salesRevenue = SalesModule.sales
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);
    }
    
    // Get today's completed services
    if (window.ServiceModule && ServiceModule.services) {
        servicesRevenue = ServiceModule.services
            .filter(service => service.status === 'completed' && 
                     service.actualDelivery === today)
            .reduce((sum, service) => sum + service.cost, 0);
    }
    
    return {
        salesRevenue,
        servicesRevenue,
        totalRevenue: salesRevenue + servicesRevenue
    };
}

/**
 * Update dashboard statistics
 */
function updateDashboard() {
    // Update statistics cards with safe checks
    if (window.InventoryModule) {
        const inventoryStats = InventoryModule.getInventoryStats();
        const totalWatchesElement = document.getElementById('totalWatches');
        if (totalWatchesElement) {
            totalWatchesElement.textContent = inventoryStats.totalWatches;
        }
    }
    
    if (window.CustomerModule) {
        const customerStats = CustomerModule.getCustomerStats();
        const totalCustomersElement = document.getElementById('totalCustomers');
        if (totalCustomersElement) {
            totalCustomersElement.textContent = customerStats.totalCustomers;
        }
    }
    
    // Update combined today's revenue (Sales + Services)
    const todayRevenue = getTodayRevenue();
    const todayRevenueElement = document.getElementById('todayRevenue');
    if (todayRevenueElement) {
        todayRevenueElement.textContent = Utils.formatCurrency(todayRevenue.totalRevenue);
    }
    
    // Update incomplete services
    if (window.ServiceModule) {
        const serviceStats = ServiceModule.getServiceStats();
        const incompleteServicesElement = document.getElementById('incompleteServices');
        if (incompleteServicesElement) {
            incompleteServicesElement.textContent = serviceStats.incompleteServices;
        }
    }

    if (window.InvoiceModule) {
        const invoiceStats = InvoiceModule.getInvoiceStats();
        const totalInvoicesElement = document.getElementById('totalInvoices');
        if (totalInvoicesElement) {
            totalInvoicesElement.textContent = invoiceStats.totalInvoices;
        }
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
 * Open Combined Revenue Analytics Modal
 */
function openRevenueAnalytics() {
    const modal = document.getElementById('revenueAnalyticsModal');
    if (!modal) {
        Utils.showNotification('Revenue analytics modal not found');
        return;
    }
    
    modal.style.display = 'block';
    
    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('revenueYear');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
    }
    
    // Set current month
    const currentMonth = new Date().getMonth();
    const monthSelect = document.getElementById('revenueMonth');
    if (monthSelect) {
        monthSelect.value = currentMonth;
    }
    
    // Reset and show all revenue initially
    resetRevenueFilter();
}

/**
 * Open Sales Filter Modal (separate analytics)
 */
function openSalesFilter() {
    const modal = document.getElementById('salesFilterModal');
    if (!modal) {
        Utils.showNotification('Sales analytics modal not found');
        return;
    }
    
    modal.style.display = 'block';
    
    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('salesYear');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
    }
    
    // Set current month
    const currentMonth = new Date().getMonth();
    const monthSelect = document.getElementById('salesMonth');
    if (monthSelect) {
        monthSelect.value = currentMonth;
    }
    
    // Reset and show all sales initially
    resetSalesFilter();
}

/**
 * Open Service Filter Modal (separate analytics)
 */
function openServiceFilter() {
    const modal = document.getElementById('serviceFilterModal');
    if (!modal) {
        Utils.showNotification('Service analytics modal not found');
        return;
    }
    
    modal.style.display = 'block';
    
    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('serviceYear');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        for (let year = currentYear; year >= currentYear - 5; year--) {
            yearSelect.innerHTML += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
    }
    
    // Set current month
    const currentMonth = new Date().getMonth();
    const monthSelect = document.getElementById('serviceMonth');
    if (monthSelect) {
        monthSelect.value = currentMonth;
    }
    
    // Reset and show all services initially
    resetServiceFilter();
}

/**
 * Toggle Revenue Filter Inputs
 */
function toggleRevenueFilterInputs() {
    const filterType = document.getElementById('revenueFilterType')?.value;
    const dateRangeInputs = document.getElementById('revenueDateRangeInputs');
    const monthGroup = document.getElementById('revenueMonthGroup');
    const yearGroup = document.getElementById('revenueYearGroup');
    
    if (!filterType || !dateRangeInputs || !monthGroup || !yearGroup) return;
    
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
 * Apply Revenue Filter (Combined Sales + Services)
 */
function applyRevenueFilter() {
    if (!window.SalesModule || !window.ServiceModule) {
        Utils.showNotification('Sales or Service module not available');
        return;
    }
    
    const filterType = document.getElementById('revenueFilterType')?.value;
    const resultsDiv = document.getElementById('revenueFilterResults');
    
    if (!filterType || !resultsDiv) return;
    
    let filteredSales = [];
    let filteredServices = [];
    let title = '';
    
    if (filterType === 'dateRange') {
        const fromDate = document.getElementById('revenueFromDate')?.value;
        const toDate = document.getElementById('revenueToDate')?.value;
        
        if (!fromDate || !toDate) {
            Utils.showNotification('Please select both from and to dates.');
            return;
        }
        
        filteredSales = SalesModule.filterSalesByDateRange(fromDate, toDate);
        filteredServices = ServiceModule.filterServicesByDateRange(fromDate, toDate)
            .filter(s => s.status === 'completed');
        title = `Revenue from ${Utils.formatDate(fromDate)} to ${Utils.formatDate(toDate)}`;
        
    } else if (filterType === 'monthly') {
        const month = document.getElementById('revenueMonth')?.value;
        const year = document.getElementById('revenueYear')?.value;
        
        if (month === null || !year) return;
        
        filteredSales = SalesModule.filterSalesByMonth(month, year);
        filteredServices = ServiceModule.filterServicesByMonth(month, year)
            .filter(s => s.status === 'completed');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        title = `Revenue for ${monthNames[month]} ${year}`;
        
    } else {
        filteredSales = SalesModule.sales || [];
        filteredServices = (ServiceModule.services || []).filter(s => s.status === 'completed');
        title = 'All Revenue';
    }
    
    // Calculate totals
    const salesAmount = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const servicesAmount = filteredServices.reduce((sum, service) => sum + service.cost, 0);
    const totalAmount = salesAmount + servicesAmount;
    const totalTransactions = filteredSales.length + filteredServices.length;
    
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
                    <h3>${Utils.formatCurrency(salesAmount)}</h3>
                    <p>Sales Revenue</p>
                </div>
                <div class="stat-card" style="margin: 10px;">
                    <h3>${Utils.formatCurrency(servicesAmount)}</h3>
                    <p>Services Revenue</p>
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
                            <th>Type</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Details</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSales.map(sale => `
                            <tr>
                                <td><span class="status available">Sales</span></td>
                                <td>${Utils.sanitizeHtml(sale.date)}</td>
                                <td>${Utils.sanitizeHtml(sale.customerName)}</td>
                                <td>${Utils.sanitizeHtml(sale.watchName)}</td>
                                <td>${Utils.formatCurrency(sale.totalAmount)}</td>
                            </tr>
                        `).join('')}
                        ${filteredServices.map(service => `
                            <tr>
                                <td><span class="status completed">Service</span></td>
                                <td>${Utils.sanitizeHtml(service.actualDelivery || service.date)}</td>
                                <td>${Utils.sanitizeHtml(service.customerName)}</td>
                                <td>${Utils.sanitizeHtml(service.watchName)}</td>
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
 * Toggle Sales Filter Inputs
 */
function toggleSalesFilterInputs() {
    const filterType = document.getElementById('salesFilterType')?.value;
    const dateRangeInputs = document.getElementById('salesDateRangeInputs');
    const monthGroup = document.getElementById('salesMonthGroup');
    const yearGroup = document.getElementById('salesYearGroup');
    
    if (!filterType || !dateRangeInputs || !monthGroup || !yearGroup) return;
    
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
    const filterType = document.getElementById('serviceFilterType')?.value;
    const dateRangeInputs = document.getElementById('serviceDateRangeInputs');
    const monthGroup = document.getElementById('serviceMonthGroup');
    const yearGroup = document.getElementById('serviceYearGroup');
    
    if (!filterType || !dateRangeInputs || !monthGroup || !yearGroup) return;
    
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
    if (!window.SalesModule) {
        Utils.showNotification('Sales module not available');
        return;
    }
    
    const filterType = document.getElementById('salesFilterType')?.value;
    const resultsDiv = document.getElementById('salesFilterResults');
    
    if (!filterType || !resultsDiv) return;
    
    let filteredSales = [];
    let title = '';
    
    if (filterType === 'dateRange') {
        const fromDate = document.getElementById('salesFromDate')?.value;
        const toDate = document.getElementById('salesToDate')?.value;
        
        if (!fromDate || !toDate) {
            Utils.showNotification('Please select both from and to dates.');
            return;
        }
        
        filteredSales = SalesModule.filterSalesByDateRange(fromDate, toDate);
        title = `Sales from ${Utils.formatDate(fromDate)} to ${Utils.formatDate(toDate)}`;
        
    } else if (filterType === 'monthly') {
        const month = document.getElementById('salesMonth')?.value;
        const year = document.getElementById('salesYear')?.value;
        
        if (month === null || !year) return;
        
        filteredSales = SalesModule.filterSalesByMonth(month, year);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        title = `Sales for ${monthNames[month]} ${year}`;
        
    } else {
        filteredSales = SalesModule.sales || [];
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
                            <th>Item</th>
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
    if (!window.ServiceModule) {
        Utils.showNotification('Service module not available');
        return;
    }
    
    const filterType = document.getElementById('serviceFilterType')?.value;
    const resultsDiv = document.getElementById('serviceFilterResults');
    
    if (!filterType || !resultsDiv) return;
    
    let filteredServices = [];
    let title = '';
    
    if (filterType === 'dateRange') {
        const fromDate = document.getElementById('serviceFromDate')?.value;
        const toDate = document.getElementById('serviceToDate')?.value;
        
        if (!fromDate || !toDate) {
            Utils.showNotification('Please select both from and to dates.');
            return;
        }
        
        filteredServices = ServiceModule.filterServicesByDateRange(fromDate, toDate);
        title = `Services from ${Utils.formatDate(fromDate)} to ${Utils.formatDate(toDate)}`;
        
    } else if (filterType === 'monthly') {
        const month = document.getElementById('serviceMonth')?.value;
        const year = document.getElementById('serviceYear')?.value;
        
        if (month === null || !year) return;
        
        filteredServices = ServiceModule.filterServicesByMonth(month, year);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        title = `Services for ${monthNames[month]} ${year}`;
        
    } else {
        filteredServices = ServiceModule.services || [];
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
 * Reset Revenue Filter
 */
function resetRevenueFilter() {
    const filterType = document.getElementById('revenueFilterType');
    const resultsDiv = document.getElementById('revenueFilterResults');
    
    if (filterType) filterType.value = 'all';
    if (resultsDiv) resultsDiv.innerHTML = '';
    
    toggleRevenueFilterInputs();
    applyRevenueFilter();
}

/**
 * Reset Sales Filter
 */
function resetSalesFilter() {
    const filterType = document.getElementById('salesFilterType');
    const resultsDiv = document.getElementById('salesFilterResults');
    
    if (filterType) filterType.value = 'all';
    if (resultsDiv) resultsDiv.innerHTML = '';
    
    toggleSalesFilterInputs();
    applySalesFilter();
}

/**
 * Reset Service Filter
 */
function resetServiceFilter() {
    const filterType = document.getElementById('serviceFilterType');
    const resultsDiv = document.getElementById('serviceFilterResults');
    
    if (filterType) filterType.value = 'all';
    if (resultsDiv) resultsDiv.innerHTML = '';
    
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
                <h2>Add New Item</h2>
                <form onsubmit="InventoryModule.addNewWatch(event)">
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Code:</label>
                            <input type="text" id="watchCode" required placeholder="Auto-generated">
                        </div>
                        <div class="form-group">
                            <label>Type:</label>
                            <select id="watchType" required>
                                <option value="">Select Type</option>
                                <option value="Watch">Watch</option>
                                <option value="Clock">Clock</option>
                                <option value="Timepiece">Timepiece</option>
                                <option value="Strap">Strap</option>
                                <option value="Battery">Battery</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Brand:</label>
                            <input type="text" id="watchBrand" required onchange="InventoryModule.updateWatchCode()">
                        </div>
                        <div class="form-group">
                            <label>Model:</label>
                            <input type="text" id="watchModel" required>
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Size:</label>
                            <input type="text" id="watchSize" required placeholder="e.g., 40mm, 42mm">
                        </div>
                        <div class="form-group">
                            <label>Price (₹):</label>
                            <input type="number" id="watchPrice" required min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Quantity:</label>
                        <input type="number" id="watchQuantity" value="1" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <textarea id="watchDescription" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn">Add Item</button>
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
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.classList.remove('logged-in');
        
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
window.openRevenueAnalytics = openRevenueAnalytics;
window.openSalesFilter = openSalesFilter;
window.openServiceFilter = openServiceFilter;
window.toggleRevenueFilterInputs = toggleRevenueFilterInputs;
window.toggleSalesFilterInputs = toggleSalesFilterInputs;
window.toggleServiceFilterInputs = toggleServiceFilterInputs;
window.applyRevenueFilter = applyRevenueFilter;
window.applySalesFilter = applySalesFilter;
window.applyServiceFilter = applyServiceFilter;
window.resetRevenueFilter = resetRevenueFilter;
window.resetSalesFilter = resetSalesFilter;
window.resetServiceFilter = resetServiceFilter;

// Assign authentication functions to global scope
window.handleLogin = function(event) {
    if (window.AuthModule) {
        AuthModule.handleLogin(event);
    }
};

window.logout = function() {
    if (window.AuthModule) {
        AuthModule.logout();
    }
};

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
    openRevenueAnalytics,
    openSalesFilter,
    openServiceFilter,
    getTodayRevenue
};