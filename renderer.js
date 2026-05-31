const { ipcRenderer } = require('electron');

let currentStep = 'otp';
let isRegistered = false;

async function checkRegistration() {
    isRegistered = await ipcRenderer.invoke('check-registration');
    const warningCard = document.getElementById('first-time-warning');
    const qrBtn = document.getElementById('show-qr-btn');
    
    // Fetch and display Windows logged-in user name
    try {
        const userInfo = await ipcRenderer.invoke('get-user-info');
        const userDisplay = document.getElementById('user-display');
        if (userInfo && userDisplay) {
            userDisplay.innerHTML = `Welcome, <strong style="color: var(--primary); font-weight: 600;">${userInfo.username}</strong>. Enter OTP to unlock.`;
        }
    } catch (err) {
        console.error('Error fetching user info:', err);
    }
    
    if (isRegistered) {
        if (warningCard) warningCard.style.display = 'none';
        if (qrBtn) qrBtn.style.display = 'none';
    } else {
        if (warningCard) warningCard.style.display = 'flex';
        if (qrBtn) qrBtn.style.display = 'block';
    }
}

// Check initial registration on startup
checkRegistration();

async function toggleQR() {
    const qrContainer = document.getElementById('qr-container');
    const qrImg = document.getElementById('qr-code');
    const btn = document.getElementById('show-qr-btn');

    if (qrContainer.style.display === 'none') {
        const qrData = await ipcRenderer.invoke('get-otp-qr');
        qrImg.src = qrData;
        qrContainer.style.display = 'block';
        btn.innerText = 'Hide Setup QR Code';
    } else {
        qrContainer.style.display = 'none';
        btn.innerText = 'Show Setup QR Code';
    }
}

function verifyLogin() {
    const otp = document.getElementById('otp-field').value;
    if (otp.length === 6) {
        ipcRenderer.send('unlock-app', { otp: otp });
    } else {
        showStatus('Please enter 6-digit OTP code');
    }
}

function showStatus(msg) {
    const status = document.getElementById('status');
    status.innerText = msg;
    status.classList.add('show');
}

function hideStatus() {
    document.getElementById('status').classList.remove('show');
}

ipcRenderer.on('unlock-failed', (event, msg) => {
    showStatus(msg);
    
    const container = document.querySelector('.login-container');
    container.style.animation = 'none';
    container.offsetHeight; // trigger reflow
    container.style.animation = 'shake 0.5s ease-in-out';
});

// Add shake keyframes
if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.innerHTML = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        50% { transform: translateX(10px); }
        75% { transform: translateX(-10px); }
    }
    `;
    document.head.appendChild(style);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        verifyLogin();
    }
});

// Force focus on input field when in OTP step
setInterval(() => {
    const otpField = document.getElementById('otp-field');
    if (otpField && document.activeElement !== otpField) {
        otpField.focus();
    }
}, 100);

// Also refocus if anything is clicked
document.addEventListener('mousedown', () => {
    setTimeout(() => {
        const otpField = document.getElementById('otp-field');
        if (otpField) otpField.focus();
    }, 10);
});
