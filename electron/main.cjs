const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;
let serverHost = '0.0.0.0';
let serverPort = 3000;

try {
  const configPath = './src/server-config.json';
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.host) serverHost = config.host;
    if (config.frontendPort) serverPort = config.frontendPort;
  }
} catch (e) {
  console.warn('Failed to load server config:', e);
}

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

// Wait until server is ready
function waitForServer(url) {
  return new Promise((resolve) => {
    const check = () => {
      http
        .get(url, () => resolve())
        .on('error', () => setTimeout(check, 500));
    };
    check();
  });
}

// Start Nitro server (production)
function startServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;
    const projectRoot = path.resolve(__dirname, '..'); // <-- ensure correct root
    const serverPath = isDev
      ? path.join(projectRoot, '.output', 'server', 'index.mjs')
      : path.join(process.resourcesPath, 'app.asar.unpacked', '.output', 'server', 'index.mjs');

    console.log("Starting server from:", serverPath);

    serverProcess = spawn('node', [serverPath], {
      stdio: 'pipe',
      windowsHide: true,
      env: {
        ...process.env,
        HOST: serverHost,
        PORT: serverPort.toString(),
      },
    });

    serverProcess.stdout.on('data', (data) => console.log('[SERVER]', data.toString()));
    serverProcess.stderr.on('data', (data) => console.error('[SERVER ERROR]', data.toString()));

    const url = `http://localhost:${serverPort}`;
    const start = Date.now();

    function check() {
      http.get(url, () => resolve()).on('error', () => {
        if (Date.now() - start > 15000) reject(new Error('Server did not start in time'));
        else setTimeout(check, 500);
      });
    }

    check();
  });
}

// Create window
function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
  });

  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Debug only if needed
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.log("LOAD FAILED:", code, desc);
  });
}

// App start
app.whenReady().then(async () => {
  await startServer();
  createWindow();
});

// Cleanup
app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});