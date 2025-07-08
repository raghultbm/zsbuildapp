// ZEDSON WATCHCRAFT - Customer Management Module

/**
 * Customer Management System
 */

// Customer database
let customers = [
    { 
        id: 1, 
        name: "Raj Kumar", 
        email: "raj@email.com", 
        phone: "+91-9876543210", 
        address: "Chennai, Tamil Nadu", 
        purchases: 0, 
        serviceCount: 0,
        addedDate: "2024-01-01"
    },
    { 
        id: 2, 
        name: "Priya Sharma", 
        email: "priya@email.com", 
        phone: "+91-9876543211", 
        address: "Mumbai, Maharashtra", 
        purchases: 0, 
        serviceCount: 0,
        addedDate: "2024-01-01"
    }
];

let nextCustomerId = 3;

/**
 * Open Add Customer Modal
 */
function openAddCustomerModal() {
    if (!AuthModule.hasPermission('customers')) {
        Utils.showNotification('You do not have permission to add customers.');
        return;
    }
    console.log('Opening Add Customer Modal');
    document.getElementById('addCustomerModal').style.display = 'block';
}

/**
 * Add new customer
 */
function addNewCustomer(event) {
    event.preventDefault();
    
    if (!AuthModule.hasPermission('customers')) {
        Utils.showNotification('You do not have permission to add customers.');
        return;
    }

    // Get form data
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    
    // Validate input
    if (!name || !email || !phone) {
        Utils.showNotification('Please fill in all required fields');
        return;
    }

    // Validate email format
    if (!Utils.validateEmail(email)) {
        Utils.showNotification('Please enter a valid email address');
        return;
    }

    // Validate phone format
    if (!Utils.validatePhone(phone)) {
        Utils.showNotification('Please enter a valid phone number');
        return;
    }

    // Check if email already exists
    if (customers.find(c => c.email === email)) {
        Utils.showNotification('A customer with this email already exists');
        return;
    }

    // Check if phone already exists
    if (customers.find(c => c.phone === phone)) {
        Utils.showNotification('A customer with this phone number already exists');
        return;
    }

    // Create new customer object
    const newCustomer = {
        id: nextCustomerId++,
        name: name,
        email: email,
        phone: phone,
        address: address,
        purchases: 0,
        serviceCount: 0,
        addedDate: Utils.formatDate(new Date()),
        addedBy: AuthModule.getCurrentUser().username
    };

    // Add to customers array
    customers.push(newCustomer);
    
    // Update display
    renderCustomerTable();
    updateDashboard();
    
    // Close modal and reset form
    closeModal('addCustomerModal');
    event.target.reset();
    
    Utils.showNotification('Customer added successfully!');
    console.log('Customer added:', newCustomer);
}

/**
 * Edit customer
 */
function editCustomer(customerId) {
    if (!AuthModule.hasPermission('customers')) {
        Utils.showNotification('You do not have permission to edit customers.');
        return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        Utils.showNotification('Customer not found.');
        return;
    }

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editCustomerModal';
    editModal.style.display = 'block';
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('editCustomerModal')">&times;</span>
            <h2>Edit Customer</h2>
            <form onsubmit="CustomerModule.updateCustomer(event, ${customerId})">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="editCustomerName" value="${customer.name}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editCustomerEmail" value="${customer.email}" required>
                </div>
                <div class="form-group">
                    <label>Phone:</label>
                    <input type="tel" id="editCustomerPhone" value="${customer.phone}" required>
                </div>
                <div class="form-group">
                    <label>Address:</label>
                    <textarea id="editCustomerAddress" rows="3">${customer.address || ''}</textarea>
                </div>
                <button type="submit" class="btn">Update Customer</button>
                <button type="button" class="btn btn-danger" onclick="closeModal('editCustomerModal')">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
}

/**
 * Update customer
 */
function updateCustomer(event, customerId) {
    event.preventDefault();
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        Utils.showNotification('Customer not found.');
        return;
    }

    const name = document.getElementById('editCustomerName').value.trim();
    const email = document.getElementById('editCustomerEmail').value.trim();
    const phone = document.getElementById('editCustomerPhone').value.trim();
    const address = document.getElementById('editCustomerAddress').value.trim();

    // Validate input
    if (!name || !email || !phone) {
        Utils.showNotification('Please fill in all required fields');
        return;
    }

    // Validate email format
    if (!Utils.validateEmail(email)) {
        Utils.showNotification('Please enter a valid email address');
        return;
    }

    // Validate phone format
    if (!Utils.validatePhone(phone)) {
        Utils.showNotification('Please enter a valid phone number');
        return;
    }

    // Check if email already exists (excluding current customer)
    if (customers.find(c => c.email === email && c.id !== customerId)) {
        Utils.showNotification('A customer with this email already exists');
        return;
    }

    // Check if phone already exists (excluding current customer)
    if (customers.find(c => c.phone === phone && c.id !== customerId)) {
        Utils.showNotification('A customer with this phone number already exists');
        return;
    }

    // Update customer
    customer.name = name;
    customer.email = email;
    customer.phone = phone;
    customer.address = address;

    renderCustomerTable();
    updateDashboard();
    closeModal('editCustomerModal');
    document.getElementById('editCustomerModal').remove();
    Utils.showNotification('Customer updated successfully!');
}

/**
 * Delete customer
 */
function deleteCustomer(customerId) {
    if (!AuthModule.hasPermission('customers')) {
        Utils.showNotification('You do not have permission to delete customers.');
        return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        Utils.showNotification('Customer not found.');
        return;
    }

    if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
        customers = customers.filter(c => c.id !== customerId);
        renderCustomerTable();
        updateDashboard();
        Utils.showNotification('Customer deleted successfully!');
    }
}

/**
 * Update customer purchase count
 */
function incrementCustomerPurchases(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.purchases++;
        renderCustomerTable();
    }
}

/**
 * Update customer service count
 */
function incrementCustomerServices(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.serviceCount++;
        renderCustomerTable();
    }
}

/**
 * Decrease customer purchase count
 */
function decrementCustomerPurchases(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.purchases = Math.max(0, customer.purchases - 1);
        renderCustomerTable();
    }
}

/**
 * Decrease customer service count
 */
function decrementCustomerServices(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.serviceCount = Math.max(0, customer.serviceCount - 1);
        renderCustomerTable();
    }
}

/**
 * Get customer by ID
 */
function getCustomerById(customerId) {
    return customers.find(c => c.id === customerId);
}

/**
 * Search customers
 */
function searchCustomers(query) {
    const tbody = document.getElementById('customerTableBody');
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
 * Initiate sale from customer
 */
function initiateSaleFromCustomer(customerId) {
    if (!AuthModule.hasPermission('sales')) {
        Utils.showNotification('You do not have permission to create sales.');
        return;
    }

    // Switch to sales section
    showSection('sales');
    
    // Update nav button state
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[3].classList.add('active'); // Sales is 4th button now
    
    // Open sale modal with pre-selected customer
    setTimeout(() => {
        if (window.SalesModule && window.SalesModule.openNewSaleModal) {
            SalesModule.openNewSaleModal();
            const customerSelect = document.getElementById('saleCustomer');
            if (customerSelect) {
                customerSelect.value = customerId;
            }
        } else {
            Utils.showNotification('Sales module not available. Please ensure sales.js is loaded.');
        }
    }, 100);
}

/**
 * Initiate service from customer
 */
function initiateServiceFromCustomer(customerId) {
    if (!AuthModule.hasPermission('service')) {
        Utils.showNotification('You do not have permission to create service requests.');
        return;
    }

    // Switch to service section
    showSection('service');
    
    // Update nav button state
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[4].classList.add('active'); // Service is 5th button now
    
    // Open service modal with pre-selected customer
    setTimeout(() => {
        if (window.ServiceModule && window.ServiceModule.openNewServiceModal) {
            ServiceModule.openNewServiceModal();
            const customerSelect = document.getElementById('serviceCustomer');
            if (customerSelect) {
                customerSelect.value = customerId;
            }
        } else {
            Utils.showNotification('Service module not available. Please ensure service.js is loaded.');
        }
    }, 100);
}

/**
 * Render customer table with S.No column
 */
function renderCustomerTable() {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) {
        console.error('Customer table body not found');
        return;
    }
    
    console.log('Rendering customer table with', customers.length, 'customers');
    tbody.innerHTML = '';
    
    customers.forEach((customer, index) => {
        const row = document.createElement('tr');
        // Creating 7 columns to match the header: S.No, Name, Email, Phone, Purchases, Services, Actions
        row.innerHTML = `
            <td class="serial-number">${index + 1}</td>
            <td>${Utils.sanitizeHtml(customer.name)}</td>
            <td>${Utils.sanitizeHtml(customer.email)}</td>
            <td>${Utils.sanitizeHtml(customer.phone)}</td>
            <td>${customer.purchases}</td>
            <td>${customer.serviceCount}</td>
            <td>
                <button class="btn" onclick="editCustomer(${customer.id})" 
                    title="Edit Customer" ${!AuthModule.hasPermission('customers') ? 'disabled' : ''}>
                    Edit
                </button>
                <button class="btn btn-success" onclick="initiateSaleFromCustomer(${customer.id})" 
                    title="New Sale" ${!AuthModule.hasPermission('sales') ? 'disabled' : ''}>
                    Sale
                </button>
                <button class="btn" onclick="initiateServiceFromCustomer(${customer.id})" 
                    title="New Service Request" ${!AuthModule.hasPermission('service') ? 'disabled' : ''}>
                    Service
                </button>
                <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})"
                    ${!AuthModule.hasPermission('customers') ? 'disabled' : ''}>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Customer table rendered successfully with S.No column');
}

/**
 * Get customer statistics
 */
function getCustomerStats() {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.purchases > 0 || c.serviceCount > 0).length;
    const topCustomers = customers
        .sort((a, b) => (b.purchases + b.serviceCount) - (a.purchases + a.serviceCount))
        .slice(0, 5);
    
    return {
        totalCustomers,
        activeCustomers,
        topCustomers
    };
}

/**
 * Populate customer dropdown for other modules
 */
function populateCustomerDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(customer => {
        select.innerHTML += `<option value="${customer.id}">${Utils.sanitizeHtml(customer.name)}</option>`;
    });
}

/**
 * Initialize customer module
 */
function initializeCustomers() {
    renderCustomerTable();
    console.log('Customer module initialized');
}

// Export functions for global use
window.CustomerModule = {
    openAddCustomerModal,
    addNewCustomer,
    editCustomer,
    updateCustomer,
    deleteCustomer,
    incrementCustomerPurchases,
    incrementCustomerServices,
    decrementCustomerPurchases,
    decrementCustomerServices,
    getCustomerById,
    searchCustomers,
    initiateSaleFromCustomer,
    initiateServiceFromCustomer,
    renderCustomerTable,
    getCustomerStats,
    populateCustomerDropdown,
    initializeCustomers,
    customers // For access by other modules
};