/**
 * Moltbot Gateway WebSocket Client
 * Connects to Moltbot Gateway for AI chat functionality
 */

export interface MoltbotConfig {
  gatewayUrl: string;
  token?: string;
  sessionKey?: string;
}

export interface MoltbotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatEvent {
  type: 'delta' | 'done' | 'error';
  content?: string;
  error?: string;
}

export class MoltbotClient {
  private config: MoltbotConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Array<(event: ChatEvent) => void> = [];
  private statusHandlers: Array<(status: 'connected' | 'disconnected' | 'connecting' | 'error')> void> = [];
  private historyHandlers: Array<(messages: MoltbotMessage[]) => void> = [];
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  private connectResolve: Function | null = null;

  constructor(config: MoltbotConfig) {
    this.config = {
      gatewayUrl: config.gatewayUrl,
      token: config.token,
      sessionKey: config.sessionKey || `web-session-${Date.now()}`,
    };
  }

  /**
   * Connect to Moltbot Gateway
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectResolve = resolve;
      this.notifyStatus('connecting');

      try {
        this.ws = new WebSocket(this.config.gatewayUrl);
      } catch (error) {
        reject(error);
        return;
      }

      this.ws.onopen = () => {
        console.log('[Moltbot] WebSocket connected');
        this.performHandshake();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('[Moltbot] WebSocket error:', error);
        this.notifyStatus('error');
        if (this.connectResolve) {
          this.connectReject(error);
        }
      };

      this.ws.onclose = () => {
        console.log('[Moltbot] WebSocket closed');
        this.notifyStatus('disconnected');
        this.handleReconnect();
      };
    });
  }

  /**
   * Perform initial handshake with Gateway
   */
  private performHandshake(): void {
    const connectRequest = {
      type: 'req' as const,
      id: this.generateId(),
      method: 'connect' as const,
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'jarvis-pwa',
          version: '1.0.0',
          platform: 'web',
          mode: 'operator' as const,
        },
        role: 'operator' as const,
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: this.config.token ? { token: this.config.token } : {},
        locale: 'zh-CN',
        userAgent: `jarvis-pwa/1.0.0`,
      },
    };

    this.sendRequest(connectRequest);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    if (message.type === 'res') {
      // Response to a request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;

        if (message.ok) {
          resolve(message.payload);
        } else {
          reject(new Error(message.error?.message || 'Request failed'));
        }

        this.pendingRequests.delete(message.id);
      }

      // Handle handshake response
      if (message.payload?.type === 'hello-ok') {
        console.log('[Moltbot] Handshake successful');
        this.notifyStatus('connected');
        if (this.connectResolve) {
          this.connectResolve();
          this.connectResolve = null;
        }
        // Load chat history
        this.loadHistory();
      }

      // Handle chat history
      if (message.payload?.type === 'chat-history') {
        const messages = message.payload.messages || [];
        this.notifyHistoryHandlers(
          messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }

      // Handle chat.send response
      if (message.payload?.runId) {
        console.log('[Moltbot] Message sent, runId:', message.payload.runId);
      }
    } else if (message.type === 'event') {
      // Events from Gateway
      if (message.event === 'chat') {
        this.handleChatEvent(message.payload);
      }
    }
  }

  /**
   * Handle chat events
   */
  private handleChatEvent(payload: any): void {
    if (payload.type === 'delta') {
      // Streaming response
      this.notifyMessageHandlers({
        type: 'delta',
        content: payload.delta,
      });
    } else if (payload.type === 'done') {
      // Response completed
      this.notifyMessageHandlers({
        type: 'done',
      });
    } else if (payload.type === 'error') {
      // Error occurred
      this.notifyMessageHandlers({
        type: 'error',
        error: payload.error || 'Unknown error',
      });
    }
  }

  /**
   * Send a message to Moltbot
   */
  async sendMessage(text: string): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const request = {
      type: 'req' as const,
      id: this.generateId(),
      method: 'chat.send' as const,
      params: {
        sessionKey: this.config.sessionKey,
        message: text,
        idempotencyKey: this.generateId(),
      },
    };

    return this.sendRequest(request);
  }

  /**
   * Load chat history
   */
  async loadHistory(): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const request = {
      type: 'req' as const,
      id: this.generateId(),
      method: 'chat.history' as const,
      params: {
        sessionKey: this.config.sessionKey,
      },
    };

    return this.sendRequest(request);
  }

  /**
   * Abort current message
   */
  async abort(): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const request = {
      type: 'req' as const,
      id: this.generateId(),
      method: 'chat.abort' as const,
      params: {
        sessionKey: this.config.sessionKey,
      },
    };

    return this.sendRequest(request);
  }

  /**
   * Send a request and wait for response
   */
  private sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(request.id, { resolve, reject });

      try {
        this.ws!.send(JSON.stringify(request));

        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.pendingRequests.has(request.id)) {
            this.pendingRequests.delete(request.id);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      } catch (error) {
        this.pendingRequests.delete(request.id);
        reject(error);
      }
    });
  }

  /**
   * Handle automatic reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(`[Moltbot] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[Moltbot] Reconnect failed:', error);
        });
      }, delay);
    } else {
      console.error('[Moltbot] Max reconnection attempts reached');
    }
  }

  /**
   * Register message event handler
   */
  onMessage(handler: (event: ChatEvent) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register status change handler
   */
  onStatus(handler: (status: 'connected' | 'disconnected' | 'connecting' | 'error') void) {
    this.statusHandlers.push(handler);
  }

  /**
   * Register history loaded handler
   */
  onHistory(handler: (messages: MoltbotMessage[]) => void): void {
    this.historyHandlers.push(handler);
  }

  /**
   * Disconnect from Gateway
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(event: ChatEvent): void {
    this.messageHandlers.forEach(handler => handler(event));
  }

  /**
   * Notify all status handlers
   */
  private notifyStatus(status: 'connected' | 'disconnected' | 'connecting' | 'error'): void {
    this.statusHandlers.forEach(handler => handler(status));
  }

  /**
   * Notify all history handlers
   */
  private notifyHistoryHandlers(messages: MoltbotMessage[]): void {
    this.historyHandlers.forEach(handler => handler(messages));
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Create a Moltbot client instance
 */
export function createMoltbotClient(config: MoltbotConfig): MoltbotClient {
  return new MoltbotClient(config);
}
