/**
 * WebSocket Service - Real-time communication with enhanced reconnection and message handling
 * Provides reliable real-time updates for platform metrics, AI generation status, and system events
 */

export class WebSocketService {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.messageQueue = [];
        this.subscriptions = new Map();
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        
        // Configuration
        this.config = {
            url: this._getWebSocketUrl(),
            protocols: ['brainsait-v1'],
            reconnectInterval: 1000, // Start with 1 second
            maxReconnectInterval: 30000, // Max 30 seconds
            maxReconnectAttempts: 50,
            heartbeatInterval: 30000, // 30 seconds
            messageTimeout: 10000, // 10 seconds
            queueMaxSize: 1000
        };
        
        // Message handlers
        this.messageHandlers = new Map();
        this.pendingMessages = new Map();
        
        // Connection state
        this.connectionState = 'disconnected';
        this.lastConnectedAt = null;
        this.connectionId = null;
        
        // Statistics
        this.stats = {
            totalConnections: 0,
            totalReconnections: 0,
            messagesReceived: 0,
            messagesSent: 0,
            bytesReceived: 0,
            bytesSent: 0,
            connectionUptime: 0,
            lastError: null
        };
    }

    /**
     * Initialize WebSocket service
     */
    async initialize() {
        console.log('🔌 Initializing WebSocket Service...');
        
        try {
            // Register default message handlers
            this._registerDefaultHandlers();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Connect to WebSocket
            await this.connect();
            
            console.log('✅ WebSocket Service initialized');
            
            this.eventBus.emit('websocket:initialized', {
                url: this.config.url,
                protocols: this.config.protocols,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ WebSocket Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.isConnecting || this.isConnected) {
            return;
        }

        this.isConnecting = true;
        this._updateConnectionState('connecting');

        try {
            console.log(`🔌 Connecting to WebSocket: ${this.config.url}`);
            
            this.socket = new WebSocket(this.config.url, this.config.protocols);
            
            // Set up event listeners
            this.socket.onopen = this._onOpen.bind(this);
            this.socket.onmessage = this._onMessage.bind(this);
            this.socket.onclose = this._onClose.bind(this);
            this.socket.onerror = this._onError.bind(this);
            
            // Wait for connection with timeout
            await this._waitForConnection();
            
        } catch (error) {
            this.isConnecting = false;
            this._updateConnectionState('error');
            console.error('❌ WebSocket connection failed:', error);
            
            // Schedule reconnection
            this._scheduleReconnection();
            
            throw error;
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');
        
        this._clearHeartbeat();
        this._clearReconnectTimeout();
        
        if (this.socket) {
            this.socket.close(1000, 'Client disconnecting');
            this.socket = null;
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        this._updateConnectionState('disconnected');
        
        this.eventBus.emit('websocket:disconnected', {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send message to WebSocket server
     */
    async send(type, data = {}, options = {}) {
        const message = {
            id: this._generateMessageId(),
            type,
            data,
            timestamp: new Date().toISOString(),
            clientId: this.connectionId || 'unknown'
        };

        if (!this.isConnected) {
            if (options.queue !== false) {
                this._queueMessage(message);
            }
            throw new Error('WebSocket not connected');
        }

        try {
            const messageString = JSON.stringify(message);
            this.socket.send(messageString);
            
            this.stats.messagesSent++;
            this.stats.bytesSent += messageString.length;
            
            // Track pending message if expecting response
            if (options.expectResponse) {
                this.pendingMessages.set(message.id, {
                    message,
                    timeout: setTimeout(() => {
                        this.pendingMessages.delete(message.id);
                        this.eventBus.emit('websocket:message-timeout', { messageId: message.id });
                    }, this.config.messageTimeout)
                });
            }
            
            this.eventBus.emit('websocket:message-sent', { message });
            
            return message.id;
            
        } catch (error) {
            console.error('❌ Failed to send WebSocket message:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(channel, callback, options = {}) {
        const subscriptionId = this._generateSubscriptionId();
        
        const subscription = {
            id: subscriptionId,
            channel,
            callback,
            options,
            createdAt: new Date().toISOString()
        };
        
        this.subscriptions.set(subscriptionId, subscription);
        
        // Send subscription message if connected
        if (this.isConnected) {
            this.send('subscribe', { channel, options });
        }
        
        this.eventBus.emit('websocket:subscribed', { subscription });
        
        // Return unsubscribe function
        return () => this.unsubscribe(subscriptionId);
    }

    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {return;}
        
        this.subscriptions.delete(subscriptionId);
        
        // Send unsubscribe message if connected
        if (this.isConnected) {
            this.send('unsubscribe', { 
                channel: subscription.channel,
                subscriptionId 
            });
        }
        
        this.eventBus.emit('websocket:unsubscribed', { subscription });
    }

    /**
     * Register message handler
     */
    onMessage(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        
        this.messageHandlers.get(type).push(handler);
        
        // Return function to remove handler
        return () => {
            const handlers = this.messageHandlers.get(type);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Get WebSocket URL based on environment
     */
    _getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NODE_ENV === 'development' ? ':8787' : '';
        
        // Use different URLs for different environments
        if (host === 'localhost' || host === '127.0.0.1') {
            return `${protocol}//${host}${port}/ws`;
        } else if (host.includes('staging')) {
            return `wss://staging-api.brainsait.io/ws`;
        } else {
            return `wss://api.brainsait.io/ws`;
        }
    }

    /**
     * Wait for WebSocket connection
     */
    _waitForConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);

            const checkConnection = () => {
                if (this.isConnected) {
                    clearTimeout(timeout);
                    resolve();
                } else if (this.socket && this.socket.readyState === WebSocket.CLOSED) {
                    clearTimeout(timeout);
                    reject(new Error('WebSocket connection failed'));
                }
            };

            const interval = setInterval(checkConnection, 100);
            
            setTimeout(() => {
                clearInterval(interval);
            }, 10000);
        });
    }

    /**
     * Handle WebSocket open event
     */
    _onOpen(event) {
        console.log('✅ WebSocket connected');
        
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastConnectedAt = new Date();
        this.stats.totalConnections++;
        
        this._updateConnectionState('connected');
        this._startHeartbeat();
        this._processMessageQueue();
        this._resubscribeAll();
        
        this.eventBus.emit('websocket:connected', {
            timestamp: new Date().toISOString(),
            attempts: this.reconnectAttempts
        });
    }

    /**
     * Handle WebSocket message event
     */
    _onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            this.stats.messagesReceived++;
            this.stats.bytesReceived += event.data.length;
            
            // Handle response to pending message
            if (message.responseToId && this.pendingMessages.has(message.responseToId)) {
                const pending = this.pendingMessages.get(message.responseToId);
                clearTimeout(pending.timeout);
                this.pendingMessages.delete(message.responseToId);
            }
            
            // Handle connection ID assignment
            if (message.type === 'connection' && message.data.connectionId) {
                this.connectionId = message.data.connectionId;
            }
            
            // Process message with handlers
            this._processMessage(message);
            
            this.eventBus.emit('websocket:message-received', { message });
            
        } catch (error) {
            console.error('❌ Failed to process WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket close event
     */
    _onClose(event) {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        
        this.isConnected = false;
        this.isConnecting = false;
        this._clearHeartbeat();
        
        this._updateConnectionState('disconnected');
        
        // Calculate uptime
        if (this.lastConnectedAt) {
            this.stats.connectionUptime += Date.now() - this.lastConnectedAt.getTime();
        }
        
        this.eventBus.emit('websocket:disconnected', {
            code: event.code,
            reason: event.reason,
            timestamp: new Date().toISOString()
        });
        
        // Schedule reconnection if not a clean close
        if (event.code !== 1000) {
            this._scheduleReconnection();
        }
    }

    /**
     * Handle WebSocket error event
     */
    _onError(event) {
        console.error('❌ WebSocket error:', event);
        
        this.stats.lastError = {
            message: event.message || 'WebSocket error',
            timestamp: new Date().toISOString()
        };
        
        this._updateConnectionState('error');
        
        this.eventBus.emit('websocket:error', {
            error: event,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Process incoming message with registered handlers
     */
    _processMessage(message) {
        const handlers = this.messageHandlers.get(message.type) || [];
        
        for (const handler of handlers) {
            try {
                handler(message.data, message);
            } catch (error) {
                console.error(`❌ Message handler error for type ${message.type}:`, error);
            }
        }
        
        // Handle subscription updates
        if (message.type === 'subscription-update') {
            this._handleSubscriptionUpdate(message);
        }
    }

    /**
     * Handle subscription updates
     */
    _handleSubscriptionUpdate(message) {
        const { channel, data } = message.data;
        
        // Find matching subscriptions
        for (const subscription of this.subscriptions.values()) {
            if (subscription.channel === channel) {
                try {
                    subscription.callback(data, message);
                } catch (error) {
                    console.error(`❌ Subscription callback error for channel ${channel}:`, error);
                }
            }
        }
    }

    /**
     * Register default message handlers
     */
    _registerDefaultHandlers() {
        // Heartbeat response
        this.onMessage('pong', () => {
            // Heartbeat acknowledged
        });
        
        // System notifications
        this.onMessage('notification', (data) => {
            this.eventBus.emit('system:notification', data);
        });
        
        // Metrics updates
        this.onMessage('metrics', (data) => {
            this.eventBus.emit('metrics:update', data);
        });
        
        // AI generation updates
        this.onMessage('ai-update', (data) => {
            this.eventBus.emit('ai:update', data);
        });
        
        // Platform updates
        this.onMessage('platform-update', (data) => {
            this.eventBus.emit('platforms:update', data);
        });
        
        // Workflow updates
        this.onMessage('workflow-update', (data) => {
            this.eventBus.emit('workflows:update', data);
        });
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Listen for app events to send to server
        this.eventBus.on('ai:content-generated', (data) => {
            if (this.isConnected) {
                this.send('ai-generated', data);
            }
        });
        
        this.eventBus.on('platforms:content-posted', (data) => {
            if (this.isConnected) {
                this.send('content-posted', data);
            }
        });
        
        this.eventBus.on('workflows:execution-completed', (data) => {
            if (this.isConnected) {
                this.send('workflow-completed', data);
            }
        });
    }

    /**
     * Start heartbeat to keep connection alive
     */
    _startHeartbeat() {
        this._clearHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping', { timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Clear heartbeat interval
     */
    _clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    _scheduleReconnection() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('❌ Max WebSocket reconnection attempts reached');
            this._updateConnectionState('failed');
            return;
        }

        this._clearReconnectTimeout();
        
        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
            this.config.maxReconnectInterval
        );
        
        console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.stats.totalReconnections++;
            this.connect().catch(error => {
                console.error('❌ Reconnection failed:', error);
            });
        }, delay);
    }

    /**
     * Clear reconnection timeout
     */
    _clearReconnectTimeout() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    /**
     * Queue message for later sending
     */
    _queueMessage(message) {
        if (this.messageQueue.length >= this.config.queueMaxSize) {
            this.messageQueue.shift(); // Remove oldest message
        }
        
        this.messageQueue.push(message);
    }

    /**
     * Process queued messages
     */
    _processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            try {
                const messageString = JSON.stringify(message);
                this.socket.send(messageString);
                this.stats.messagesSent++;
                this.stats.bytesSent += messageString.length;
            } catch (error) {
                console.error('❌ Failed to send queued message:', error);
                break;
            }
        }
    }

    /**
     * Resubscribe to all channels after reconnection
     */
    _resubscribeAll() {
        for (const subscription of this.subscriptions.values()) {
            this.send('subscribe', {
                channel: subscription.channel,
                options: subscription.options
            });
        }
    }

    /**
     * Update connection state
     */
    _updateConnectionState(state) {
        this.connectionState = state;
        
        // Update UI indicator
        if (typeof window !== 'undefined' && window.brainsait) {
            window.brainsait.updateWebSocketStatus(state);
        }
        
        this.eventBus.emit('websocket:state-changed', {
            state,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate unique message ID
     */
    _generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique subscription ID
     */
    _generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            ...this.stats,
            connectionState: this.connectionState,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: this.subscriptions.size,
            queuedMessages: this.messageQueue.length,
            pendingMessages: this.pendingMessages.size,
            uptime: this.lastConnectedAt ? Date.now() - this.lastConnectedAt.getTime() : 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.eventBus.emit('websocket:config-updated', this.config);
    }

    /**
     * Destroy WebSocket service
     */
    destroy() {
        console.log('🔌 Destroying WebSocket Service...');
        
        this.disconnect();
        this.subscriptions.clear();
        this.messageQueue = [];
        this.messageHandlers.clear();
        this.pendingMessages.clear();
        
        console.log('🔌 WebSocket Service destroyed');
    }
}