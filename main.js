const { app, BrowserWindow, ipcMain, screen, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const os = require('os');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Disable hardware acceleration to prevent flickering in some environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

let windows = [];
let keyListener;
let antiBypassInterval;

// Dynamically retrieve Windows Hardware UUID
function getSystemUUID() {
  try {
    const out = execSync('powershell -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', { encoding: 'utf8' }).trim();
    if (out && out.length > 10) return out;
  } catch (e) {}
  
  try {
    const out = execSync('wmic csproduct get uuid', { encoding: 'utf8' });
    const match = out.match(/[A-Fa-f0-9\-]{36}/);
    if (match) return match[0];
  } catch (e) {}

  return 'UNKNOWN-UUID';
}

const CONFIG_PATH = path.join(app.getPath('userData'), 'kiosk-config.json');

// Ensure clean config directories and read configuration
function loadConfig() {
  let config;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      config = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }

  if (!config) {
    config = { isRegistered: false, enableDeveloperBypass: true };
  }

  // Ensure unique secret key exists per computer
  if (!config.secret) {
    config.secret = speakeasy.generateSecret({ length: 20 }).base32;
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (e) {}
  }

  return config;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

function startAntiBypass() {
  antiBypassInterval = setInterval(() => {
    // Continuous watchdog to close Windows Task Manager (taskmgr.exe)
    exec('taskkill /F /IM taskmgr.exe', (err, stdout, stderr) => {
      // Ignore errors when taskmgr is not active
    });
  }, 500);
}

function stopAntiBypass() {
  if (antiBypassInterval) {
    clearInterval(antiBypassInterval);
  }
}


function createWindows() {
  const displays = screen.getAllDisplays();

  displays.forEach((display, index) => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      fullscreen: true,
      kiosk: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      frame: false,
      resizable: false,
      movable: false,
      closable: false,
      focusable: true,
      backgroundColor: '#000000',
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
    });

    win.setMenu(null);
    win.setMenuBarVisibility(false);
    win.setAlwaysOnTop(true, 'screen-saver', 1);
    win.setVisibleOnAllWorkspaces(true);
    win.setFullScreen(true);
    win.setKiosk(true);

    if (index === 0) {
      win.loadFile(path.join(__dirname, 'index.html'));
    } else {
      win.loadURL(`data:text/html,<html><body style="background:black;margin:0;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;overflow:hidden;"><h1>Secure Access Mode Active</h1></body></html>`);
    }

    win.on('close', (e) => {
      if (!app.isQuitting) e.preventDefault();
    });

    // Removed blur-focus loop that caused flickering and input issues.
    // Instead, rely on kiosk mode and renderer-side focus management.

    win.webContents.on('before-input-event', (e, input) => {
        if (input.control && input.key.toLowerCase() === 'i') e.preventDefault();
        if (input.control && input.key.toLowerCase() === 'r') e.preventDefault();
        if (input.key === 'F12') e.preventDefault();
    });

    windows.push(win);
  });

  setupKeyHook();
}

function setupKeyHook() {
  keyListener = new GlobalKeyboardListener();
  
  let hPressed = false;

  keyListener.addListener((e, down) => {
    const key = e.name;
    const isDown = e.state === 'DOWN';

    if (key === 'H') hPressed = isDown;

    if (isDown) {
      if (hPressed && key === 'F4') {
        const config = loadConfig();
        if (config.enableDeveloperBypass) {
          stopAntiBypass();
          app.isQuitting = true;
          app.exit(0);
          return;
        }
      }

      const meta = e.metaKey || e.name.includes('WINDOWS');
      const alt = e.altKey;
      const ctrl = e.ctrlKey;

      if (meta || (alt && key === 'TAB') || (alt && key === 'F4') || (ctrl && key === 'ESCAPE')) {
        windows.forEach(win => {
          if (!win.isDestroyed()) {
            win.setAlwaysOnTop(true, 'screen-saver', 1);
            win.focus();
          }
        });
        return true; 
      }
    }
  });
}

app.whenReady().then(() => {
  startAntiBypass();
  createWindows();

  // Listen to Windows Session lock/unlock events to dynamically re-lock
  powerMonitor.on('unlock-screen', () => {
    if (windows.length === 0) {
      startAntiBypass();
      createWindows();
    }
  });
});

// Prevent Electron from exiting when windows are closed to preserve session listening
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

ipcMain.handle('check-registration', async () => {
  const config = loadConfig();
  return config.isRegistered;
});

ipcMain.handle('get-user-info', async () => {
  return {
    username: os.userInfo().username,
    hostname: os.hostname()
  };
});

ipcMain.handle('get-otp-qr', async () => {
  const config = loadConfig();
  if (config.isRegistered) {
    throw new Error('Device already registered.');
  }
  
  const hostname = os.hostname();
  const uuid = getSystemUUID();
  const shortUuid = uuid.substring(0, 8);

  const otpauth = speakeasy.otpauthURL({
    secret: config.secret,
    label: `Admin@${hostname} (${shortUuid})`,
    issuer: `SecureKiosk-${shortUuid}`,
    encoding: 'base32'
  });
  return await QRCode.toDataURL(otpauth);
});

ipcMain.on('unlock-app', (event, { otp }) => {
  const config = loadConfig();
  const isOtpValid = speakeasy.totp.verify({
    secret: config.secret,
    encoding: 'base32',
    token: otp,
    window: 1
  });

  if (isOtpValid) {
    if (!config.isRegistered) {
      config.isRegistered = true;
      saveConfig(config);
    }
    stopAntiBypass();
    // Close lock windows to return to desktop but keep Electron listening in the background
    windows.forEach(win => {
      if (!win.isDestroyed()) win.destroy();
    });
    windows = [];
  } else {
    event.reply('unlock-failed', 'Incorrect OTP Code');
  }
});

