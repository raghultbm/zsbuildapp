// ZEDSON WATCHCRAFT - Invoice Management Module

/**
 * Complete Invoice Generation and Management System
 */

// Invoice database
let invoices = [];
let nextInvoiceId = 1;

/**
 * Generate Sales Invoice (triggered after sale completion)
 */
function generateSalesInvoice(saleData) {
    const customer = CustomerModule.getCustomerById(saleData.customerId);
    const watch = InventoryModule.getWatchById(saleData.watchId);
    
    if (!customer || !watch) {
        Utils.showNotification('Customer or watch data not found for invoice generation');
        return null;
    }

    const invoiceData = {
        id: nextInvoiceId++,
        invoiceNo: Utils.generateBillNumber('Sales'),
        type: 'Sales',
        subType: 'Sales Invoice',
        date: Utils.formatDate(new Date()),
        timestamp: Utils.getCurrentTimestamp(),
        customerId: saleData.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address || '',
        relatedId: saleData.id,
        relatedType: 'sale',
        amount: saleData.totalAmount,
        status: 'generated',
        createdBy: AuthModule.getCurrentUser().username,
        
        // Sales specific data
        watchName: saleData.watchName,
        watchCode: saleData.watchCode,
        quantity: saleData.quantity,
        price: saleData.price,
        paymentMethod: saleData.paymentMethod,
        discount: 0
    };

    invoices.push(invoiceData);
    renderInvoiceTable();
    updateDashboard();
    
    Utils.showNotification('Sales invoice generated successfully!');
    return invoiceData;
}

/**
 * Generate Service Acknowledgement Invoice (triggered when service is initiated)
 */
function generateServiceAcknowledgement(serviceData) {
    const customer = CustomerModule.getCustomerById(serviceData.customerId);
    
    if (!customer) {
        Utils.showNotification('Customer data not found for acknowledgement generation');
        return null;
    }

    const invoiceData = {
        id: nextInvoiceId++,
        invoiceNo: Utils.generateBillNumber('ACK'),
        type: 'Service Acknowledgement',
        subType: 'Watch Received',
        date: Utils.formatDate(new Date()),
        timestamp: Utils.getCurrentTimestamp(),
        customerId: serviceData.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address || '',
        relatedId: serviceData.id,
        relatedType: 'service',
        amount: 0, // No amount for acknowledgement
        status: 'generated',
        createdBy: AuthModule.getCurrentUser().username,
        
        // Service specific data
        watchName: serviceData.watchName,
        brand: serviceData.brand,
        model: serviceData.model,
        dialColor: serviceData.dialColor,
        movementNo: serviceData.movementNo,
        gender: serviceData.gender,
        caseType: serviceData.caseType,
        strapType: serviceData.strapType,
        issue: serviceData.issue,
        estimatedCost: serviceData.cost
    };

    invoices.push(invoiceData);
    renderInvoiceTable();
    updateDashboard();
    
    Utils.showNotification('Service acknowledgement generated successfully!');
    return invoiceData;
}

/**
 * Generate Service Completion Invoice (triggered when service is completed)
 */
function generateServiceCompletionInvoice(serviceData) {
    const customer = CustomerModule.getCustomerById(serviceData.customerId);
    
    if (!customer) {
        Utils.showNotification('Customer data not found for completion invoice generation');
        return null;
    }

    const invoiceData = {
        id: nextInvoiceId++,
        invoiceNo: Utils.generateBillNumber('SVC'),
        type: 'Service Completion',
        subType: 'Service Bill',
        date: Utils.formatDate(new Date()),
        timestamp: Utils.getCurrentTimestamp(),
        customerId: serviceData.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address || '',
        relatedId: serviceData.id,
        relatedType: 'service',
        amount: serviceData.cost,
        status: 'generated',
        createdBy: AuthModule.getCurrentUser().username,
        
        // Service specific data
        watchName: serviceData.watchName,
        brand: serviceData.brand,
        model: serviceData.model,
        dialColor: serviceData.dialColor,
        movementNo: serviceData.movementNo,
        gender: serviceData.gender,
        caseType: serviceData.caseType,
        strapType: serviceData.strapType,
        issue: serviceData.issue,
        workPerformed: serviceData.completionDescription || '',
        warrantyPeriod: serviceData.warrantyPeriod || 0,
        completionDate: serviceData.actualDelivery || Utils.formatDate(new Date())
    };

    invoices.push(invoiceData);
    renderInvoiceTable();
    updateDashboard();
    
    Utils.showNotification('Service completion invoice generated successfully!');
    return invoiceData;
}

/**
 * View Invoice (Read-only)
 */
function viewInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        Utils.showNotification('Invoice not found');
        return;
    }

    const logoHTML = `
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; gap: 15px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #1a237e 0%, #283593 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 4px 20px rgba(26, 35, 126, 0.3);">
                <div style="position: absolute; width: 65px; height: 65px; border: 3px dashed #ffd700; border-radius: 50%;"></div>
                <div style="width: 35px; height: 35px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="position: absolute; width: 2px; height: 12px; background: #1a237e; transform-origin: bottom; transform: rotate(45deg);"></div>
                    <div style="position: absolute; width: 2px; height: 8px; background: #ffd700; transform-origin: bottom; transform: rotate(-30deg);"></div>
                </div>
            </div>
            <div>
                <h1 style="color: #1a237e; margin: 0; font-size: 2.5em; font-weight: 700; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);">ZEDSON</h1>
                <div style="color: #ffd700; font-size: 1.2em; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">WATCHCRAFT</div>
            </div>
        </div>
    `;

    let invoiceHTML = '';

    if (invoice.type === 'Sales') {
        invoiceHTML = createSalesInvoiceHTML(logoHTML, invoice);
    } else if (invoice.type === 'Service Acknowledgement') {
        invoiceHTML = createServiceAcknowledgementHTML(logoHTML, invoice);
    } else if (invoice.type === 'Service Completion') {
        invoiceHTML = createServiceCompletionHTML(logoHTML, invoice);
    }

    document.getElementById('invoicePreviewContent').innerHTML = invoiceHTML;
    document.getElementById('invoicePreviewModal').style.display = 'block';
}

/**
 * Create Sales Invoice HTML
 */
function createSalesInvoiceHTML(logoHTML, invoice) {
    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 30px; font-family: Arial, sans-serif; border: 3px solid #1a237e; border-radius: 15px; background: white;">
            ${logoHTML}
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: #1a237e; margin: 10px 0; font-size: 1.8em; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #ffd700; display: inline-block; padding-bottom: 10px;">SALES INVOICE</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #1a237e;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">CUSTOMER DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${Utils.sanitizeHtml(invoice.customerName)}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${Utils.sanitizeHtml(invoice.customerPhone)}</p>
                    <p style="margin: 8px 0;"><strong>Address:</strong> ${Utils.sanitizeHtml(invoice.customerAddress)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #ffd700;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">INVOICE DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Invoice No:</strong> ${Utils.sanitizeHtml(invoice.invoiceNo)}</p>
                    <p style="margin: 8px 0;"><strong>Date:</strong> ${Utils.sanitizeHtml(invoice.date)}</p>
                    <p style="margin: 8px 0;"><strong>Payment:</strong> ${Utils.sanitizeHtml(invoice.paymentMethod)}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: linear-gradient(45deg, #1a237e, #283593); color: white;">
                            <th style="border: 1px solid #ddd; padding: 15px; text-align: left;">Quantity</th>
                            <th style="border: 1px solid #ddd; padding: 15px; text-align: left;">Watch Details</th>
                            <th style="border: 1px solid #ddd; padding: 15px; text-align: right;">Rate (₹)</th>
                            <th style="border: 1px solid #ddd; padding: 15px; text-align: right;">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #f9f9f9;">
                            <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">${invoice.quantity}</td>
                            <td style="border: 1px solid #ddd; padding: 15px;">
                                <strong>${Utils.sanitizeHtml(invoice.watchName)}</strong><br>
                                <small>Code: ${Utils.sanitizeHtml(invoice.watchCode)}</small>
                            </td>
                            <td style="border: 1px solid #ddd; padding: 15px; text-align: right;">${Utils.formatCurrency(invoice.price)}</td>
                            <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; background: linear-gradient(135deg, #e8f5e8, #c8e6c9); color: #2e7d32;">${Utils.formatCurrency(invoice.amount)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="text-align: right; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #1a237e, #283593); color: white; border-radius: 10px;">
                <p style="font-size: 1.4em; font-weight: bold; margin: 0;">
                    TOTAL AMOUNT: ${Utils.formatCurrency(invoice.amount)}
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #f5f5f5, #eeeeee); border-radius: 10px; border: 2px dashed #1a237e;">
                <p style="margin: 5px 0; font-size: 1.1em; color: #1a237e; font-weight: 600;">Thank you for your business!</p>
                <p style="margin: 5px 0; font-size: 0.95em; color: #666;">ZEDSON WATCHCRAFT - Your trusted watch partner</p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #888;">Contact: +91-XXXXXXXXXX | Email: info@zedsonwatchcraft.com</p>
            </div>
        </div>
    `;
}

/**
 * Create Service Acknowledgement HTML
 */
function createServiceAcknowledgementHTML(logoHTML, invoice) {
    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 30px; font-family: Arial, sans-serif; border: 3px solid #1a237e; border-radius: 15px; background: white;">
            ${logoHTML}
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: #1a237e; margin: 10px 0; font-size: 1.8em; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #ffd700; display: inline-block; padding-bottom: 10px;">SERVICE ACKNOWLEDGEMENT</h3>
                <p style="color: #666; font-size: 1.1em; margin: 10px 0;">Watch Received for Service</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #1a237e;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">CUSTOMER DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${Utils.sanitizeHtml(invoice.customerName)}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${Utils.sanitizeHtml(invoice.customerPhone)}</p>
                    <p style="margin: 8px 0;"><strong>Address:</strong> ${Utils.sanitizeHtml(invoice.customerAddress)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #ffd700;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">ACKNOWLEDGEMENT DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Receipt No:</strong> ${Utils.sanitizeHtml(invoice.invoiceNo)}</p>
                    <p style="margin: 8px 0;"><strong>Received Date:</strong> ${Utils.sanitizeHtml(invoice.date)}</p>
                    <p style="margin: 8px 0;"><strong>Estimated Cost:</strong> ${Utils.formatCurrency(invoice.estimatedCost)}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 30px; background: linear-gradient(135deg, #f0f4ff 0%, #e1f5fe 100%); padding: 25px; border-radius: 12px; border: 2px solid #1a237e;">
                <h4 style="color: #1a237e; border-bottom: 3px solid #ffd700; padding-bottom: 8px; margin-top: 0; text-align: center; font-size: 1.2em;">WATCH DETAILS RECEIVED</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Watch:</strong> ${Utils.sanitizeHtml(invoice.watchName)}</p>
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Dial Color:</strong> ${Utils.sanitizeHtml(invoice.dialColor)}</p>
                        <p style="margin: 8px 0; padding: 5px 0;"><strong style="color: #1a237e;">Movement No:</strong> ${Utils.sanitizeHtml(invoice.movementNo)}</p>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Gender:</strong> ${Utils.sanitizeHtml(invoice.gender)}</p>
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Case:</strong> ${Utils.sanitizeHtml(invoice.caseType)}</p>
                        <p style="margin: 8px 0; padding: 5px 0;"><strong style="color: #1a237e;">Strap:</strong> ${Utils.sanitizeHtml(invoice.strapType)}</p>
                    </div>
                </div>
                <div style="margin-top: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin: 0;"><strong style="color: #1a237e;">Reported Issue:</strong></p>
                    <p style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #1a237e; border-radius: 4px;">${Utils.sanitizeHtml(invoice.issue)}</p>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); padding: 20px; border-radius: 10px; border: 2px solid #856404; margin-bottom: 20px;">
                <h4 style="color: #856404; margin-top: 0; text-align: center;">IMPORTANT TERMS & CONDITIONS</h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>This acknowledgement confirms receipt of your watch for service</li>
                    <li>Estimated repair time: 7-14 working days</li>
                    <li>Final cost may vary based on actual repair requirements</li>
                    <li>Please bring this receipt when collecting your watch</li>
                    <li>Watch will be held for 90 days after completion notification</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #f5f5f5, #eeeeee); border-radius: 10px; border: 2px dashed #1a237e;">
                <p style="margin: 5px 0; font-size: 1.1em; color: #1a237e; font-weight: 600;">Thank you for trusting us with your timepiece!</p>
                <p style="margin: 5px 0; font-size: 0.95em; color: #666;">ZEDSON WATCHCRAFT - Expert watch servicing</p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #888;">Contact: +91-XXXXXXXXXX | Email: info@zedsonwatchcraft.com</p>
            </div>
        </div>
    `;
}

/**
 * Create Service Completion Invoice HTML
 */
function createServiceCompletionHTML(logoHTML, invoice) {
    return `
        <div style="max-width: 800px; margin: 0 auto; padding: 30px; font-family: Arial, sans-serif; border: 3px solid #1a237e; border-radius: 15px; background: white;">
            ${logoHTML}
            
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: #1a237e; margin: 10px 0; font-size: 1.8em; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #ffd700; display: inline-block; padding-bottom: 10px;">SERVICE COMPLETION INVOICE</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #1a237e;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">CUSTOMER DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${Utils.sanitizeHtml(invoice.customerName)}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${Utils.sanitizeHtml(invoice.customerPhone)}</p>
                    <p style="margin: 8px 0;"><strong>Address:</strong> ${Utils.sanitizeHtml(invoice.customerAddress)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #ffd700;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #ffd700; padding-bottom: 5px; margin-top: 0;">INVOICE DETAILS</h4>
                    <p style="margin: 8px 0;"><strong>Invoice No:</strong> ${Utils.sanitizeHtml(invoice.invoiceNo)}</p>
                    <p style="margin: 8px 0;"><strong>Completion Date:</strong> ${Utils.sanitizeHtml(invoice.completionDate)}</p>
                    <p style="margin: 8px 0;"><strong>Warranty:</strong> ${invoice.warrantyPeriod} months</p>
                </div>
            </div>
            
            <div style="margin-bottom: 30px; background: linear-gradient(135deg, #f0f4ff 0%, #e1f5fe 100%); padding: 25px; border-radius: 12px; border: 2px solid #1a237e;">
                <h4 style="color: #1a237e; border-bottom: 3px solid #ffd700; padding-bottom: 8px; margin-top: 0; text-align: center; font-size: 1.2em;">WATCH SERVICE DETAILS</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 20px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Watch:</strong> ${Utils.sanitizeHtml(invoice.watchName)}</p>
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Dial Color:</strong> ${Utils.sanitizeHtml(invoice.dialColor)}</p>
                        <p style="margin: 8px 0; padding: 5px 0;"><strong style="color: #1a237e;">Movement No:</strong> ${Utils.sanitizeHtml(invoice.movementNo)}</p>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Gender:</strong> ${Utils.sanitizeHtml(invoice.gender)}</p>
                        <p style="margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee;"><strong style="color: #1a237e;">Case:</strong> ${Utils.sanitizeHtml(invoice.caseType)}</p>
                        <p style="margin: 8px 0; padding: 5px 0;"><strong style="color: #1a237e;">Strap:</strong> ${Utils.sanitizeHtml(invoice.strapType)}</p>
                    </div>
                </div>
                <div style="margin-top: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin: 0;"><strong style="color: #1a237e;">Work Performed:</strong></p>
                    <p style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">${Utils.sanitizeHtml(invoice.workPerformed)}</p>
                </div>
            </div>
            
            <div style="text-align: right; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #1a237e, #283593); color: white; border-radius: 10px;">
                <p style="font-size: 1.4em; font-weight: bold; margin: 0;">
                    SERVICE CHARGE: ${Utils.formatCurrency(invoice.amount)}
                </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #d4edda, #c3e6cb); padding: 20px; border-radius: 10px; border: 2px solid #155724; margin-bottom: 20px;">
                <h4 style="color: #155724; margin-top: 0; text-align: center;">WARRANTY INFORMATION</h4>
                <p style="color: #155724; margin: 10px 0; text-align: center; font-size: 1.1em;">
                    <strong>${invoice.warrantyPeriod} Month${invoice.warrantyPeriod > 1 ? 's' : ''} Warranty</strong> on service work performed
                </p>
                <p style="color: #155724; margin: 5px 0; font-size: 0.9em; text-align: center;">
                    Warranty covers the specific work performed. Normal wear and tear not included.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding: 20px; background: linear-gradient(135deg, #f5f5f5, #eeeeee); border-radius: 10px; border: 2px dashed #1a237e;">
                <p style="margin: 5px 0; font-size: 1.1em; color: #1a237e; font-weight: 600;">Thank you for choosing our service!</p>
                <p style="margin: 5px 0; font-size: 0.95em; color: #666;">ZEDSON WATCHCRAFT - Expert watch servicing</p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #888;">Contact: +91-XXXXXXXXXX | Email: info@zedsonwatchcraft.com</p>
            </div>
        </div>
    `;
}

/**
 * Print Invoice - Fixed to prevent logout
 */
function printInvoice() {
    const printContent = document.getElementById('invoicePreviewContent').innerHTML;
    
    // Create a new window for printing instead of replacing body content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ZEDSON WATCHCRAFT - Invoice</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none; }
                    }
                    /* Copy essential styles for printing */
                    .modal-content > div {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 30px;
                        font-family: Arial, sans-serif;
                        border: 3px solid #1a237e;
                        border-radius: 15px;
                        background: white;
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print(); window.close();" style="padding: 10px 20px; background: #1a237e; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
                    <button onclick="window.close();" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Auto-focus the print window
        printWindow.focus();
        
        // Optional: Auto-print after a short delay
        setTimeout(() => {
            printWindow.print();
        }, 250);
        
    } else {
        // Fallback if popup is blocked - use a different approach
        Utils.showNotification('Please allow pop-ups for printing functionality');
        
        // Alternative: Create a hidden iframe for printing
        createPrintFrame(printContent);
    }
}

/**
 * Alternative print method using iframe (fallback)
 */
function createPrintFrame(content) {
    // Remove any existing print frame
    const existingFrame = document.getElementById('printFrame');
    if (existingFrame) {
        existingFrame.remove();
    }
    
    // Create new iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.id = 'printFrame';
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-10000px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ZEDSON WATCHCRAFT - Invoice</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    frameDoc.close();
    
    // Print the frame
    setTimeout(() => {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            
            // Clean up after printing
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 1000);
        } catch (e) {
            console.error('Print error:', e);
            Utils.showNotification('Printing failed. Please try again.');
            document.body.removeChild(printFrame);
        }
    }, 250);
}

/**
 * Search Invoices
 */
function searchInvoices(query) {
    const tbody = document.getElementById('invoiceTableBody');
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
 * Filter Invoices by Type
 */
function filterInvoicesByType() {
    const filterValue = document.getElementById('invoiceTypeFilter').value;
    const tbody = document.getElementById('invoiceTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const typeCell = row.cells[2]; // Type column
        if (typeCell) {
            const typeText = typeCell.textContent.trim();
            if (!filterValue || typeText === filterValue) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Get Invoice Statistics
 */
function getInvoiceStats() {
    const totalInvoices = invoices.length;
    const salesInvoices = invoices.filter(inv => inv.type === 'Sales').length;
    const serviceAcknowledgements = invoices.filter(inv => inv.type === 'Service Acknowledgement').length;
    const serviceCompletions = invoices.filter(inv => inv.type === 'Service Completion').length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    return {
        totalInvoices,
        salesInvoices,
        serviceAcknowledgements,
        serviceCompletions,
        totalRevenue
    };
}

/**
 * Get invoices for a specific sale or service
 */
function getInvoicesForTransaction(transactionId, transactionType) {
    return invoices.filter(inv => inv.relatedId === transactionId && inv.relatedType === transactionType);
}

/**
 * Render Invoice Table
 */
function renderInvoiceTable() {
    const tbody = document.getElementById('invoiceTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort invoices by date (newest first)
    const sortedInvoices = invoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        let details = '';
        if (invoice.type === 'Sales') {
            details = `${invoice.watchName} (${invoice.watchCode})`;
        } else {
            details = `${invoice.watchName} - ${invoice.brand} ${invoice.model}`;
        }
        
        const statusClass = invoice.status === 'generated' ? 'completed' : 'pending';
        
        row.innerHTML = `
            <td class="serial-number">${index + 1}</td>
            <td><strong>${Utils.sanitizeHtml(invoice.invoiceNo)}</strong></td>
            <td><span class="status ${invoice.type.toLowerCase().replace(' ', '-')}">${Utils.sanitizeHtml(invoice.type)}</span></td>
            <td>${Utils.sanitizeHtml(invoice.date)}</td>
            <td>${Utils.sanitizeHtml(invoice.customerName)}</td>
            <td>${Utils.sanitizeHtml(details)}</td>
            <td>${invoice.amount > 0 ? Utils.formatCurrency(invoice.amount) : '-'}</td>
            <td><span class="status ${statusClass}">${Utils.sanitizeHtml(invoice.status)}</span></td>
            <td>
                <button class="btn" onclick="viewInvoice(${invoice.id})" title="View Invoice">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Initialize Invoice Module
 */
function initializeInvoices() {
    renderInvoiceTable();
    console.log('Invoice module initialized');
}

// Export functions for global use
window.InvoiceModule = {
    generateSalesInvoice,
    generateServiceAcknowledgement,
    generateServiceCompletionInvoice,
    viewInvoice,
    printInvoice,
    searchInvoices,
    filterInvoicesByType,
    getInvoiceStats,
    getInvoicesForTransaction,
    renderInvoiceTable,
    initializeInvoices,
    invoices // For access by other modules
};

// Make functions globally available
window.viewInvoice = function(invoiceId) {
    InvoiceModule.viewInvoice(invoiceId);
};

window.printInvoice = function() {
    InvoiceModule.printInvoice();
};

window.searchInvoices = function(query) {
    InvoiceModule.searchInvoices(query);
};

window.filterInvoicesByType = function() {
    InvoiceModule.filterInvoicesByType();
};