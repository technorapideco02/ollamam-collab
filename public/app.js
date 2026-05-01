const API_BASE = '/api';
let authToken = localStorage.getItem('token');

// DOM Elements
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const emailStep = document.getElementById('email-step');
const otpStep = document.getElementById('otp-step');
const emailInput = document.getElementById('email-input');
const otpInput = document.getElementById('otp-input');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const loginMsg = document.getElementById('login-msg');

const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const thinkingIndicator = document.getElementById('thinking-indicator');

const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const closeMenu = document.getElementById('close-menu');
const showChat = document.getElementById('show-chat');
const showApi = document.getElementById('show-api');
const apiPanel = document.getElementById('api-panel');
const closeApi = document.getElementById('close-api');
const logoutBtn = document.getElementById('logout-btn');

// Initial Setup
if (authToken) {
    showChatWindow();
}

// Auth Handlers
sendOtpBtn.onclick = async () => {
    const email = emailInput.value;
    if (!email) return alert('Enter email');
    
    try {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            emailStep.classList.add('hidden');
            otpStep.classList.remove('hidden');
            loginMsg.innerText = 'OTP sent to your email';
        } else {
            loginMsg.innerText = data.message;
        }
    } catch (err) {
        loginMsg.innerText = 'Error sending OTP';
    }
};

verifyOtpBtn.onclick = async () => {
    const email = emailInput.value;
    const otp = otpInput.value;
    
    try {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();
        if (res.ok) {
            authToken = data.token;
            localStorage.setItem('token', authToken);
            showChatWindow();
        } else {
            loginMsg.innerText = data.message;
        }
    } catch (err) {
        loginMsg.innerText = 'Error verifying OTP';
    }
};

function showChatWindow() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
}

// Chat Handlers
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    userInput.value = '';
    thinkingIndicator.classList.remove('hidden');

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message })
        });
        
        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        const data = await res.json();
        thinkingIndicator.classList.add('hidden');
        if (res.ok) {
            appendMessage('ai', data.response);
        } else {
            appendMessage('ai', 'Error: ' + data.message);
        }
    } catch (err) {
        thinkingIndicator.classList.add('hidden');
        appendMessage('ai', 'Connection error');
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    msgDiv.innerText = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.parentElement.scrollTop = messagesDiv.parentElement.scrollHeight;
}

sendBtn.onclick = sendMessage;
userInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

// Menu Handlers
menuToggle.onclick = () => sideMenu.classList.remove('hidden');
closeMenu.onclick = () => sideMenu.classList.add('hidden');
sideMenu.onclick = (e) => { if (e.target === sideMenu) sideMenu.classList.add('hidden'); };

showChat.onclick = () => {
    apiPanel.classList.add('hidden');
    sideMenu.classList.add('hidden');
};

showApi.onclick = () => {
    apiPanel.classList.remove('hidden');
    sideMenu.classList.add('hidden');
};

closeApi.onclick = () => apiPanel.classList.add('hidden');

function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}
logoutBtn.onclick = logout;
