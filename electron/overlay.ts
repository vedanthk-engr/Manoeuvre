import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

export class OverlayWindowManager {
  private overlayWindow: BrowserWindow | null = null;
  private isVisible: boolean = false;
  private isIgnoringMouse: boolean = true;

  createOverlayWindow(preloadPath: string): BrowserWindow {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    this.overlayWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      transparent: true,
      frame: false,
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });

    // Load overlay html / view
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.overlayWindow.loadURL('http://localhost:5173#overlay');
    } else {
      this.overlayWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'), {
        hash: 'overlay',
      });
    }

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
      this.isVisible = false;
    });

    return this.overlayWindow;
  }

  toggle(show?: boolean) {
    if (!this.overlayWindow) return;
    this.isVisible = show !== undefined ? show : !this.isVisible;
    if (this.isVisible) {
      this.overlayWindow.show();
    } else {
      this.overlayWindow.hide();
    }
  }

  setIgnoreMouseEvents(ignore: boolean) {
    if (!this.overlayWindow) return;
    this.isIgnoringMouse = ignore;
    this.overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }

  getWindow(): BrowserWindow | null {
    return this.overlayWindow;
  }
}
