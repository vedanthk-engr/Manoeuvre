import { contextBridge, ipcRenderer } from 'electron';

// Expose safe, typed API to renderer
contextBridge.exposeInMainWorld('manoeuvreBridge', {
  platform: process.platform,
  version: '1.0.0',
  toggleOverlay: (show: boolean) => ipcRenderer.send('overlay:toggle', show),
  setOverlayIgnoreMouse: (ignore: boolean) => ipcRenderer.send('overlay:ignore-mouse', ignore),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  onOverlayStateChange: (callback: (state: any) => void) => {
    ipcRenderer.on('overlay:state', (_event, state) => callback(state));
  }
});
