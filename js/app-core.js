// ZEDSON WATCHCRAFT - App Core Module (Part 1)

/**
 * Main Application Controller - Core Functions
 * Navigation, Dashboard, and Basic App Management
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
 * Open Revenue Analytics Modal - UPDATED
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
 * Toggle Revenue Filter Inputs - UPDATED
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
    } else if (filterType === 'salesOnly' || filterType === 'servicesOnly') {
        yearGroup.style.display = 'block';
    } else {
        yearGroup.style.display = 'block';
    }
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
        // Load modal templates (will be handled in extended module)
        if (window.AppExtendedModule && AppExtendedModule.loadModalTemplates) {
            AppExtendedModule.loadModalTemplates();
        }
        
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

// Export core functions for extended module
window.AppCoreModule = {
    showSection,
    updateSectionData,
    getTodayDate,
    getTodayRevenue,
    updateDashboard,
    updateRecentActivities,
    openRevenueAnalytics,
    toggleRevenueFilterInputs,
    closeModal,
    deleteItem,
    confirmTransaction,
    setupEventListeners,
    initializeSampleData,
    initializeApp
};