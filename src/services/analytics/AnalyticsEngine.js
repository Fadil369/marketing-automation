/**
 * Analytics Engine - Advanced data analytics and reporting
 * Features: Real-time metrics, predictive analytics, custom reports
 * 
 * @author BrainSAIT Team
 */

class AnalyticsEngine {
    constructor(config = {}) {
        this.config = {
            realTimeUpdates: true,
            dataRetentionDays: 365,
            aggregationIntervals: ['hour', 'day', 'week', 'month'],
            enablePredictiveAnalytics: true,
            enableAnomalyDetection: true,
            enableCustomReports: true,
            cacheEnabled: true,
            cacheTTL: 300000, // 5 minutes
            batchSize: 1000,
            maxConcurrentQueries: 10,
            ...config
        };

        this.metrics = new Map();
        this.aggregatedMetrics = new Map();
        this.reports = new Map();
        this.dashboards = new Map();
        this.queries = new Map();
        this.cache = new Map();
        this.eventStream = new Map();
        
        this.activeQueries = 0;
        this.queryQueue = [];
        this.isProcessing = false;
        
        this.setupEventHandlers();
        this.initializeMetricDefinitions();
    }

    /**
     * Initialize analytics engine
     */
    async initialize() {
        console.log('📊 Initializing Analytics Engine...');
        
        // Start background processes
        this.startRealTimeProcessing();
        this.startAggregationProcess();
        this.startQueryProcessor();
        
        // Load historical data
        await this.loadHistoricalData();
        
        console.log('✅ Analytics Engine initialized');
    }

    /**
     * Initialize metric definitions
     */
    initializeMetricDefinitions() {
        // Campaign metrics
        this.defineMetric('campaign_impressions', {
            type: 'counter',
            description: 'Total campaign impressions',
            dimensions: ['campaign_id', 'platform', 'country'],
            aggregations: ['sum', 'avg', 'count']
        });

        this.defineMetric('campaign_clicks', {
            type: 'counter',
            description: 'Total campaign clicks',
            dimensions: ['campaign_id', 'platform', 'country'],
            aggregations: ['sum', 'avg', 'count']
        });

        this.defineMetric('campaign_conversions', {
            type: 'counter',
            description: 'Campaign conversions',
            dimensions: ['campaign_id', 'platform', 'conversion_type'],
            aggregations: ['sum', 'avg', 'count']
        });

        this.defineMetric('campaign_spend', {
            type: 'gauge',
            description: 'Campaign spend amount',
            dimensions: ['campaign_id', 'platform', 'currency'],
            aggregations: ['sum', 'avg', 'min', 'max']
        });

        // Platform metrics
        this.defineMetric('platform_reach', {
            type: 'gauge',
            description: 'Platform reach',
            dimensions: ['platform', 'content_type'],
            aggregations: ['sum', 'avg', 'max']
        });

        this.defineMetric('platform_engagement', {
            type: 'gauge',
            description: 'Platform engagement rate',
            dimensions: ['platform', 'content_type'],
            aggregations: ['avg', 'min', 'max']
        });

        // User metrics
        this.defineMetric('user_sessions', {
            type: 'counter',
            description: 'User session count',
            dimensions: ['user_id', 'device_type', 'country'],
            aggregations: ['count', 'unique_count']
        });

        this.defineMetric('user_actions', {
            type: 'counter',
            description: 'User action count',
            dimensions: ['user_id', 'action_type', 'feature'],
            aggregations: ['count', 'sum']
        });

        // System metrics
        this.defineMetric('api_requests', {
            type: 'counter',
            description: 'API request count',
            dimensions: ['endpoint', 'method', 'status_code'],
            aggregations: ['count', 'sum']
        });

        this.defineMetric('api_response_time', {
            type: 'histogram',
            description: 'API response time',
            dimensions: ['endpoint', 'method'],
            aggregations: ['avg', 'p95', 'p99', 'min', 'max']
        });
    }

    /**
     * Define a new metric
     */
    defineMetric(name, definition) {
        this.metrics.set(name, {
            name,
            ...definition,
            createdAt: Date.now()
        });
    }

    /**
     * Track a metric event
     */
    track(metricName, value, dimensions = {}, timestamp = Date.now()) {
        const metric = this.metrics.get(metricName);
        if (!metric) {
            console.warn(`Metric not defined: ${metricName}`);
            return;
        }

        const event = {
            metric: metricName,
            value,
            dimensions,
            timestamp,
            id: this.generateId()
        };

        // Add to event stream for real-time processing
        if (!this.eventStream.has(metricName)) {
            this.eventStream.set(metricName, []);
        }
        this.eventStream.get(metricName).push(event);

        // Trigger real-time aggregation
        if (this.config.realTimeUpdates) {
            this.processRealTimeEvent(event);
        }

        // Emit event for real-time dashboards
        this.emitMetricEvent('metric:tracked', event);
    }

    /**
     * Track multiple events in batch
     */
    trackBatch(events) {
        events.forEach(event => {
            this.track(event.metric, event.value, event.dimensions, event.timestamp);
        });
    }

    /**
     * Query metrics with filtering and aggregation
     */
    async query(options = {}) {
        const query = {
            id: this.generateId(),
            metric: options.metric,
            dimensions: options.dimensions || [],
            filters: options.filters || {},
            aggregation: options.aggregation || 'sum',
            timeRange: options.timeRange || { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() },
            groupBy: options.groupBy || [],
            orderBy: options.orderBy || [],
            limit: options.limit || 1000,
            interval: options.interval || 'hour'
        };

        // Check cache first
        if (this.config.cacheEnabled) {
            const cacheKey = this.generateCacheKey(query);
            const cached = this.cache.get(cacheKey);
            if (cached && !this.isCacheExpired(cached)) {
                return cached.data;
            }
        }

        // Add to query queue
        return new Promise((resolve, reject) => {
            this.queryQueue.push({
                query,
                resolve,
                reject
            });

            this.processQueryQueue();
        });
    }

    /**
     * Process query queue
     */
    async processQueryQueue() {
        if (this.isProcessing || this.activeQueries >= this.config.maxConcurrentQueries) {
            return;
        }

        this.isProcessing = true;

        while (this.queryQueue.length > 0 && this.activeQueries < this.config.maxConcurrentQueries) {
            const { query, resolve, reject } = this.queryQueue.shift();
            this.activeQueries++;

            try {
                const result = await this.executeQuery(query);
                
                // Cache result
                if (this.config.cacheEnabled) {
                    const cacheKey = this.generateCacheKey(query);
                    this.cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now(),
                        ttl: this.config.cacheTTL
                    });
                }

                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                this.activeQueries--;
            }
        }

        this.isProcessing = false;
    }

    /**
     * Execute single query
     */
    async executeQuery(query) {
        const { metric, timeRange, filters, aggregation, groupBy, interval } = query;

        // Get events for the metric within time range
        const events = this.getEventsInTimeRange(metric, timeRange.start, timeRange.end);

        // Apply filters
        const filteredEvents = this.applyFilters(events, filters);

        // Aggregate data
        const aggregatedData = this.aggregateEvents(filteredEvents, aggregation, groupBy, interval);

        return {
            query: query.id,
            metric,
            timeRange,
            aggregation,
            data: aggregatedData,
            totalEvents: filteredEvents.length,
            executedAt: Date.now()
        };
    }

    /**
     * Get events in time range
     */
    getEventsInTimeRange(metric, start, end) {
        const events = this.eventStream.get(metric) || [];
        return events.filter(event => event.timestamp >= start && event.timestamp <= end);
    }

    /**
     * Apply filters to events
     */
    applyFilters(events, filters) {
        return events.filter(event => {
            for (const [dimension, value] of Object.entries(filters)) {
                if (event.dimensions[dimension] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Aggregate events
     */
    aggregateEvents(events, aggregation, groupBy, interval) {
        if (groupBy.length === 0) {
            return this.performAggregation(events, aggregation);
        }

        const groups = this.groupEvents(events, groupBy, interval);
        const results = [];

        for (const [groupKey, groupEvents] of groups) {
            const aggregatedValue = this.performAggregation(groupEvents, aggregation);
            const dimensions = this.parseGroupKey(groupKey, groupBy);
            
            results.push({
                dimensions,
                value: aggregatedValue,
                count: groupEvents.length
            });
        }

        return results;
    }

    /**
     * Group events by dimensions
     */
    groupEvents(events, groupBy, interval) {
        const groups = new Map();

        events.forEach(event => {
            let groupKey = '';
            
            // Group by dimensions
            groupBy.forEach(dimension => {
                if (dimension === 'time') {
                    groupKey += this.getTimeInterval(event.timestamp, interval) + '|';
                } else {
                    groupKey += (event.dimensions[dimension] || 'null') + '|';
                }
            });

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(event);
        });

        return groups;
    }

    /**
     * Perform aggregation on events
     */
    performAggregation(events, aggregation) {
        if (events.length === 0) {return 0;}

        const values = events.map(event => event.value).filter(v => typeof v === 'number');

        switch (aggregation) {
            case 'sum':
                return values.reduce((sum, value) => sum + value, 0);
            case 'avg':
                return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'count':
                return events.length;
            case 'unique_count':
                return new Set(events.map(event => JSON.stringify(event.dimensions))).size;
            case 'p95':
                return this.calculatePercentile(values, 0.95);
            case 'p99':
                return this.calculatePercentile(values, 0.99);
            default:
                return values.reduce((sum, value) => sum + value, 0);
        }
    }

    /**
     * Calculate percentile
     */
    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[index] || 0;
    }

    /**
     * Get time interval for grouping
     */
    getTimeInterval(timestamp, interval) {
        const date = new Date(timestamp);
        
        switch (interval) {
            case 'hour':
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
            case 'day':
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-W${this.getWeekNumber(weekStart)}`;
            case 'month':
                return `${date.getFullYear()}-${date.getMonth() + 1}`;
            case 'year':
                return `${date.getFullYear()}`;
            default:
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
        }
    }

    /**
     * Get week number
     */
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Parse group key back to dimensions
     */
    parseGroupKey(groupKey, groupBy) {
        const parts = groupKey.split('|').slice(0, -1); // Remove last empty part
        const dimensions = {};
        
        groupBy.forEach((dimension, index) => {
            dimensions[dimension] = parts[index] || null;
        });
        
        return dimensions;
    }

    /**
     * Create custom report
     */
    createReport(reportConfig) {
        const report = {
            id: reportConfig.id || this.generateId(),
            name: reportConfig.name,
            description: reportConfig.description || '',
            queries: reportConfig.queries || [],
            visualizations: reportConfig.visualizations || [],
            schedule: reportConfig.schedule,
            recipients: reportConfig.recipients || [],
            settings: {
                autoRefresh: reportConfig.autoRefresh !== false,
                refreshInterval: reportConfig.refreshInterval || 300000, // 5 minutes
                exportFormats: reportConfig.exportFormats || ['pdf', 'csv'],
                ...reportConfig.settings
            },
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: reportConfig.createdBy,
                tags: reportConfig.tags || []
            }
        };

        this.reports.set(report.id, report);
        
        // Schedule report if configured
        if (report.schedule) {
            this.scheduleReport(report);
        }

        return report;
    }

    /**
     * Generate report
     */
    async generateReport(reportId) {
        const report = this.reports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }

        const results = [];

        // Execute all queries
        for (const query of report.queries) {
            const result = await this.query(query);
            results.push({
                queryId: query.id || this.generateId(),
                queryName: query.name || `Query ${results.length + 1}`,
                ...result
            });
        }

        // Generate visualizations
        const visualizations = await this.generateVisualizations(results, report.visualizations);

        const generatedReport = {
            reportId: report.id,
            reportName: report.name,
            generatedAt: Date.now(),
            results,
            visualizations,
            summary: this.generateReportSummary(results)
        };

        // Send to recipients if configured
        if (report.recipients.length > 0) {
            await this.sendReport(generatedReport, report.recipients, report.settings.exportFormats);
        }

        return generatedReport;
    }

    /**
     * Create dashboard
     */
    createDashboard(dashboardConfig) {
        const dashboard = {
            id: dashboardConfig.id || this.generateId(),
            name: dashboardConfig.name,
            description: dashboardConfig.description || '',
            widgets: dashboardConfig.widgets || [],
            layout: dashboardConfig.layout || { columns: 12, rows: 'auto' },
            filters: dashboardConfig.filters || {},
            settings: {
                autoRefresh: dashboardConfig.autoRefresh !== false,
                refreshInterval: dashboardConfig.refreshInterval || 30000, // 30 seconds
                theme: dashboardConfig.theme || 'light',
                ...dashboardConfig.settings
            },
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: dashboardConfig.createdBy,
                isPublic: dashboardConfig.isPublic || false,
                tags: dashboardConfig.tags || []
            }
        };

        this.dashboards.set(dashboard.id, dashboard);
        return dashboard;
    }

    /**
     * Get dashboard data
     */
    async getDashboardData(dashboardId, filters = {}) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard not found: ${dashboardId}`);
        }

        const widgetData = [];

        // Execute queries for each widget
        for (const widget of dashboard.widgets) {
            if (widget.query) {
                const mergedFilters = { ...dashboard.filters, ...filters, ...widget.filters };
                const queryWithFilters = { ...widget.query, filters: mergedFilters };
                
                const result = await this.query(queryWithFilters);
                widgetData.push({
                    widgetId: widget.id,
                    widgetType: widget.type,
                    ...result
                });
            }
        }

        return {
            dashboardId: dashboard.id,
            dashboardName: dashboard.name,
            generatedAt: Date.now(),
            widgets: widgetData,
            appliedFilters: { ...dashboard.filters, ...filters }
        };
    }

    /**
     * Predictive analytics
     */
    async predictMetric(metric, timeRange, predictionDays = 7) {
        if (!this.config.enablePredictiveAnalytics) {
            throw new Error('Predictive analytics is disabled');
        }

        // Get historical data
        const historicalData = await this.query({
            metric,
            timeRange,
            groupBy: ['time'],
            interval: 'day',
            aggregation: 'sum'
        });

        // Simple linear regression for prediction
        const predictions = this.linearRegression(historicalData.data, predictionDays);

        return {
            metric,
            historicalData: historicalData.data,
            predictions,
            predictionRange: {
                start: timeRange.end,
                end: timeRange.end + (predictionDays * 24 * 60 * 60 * 1000)
            },
            accuracy: this.calculatePredictionAccuracy(historicalData.data),
            generatedAt: Date.now()
        };
    }

    /**
     * Anomaly detection
     */
    async detectAnomalies(metric, timeRange, sensitivity = 0.95) {
        if (!this.config.enableAnomalyDetection) {
            throw new Error('Anomaly detection is disabled');
        }

        const data = await this.query({
            metric,
            timeRange,
            groupBy: ['time'],
            interval: 'hour',
            aggregation: 'avg'
        });

        const anomalies = this.findAnomalies(data.data, sensitivity);

        return {
            metric,
            timeRange,
            anomalies,
            totalDataPoints: data.data.length,
            anomalyCount: anomalies.length,
            sensitivity,
            detectedAt: Date.now()
        };
    }

    /**
     * Real-time processing
     */
    startRealTimeProcessing() {
        setInterval(() => {
            this.processRealTimeMetrics();
        }, 1000); // Process every second
    }

    processRealTimeMetrics() {
        // Process recent events for real-time dashboards
        const now = Date.now();
        const recentThreshold = now - 60000; // Last minute

        for (const [metricName, events] of this.eventStream) {
            const recentEvents = events.filter(event => event.timestamp >= recentThreshold);
            
            if (recentEvents.length > 0) {
                const realtimeData = {
                    metric: metricName,
                    events: recentEvents,
                    summary: {
                        count: recentEvents.length,
                        sum: recentEvents.reduce((sum, e) => sum + (e.value || 0), 0),
                        avg: recentEvents.length > 0 ? recentEvents.reduce((sum, e) => sum + (e.value || 0), 0) / recentEvents.length : 0
                    },
                    timestamp: now
                };

                this.emitMetricEvent('metric:realtime', realtimeData);
            }
        }
    }

    processRealTimeEvent(event) {
        // Immediate processing for critical events
        if (this.isCriticalMetric(event.metric)) {
            this.checkThresholds(event);
        }
    }

    /**
     * Aggregation process
     */
    startAggregationProcess() {
        // Run aggregation every 5 minutes
        setInterval(() => {
            this.runAggregation();
        }, 5 * 60 * 1000);
    }

    async runAggregation() {
        console.log('📊 Running metrics aggregation...');
        
        const now = Date.now();
        const intervals = ['hour', 'day', 'week', 'month'];
        
        for (const interval of intervals) {
            await this.aggregateByInterval(interval, now);
        }
    }

    async aggregateByInterval(interval, timestamp) {
        // Aggregate all metrics for the given interval
        for (const [metricName, metric] of this.metrics) {
            const timeKey = this.getTimeInterval(timestamp, interval);
            const aggregationKey = `${metricName}:${interval}:${timeKey}`;
            
            if (this.aggregatedMetrics.has(aggregationKey)) {
                continue; // Already aggregated
            }

            const timeRange = this.getIntervalTimeRange(timeKey, interval);
            const events = this.getEventsInTimeRange(metricName, timeRange.start, timeRange.end);
            
            if (events.length > 0) {
                const aggregatedData = {
                    metric: metricName,
                    interval,
                    timeKey,
                    timeRange,
                    aggregations: {}
                };

                // Calculate all aggregations defined for this metric
                metric.aggregations.forEach(aggregation => {
                    aggregatedData.aggregations[aggregation] = this.performAggregation(events, aggregation);
                });

                this.aggregatedMetrics.set(aggregationKey, aggregatedData);
            }
        }
    }

    /**
     * Utility methods
     */
    isCriticalMetric(metricName) {
        const criticalMetrics = ['campaign_spend', 'api_errors', 'system_alerts'];
        return criticalMetrics.includes(metricName);
    }

    checkThresholds(event) {
        // Check if event exceeds configured thresholds
        // This would trigger alerts or automated actions
    }

    linearRegression(data, predictionDays) {
        if (data.length < 2) {return [];}

        // Simple linear regression implementation
        const n = data.length;
        const xValues = data.map((_, i) => i);
        const yValues = data.map(d => d.value);
        
        const sumX = xValues.reduce((sum, x) => sum + x, 0);
        const sumY = yValues.reduce((sum, y) => sum + y, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const predictions = [];
        for (let i = 0; i < predictionDays; i++) {
            const x = n + i;
            const y = slope * x + intercept;
            predictions.push({
                day: i + 1,
                predictedValue: Math.max(0, y), // Ensure non-negative
                confidence: this.calculateConfidence(data, slope, intercept)
            });
        }
        
        return predictions;
    }

    findAnomalies(data, sensitivity) {
        if (data.length < 10) {return [];} // Need enough data points
        
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const threshold = this.getAnomalyThreshold(sensitivity) * stdDev;
        
        return data.filter(d => Math.abs(d.value - mean) > threshold)
                  .map(d => ({
                      ...d,
                      deviation: Math.abs(d.value - mean),
                      severity: this.calculateAnomalySeverity(d.value, mean, stdDev)
                  }));
    }

    getAnomalyThreshold(sensitivity) {
        // Convert sensitivity to z-score threshold
        const thresholds = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        return thresholds[sensitivity] || 1.96;
    }

    calculateAnomalySeverity(value, mean, stdDev) {
        const zScore = Math.abs(value - mean) / stdDev;
        if (zScore > 3) {return 'high';}
        if (zScore > 2) {return 'medium';}
        return 'low';
    }

    calculatePredictionAccuracy(data) {
        // Simple accuracy calculation based on historical variance
        if (data.length < 5) {return 0;}
        
        const values = data.map(d => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        
        return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
    }

    calculateConfidence(data, slope, intercept) {
        // Calculate R-squared for confidence
        const yValues = data.map(d => d.value);
        const yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
        
        let ssRes = 0;
        let ssTot = 0;
        
        yValues.forEach((y, i) => {
            const yPred = slope * i + intercept;
            ssRes += Math.pow(y - yPred, 2);
            ssTot += Math.pow(y - yMean, 2);
        });
        
        return ssTot === 0 ? 0 : Math.max(0, 1 - (ssRes / ssTot));
    }

    generateCacheKey(query) {
        return btoa(JSON.stringify(query));
    }

    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }

    getIntervalTimeRange(timeKey, interval) {
        // Convert time key back to time range
        // This is a simplified implementation
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;
        
        switch (interval) {
            case 'hour':
                return { start: now - oneHour, end: now };
            case 'day':
                return { start: now - oneDay, end: now };
            case 'week':
                return { start: now - 7 * oneDay, end: now };
            case 'month':
                return { start: now - 30 * oneDay, end: now };
            default:
                return { start: now - oneHour, end: now };
        }
    }

    generateReportSummary(results) {
        return {
            totalQueries: results.length,
            totalEvents: results.reduce((sum, r) => sum + r.totalEvents, 0),
            executionTime: results.reduce((sum, r) => sum + (r.executedAt - (r.startedAt || r.executedAt)), 0)
        };
    }

    async generateVisualizations(results, visualizationConfigs) {
        // Generate chart configurations for visualizations
        return visualizationConfigs.map(config => ({
            id: config.id,
            type: config.type,
            title: config.title,
            data: this.formatDataForVisualization(results, config)
        }));
    }

    formatDataForVisualization(results, config) {
        // Format query results for different visualization types
        const queryResult = results.find(r => r.queryId === config.queryId);
        if (!queryResult) {return null;}
        
        return {
            labels: queryResult.data.map(d => d.dimensions?.time || 'Unknown'),
            datasets: [{
                label: config.title,
                data: queryResult.data.map(d => d.value)
            }]
        };
    }

    scheduleReport(report) {
        // Implementation for report scheduling
        console.log(`Scheduled report: ${report.name}`);
    }

    async sendReport(report, recipients, formats) {
        // Implementation for sending reports
        console.log(`Sending report to ${recipients.length} recipients in formats: ${formats.join(', ')}`);
    }

    emitMetricEvent(eventName, data) {
        const event = new CustomEvent(`analytics:${eventName}`, { detail: data });
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    setupEventHandlers() {
        // Setup event listeners for metric tracking
        if (typeof window !== 'undefined') {
            window.addEventListener('campaign:impression', (event) => {
                this.track('campaign_impressions', 1, {
                    campaign_id: event.detail.campaignId,
                    platform: event.detail.platform
                });
            });
            
            window.addEventListener('campaign:click', (event) => {
                this.track('campaign_clicks', 1, {
                    campaign_id: event.detail.campaignId,
                    platform: event.detail.platform
                });
            });
        }
    }

    async loadHistoricalData() {
        // Load historical data on startup
        console.log('Loading historical analytics data...');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            metricsCount: this.metrics.size,
            reportsCount: this.reports.size,
            dashboardsCount: this.dashboards.size,
            activeQueries: this.activeQueries,
            queuedQueries: this.queryQueue.length,
            cacheSize: this.cache.size,
            eventStreamSize: Array.from(this.eventStream.values()).reduce((sum, events) => sum + events.length, 0)
        };
    }

    /**
     * Clear old data based on retention policy
     */
    cleanupOldData() {
        const retentionTime = this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - retentionTime;
        
        for (const [metricName, events] of this.eventStream) {
            const filteredEvents = events.filter(event => event.timestamp > cutoffTime);
            this.eventStream.set(metricName, filteredEvents);
        }
    }

    /**
     * Destroy analytics engine
     */
    destroy() {
        this.metrics.clear();
        this.reports.clear();
        this.dashboards.clear();
        this.cache.clear();
        this.eventStream.clear();
        console.log('🧹 Analytics Engine destroyed');
    }
}

export { AnalyticsEngine };