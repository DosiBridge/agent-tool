/**
 * WebSocket client for real-time connection monitoring
 */

import { getApiBaseUrl, getAuthToken } from "./api/client";

export interface HealthStatus {
  status: string;
  version: string;
  rag_available: boolean;
  mcp_servers: number;
  type?: string; // For pong messages
  error?: string;
}

export type HealthStatusCallback = (status: HealthStatus) => void;
export type ConnectionStateCallback = (connected: boolean) => void;

class HealthWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCallbacks: Set<HealthStatusCallback> = new Set();
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private isConnecting = false;
  private isIntentionallyClosed = false;
  private useHttpPolling = false; // Fallback to HTTP polling if WebSocket fails
  private httpPollingInterval: NodeJS.Timeout | null = null;
  private consecutiveWsFailures = 0;
  private maxWsFailures = 3; // Switch to HTTP polling after 3 consecutive failures

  /**
   * Initialize WebSocket connection
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return; // Already connected or connecting
    }

    if (this.isIntentionallyClosed) {
      return; // Don't reconnect if intentionally closed
    }

    this.isConnecting = true;
    this.isIntentionallyClosed = false; // Reset flag when connecting

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const token = getAuthToken();

      // Convert HTTP/HTTPS URL to WebSocket URL
      let wsUrl = apiBaseUrl;
      if (wsUrl.startsWith("http://")) {
        wsUrl = wsUrl.replace(/^http/, "ws");
      } else if (wsUrl.startsWith("https://")) {
        wsUrl = wsUrl.replace(/^https/, "wss");
      } else {
        // If no protocol, assume ws:// for local development
        wsUrl = `ws://${wsUrl}`;
      }

      const url = `${wsUrl}/api/ws/health${
        token ? `?token=${encodeURIComponent(token)}` : ""
      }`;

      this.url = url;
      
      // Validate URL before creating WebSocket
      if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
        throw new Error(`Invalid WebSocket URL: ${url}`);
      }
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("✓ WebSocket health connection established");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.consecutiveWsFailures = 0; // Reset failure count on successful connection
        this.stopHttpPolling(); // Stop HTTP polling if WebSocket connects
        this.useHttpPolling = false;
        this.notifyConnectionState(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data: HealthStatus = JSON.parse(event.data);
          this.notifyHealthStatus(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (event: Event) => {
        // WebSocket error events don't provide detailed error information
        // The actual error details are in the onclose event
        const errorInfo: any = {
          type: event.type,
          target: event.target instanceof WebSocket ? {
            url: this.url,
            readyState: event.target.readyState,
            readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][event.target.readyState] || 'UNKNOWN'
          } : null
        };
        
        // Only log if there's meaningful information or in development
        if (process.env.NODE_ENV === 'development') {
          console.warn("WebSocket error event:", errorInfo);
        }
        
        this.isConnecting = false;
        this.notifyConnectionState(false);
      };

      this.ws.onclose = (event) => {
        const closeInfo = {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          url: this.url
        };
        
        // Log close event with details
        if (event.code !== 1000 && event.code !== 1001) {
          // Not a normal closure - log as warning
          console.warn("WebSocket closed unexpectedly:", closeInfo);
          
          // Code 1006 means connection closed abnormally (before handshake completed)
          // This often happens when WebSocket is blocked by proxy/firewall
          if (event.code === 1006) {
            console.warn("WebSocket connection failed (code 1006). This may indicate:");
            console.warn("- WebSocket connections are blocked by a proxy/load balancer");
            console.warn("- Network/firewall restrictions");
            console.warn("- Server not properly configured for WebSocket upgrades");
            console.warn("Falling back to HTTP polling...");
          }
        } else {
          console.log("WebSocket closed:", closeInfo);
        }
        
        this.isConnecting = false;
        this.ws = null;
        this.notifyConnectionState(false);

        // Track consecutive WebSocket failures
        if (event.code === 1006 || event.code !== 1000) {
          this.consecutiveWsFailures++;
          
          // Switch to HTTP polling after multiple failures
          if (this.consecutiveWsFailures >= this.maxWsFailures && !this.useHttpPolling) {
            console.log(`WebSocket failed ${this.consecutiveWsFailures} times. Switching to HTTP polling.`);
            this.stopHttpPolling(); // Ensure clean state
            this.startHttpPolling();
            return; // Don't try to reconnect WebSocket
          }
        }

        // Attempt to reconnect if not intentionally closed and not a normal closure
        if (
          !this.isIntentionallyClosed &&
          this.reconnectAttempts < this.maxReconnectAttempts &&
          event.code !== 1000 && // Don't reconnect on normal closure
          !this.useHttpPolling // Don't reconnect if using HTTP polling
        ) {
          // For code 1006 (abnormal closure), wait longer before retry
          if (event.code === 1006) {
            this.reconnectDelay = 5000; // Wait 5 seconds before retry
          }
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to create WebSocket connection:", {
        error: errorMessage,
        url: this.url,
        stack: error instanceof Error ? error.stack : undefined
      });
      this.isConnecting = false;
      this.notifyConnectionState(false);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Send ping message to request immediate status update
   */
  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "ping" }));
    }
  }

  /**
   * Close WebSocket connection
   * @param allowReconnect - If true, allows reconnection after disconnect (default: false)
   */
  disconnect(allowReconnect: boolean = false): void {
    if (!allowReconnect) {
      this.isIntentionallyClosed = true;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHttpPolling();

    if (this.ws) {
      // Send close message if possible
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "close" }));
      }
      this.ws.close();
      this.ws = null;
    }

    this.notifyConnectionState(false);
  }

  /**
   * Subscribe to health status updates
   */
  onHealthStatus(callback: HealthStatusCallback): () => void {
    this.healthCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.healthCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionState(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.connectionStateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all health status callbacks
   */
  private notifyHealthStatus(status: HealthStatus): void {
    this.healthCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("Error in health status callback:", error);
      }
    });
  }

  /**
   * Notify all connection state callbacks
   */
  private notifyConnectionState(connected: boolean): void {
    this.connectionStateCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error("Error in connection state callback:", error);
      }
    });
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.useHttpPolling ? true : (this.ws?.readyState === WebSocket.OPEN);
  }

  /**
   * Start HTTP polling as fallback when WebSocket fails
   */
  private startHttpPolling(): void {
    if (this.httpPollingInterval) {
      return; // Already polling
    }

    console.log("Starting HTTP polling fallback for health status");
    this.useHttpPolling = true;
    this.notifyConnectionState(true);

    // Poll every 5 seconds (same as WebSocket interval)
    this.httpPollingInterval = setInterval(async () => {
      try {
        const { getApiBaseUrl } = await import("./api/client");
        const { getAuthHeaders } = await import("./api/client");
        const apiBaseUrl = await getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/health`, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          const data: HealthStatus = await response.json();
          this.notifyHealthStatus(data);
        }
      } catch (error) {
        console.error("HTTP polling error:", error);
      }
    }, 5000);

    // Initial fetch
    (async () => {
      try {
        const { getApiBaseUrl } = await import("./api/client");
        const { getAuthHeaders } = await import("./api/client");
        const apiBaseUrl = await getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/health`, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          const data: HealthStatus = await response.json();
          this.notifyHealthStatus(data);
        }
      } catch (error) {
        console.error("Initial HTTP health fetch error:", error);
      }
    })();
  }

  /**
   * Stop HTTP polling
   */
  private stopHttpPolling(): void {
    if (this.httpPollingInterval) {
      clearInterval(this.httpPollingInterval);
      this.httpPollingInterval = null;
    }
    this.useHttpPolling = false;
  }
}

// Export singleton instance
export const healthWebSocket = new HealthWebSocketClient();
