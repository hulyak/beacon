// Real-time WebSocket Service for Live Data Updates
'use client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  enableDebug?: boolean;
}

export class BeaconWebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isReconnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      enableDebug: false,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isReconnecting = false;
          this.reconnectAttempts = 0;
          
          this.startHeartbeat();
          this.emit('connected');
          
          if (this.config.enableDebug) {
            console.log('WebSocket connected to:', this.config.url);
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          
          if (this.config.enableDebug) {
            console.log('WebSocket disconnected:', event.code, event.reason);
          }
          
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          // Attempt reconnection if not intentionally closed
          if (event.code !== 1000 && !this.isReconnecting) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', { error });
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isReconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Send message to server
   */
  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected. Message queued.');
      // In production, implement message queuing
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
    };

    try {
      this.ws.send(JSON.stringify(fullMessage));
      
      if (this.config.enableDebug) {
        console.log('WebSocket message sent:', fullMessage);
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(messageType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    
    this.listeners.get(messageType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(messageType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    if (this.config.enableDebug) {
      console.log('WebSocket message received:', message);
    }

    // Handle system messages
    switch (message.type) {
      case 'ping':
        this.send({ type: 'pong', data: {} });
        return;
      case 'pong':
        // Heartbeat response received
        return;
    }

    // Emit to specific listeners
    this.emit(message.type, message.data);
    
    // Emit to general message listeners
    this.emit('message', message);
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    if (this.config.enableDebug) {
      console.log(`Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, try again
        this.isReconnecting = false;
        this.attemptReconnect();
      });
    }, this.config.reconnectInterval);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', data: {} });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Event emitter
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    reconnecting: boolean;
    attempts: number;
    maxAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts!,
    };
  }
}

// Supply Chain specific WebSocket service
export class SupplyChainWebSocketService extends BeaconWebSocketService {
  constructor() {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';
    
    super({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 15,
      heartbeatInterval: 25000,
      enableDebug: process.env.NODE_ENV === 'development',
    });

    this.setupSupplyChainHandlers();
  }

  /**
   * Setup supply chain specific message handlers
   */
  private setupSupplyChainHandlers(): void {
    // Subscribe to real-time metrics updates
    this.subscribe('metrics_update', (data) => {
      this.emit('supply_chain_metrics', data);
    });

    // Subscribe to risk alerts
    this.subscribe('risk_alert', (data) => {
      this.emit('supply_chain_risk', data);
    });

    // Subscribe to shipment updates
    this.subscribe('shipment_update', (data) => {
      this.emit('supply_chain_shipment', data);
    });

    // Subscribe to sustainability updates
    this.subscribe('sustainability_update', (data) => {
      this.emit('supply_chain_sustainability', data);
    });
  }

  /**
   * Request real-time metrics for specific regions
   */
  requestMetrics(regions: string[]): void {
    this.send({
      type: 'subscribe_metrics',
      data: { regions },
    });
  }

  /**
   * Request risk monitoring for specific suppliers
   */
  requestRiskMonitoring(suppliers: string[]): void {
    this.send({
      type: 'subscribe_risks',
      data: { suppliers },
    });
  }

  /**
   * Request shipment tracking
   */
  requestShipmentTracking(shipmentIds: string[]): void {
    this.send({
      type: 'subscribe_shipments',
      data: { shipmentIds },
    });
  }
}

// React hook for WebSocket integration
export function useSupplyChainWebSocket() {
  const [service] = useState(() => new SupplyChainWebSocketService());
  const [status, setStatus] = useState(service.getStatus());
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Connect on mount
    service.connect().catch(console.error);

    // Setup status listeners
    const unsubscribeConnected = service.subscribe('connected', () => {
      setStatus(service.getStatus());
    });

    const unsubscribeDisconnected = service.subscribe('disconnected', () => {
      setStatus(service.getStatus());
    });

    const unsubscribeMessage = service.subscribe('message', (message: WebSocketMessage) => {
      setLastMessage(message);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeMessage();
      service.disconnect();
    };
  }, [service]);

  return {
    service,
    status,
    lastMessage,
    isConnected: status.connected,
    isReconnecting: status.reconnecting,
  };
}