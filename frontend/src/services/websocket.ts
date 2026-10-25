export type SocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
export type MessageHandler = (data: any) => void;

class DesktopWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private reconnectTimer: any = null;
  private status: SocketStatus = 'DISCONNECTED';
  private lastError: string | null = null;
  private eventCount = 0;
  private currentHz = 0;
  private hzTimer: any = null;
  private lastDeviceEventTime: number | null = null;
  private lastDeviceEventType: string | null = null;

  constructor() {
    this.hzTimer = setInterval(() => {
      this.currentHz = this.eventCount;
      this.eventCount = 0;
    }, 1000);
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  getCurrentHz(): number {
    return this.currentHz;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  getLastDeviceEvent(): { type: string | null; time: number | null } {
    return { type: this.lastDeviceEventType, time: this.lastDeviceEventTime };
  }

  onStatusChange(listener: (status: SocketStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: SocketStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  connect(url = 'ws://127.0.0.1:8000/ws/desktop') {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS Desktop] Connected to Manoeuvre Core');
        this.setStatus('CONNECTED');
        this.lastError = null;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        this.eventCount++;
        try {
          const data = JSON.parse(event.data);
          this.lastDeviceEventTime = Date.now();
          this.lastDeviceEventType = data.type || 'unknown';
          this.listeners.forEach((handler) => handler(data));
        } catch (err) {
          console.error('[WS Desktop] Message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('[WS Desktop] Disconnected. Reconnecting in 2s...');
        this.setStatus('DISCONNECTED');
        this.scheduleReconnect(url);
      };

      this.ws.onerror = (err) => {
        this.lastError = 'Connection failed or refused';
        this.setStatus('ERROR');
        this.ws?.close();
      };
    } catch (err: any) {
      this.lastError = err?.message || 'WebSocket initialization error';
      this.setStatus('ERROR');
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect(url);
      }, 2000);
    }
  }

  subscribe(handler: MessageHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

export const wsService = new DesktopWebSocketService();

