const { spawn } = require('child_process');
const path = require('path');

const APP_PATH = path.join(__dirname, 'node_modules', '.bin', 'electron.cmd');
const APP_ARGS = ['.'];

let appProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 10;
const RESTART_WINDOW = 60000; // 1 minute

function startApp() {
    console.log('Starting Secure Login App...');
    
    appProcess = spawn(APP_PATH, APP_ARGS, {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    appProcess.on('exit', (code) => {
        console.log(`App exited with code ${code}`);
        
        // If code is 0, it means it was a successful unlock/quit
        if (code === 0) {
            console.log('System unlocked successfully. Exiting monitor.');
            process.exit(0);
        } else {
            console.log('App crashed or was killed. Restarting...');
            handleRestart();
        }
    });
}

function handleRestart() {
    restartCount++;
    
    if (restartCount > MAX_RESTARTS) {
        console.error('Too many crashes detected. Force shutting down system for security...');
        // In a real high-security kiosk, you'd trigger a system shutdown here
        // spawn('shutdown', ['/s', '/t', '0']); 
        process.exit(1);
    }

    setTimeout(() => {
        startApp();
    }, 1000);
}

// Reset restart count every minute
setInterval(() => {
    restartCount = 0;
}, RESTART_WINDOW);

startApp();

// Prevent monitor from being easily closed
process.on('SIGINT', () => {
    console.log('Monitor cannot be stopped manually.');
});
