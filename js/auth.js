// ZEDSON WATCHCRAFT - Authentication Module

/**
 * Authentication and User Management System
 */

// Current logged-in user
let currentUser = null;

// User database (in production, this would be in a backend database)
let users = [
    { 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        fullName: 'System Administrator', 
        email: 'admin@zedsonwatchcraft.com', 
        status: 'active', 
        created: '2024-01-01', 
        lastLogin: 'Today' 
    },
    { 
        username: 'owner', 
        password: 'owner123', 
        role: 'owner', 
        fullName: 'Shop Owner', 
        email: 'owner@zedsonwatchcraft.com', 
        status: 'active', 
        created: '2024-01-01', 
        lastLogin: 'Yesterday' 
    },
    { 
        username: 'staff', 
        password: 'staff123', 
        role: 'staff', 
        fullName: 'Staff Member', 
        email: 'staff@zedsonwatchcraft.com', 
        status: 'active', 
        created: '2024-01-01', 
        lastLogin: '2 days ago' 
    }
];

// User permissions configuration
const permissions = {
    admin: ['dashboard', 'inventory', 'customers', 'sales', 'service', 'invoices', 'users'],
    owner: ['dashboard', 'inventory', 'customers', 'sales', 'service', 'invoices'],
    staff: ['dashboard', 'inventory', 'customers', 'sales', 'service', 'invoices']
};

/**
 * Handle user login
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate input
    if (!username || !password) {
        Utils.showNotification('Please enter both username and password.');
        return;
    }
    
    // Find user
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user && user.status === 'active') {
        // Successful login
        currentUser = user;
        
        // Update user info display
        document.getElementById('currentUser').textContent = `Welcome, ${user.fullName}`;
        document.getElementById('currentUserRole').textContent = user.role.toUpperCase();
        
        // Hide login screen and show main app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').classList.add('logged-in');
        
        // Setup navigation based on user role
        setupNavigation();
        
        // Update last login
        user.lastLogin = 'Just now';
        
        // Update user table if admin is logged in
        if (user.role === 'admin') {
            updateUserTable();
        }
        
        console.log('Login successful:', user);
        Utils.showNotification(`Welcome back, ${user.fullName}!`);
    } else {
        Utils.showNotification('Invalid username or password, or account is inactive.');
    }
}

/**
 * User logout
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        
        // Show login screen and hide main app
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').classList.remove('logged-in');
        
        // Clear login form
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        
        console.log('User logged out');
    }
}

/**
 * Check if current user has permission for a section
 */
function hasPermission(section) {
    if (!currentUser) return false;
    return permissions[currentUser.role].includes(section);
}

/**
 * Setup navigation based on user role
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const userPermissions = permissions[currentUser.role];
    
    navButtons.forEach(button => {
        const section = button.onclick.toString().match(/showSection\('(.+?)'/);
        if (section && section[1]) {
            const sectionName = section[1];
            if (userPermissions.includes(sectionName)) {
                button.style.display = 'inline-block';
            } else {
                button.style.display = 'none';
            }
        }
    });

    // Show user management button only for admin
    const userMgmtBtn = document.getElementById('userManagementBtn');
    if (currentUser.role === 'admin') {
        userMgmtBtn.style.display = 'inline-block';
    } else {
        userMgmtBtn.style.display = 'none';
    }

    // Show first available section
    const firstAvailableSection = userPermissions[0];
    if (firstAvailableSection && window.showSection) {
        showSection(firstAvailableSection);
        
        // Activate corresponding nav button
        navButtons.forEach(btn => {
            const section = btn.onclick.toString().match(/showSection\('(.+?)'/);
            if (section && section[1] === firstAvailableSection) {
                btn.classList.add('active');
            }
        });
    }
}

/**
 * Open Add User Modal (Admin only)
 */
function openAddUserModal() {
    if (currentUser.role !== 'admin') {
        Utils.showNotification('Only administrators can add new users.');
        return;
    }
    document.getElementById('addUserModal').style.display = 'block';
}

/**
 * Add new user (Admin only)
 */
function addNewUser(event) {
    event.preventDefault();
    
    if (currentUser.role !== 'admin') {
        Utils.showNotification('Only administrators can add new users.');
        return;
    }

    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newUserRole').value;
    const fullName = document.getElementById('newUserFullName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();

    // Validate input
    if (!username || !password || !role || !fullName || !email) {
        Utils.showNotification('Please fill in all required fields.');
        return;
    }

    // Validate email format
    if (!Utils.validateEmail(email)) {
        Utils.showNotification('Please enter a valid email address.');
        return;
    }

    // Check if username already exists
    if (users.find(u => u.username === username)) {
        Utils.showNotification('Username already exists. Please choose a different username.');
        return;
    }

    // Check if email already exists
    if (users.find(u => u.email === email)) {
        Utils.showNotification('Email already exists. Please use a different email.');
        return;
    }

    const newUser = {
        username: username,
        password: password,
        role: role,
        fullName: fullName,
        email: email,
        status: 'active',
        created: Utils.formatDate(new Date()),
        lastLogin: 'Never'
    };

    users.push(newUser);
    updateUserTable();
    closeModal('addUserModal');
    event.target.reset();
    Utils.showNotification('User added successfully!');
}

/**
 * Update user table display
 */
function updateUserTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach((user, index) => {
        const roleClass = user.role === 'admin' ? 'available' : user.role === 'owner' ? 'in-progress' : 'pending';
        const statusClass = user.status === 'active' ? 'completed' : 'pending';
        const canDelete = currentUser.username !== user.username && user.role !== 'admin';
        
        tbody.innerHTML += `
            <tr>
                <td class="serial-number">${index + 1}</td>
                <td>${Utils.sanitizeHtml(user.username)}</td>
                <td><span class="status ${roleClass}">${Utils.sanitizeHtml(user.role)}</span></td>
                <td><span class="status ${statusClass}">${Utils.sanitizeHtml(user.status)}</span></td>
                <td>${Utils.sanitizeHtml(user.created)}</td>
                <td>${Utils.sanitizeHtml(user.lastLogin)}</td>
                <td>
                    <button class="btn" onclick="editUser('${user.username}')">Edit</button>
                    <button class="btn btn-danger" onclick="confirmTransaction('Are you sure you want to delete user ${user.username}?', () => deleteUser('${user.username}'))" ${!canDelete ? 'disabled' : ''}>Delete</button>
                </td>
            </tr>
        `;
    });
}

/**
 * Edit user
 */
function editUser(username) {
    if (currentUser.role !== 'admin') {
        Utils.showNotification('Only administrators can edit users.');
        return;
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        Utils.showNotification('User not found.');
        return;
    }

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editUserModal';
    editModal.style.display = 'block';
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('editUserModal')">&times;</span>
            <h2>Edit User: ${user.username}</h2>
            <form onsubmit="AuthModule.updateUser(event, '${username}')">
                <div class="form-group">
                    <label>Full Name:</label>
                    <input type="text" id="editUserFullName" value="${user.fullName}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editUserEmail" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Role:</label>
                    <select id="editUserRole" required>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="owner" ${user.role === 'owner' ? 'selected' : ''}>Owner</option>
                        <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status:</label>
                    <select id="editUserStatus" required>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <button type="submit" class="btn">Update User</button>
                <button type="button" class="btn btn-danger" onclick="closeModal('editUserModal')">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
}

/**
 * Update user
 */
function updateUser(event, username) {
    event.preventDefault();
    
    const user = users.find(u => u.username === username);
    if (!user) {
        Utils.showNotification('User not found.');
        return;
    }

    const fullName = document.getElementById('editUserFullName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const role = document.getElementById('editUserRole').value;
    const status = document.getElementById('editUserStatus').value;

    // Validate input
    if (!fullName || !email || !role || !status) {
        Utils.showNotification('Please fill in all fields.');
        return;
    }

    // Check if email already exists (excluding current user)
    if (users.find(u => u.email === email && u.username !== username)) {
        Utils.showNotification('Email already exists. Please use a different email.');
        return;
    }

    // Update user
    user.fullName = fullName;
    user.email = email;
    user.role = role;
    user.status = status;

    updateUserTable();
    closeModal('editUserModal');
    document.getElementById('editUserModal').remove();
    Utils.showNotification('User updated successfully!');
}

/**
 * Delete user (Admin only)
 */
function deleteUser(username) {
    if (currentUser.role !== 'admin') {
        Utils.showNotification('Only administrators can delete users.');
        return;
    }

    if (username === 'admin') {
        Utils.showNotification('Cannot delete the main admin account.');
        return;
    }

    if (username === currentUser.username) {
        Utils.showNotification('Cannot delete your own account.');
        return;
    }

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
        users = users.filter(u => u.username !== username);
        updateUserTable();
        Utils.showNotification('User deleted successfully!');
    }
}

/**
 * Get current user
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return currentUser !== null;
}

// Export functions for global use
window.AuthModule = {
    handleLogin,
    logout,
    hasPermission,
    setupNavigation,
    openAddUserModal,
    addNewUser,
    updateUserTable,
    editUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    isLoggedIn
};