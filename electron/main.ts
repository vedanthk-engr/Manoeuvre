import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { OverlayWindowManager } from './overlay';

let mainWindow: BrowserWindow | null = null;
let overlayManager: OverlayWindowManager | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function startBackend() {
  const isWindows = process.platform === 'win32';
  const pyExecutable = isWindows ? path.join(__dirname, '../../.venv/Scripts/python.exe') : 'python3';
  
  try {
    backendProcess = spawn(pyExecutable, ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe',
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Core] ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      console.log(`[Core Log] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.warn('[Core] Could not spawn bundled backend, assuming standalone server:', err.message);
    });
  } catch (err) {
    console.warn('[Core] Standalone backend assumed.');
  }
}

function createMainWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayManager?.getWindow()) {
      overlayManager.getWindow()?.close();
    }
  });

  // Setup Overlay Window
  overlayManager = new OverlayWindowManager();
  overlayManager.createOverlayWindow(preloadPath);
}

// IPC Handlers
ipcMain.on('overlay:toggle', (_event, show) => {
  overlayManager?.toggle(show);
});

ipcMain.on('overlay:ignore-mouse', (_event, ignore) => {
  overlayManager?.setIgnoreMouseEvents(ignore);
});

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

app.whenReady().then(() => {
  startBackend();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
