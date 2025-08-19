/**
 * Metrics Manager - Real-time metrics collection and visualization
 * Handles performance monitoring, KPI tracking, and alert management
 */

export class MetricsManager {
    constructor(eventBus, stateManager, services) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.services = services;
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = new Map();
        this.collectors = new Map();
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            collectionInterval: 10000, // 10 seconds
            retentionPeriod: 86400000, // 24 hours
            alertCooldown: 300000, // 5 minutes
            enableAlerts: true,
            enableAutoThresholds: true
        };
        
        // Metric definitions
        this.metricDefinitions = {
            'engagement_rate': {
                name: 'Engagement Rate',
                unit: '%',
                type: 'percentage',
                aggregation: 'average',
                thresholds: { warning: 2.0, critical: 1.0 }
            },
            'response_time': {
                name: 'Response Time',
                unit: 'ms',
                type: 'duration',
                aggregation: 'average',
                thresholds: { warning: 2000, critical: 5000 }
            },
            'error_rate': {
                name: 'Error Rate',
                unit: '%',
                type: 'percentage',
                aggregation: 'sum',
                thresholds: { warning: 1.0, critical: 5.0 }
            },
            'active_campaigns': {
                name: 'Active Campaigns',
                unit: 'count',
                type: 'counter',
                aggregation: 'current',
                thresholds: { warning: 100, critical: 150 }
            },
            'api_calls': {
                name: 'API Calls',
                unit: 'calls/min',
                type: 'rate',
                aggregation: 'sum',
                thresholds: { warning: 1000, critical: 1500 }
            }
        };
    }

    /**
     * Initialize metrics manager
     */
    async initialize() {
        console.log('📊 Initializing Metrics Manager...');
        
        try {
            // Initialize metric storage
            this._initializeMetricStorage();
            
            // Set up data collectors
            this._setupDataCollectors();
            
            // Initialize thresholds
            this._initializeThresholds();
            
            // Start metric collection
            this._startMetricCollection();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Load historical data
            await this._loadHistoricalData();
            
            this.isInitialized = true;
            console.log('✅ Metrics Manager initialized');
            
            this.eventBus.emit('metrics:initialized', {
                metrics: Array.from(this.metrics.keys()),
                collectors: Array.from(this.collectors.keys()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Metrics Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Record metric value
     */
    recordMetric(metricName, value, tags = {}) {
        const timestamp = Date.now();
        
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }
        
        const metricData = {
            timestamp,
            value,
            tags,
            id: `${metricName}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.metrics.get(metricName).push(metricData);
        
        // Clean old data
        this._cleanOldData(metricName);
        
        // Check thresholds
        this._checkThresholds(metricName, value);
        
        // Emit event
        this.eventBus.emit('metrics:recorded', {
            metricName,
            value,
            tags,
            timestamp: new Date(timestamp).toISOString()
        });
        
        return metricData.id;
    }

    /**
     * Get metric data
     */
    getMetric(metricName, options = {}) {
        const { 
            timeRange = 3600000, // 1 hour
            aggregation = 'raw',
            tags = null
        } = options;
        
        const metricData = this.metrics.get(metricName) || [];
        const cutoffTime = Date.now() - timeRange;
        
        // Filter by time range
        let filteredData = metricData.filter(data => data.timestamp >= cutoffTime);
        
        // Filter by tags if specified
        if (tags) {
            filteredData = filteredData.filter(data => {
                return Object.entries(tags).every(([key, value]) => data.tags[key] === value);
            });
        }
        
        // Apply aggregation
        switch (aggregation) {
            case 'average':
                return this._calculateAverage(filteredData);
            case 'sum':
                return this._calculateSum(filteredData);
            case 'min':
                return this._calculateMin(filteredData);
            case 'max':
                return this._calculateMax(filteredData);
            case 'count':
                return filteredData.length;
            case 'latest':
                return filteredData.length > 0 ? filteredData[filteredData.length - 1].value : null;
            default:
                return filteredData;
        }
    }

    /**
     * Get multiple metrics
     */
    getMetrics(metricNames, options = {}) {
        const result = {};
        
        for (const metricName of metricNames) {
            result[metricName] = this.getMetric(metricName, options);
        }
        
        return result;
    }

    /**
     * Get real-time dashboard data
     */
    getRealTimeDashboard() {
        const dashboardData = {};
        
        // Collect current values for all metrics
        for (const [metricName, definition] of Object.entries(this.metricDefinitions)) {
            const currentValue = this.getMetric(metricName, { 
                aggregation: definition.aggregation,
                timeRange: 300000 // 5 minutes
            });
            
            dashboardData[metricName] = {
                current: currentValue,
                definition,
                status: this._getMetricStatus(metricName, currentValue),
                trend: this._calculateTrend(metricName)
            };
        }
        
        return {
            metrics: dashboardData,
            alerts: this._getActiveAlerts(),
            summary: this._generateSummary(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Set metric threshold
     */
    setThreshold(metricName, thresholds) {
        this.thresholds.set(metricName, {
            ...thresholds,
            updatedAt: new Date().toISOString()
        });
        
        this.eventBus.emit('metrics:threshold-updated', {
            metricName,
            thresholds,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Create alert
     */
    createAlert(metricName, condition, threshold, message) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const alert = {
            id: alertId,
            metricName,
            condition, // 'greater_than', 'less_than', 'equals'
            threshold,
            message,
            isActive: true,
            triggeredAt: null,
            lastTriggered: null,
            triggerCount: 0,
            createdAt: new Date().toISOString()
        };
        
        this.alerts.set(alertId, alert);
        
        this.eventBus.emit('metrics:alert-created', {
            alertId,
            alert,
            timestamp: new Date().toISOString()
        });
        
        return alertId;
    }

    /**
     * Generate metrics report
     */
    async generateReport(options = {}) {
        const {
            period = '24h',
            metrics = Object.keys(this.metricDefinitions),
            format = 'json'
        } = options;
        
        const timeRange = this._parseTimeRange(period);
        const reportData = {
            period,
            generatedAt: new Date().toISOString(),
            metrics: {},
            summary: {},
            alerts: this._getAlertsInPeriod(timeRange)
        };
        
        // Collect data for each metric
        for (const metricName of metrics) {
            const data = this.getMetric(metricName, { timeRange, aggregation: 'raw' });
            const definition = this.metricDefinitions[metricName];
            
            reportData.metrics[metricName] = {
                definition,
                data: data.slice(-100), // Last 100 data points
                statistics: {
                    count: data.length,
                    average: this._calculateAverage(data),
                    min: this._calculateMin(data),
                    max: this._calculateMax(data),
                    latest: data.length > 0 ? data[data.length - 1].value : null
                },
                trend: this._calculateTrend(metricName),
                status: this._getMetricStatus(metricName, data.length > 0 ? data[data.length - 1].value : null)
            };
        }
        
        // Generate summary
        reportData.summary = this._generateReportSummary(reportData.metrics);
        
        this.eventBus.emit('metrics:report-generated', {
            report: reportData,
            timestamp: new Date().toISOString()
        });
        
        return reportData;
    }

    /**
     * Initialize metric storage
     */
    _initializeMetricStorage() {
        // Initialize storage for each defined metric
        for (const metricName of Object.keys(this.metricDefinitions)) {
            if (!this.metrics.has(metricName)) {
                this.metrics.set(metricName, []);
            }
        }
    }

    /**
     * Set up data collectors
     */
    _setupDataCollectors() {
        // System performance collector
        this.collectors.set('system', {
            name: 'System Performance',
            collect: () => this._collectSystemMetrics(),
            interval: 30000 // 30 seconds
        });
        
        // Platform metrics collector
        this.collectors.set('platforms', {
            name: 'Platform Metrics',
            collect: () => this._collectPlatformMetrics(),
            interval: 60000 // 1 minute
        });
        
        // Campaign metrics collector
        this.collectors.set('campaigns', {
            name: 'Campaign Metrics',
            collect: () => this._collectCampaignMetrics(),
            interval: 120000 // 2 minutes
        });
        
        // AI metrics collector
        this.collectors.set('ai', {
            name: 'AI Service Metrics',
            collect: () => this._collectAIMetrics(),
            interval: 60000 // 1 minute
        });
    }

    /**
     * Initialize thresholds
     */
    _initializeThresholds() {
        for (const [metricName, definition] of Object.entries(this.metricDefinitions)) {
            if (definition.thresholds) {
                this.setThreshold(metricName, definition.thresholds);
            }
        }
    }

    /**
     * Start metric collection
     */
    _startMetricCollection() {
        // Start all collectors
        for (const [id, collector] of this.collectors) {
            setInterval(async () => {
                try {
                    await collector.collect();
                } catch (error) {
                    console.error(`Metrics collector ${id} failed:`, error);
                    this.recordMetric('collector_errors', 1, { collector: id });
                }
            }, collector.interval);
        }
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Listen for service events
        this.eventBus.on('platforms:metrics', (data) => {
            this._processPlatformMetrics(data);
        });
        
        this.eventBus.on('ai:metrics', (data) => {
            this._processAIMetrics(data);
        });
        
        this.eventBus.on('analytics:metrics', (data) => {
            this._processAnalyticsMetrics(data);
        });
    }

    /**
     * Collect system metrics
     */
    async _collectSystemMetrics() {
        // Simulate system metrics collection
        this.recordMetric('response_time', Math.floor(Math.random() * 1000 + 200));
        this.recordMetric('error_rate', Math.random() * 2);
        this.recordMetric('api_calls', Math.floor(Math.random() * 100 + 50));
        
        // Memory and CPU simulation
        this.recordMetric('memory_usage', Math.random() * 80 + 20);
        this.recordMetric('cpu_usage', Math.random() * 60 + 10);
    }

    /**
     * Collect platform metrics
     */
    async _collectPlatformMetrics() {
        const platformService = this.services.get('platforms');
        
        if (platformService) {
            try {
                const metrics = platformService.getMetrics();
                
                this.recordMetric('platform_requests', metrics.totalRequests || 0);
                this.recordMetric('platform_errors', metrics.failedRequests || 0);
                this.recordMetric('platform_response_time', metrics.responseTime || 0);
                
            } catch (error) {
                console.error('Failed to collect platform metrics:', error);
            }
        }
    }

    /**
     * Collect campaign metrics
     */
    async _collectCampaignMetrics() {
        // Simulate campaign metrics
        this.recordMetric('active_campaigns', Math.floor(Math.random() * 50 + 10));
        this.recordMetric('engagement_rate', Math.random() * 8 + 2);
        this.recordMetric('conversion_rate', Math.random() * 5 + 1);
        this.recordMetric('campaign_spend', Math.random() * 1000 + 100);
    }

    /**
     * Collect AI metrics
     */
    async _collectAIMetrics() {
        const aiService = this.services.get('ai');
        
        if (aiService) {
            try {
                const metrics = aiService.getMetrics();
                
                this.recordMetric('ai_requests', metrics.totalRequests || 0);
                this.recordMetric('ai_success_rate', 
                    metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0
                );
                this.recordMetric('ai_response_time', metrics.averageResponseTime || 0);
                
            } catch (error) {
                console.error('Failed to collect AI metrics:', error);
            }
        }
    }

    /**
     * Check thresholds for alerts
     */
    _checkThresholds(metricName, value) {
        if (!this.config.enableAlerts) {return;}
        
        const thresholds = this.thresholds.get(metricName);
        if (!thresholds) {return;}
        
        let alertLevel = null;
        
        if (thresholds.critical !== undefined && 
            ((value > thresholds.critical && thresholds.critical > 0) || 
             (value < thresholds.critical && thresholds.critical < 0))) {
            alertLevel = 'critical';
        } else if (thresholds.warning !== undefined && 
            ((value > thresholds.warning && thresholds.warning > 0) || 
             (value < thresholds.warning && thresholds.warning < 0))) {
            alertLevel = 'warning';
        }
        
        if (alertLevel) {
            this._triggerAlert(metricName, value, alertLevel, thresholds[alertLevel]);
        }
    }

    /**
     * Trigger alert
     */
    _triggerAlert(metricName, value, level, threshold) {
        const alertId = `threshold_${metricName}_${level}`;
        const existingAlert = this.alerts.get(alertId);
        
        // Check cooldown
        if (existingAlert && existingAlert.lastTriggered) {
            const timeSinceLastTrigger = Date.now() - new Date(existingAlert.lastTriggered).getTime();
            if (timeSinceLastTrigger < this.config.alertCooldown) {
                return; // Still in cooldown
            }
        }
        
        const alert = existingAlert || {
            id: alertId,
            metricName,
            level,
            threshold,
            triggerCount: 0,
            createdAt: new Date().toISOString()
        };
        
        alert.triggeredAt = new Date().toISOString();
        alert.lastTriggered = alert.triggeredAt;
        alert.triggerCount++;
        alert.currentValue = value;
        alert.message = `${metricName} exceeded ${level} threshold: ${value} > ${threshold}`;
        
        this.alerts.set(alertId, alert);
        
        this.eventBus.emit('metrics:alert-triggered', {
            alert,
            metricName,
            value,
            level,
            threshold,
            timestamp: alert.triggeredAt
        });
    }

    /**
     * Calculate metric trend
     */
    _calculateTrend(metricName) {
        const data = this.getMetric(metricName, { timeRange: 1800000, aggregation: 'raw' }); // 30 minutes
        
        if (!Array.isArray(data) || data.length < 2) {
            return { direction: 'stable', change: 0 };
        }
        
        const recent = data.slice(-10); // Last 10 points
        const older = data.slice(-20, -10); // Previous 10 points
        
        if (recent.length === 0 || older.length === 0) {
            return { direction: 'stable', change: 0 };
        }
        
        const recentAvg = this._calculateAverage(recent);
        const olderAvg = this._calculateAverage(older);
        
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        let direction = 'stable';
        if (Math.abs(change) > 5) { // 5% threshold
            direction = change > 0 ? 'increasing' : 'decreasing';
        }
        
        return { direction, change: parseFloat(change.toFixed(2)) };
    }

    /**
     * Get metric status based on thresholds
     */
    _getMetricStatus(metricName, value) {
        if (value === null || value === undefined) {return 'unknown';}
        
        const thresholds = this.thresholds.get(metricName);
        if (!thresholds) {return 'normal';}
        
        if (thresholds.critical !== undefined && 
            ((value > thresholds.critical && thresholds.critical > 0) || 
             (value < thresholds.critical && thresholds.critical < 0))) {
            return 'critical';
        }
        
        if (thresholds.warning !== undefined && 
            ((value > thresholds.warning && thresholds.warning > 0) || 
             (value < thresholds.warning && thresholds.warning < 0))) {
            return 'warning';
        }
        
        return 'normal';
    }

    /**
     * Calculate average of metric data
     */
    _calculateAverage(data) {
        if (!Array.isArray(data) || data.length === 0) {return 0;}
        
        const sum = data.reduce((total, item) => total + (item.value || item), 0);
        return sum / data.length;
    }

    /**
     * Calculate sum of metric data
     */
    _calculateSum(data) {
        if (!Array.isArray(data) || data.length === 0) {return 0;}
        
        return data.reduce((total, item) => total + (item.value || item), 0);
    }

    /**
     * Calculate minimum of metric data
     */
    _calculateMin(data) {
        if (!Array.isArray(data) || data.length === 0) {return null;}
        
        return Math.min(...data.map(item => item.value || item));
    }

    /**
     * Calculate maximum of metric data
     */
    _calculateMax(data) {
        if (!Array.isArray(data) || data.length === 0) {return null;}
        
        return Math.max(...data.map(item => item.value || item));
    }

    /**
     * Clean old data beyond retention period
     */
    _cleanOldData(metricName) {
        const data = this.metrics.get(metricName);
        if (!data) {return;}
        
        const cutoffTime = Date.now() - this.config.retentionPeriod;
        const filteredData = data.filter(item => item.timestamp >= cutoffTime);
        
        this.metrics.set(metricName, filteredData);
    }

    /**
     * Get active alerts
     */
    _getActiveAlerts() {
        const activeAlerts = [];
        
        for (const alert of this.alerts.values()) {
            if (alert.triggeredAt) {
                const timeSinceTriggered = Date.now() - new Date(alert.triggeredAt).getTime();
                if (timeSinceTriggered < 3600000) { // Active for 1 hour
                    activeAlerts.push(alert);
                }
            }
        }
        
        return activeAlerts.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    }

    /**
     * Generate summary
     */
    _generateSummary() {
        const summary = {
            totalMetrics: this.metrics.size,
            activeAlerts: this._getActiveAlerts().length,
            systemStatus: 'normal'
        };
        
        // Determine overall system status
        const activeAlerts = this._getActiveAlerts();
        if (activeAlerts.some(alert => alert.level === 'critical')) {
            summary.systemStatus = 'critical';
        } else if (activeAlerts.some(alert => alert.level === 'warning')) {
            summary.systemStatus = 'warning';
        }
        
        return summary;
    }

    /**
     * Parse time range string
     */
    _parseTimeRange(period) {
        const units = {
            's': 1000,
            'm': 60000,
            'h': 3600000,
            'd': 86400000
        };
        
        const match = period.match(/^(\d+)([smhd])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * units[unit];
        }
        
        return 3600000; // Default to 1 hour
    }

    /**
     * Load historical data
     */
    async _loadHistoricalData() {
        const historicalData = this.stateManager.getState('metricsData') || {};
        
        for (const [metricName, data] of Object.entries(historicalData)) {
            if (Array.isArray(data)) {
                this.metrics.set(metricName, data);
            }
        }
    }

    /**
     * Get manager metrics
     */
    getManagerMetrics() {
        return {
            metrics: this.metrics.size,
            alerts: this.alerts.size,
            thresholds: this.thresholds.size,
            collectors: this.collectors.size,
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.eventBus.emit('metrics:config-updated', this.config);
    }

    /**
     * Destroy metrics manager
     */
    destroy() {
        // Save current data
        const metricsData = {};
        for (const [metricName, data] of this.metrics) {
            metricsData[metricName] = data.slice(-1000); // Keep last 1000 points
        }
        this.stateManager.setState('metricsData', metricsData);
        
        this.metrics.clear();
        this.alerts.clear();
        this.thresholds.clear();
        this.collectors.clear();
        
        console.log('📊 Metrics Manager destroyed');
    }
}