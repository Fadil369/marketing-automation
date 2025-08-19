/**
 * Dashboard Manager - Unified dashboard interface management
 * Handles real-time updates, widget management, and user interactions
 */

export class DashboardManager {
    constructor(eventBus, stateManager, services) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.services = services;
        this.widgets = new Map();
        this.layouts = new Map();
        this.updateInterval = null;
        this.isInitialized = false;
        
        // Dashboard configuration
        this.config = {
            refreshInterval: 30000, // 30 seconds
            enableRealTime: true,
            enableAnimations: true,
            theme: 'light',
            layout: 'default'
        };
        
        // UI elements
        this.elements = {
            container: null,
            sidebar: null,
            mainContent: null,
            widgets: new Map()
        };
    }

    /**
     * Initialize dashboard manager
     */
    async initialize() {
        console.log('📊 Initializing Dashboard Manager...');
        
        try {
            // Initialize UI elements
            this._initializeUIElements();
            
            // Register default widgets
            this._registerDefaultWidgets();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Load user preferences
            await this._loadUserPreferences();
            
            // Start real-time updates
            if (this.config.enableRealTime) {
                this._startRealTimeUpdates();
            }
            
            // Render initial dashboard
            await this._renderDashboard();
            
            this.isInitialized = true;
            console.log('✅ Dashboard Manager initialized');
            
            this.eventBus.emit('dashboard:initialized', {
                widgets: Array.from(this.widgets.keys()),
                config: this.config,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Dashboard Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Add widget to dashboard
     */
    async addWidget(widgetConfig) {
        const widgetId = widgetConfig.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const widget = {
            id: widgetId,
            type: widgetConfig.type,
            title: widgetConfig.title,
            position: widgetConfig.position || { x: 0, y: 0, w: 4, h: 3 },
            config: widgetConfig.config || {},
            data: null,
            element: null,
            lastUpdated: null,
            isLoading: false,
            error: null
        };
        
        // Validate widget type
        if (!this._isValidWidgetType(widget.type)) {
            throw new Error(`Invalid widget type: ${widget.type}`);
        }
        
        this.widgets.set(widgetId, widget);
        
        // Render widget
        await this._renderWidget(widget);
        
        // Start data updates for widget
        this._startWidgetUpdates(widget);
        
        this.eventBus.emit('dashboard:widget-added', {
            widgetId,
            widget,
            timestamp: new Date().toISOString()
        });
        
        return widgetId;
    }

    /**
     * Remove widget from dashboard
     */
    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget not found: ${widgetId}`);
        }
        
        // Remove from DOM
        if (widget.element) {
            widget.element.remove();
        }
        
        this.widgets.delete(widgetId);
        
        this.eventBus.emit('dashboard:widget-removed', {
            widgetId,
            timestamp: new Date().toISOString()
        });
        
        return true;
    }

    /**
     * Update widget data
     */
    async updateWidget(widgetId, data) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget not found: ${widgetId}`);
        }
        
        widget.data = data;
        widget.lastUpdated = new Date().toISOString();
        widget.isLoading = false;
        widget.error = null;
        
        // Re-render widget with new data
        await this._renderWidgetContent(widget);
        
        this.eventBus.emit('dashboard:widget-updated', {
            widgetId,
            data,
            timestamp: widget.lastUpdated
        });
    }

    /**
     * Update dashboard layout
     */
    updateLayout(layoutConfig) {
        this.config.layout = layoutConfig.name || this.config.layout;
        
        // Store layout
        this.layouts.set(layoutConfig.name, layoutConfig);
        
        // Apply layout
        this._applyLayout(layoutConfig);
        
        // Save to preferences
        this._saveUserPreferences();
        
        this.eventBus.emit('dashboard:layout-updated', {
            layout: layoutConfig,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Initialize UI elements
     */
    _initializeUIElements() {
        // Create main dashboard container
        this.elements.container = document.getElementById('dashboard-container') || 
            this._createDashboardContainer();
        
        // Create sidebar
        this.elements.sidebar = this._createSidebar();
        
        // Create main content area
        this.elements.mainContent = this._createMainContent();
        
        // Append to container
        this.elements.container.appendChild(this.elements.sidebar);
        this.elements.container.appendChild(this.elements.mainContent);
    }

    /**
     * Create dashboard container
     */
    _createDashboardContainer() {
        const container = document.createElement('div');
        container.id = 'dashboard-container';
        container.className = 'dashboard-container';
        container.innerHTML = `
            <style>
                .dashboard-container {
                    display: flex;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f8fafc;
                }
                
                .dashboard-sidebar {
                    width: 280px;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .dashboard-main {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .widget-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                
                .widget {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                    transition: all 0.3s ease;
                }
                
                .widget:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }
                
                .widget-header {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }
                
                .widget-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .widget-content {
                    min-height: 200px;
                }
                
                .widget-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    color: #64748b;
                }
                
                .widget-error {
                    color: #ef4444;
                    text-align: center;
                    padding: 20px;
                }
                
                .metric-card {
                    text-align: center;
                    padding: 20px;
                }
                
                .metric-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 8px;
                }
                
                .metric-label {
                    font-size: 14px;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .metric-change {
                    font-size: 12px;
                    margin-top: 4px;
                }
                
                .metric-change.positive {
                    color: #10b981;
                }
                
                .metric-change.negative {
                    color: #ef4444;
                }
                
                .chart-container {
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border-radius: 8px;
                    color: #64748b;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .loading {
                    animation: pulse 2s infinite;
                }
            </style>
        `;
        
        document.body.appendChild(container);
        return container;
    }

    /**
     * Create sidebar
     */
    _createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'dashboard-sidebar';
        sidebar.innerHTML = `
            <h2 style="margin-bottom: 24px; color: #1e293b;">📊 Dashboard</h2>
            <div id="sidebar-content">
                <div class="sidebar-section">
                    <h3 style="margin-bottom: 12px; color: #475569; font-size: 14px;">QUICK STATS</h3>
                    <div id="quick-stats"></div>
                </div>
                
                <div class="sidebar-section" style="margin-top: 24px;">
                    <h3 style="margin-bottom: 12px; color: #475569; font-size: 14px;">ACTIONS</h3>
                    <div id="dashboard-actions">
                        <button id="refresh-dashboard" style="width: 100%; padding: 8px 12px; margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer;">
                            🔄 Refresh All
                        </button>
                        <button id="add-widget" style="width: 100%; padding: 8px 12px; margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer;">
                            ➕ Add Widget
                        </button>
                        <button id="export-data" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer;">
                            📊 Export Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return sidebar;
    }

    /**
     * Create main content area
     */
    _createMainContent() {
        const mainContent = document.createElement('div');
        mainContent.className = 'dashboard-main';
        mainContent.innerHTML = `
            <div class="dashboard-header" style="margin-bottom: 24px;">
                <h1 style="margin: 0; color: #1e293b;">Marketing Dashboard</h1>
                <p style="margin: 8px 0 0 0; color: #64748b;">Real-time insights and analytics</p>
            </div>
            <div id="widget-grid" class="widget-grid"></div>
        `;
        
        return mainContent;
    }

    /**
     * Register default widgets
     */
    _registerDefaultWidgets() {
        // Campaign performance widget
        this.addWidget({
            id: 'campaign-performance',
            type: 'metrics',
            title: '📈 Campaign Performance',
            position: { x: 0, y: 0, w: 6, h: 4 },
            config: { metric: 'campaign_performance' }
        });
        
        // Real-time metrics widget
        this.addWidget({
            id: 'realtime-metrics',
            type: 'realtime',
            title: '⚡ Real-time Metrics',
            position: { x: 6, y: 0, w: 6, h: 4 },
            config: { refreshInterval: 5000 }
        });
        
        // Platform analytics widget
        this.addWidget({
            id: 'platform-analytics',
            type: 'chart',
            title: '📱 Platform Analytics',
            position: { x: 0, y: 4, w: 8, h: 5 },
            config: { chartType: 'line' }
        });
        
        // AI insights widget
        this.addWidget({
            id: 'ai-insights',
            type: 'insights',
            title: '🤖 AI Insights',
            position: { x: 8, y: 4, w: 4, h: 5 },
            config: { showPredictions: true }
        });
    }

    /**
     * Setup event listeners
     */
    _setupEventListeners() {
        // Refresh dashboard button
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this._refreshAllWidgets();
        });
        
        // Add widget button
        document.getElementById('add-widget')?.addEventListener('click', () => {
            this._showAddWidgetDialog();
        });
        
        // Export data button
        document.getElementById('export-data')?.addEventListener('click', () => {
            this._exportDashboardData();
        });
        
        // Listen for service events
        this.eventBus.on('analytics:realtime-update', (data) => {
            this._handleRealtimeUpdate(data);
        });
        
        this.eventBus.on('platforms:metrics', (data) => {
            this._handlePlatformMetrics(data);
        });
        
        this.eventBus.on('ai:content-generated', (data) => {
            this._handleAIUpdate(data);
        });
    }

    /**
     * Render dashboard
     */
    async _renderDashboard() {
        const widgetGrid = document.getElementById('widget-grid');
        if (!widgetGrid) {return;}
        
        // Clear existing widgets
        widgetGrid.innerHTML = '';
        
        // Render all widgets
        for (const widget of this.widgets.values()) {
            await this._renderWidget(widget);
        }
        
        // Update sidebar stats
        this._updateSidebarStats();
    }

    /**
     * Render individual widget
     */
    async _renderWidget(widget) {
        const widgetGrid = document.getElementById('widget-grid');
        if (!widgetGrid) {return;}
        
        // Create widget element
        const widgetElement = document.createElement('div');
        widgetElement.className = 'widget';
        widgetElement.id = `widget-${widget.id}`;
        
        widgetElement.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">${widget.title}</span>
                <div class="widget-actions">
                    <button onclick="window.dashboardManager?.removeWidget('${widget.id}')" style="border: none; background: none; cursor: pointer; color: #64748b;">×</button>
                </div>
            </div>
            <div class="widget-content" id="widget-content-${widget.id}">
                <div class="widget-loading">Loading...</div>
            </div>
        `;
        
        widget.element = widgetElement;
        widgetGrid.appendChild(widgetElement);
        
        // Load widget data
        await this._loadWidgetData(widget);
    }

    /**
     * Render widget content
     */
    async _renderWidgetContent(widget) {
        const contentElement = document.getElementById(`widget-content-${widget.id}`);
        if (!contentElement) {return;}
        
        if (widget.error) {
            contentElement.innerHTML = `<div class="widget-error">Error: ${widget.error}</div>`;
            return;
        }
        
        if (widget.isLoading) {
            contentElement.innerHTML = `<div class="widget-loading loading">Loading...</div>`;
            return;
        }
        
        // Render based on widget type
        switch (widget.type) {
            case 'metrics':
                this._renderMetricsWidget(contentElement, widget);
                break;
            case 'realtime':
                this._renderRealtimeWidget(contentElement, widget);
                break;
            case 'chart':
                this._renderChartWidget(contentElement, widget);
                break;
            case 'insights':
                this._renderInsightsWidget(contentElement, widget);
                break;
            default:
                contentElement.innerHTML = `<div>Unknown widget type: ${widget.type}</div>`;
        }
    }

    /**
     * Render metrics widget
     */
    _renderMetricsWidget(element, widget) {
        const data = widget.data || {};
        const metrics = data.summary || {};
        
        element.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px;">
                <div class="metric-card">
                    <div class="metric-value">${this._formatNumber(metrics.totalImpressions || 0)}</div>
                    <div class="metric-label">Impressions</div>
                    <div class="metric-change positive">+5.2%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${this._formatNumber(metrics.totalClicks || 0)}</div>
                    <div class="metric-label">Clicks</div>
                    <div class="metric-change positive">+3.1%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.averageCTR || '0.00'}%</div>
                    <div class="metric-label">CTR</div>
                    <div class="metric-change negative">-0.3%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">$${metrics.averageCPC || '0.00'}</div>
                    <div class="metric-label">CPC</div>
                    <div class="metric-change positive">-2.1%</div>
                </div>
            </div>
        `;
    }

    /**
     * Render realtime widget
     */
    _renderRealtimeWidget(element, widget) {
        const data = widget.data || {};
        
        element.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div class="metric-card">
                    <div class="metric-value">${data.activeUsers || 0}</div>
                    <div class="metric-label">Active Users</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.todayViews || 0}</div>
                    <div class="metric-label">Today's Views</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${data.hourlyEngagement || '0.00%'}</div>
                    <div class="metric-label">Engagement Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value" style="font-size: 14px; color: #10b981;">${data.status || 'Unknown'}</div>
                    <div class="metric-label">System Status</div>
                </div>
            </div>
            <div style="margin-top: 16px; text-align: center; font-size: 12px; color: #64748b;">
                Last updated: ${data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
        `;
    }

    /**
     * Render chart widget
     */
    _renderChartWidget(element, widget) {
        const data = widget.data || {};
        
        element.innerHTML = `
            <div class="chart-container">
                📊 Platform Performance Chart
                <br><small>Chart visualization would be rendered here</small>
            </div>
            <div style="margin-top: 16px; display: flex; justify-content: space-around; font-size: 12px; color: #64748b;">
                <span>TikTok: ${data.tiktok || 0}%</span>
                <span>Instagram: ${data.instagram || 0}%</span>
                <span>Snapchat: ${data.snapchat || 0}%</span>
                <span>YouTube: ${data.youtube || 0}%</span>
            </div>
        `;
    }

    /**
     * Render insights widget
     */
    _renderInsightsWidget(element, widget) {
        const insights = widget.data?.insights || [
            'Posting at 2 PM increases engagement by 15%',
            'Video content performs 3x better than images',
            'Hashtag #BrainSAIT trending in your target demographic'
        ];
        
        element.innerHTML = `
            <div style="space-y: 12px;">
                ${insights.map(insight => `
                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1; margin-bottom: 12px;">
                        <div style="font-size: 14px; color: #1e293b;">${insight}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Load widget data
     */
    async _loadWidgetData(widget) {
        widget.isLoading = true;
        await this._renderWidgetContent(widget);
        
        try {
            let data = null;
            
            switch (widget.type) {
                case 'metrics':
                    data = await this._loadMetricsData(widget.config);
                    break;
                case 'realtime':
                    data = await this._loadRealtimeData(widget.config);
                    break;
                case 'chart':
                    data = await this._loadChartData(widget.config);
                    break;
                case 'insights':
                    data = await this._loadInsightsData(widget.config);
                    break;
            }
            
            await this.updateWidget(widget.id, data);
            
        } catch (error) {
            widget.error = error.message;
            widget.isLoading = false;
            await this._renderWidgetContent(widget);
        }
    }

    /**
     * Load metrics data
     */
    async _loadMetricsData(config) {
        const analyticsService = this.services.get('analytics');
        if (analyticsService) {
            const report = await analyticsService.generateReport('campaign_performance', {
                period: '7d'
            });
            return report.data;
        }
        
        // Fallback mock data
        return {
            summary: {
                totalImpressions: 125000,
                totalClicks: 3200,
                averageCTR: '2.56',
                averageCPC: '1.25'
            }
        };
    }

    /**
     * Load realtime data
     */
    async _loadRealtimeData(config) {
        const platformService = this.services.get('platforms');
        if (platformService) {
            return await platformService.getRealTimeMetrics();
        }
        
        // Fallback mock data
        return {
            activeUsers: 1234,
            todayViews: 45678,
            hourlyEngagement: '3.45%',
            status: 'Active',
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Format number for display
     */
    _formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Start real-time updates
     */
    _startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this._refreshRealtimeWidgets();
        }, this.config.refreshInterval);
    }

    /**
     * Refresh realtime widgets
     */
    async _refreshRealtimeWidgets() {
        for (const widget of this.widgets.values()) {
            if (widget.type === 'realtime' || widget.type === 'metrics') {
                await this._loadWidgetData(widget);
            }
        }
    }

    /**
     * Update sidebar stats
     */
    _updateSidebarStats() {
        const statsElement = document.getElementById('quick-stats');
        if (!statsElement) {return;}
        
        statsElement.innerHTML = `
            <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
                <div style="font-size: 12px; color: #64748b;">Active Widgets</div>
                <div style="font-size: 18px; font-weight: 600; color: #1e293b;">${this.widgets.size}</div>
            </div>
            <div style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
                <div style="font-size: 12px; color: #64748b;">Last Update</div>
                <div style="font-size: 14px; color: #1e293b;">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
    }

    /**
     * Check if widget type is valid
     */
    _isValidWidgetType(type) {
        const validTypes = ['metrics', 'realtime', 'chart', 'insights'];
        return validTypes.includes(type);
    }

    /**
     * Load user preferences
     */
    async _loadUserPreferences() {
        const preferences = this.stateManager.getState('dashboardPreferences') || {};
        this.config = { ...this.config, ...preferences };
    }

    /**
     * Save user preferences
     */
    _saveUserPreferences() {
        this.stateManager.setState('dashboardPreferences', this.config);
    }

    /**
     * Get dashboard metrics
     */
    getMetrics() {
        return {
            widgets: this.widgets.size,
            layouts: this.layouts.size,
            config: this.config,
            isRealTimeEnabled: this.config.enableRealTime,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Destroy dashboard manager
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.widgets.clear();
        this.layouts.clear();
        
        console.log('📊 Dashboard Manager destroyed');
    }
}

// Make available globally for button events
window.dashboardManager = null;