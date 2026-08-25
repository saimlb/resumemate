const API_URL = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function isAuthenticated() {
    return !!getToken();
}

function redirectToDashboard() {
    window.location.href = '/dashboard';
}

function redirectToLogin() {
    window.location.href = '/';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast';
        document.body.appendChild(newToast);
    }
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 4000);
}

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la solicitud');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function login(email, password) {
    const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    return data;
}

async function register(name, email, password) {
    const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
    setToken(data.token);
    setUser(data.user);
    return data;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function getUserProfile() {
    const data = await apiCall('/auth/me');
    return data;
}

async function getCredits() {
    const data = await apiCall('/credits/balance');
    return data;
}

async function purchaseCredits(plan) {
    const data = await apiCall('/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ plan })
    });
    return data;
}

async function analyzeResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    
    const data = await apiCall('/resume/analyze', {
        method: 'POST',
        body: formData
    });
    return data;
}

async function getHistory() {
    const data = await apiCall('/resume/history');
    return data;
}