// API Configuration
const API_BASE = window.location.origin;
let authToken = localStorage.getItem('authToken');

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showLogin();
    }
});

// Authentication
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Verification error:', error);
        showLogin();
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showDashboard();
            loadDashboardData();
        } else {
            const error = await response.json();
            showError('loginError', error.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Connection error');
    }
});

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    showLogin();
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').classList.add('active');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="alert alert-error">${message}</div>`;
    setTimeout(() => { element.innerHTML = ''; }, 5000);
}

// Dashboard Functions
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadUsers(),
        loadStreams(),
        loadVOD(),
        loadCategories()
    ]);
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('statUsers').textContent = stats.users;
            document.getElementById('statActiveUsers').textContent = stats.activeUsers;
            document.getElementById('statStreams').textContent = stats.liveStreams;
            document.getElementById('statVOD').textContent = stats.vodStreams;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const users = await response.json();
            renderUsersTable(users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email || '-'}</td>
            <td>${user.status}</td>
            <td>${user.exp_date || 'Never'}</td>
            <td>${user.max_connections}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadStreams() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/live-streams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const streams = await response.json();
            renderStreamsTable(streams);
        }
    } catch (error) {
        console.error('Error loading streams:', error);
    }
}

function renderStreamsTable(streams) {
    const tbody = document.querySelector('#streamsTable tbody');
    tbody.innerHTML = streams.map(stream => `
        <tr>
            <td>${stream.id}</td>
            <td>${stream.name}</td>
            <td>${stream.category_name || 'Uncategorized'}</td>
            <td>${stream.status}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editStream(${stream.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStream(${stream.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadVOD() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/vod`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const vods = await response.json();
            renderVODTable(vods);
        }
    } catch (error) {
        console.error('Error loading VOD:', error);
    }
}

function renderVODTable(vods) {
    const tbody = document.querySelector('#vodTable tbody');
    tbody.innerHTML = vods.map(vod => `
        <tr>
            <td>${vod.id}</td>
            <td>${vod.name}</td>
            <td>${vod.category_name || 'Uncategorized'}</td>
            <td>${vod.rating || 'N/A'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editVOD(${vod.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteVOD(${vod.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const categories = await response.json();
            renderCategoriesTable(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderCategoriesTable(categories) {
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${cat.id}</td>
            <td>${cat.name}</td>
            <td>${cat.type}</td>
            <td class="actions">
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Tab Management
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// CRUD Operations (simplified - would need modals for full implementation)
function showAddUserModal() {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');
    if (username && password) {
        addUser({ username, password, maxConnections: 1 });
    }
}

async function addUser(data) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('User added successfully');
            loadUsers();
            loadStats();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Connection error');
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            alert('User deleted');
            loadUsers();
            loadStats();
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

function showAddStreamModal() {
    const name = prompt('Enter stream name:');
    const url = prompt('Enter stream URL:');
    if (name && url) {
        addStream({ name, stream_url: url, status: 'active' });
    }
}

async function addStream(data) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/live-streams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Stream added successfully');
            loadStreams();
            loadStats();
        }
    } catch (error) {
        console.error('Error adding stream:', error);
    }
}

async function deleteStream(id) {
    if (!confirm('Delete this stream?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/live-streams/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            alert('Stream deleted');
            loadStreams();
            loadStats();
        }
    } catch (error) {
        console.error('Error deleting stream:', error);
    }
}

function showAddVODModal() {
    alert('VOD management coming soon');
}

function showAddCategoryModal() {
    const name = prompt('Enter category name:');
    const type = prompt('Enter type (live/vod):');
    if (name && type) {
        addCategory({ name, type });
    }
}

async function addCategory(data) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Category added successfully');
            loadCategories();
        }
    } catch (error) {
        console.error('Error adding category:', error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;

    try {
        const response = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            alert('Category deleted');
            loadCategories();
        }
    } catch (error) {
        console.error('Error deleting category:', error);
    }
}

// Placeholder functions for edit
function editUser(id) { alert('Edit user: ' + id); }
function editStream(id) { alert('Edit stream: ' + id); }
function editVOD(id) { alert('Edit VOD: ' + id); }
function deleteVOD(id) { alert('Delete VOD: ' + id); }
