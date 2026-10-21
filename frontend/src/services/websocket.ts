type MessageHandler = (data: any) => void;

class DesktopWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private reconnectTimer: any = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket('ws://127.0.0.1:8000/ws/desktop');

      this.ws.onopen = () => {
        console.log('[WS Desktop] Connected to Manoeuvre Core');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((handler) => handler(data));
        } catch (err) {
          console.error('[WS Desktop] Message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('[WS Desktop] Disconnected. Reconnecting in 2s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS Desktop] Socket error:', err);
        this.ws?.close();
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
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
}

export const wsService = new DesktopWebSocketService();
