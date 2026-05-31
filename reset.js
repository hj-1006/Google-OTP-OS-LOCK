const fs = require('fs');
const path = require('path');

// Determine path to kiosk-config.json
const appName = 'os-login-kiosk';
const appDataPath = process.env.APPDATA || 
  (process.platform === 'darwin' ? `${process.env.HOME}/Library/Application Support` : `${process.env.HOME}/.config`);
const configPath = path.join(appDataPath, appName, 'kiosk-config.json');

console.log('\x1b[36m%s\x1b[0m', '🔄 [Smart Wall] Resetting OTP Registration Config...');
console.log('Target path:', configPath);

try {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log('\x1b[32m%s\x1b[0m', '✅ Success: Configuration file deleted successfully!');
    console.log('Next time the kiosk runs, it will regenerate a new unique secret and display the QR setup code again.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ Info: No configuration file found. The system is already in a fresh setup state.');
  }
} catch (err) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error resetting configuration:', err.message);
}
