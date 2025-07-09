// ZEDSON WATCHCRAFT - Service Management Module (Updated with Search)

/**
 * Service Request Management System
 */

// Service requests database
let services = [];
let nextServiceId = 1;

/**
 * Open New Service Modal
 */
function openNewServiceModal() {
    if (!AuthModule.hasPermission('service')) {
        Utils.showNotification('You do not have permission to create service requests.');
        return;
    }
    
    console.log('Opening New Service Modal');
    
    // Populate customer dropdown
    CustomerModule.populateCustomerDropdown('serviceCustomer');
    
    document.getElementById('newServiceModal').style.display = 'block';
}

/**
 * Add new service request
 */
function addNewService(event) {
    event.preventDefault();
    
    if (!AuthModule.hasPermission('service')) {
        Utils.showNotification('You do not have permission to create service requests.');
        return;
    }

    // Get form data
    const customerId = parseInt(document.getElementById('serviceCustomer').value);
    const brand = document.getElementById('serviceBrand').value.trim();
    const model = document.getElementById('serviceModel').value.trim();
    const dialColor = document.getElementById('serviceDialColor').value.trim();
    const movementNo = document.getElementById('serviceMovementNo').value.trim();
    const gender = document.getElementById('serviceGender').value;
    const caseType = document.getElementById('serviceCase').value;
    const strapType = document.getElementById('serviceStrap').value;
    const issue = document.getElementById('serviceIssue').value.trim();
    const cost = parseFloat(document.getElementById('serviceCost').value);
    
    // Validate input
    if (!customerId || !brand || !model || !dialColor || !movementNo || 
        !gender || !caseType || !strapType || !issue || !cost) {
        Utils.showNotification('Please fill in all required fields');
        return;
    }

    if (cost < 0) {
        Utils.showNotification('Service cost cannot be negative');
        return;
    }

    // Get customer details
    const customer = CustomerModule.getCustomerById(customerId);
    if (!customer) {
        Utils.showNotification('Selected customer not found');
        return;
    }

    // Create service object with full forms and time
    const now = new Date();
    const newService = {
        id: nextServiceId++,
        date: Utils.formatDate(now),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Utils.getCurrentTimestamp(),
        customerId: customerId,
        customerName: customer.name,
        watchName: `${brand} ${model}`, // Auto-generated from brand and model
        brand: brand,
        model: model,
        dialColor: dialColor,
        movementNo: movementNo,
        gender: gender, // Full form stored
        caseType: caseType, // Full form stored
        strapType: strapType, // Full form stored
        issue: issue,
        cost: cost,
        status: 'pending',
        createdBy: AuthModule.getCurrentUser().username,
        estimatedDelivery: null,
        actualDelivery: null,
        completionImage: null,
        completionDescription: null,
        warrantyPeriod: null,
        notes: [],
        acknowledgementGenerated: false,
        completionInvoiceGenerated: false,
        acknowledgementInvoiceId: null,
        completionInvoiceId: null
    };

    // Add to services array
    services.push(newService);
    
    // Update customer service count
    CustomerModule.incrementCustomerServices(customerId);
    
    // Generate Service Acknowledgement automatically (separate tracking)
    if (window.InvoiceModule) {
        const acknowledgement = InvoiceModule.generateServiceAcknowledgement(newService);
        if (acknowledgement) {
            newService.acknowledgementGenerated = true;
            newService.acknowledgementInvoiceId = acknowledgement.id;
        }
    }
    
    // Update displays
    renderServiceTable();
    updateDashboard();
    
    // Close modal and reset form
    closeModal('newServiceModal');
    event.target.reset();
    
    Utils.showNotification(`Service request created successfully! Request ID: ${newService.id}. Acknowledgement generated.`);
    console.log('Service added:', newService);
}

/**
 * Update service status
 */
function updateServiceStatus(serviceId, newStatus) {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        Utils.showNotification('Service request not found.');
        return;
    }

    const oldStatus = service.status;
    
    // Show confirmation BEFORE changing status
    let confirmMessage = '';
    if (newStatus === 'in-progress') {
        confirmMessage = `Start working on service for ${service.customerName}'s ${service.watchName}?`;
    } else if (newStatus === 'on-hold') {
        confirmMessage = `Put service for ${service.customerName}'s ${service.watchName} on hold?`;
    } else if (newStatus === 'completed' && oldStatus === 'in-progress') {
        // For completion, show the completion modal instead
        showServiceCompletionModal(service);
        return;
    }
    
    if (confirmMessage && !confirm(confirmMessage)) {
        return; // User cancelled
    }
    
    if (newStatus === 'completed' && oldStatus === 'in-progress') {
        // Show completion details modal
        showServiceCompletionModal(service);
        return;
    }
    
    service.status = newStatus;
    
    // Add timestamp for status changes
    if (newStatus === 'in-progress' && oldStatus === 'pending') {
        service.startedAt = Utils.getCurrentTimestamp();
    } else if (newStatus === 'on-hold') {
        service.heldAt = Utils.getCurrentTimestamp();
    }
    
    renderServiceTable();
    updateDashboard();
    Utils.showNotification(`Service status updated to: ${newStatus}`);
}

/**
 * Edit service
 */
function editService(serviceId) {
    if (!AuthModule.hasPermission('service')) {
        Utils.showNotification('You do not have permission to edit service requests.');
        return;
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) {
        Utils.showNotification('Service request not found.');
        return;
    }

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editServiceModal';
    editModal.style.display = 'block';
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeEditServiceModal()">&times;</span>
            <h2>Edit Service Request</h2>
            <form onsubmit="ServiceModule.updateService(event, ${serviceId})">
                <div class="form-group">
                    <label>Customer:</label>
                    <select id="editServiceCustomer" required>
                        <option value="">Select Customer</option>
                    </select>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Watch Brand:</label>
                        <input type="text" id="editServiceBrand" value="${service.brand}" required>
                    </div>
                    <div class="form-group">
                        <label>Watch Model:</label>
                        <input type="text" id="editServiceModel" value="${service.model}" required>
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Dial Colour:</label>
                        <input type="text" id="editServiceDialColor" value="${service.dialColor}" required>
                    </div>
                    <div class="form-group">
                        <label>Movement No:</label>
                        <input type="text" id="editServiceMovementNo" value="${service.movementNo}" required>
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Gender:</label>
                        <select id="editServiceGender" required>
                            <option value="Male" ${service.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${service.gender === 'Female' ? 'selected' : ''}>Female</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Case Material:</label>
                        <select id="editServiceCase" required>
                            <option value="Steel" ${service.caseType === 'Steel' ? 'selected' : ''}>Steel</option>
                            <option value="Gold Tone" ${service.caseType === 'Gold Tone' ? 'selected' : ''}>Gold Tone</option>
                            <option value="Fiber" ${service.caseType === 'Fiber' ? 'selected' : ''}>Fiber</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>Strap Material:</label>
                        <select id="editServiceStrap" required>
                            <option value="Fiber" ${service.strapType === 'Fiber' ? 'selected' : ''}>Fiber</option>
                            <option value="Steel" ${service.strapType === 'Steel' ? 'selected' : ''}>Steel</option>
                            <option value="Gold Plated" ${service.strapType === 'Gold Plated' ? 'selected' : ''}>Gold Plated</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Cost (₹):</label>
                        <input type="number" id="editServiceCost" value="${service.cost}" required min="0" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label>Issue Description:</label>
                    <textarea id="editServiceIssue" rows="3" required>${service.issue}</textarea>
                </div>
                <button type="submit" class="btn">Update Service Request</button>
                <button type="button" class="btn btn-danger" onclick="closeEditServiceModal()">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Populate customer dropdown and set current customer
    if (window.CustomerModule) {
        CustomerModule.populateCustomerDropdown('editServiceCustomer');
        // Set the current customer as selected
        setTimeout(() => {
            const customerSelect = document.getElementById('editServiceCustomer');
            if (customerSelect) {
                customerSelect.value = service.customerId;
            }
        }, 50);
    }
}

/**
 * Close edit service modal
 */
function closeEditServiceModal() {
    const modal = document.getElementById('editServiceModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Update service
 */
function updateService(event, serviceId) {
    event.preventDefault();
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        Utils.showNotification('Service not found.');
        return;
    }

    const customerId = parseInt(document.getElementById('editServiceCustomer').value);
    const brand = document.getElementById('editServiceBrand').value.trim();
    const model = document.getElementById('editServiceModel').value.trim();
    const dialColor = document.getElementById('editServiceDialColor').value.trim();
    const movementNo = document.getElementById('editServiceMovementNo').value.trim();
    const gender = document.getElementById('editServiceGender').value;
    const caseType = document.getElementById('editServiceCase').value;
    const strapType = document.getElementById('editServiceStrap').value;
    const issue = document.getElementById('editServiceIssue').value.trim();
    const cost = parseFloat(document.getElementById('editServiceCost').value);

    // Validate input
    if (!customerId || !brand || !model || !dialColor || !movementNo || 
        !gender || !caseType || !strapType || !issue || cost < 0) {
        Utils.showNotification('Please fill in all required fields correctly');
        return;
    }

    const customer = CustomerModule.getCustomerById(customerId);
    if (!customer) {
        Utils.showNotification('Selected customer not found');
        return;
    }

    // Update service
    service.customerId = customerId;
    service.customerName = customer.name;
    service.brand = brand;
    service.model = model;
    service.watchName = `${brand} ${model}`;
    service.dialColor = dialColor;
    service.movementNo = movementNo;
    service.gender = gender;
    service.caseType = caseType;
    service.strapType = strapType;
    service.issue = issue;
    service.cost = cost;

    renderServiceTable();
    updateDashboard();
    closeEditServiceModal();
    Utils.showNotification('Service request updated successfully!');
}

/**
 * Show service completion modal
 */
function showServiceCompletionModal(service) {
    // Show confirmation BEFORE opening completion modal
    const confirmMessage = `Complete service for ${service.customerName}'s ${service.watchName}?\n\nThis will require completion details and warranty information.`;
    
    if (!confirm(confirmMessage)) {
        return; // User cancelled
    }
    
    const completionModal = document.createElement('div');
    completionModal.className = 'modal';
    completionModal.id = 'serviceCompletionModal';
    completionModal.style.display = 'block';
    completionModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('serviceCompletionModal')">&times;</span>
            <h2>Complete Service Request</h2>
            <p><strong>Service ID:</strong> ${service.id} - ${service.watchName}</p>
            <form onsubmit="ServiceModule.completeService(event, ${service.id})">
                <div class="form-group">
                    <label>Completion Image URL:</label>
                    <input type="url" id="completionImage" placeholder="Enter image URL (optional)">
                    <small>Optional: URL to an image showing the completed work</small>
                </div>
                <div class="form-group">
                    <label>Work Description:</label>
                    <textarea id="completionDescription" rows="4" required 
                        placeholder="Describe the work performed, parts replaced, etc."></textarea>
                </div>
                <div class="form-group">
                    <label>Warranty Period (months):</label>
                    <input type="number" id="warrantyPeriod" min="0" max="60" value="6" required>
                    <small>Enter warranty period in months (0-60)</small>
                </div>
                <div class="grid grid-2">
                    <button type="button" class="btn btn-danger" onclick="closeModal('serviceCompletionModal')">Cancel</button>
                    <button type="submit" class="btn btn-success">Complete Service</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(completionModal);
}

/**
 * Complete service with details
 */
function completeService(event, serviceId) {
    event.preventDefault();
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        Utils.showNotification('Service not found.');
        return;
    }
    
    const image = document.getElementById('completionImage').value.trim();
    const description = document.getElementById('completionDescription').value.trim();
    const warranty = parseInt(document.getElementById('warrantyPeriod').value);
    
    if (!description) {
        Utils.showNotification('Please provide a work description.');
        return;
    }
    
    if (warranty < 0 || warranty > 60) {
        Utils.showNotification('Warranty period must be between 0 and 60 months.');
        return;
    }
    
    // Update service
    service.status = 'completed';
    service.completedAt = Utils.getCurrentTimestamp();
    service.actualDelivery = Utils.formatDate(new Date());
    service.completionImage = image || null;
    service.completionDescription = description;
    service.warrantyPeriod = warranty;
    
    // Generate Service Completion Invoice automatically (goes to main invoice list)
    if (window.InvoiceModule) {
        const completionInvoice = InvoiceModule.generateServiceCompletionInvoice(service);
        if (completionInvoice) {
            service.completionInvoiceGenerated = true;
            service.completionInvoiceId = completionInvoice.id;
        }
    }
    
    renderServiceTable();
    updateDashboard();
    closeModal('serviceCompletionModal');
    document.getElementById('serviceCompletionModal').remove();
    
    Utils.showNotification('Service completed successfully! Completion invoice generated.');
}

/**
 * View service acknowledgement (separate tracking)
 */
function viewServiceAcknowledgement(serviceId) {
    if (!window.InvoiceModule) {
        Utils.showNotification('Invoice module not available.');
        return;
    }
    
    InvoiceModule.viewServiceAcknowledgement(serviceId);
}

/**
 * View service completion invoice (from main invoice list)
 */
function viewServiceCompletionInvoice(serviceId) {
    if (!window.InvoiceModule) {
        Utils.showNotification('Invoice module not available.');
        return;
    }
    
    const invoices = InvoiceModule.getInvoicesForTransaction(serviceId, 'service');
    const completionInvoice = invoices.find(inv => inv.type === 'Service Completion');
    
    if (completionInvoice) {
        InvoiceModule.viewInvoice(completionInvoice.id);
    } else {
        Utils.showNotification('No completion invoice found for this service.');
    }
}

/**
 * Delete service request
 */
function deleteService(serviceId) {
    if (!AuthModule.hasPermission('service')) {
        Utils.showNotification('You do not have permission to delete service requests.');
        return;
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) {
        Utils.showNotification('Service request not found.');
        return;
    }

    if (confirm(`Are you sure you want to delete the service request for ${service.watchName}?`)) {
        // Decrease customer service count
        CustomerModule.decrementCustomerServices(service.customerId);
        
        // Remove from services array
        services = services.filter(s => s.id !== serviceId);
        
        renderServiceTable();
        updateDashboard();
        Utils.showNotification('Service request deleted successfully!');
    }
}

/**
 * Add note to service
 */
function addServiceNote(serviceId, note) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        service.notes.push({
            note: note,
            timestamp: Utils.getCurrentTimestamp(),
            addedBy: AuthModule.getCurrentUser().username
        });
        Utils.showNotification('Note added to service request');
    }
}

/**
 * Set estimated delivery date
 */
function setEstimatedDelivery(serviceId, deliveryDate) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        service.estimatedDelivery = deliveryDate;
        renderServiceTable();
        Utils.showNotification('Estimated delivery date updated');
    }
}

/**
 * Get service by ID
 */
function getServiceById(serviceId) {
    return services.find(s => s.id === serviceId);
}

/**
 * Get pending services
 */
function getPendingServices(limit = 5) {
    return services
        .filter(s => s.status === 'pending')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

/**
 * Get services by status
 */
function getServicesByStatus(status) {
    return services.filter(s => s.status === status);
}

/**
 * Get incomplete services (all non-completed services)
 */
function getIncompleteServices(limit = 5) {
    return services
        .filter(s => s.status !== 'completed')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

/**
 * Get service statistics
 */
function getServiceStats() {
    const totalServices = services.length;
    const pendingServices = services.filter(s => s.status === 'pending').length;
    const inProgressServices = services.filter(s => s.status === 'in-progress').length;
    const onHoldServices = services.filter(s => s.status === 'on-hold').length;
    const completedServices = services.filter(s => s.status === 'completed').length;
    const incompleteServices = totalServices - completedServices;
    const totalRevenue = services.filter(s => s.status === 'completed')
        .reduce((sum, service) => sum + service.cost, 0);
    const averageServiceCost = totalServices > 0 ? 
        services.reduce((sum, service) => sum + service.cost, 0) / totalServices : 0;
    
    return {
        totalServices,
        pendingServices,
        inProgressServices,
        onHoldServices,
        completedServices,
        incompleteServices,
        totalRevenue,
        averageServiceCost
    };
}

/**
 * Filter services by date range
 */
function filterServicesByDateRange(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return services.filter(service => {
        const serviceDate = new Date(service.timestamp);
        return serviceDate >= from && serviceDate <= to;
    });
}

/**
 * Filter services by month and year
 */
function filterServicesByMonth(month, year) {
    return services.filter(service => {
        const serviceDate = new Date(service.timestamp);
        return serviceDate.getMonth() === parseInt(month) && serviceDate.getFullYear() === parseInt(year);
    });
}

/**
 * Get services by customer
 */
function getServicesByCustomer(customerId) {
    return services.filter(service => service.customerId === customerId);
}

/**
 * Search services
 */
function searchServices(query) {
    const tbody = document.getElementById('serviceTableBody');
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
 * Render service table
 */
function renderServiceTable() {
    const tbody = document.getElementById('serviceTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort services by date (newest first)
    const sortedServices = services.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedServices.forEach((service, index) => {
        const row = document.createElement('tr');
        
        // Create action buttons based on status
        let actionButtons = '';
        if (service.status === 'pending') {
            actionButtons = `
                <button class="btn btn-success" onclick="updateServiceStatus(${service.id}, 'in-progress')">Start</button>
                <button class="btn" onclick="updateServiceStatus(${service.id}, 'on-hold')">Hold</button>
            `;
        } else if (service.status === 'in-progress') {
            actionButtons = `
                <button class="btn btn-success" onclick="updateServiceStatus(${service.id}, 'completed')">Complete</button>
                <button class="btn" onclick="updateServiceStatus(${service.id}, 'on-hold')">Hold</button>
            `;
        } else if (service.status === 'on-hold') {
            actionButtons = `
                <button class="btn btn-success" onclick="updateServiceStatus(${service.id}, 'in-progress')">Resume</button>
            `;
        }
        
        // Add invoice view buttons
        const hasAcknowledgement = service.acknowledgementGenerated;
        
        const hasCompletionInvoice = window.InvoiceModule && 
            InvoiceModule.getInvoicesForTransaction(service.id, 'service')
                .some(inv => inv.type === 'Service Completion');
        
        actionButtons += `
            <button class="btn" onclick="editService(${service.id})" 
                ${!AuthModule.hasPermission('service') ? 'disabled' : ''}>Edit</button>
            <button class="btn btn-danger" onclick="confirmTransaction('Are you sure you want to delete this service request?', () => deleteService(${service.id}))" 
                ${!AuthModule.hasPermission('service') ? 'disabled' : ''}>Delete</button>
        `;
        
        if (hasAcknowledgement) {
            actionButtons += `
                <button class="btn btn-success" onclick="viewServiceAcknowledgement(${service.id})" title="View Acknowledgement">Receipt</button>
            `;
        }
        
        if (hasCompletionInvoice) {
            actionButtons += `
                <button class="btn btn-success" onclick="viewServiceCompletionInvoice(${service.id})" title="View Completion Invoice">Invoice</button>
            `;
        }
        
        row.innerHTML = `
            <td class="serial-number">${index + 1}</td>
            <td>${Utils.sanitizeHtml(service.date)}</td>
            <td>${Utils.sanitizeHtml(service.time)}</td>
            <td>${Utils.sanitizeHtml(service.customerName)}</td>
            <td>
                <strong>${Utils.sanitizeHtml(service.watchName)}</strong><br>
                <small>${Utils.sanitizeHtml(service.brand)} ${Utils.sanitizeHtml(service.model)}</small>
            </td>
            <td>
                <small>
                    <strong>Dial:</strong> ${Utils.sanitizeHtml(service.dialColor)}<br>
                    <strong>Movement:</strong> ${Utils.sanitizeHtml(service.movementNo)}<br>
                    <strong>Gender:</strong> ${Utils.sanitizeHtml(service.gender)}<br>
                    <strong>Case:</strong> ${Utils.sanitizeHtml(service.caseType)}<br>
                    <strong>Strap:</strong> ${Utils.sanitizeHtml(service.strapType)}
                </small>
            </td>
            <td>${Utils.sanitizeHtml(service.issue)}</td>
            <td><span class="status ${service.status}">${service.status}</span></td>
            <td>${Utils.formatCurrency(service.cost)}</td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Export services data (placeholder)
 */
function exportServices(format = 'csv') {
    Utils.showNotification(`Export to ${format.toUpperCase()} functionality coming soon!`);
    // TODO: Implement export functionality
}

/**
 * Initialize service module
 */
function initializeServices() {
    renderServiceTable();
    console.log('Service module initialized');
}

// Load modal template for services
function loadServiceModal() {
    const modalHtml = `
        <!-- New Service Modal -->
        <div id="newServiceModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal('newServiceModal')">&times;</span>
                <h2>New Service Request</h2>
                <form onsubmit="ServiceModule.addNewService(event)">
                    <div class="form-group">
                        <label>Customer:</label>
                        <select id="serviceCustomer" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Watch Brand:</label>
                            <input type="text" id="serviceBrand" required placeholder="e.g., Rolex, Omega">
                        </div>
                        <div class="form-group">
                            <label>Watch Model:</label>
                            <input type="text" id="serviceModel" required placeholder="e.g., Submariner, Speedmaster">
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Dial Colour:</label>
                            <input type="text" id="serviceDialColor" required placeholder="e.g., Black, White, Blue">
                        </div>
                        <div class="form-group">
                            <label>Movement No:</label>
                            <input type="text" id="serviceMovementNo" required placeholder="e.g., 3135, 1861">
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Gender:</label>
                            <select id="serviceGender" required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Case Material:</label>
                            <select id="serviceCase" required>
                                <option value="">Select Case</option>
                                <option value="Steel">Steel</option>
                                <option value="Gold Tone">Gold Tone</option>
                                <option value="Fiber">Fiber</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label>Strap Material:</label>
                            <select id="serviceStrap" required>
                                <option value="">Select Strap</option>
                                <option value="Leather">Leather</option>
                                <option value="Fiber">Fiber</option>
                                <option value="Steel">Steel</option>
                                <option value="Gold Plated">Gold Plated</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Estimated Cost (₹):</label>
                            <input type="number" id="serviceCost" required min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Issue Description:</label>
                        <textarea id="serviceIssue" rows="3" required placeholder="Describe the problem with the watch..."></textarea>
                    </div>
                    <button type="submit" class="btn">Create Service Request</button>
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
        loadServiceModal();
        if (window.ServiceModule) {
            ServiceModule.initializeServices();
        }
    }, 100);
});

// Export functions for global use
window.ServiceModule = {
    openNewServiceModal,
    addNewService,
    updateServiceStatus,
    editService,
    updateService,
    showServiceCompletionModal,
    completeService,
    deleteService,
    addServiceNote,
    setEstimatedDelivery,
    getServiceById,
    getPendingServices,
    getIncompleteServices,
    getServicesByStatus,
    getServiceStats,
    getServicesByCustomer,
    filterServicesByDateRange,
    filterServicesByMonth,
    searchServices,
    renderServiceTable,
    exportServices,
    initializeServices,
    viewServiceAcknowledgement,
    viewServiceCompletionInvoice,
    services // For access by other modules
};

// Make functions globally available
window.closeEditServiceModal = function() {
    const modal = document.getElementById('editServiceModal');
    if (modal) {
        modal.remove();
    }
};

window.viewServiceAcknowledgement = function(serviceId) {
    if (window.ServiceModule) {
        ServiceModule.viewServiceAcknowledgement(serviceId);
    }
};

window.viewServiceCompletionInvoice = function(serviceId) {
    if (window.ServiceModule) {
        ServiceModule.viewServiceCompletionInvoice(serviceId);
    }
};

window.searchServices = function(query) {
    if (window.ServiceModule) {
        ServiceModule.searchServices(query);
    }
};