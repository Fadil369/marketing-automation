/**
 * Analytics Service - Comprehensive analytics and reporting system
 * Tracks user behavior, campaign performance, and platform metrics
 */

export class AnalyticsService {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.events = [];
        this.sessions = new Map();
        this.metrics = new Map();
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            maxEvents: 10000,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            batchSize: 100,
            enableRealtime: true,
            enableDataCollection: true,
            retentionPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
        };
        
        // Built-in metrics
        this.builtInMetrics = {
            pageViews: 0,
            uniqueVisitors: 0,
            sessions: 0,
            bounceRate: 0,
            avgSessionDuration: 0,
            conversions: 0,
            revenue: 0
        };
        
        // Event types
        this.eventTypes = {
            PAGE_VIEW: 'page_view',
            CLICK: 'click',
            FORM_SUBMIT: 'form_submit',
            CONVERSION: 'conversion',
            ERROR: 'error',
            CUSTOM: 'custom'
        };
    }

    /**
     * Initialize analytics service
     */
    async initialize() {
        console.log('📊 Initializing Analytics Service...');
        
        try {
            // Load existing data
            await this._loadStoredData();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Start session tracking
            this._startSessionTracking();
            
            // Set up periodic cleanup
            this._setupDataCleanup();
            
            this.isInitialized = true;
            console.log('✅ Analytics Service initialized');
            
            this.eventBus.emit('analytics:initialized', {
                totalEvents: this.events.length,
                activeSessions: this.sessions.size,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Analytics Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Track an event
     */
    track(eventName, properties = {}, context = {}) {
        if (!this.config.enableDataCollection) {
            return;
        }

        const event = {
            id: this._generateEventId(),
            name: eventName,
            properties: {
                ...properties,
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : null,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                referrer: typeof document !== 'undefined' ? document.referrer : null
            },
            context: {
                sessionId: this._getCurrentSessionId(),
                userId: this._getCurrentUserId(),
                ...context
            },
            timestamp: Date.now()
        };

        // Add to events array
        this.events.push(event);
        
        // Maintain event limit
        if (this.events.length > this.config.maxEvents) {
            this.events.shift();
        }

        // Update metrics
        this._updateMetrics(event);
        
        // Emit real-time event
        if (this.config.enableRealtime) {
            this.eventBus.emit('analytics:event-tracked', event);
        }

        // Store event
        this._storeEvent(event);
        
        return event;
    }

    /**
     * Track page view
     */
    trackPageView(page, properties = {}) {
        return this.track(this.eventTypes.PAGE_VIEW, {
            page,
            ...properties
        });
    }

    /**
     * Track click event
     */
    trackClick(element, properties = {}) {
        return this.track(this.eventTypes.CLICK, {
            element: element.tagName || element,
            elementId: element.id || null,
            elementClass: element.className || null,
            text: element.textContent || null,
            ...properties
        });
    }

    /**
     * Track form submission
     */
    trackFormSubmit(formId, data = {}) {
        return this.track(this.eventTypes.FORM_SUBMIT, {
            formId,
            fields: Object.keys(data).length,
            ...data
        });
    }

    /**
     * Track conversion
     */
    trackConversion(type, value = 0, properties = {}) {
        const event = this.track(this.eventTypes.CONVERSION, {
            conversionType: type,
            value,
            currency: 'USD',
            ...properties
        });

        // Update conversion metrics
        this.builtInMetrics.conversions++;
        this.builtInMetrics.revenue += value;

        return event;
    }

    /**
     * Track error
     */
    trackError(error, context = {}) {
        return this.track(this.eventTypes.ERROR, {
            message: error.message || error,
            stack: error.stack || null,
            type: error.name || 'Error',
            ...context
        });
    }

    /**
     * Start a session
     */
    startSession(userId = null) {
        const sessionId = this._generateSessionId();
        const session = {
            id: sessionId,
            userId: userId || this._generateUserId(),
            startTime: Date.now(),
            lastActivity: Date.now(),
            pageViews: 0,
            events: 0,
            isActive: true
        };

        this.sessions.set(sessionId, session);
        this.builtInMetrics.sessions++;

        // Store session
        this._storeSession(session);

        return session;
    }

    /**
     * End a session
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.endTime = Date.now();
            session.duration = session.endTime - session.startTime;
            session.isActive = false;

            // Update metrics
            this._updateSessionMetrics(session);
            
            // Store updated session
            this._storeSession(session);
        }
    }

    /**
     * Get analytics data
     */
    getAnalytics(options = {}) {
        const {
            startDate = null,
            endDate = null,
            eventType = null,
            groupBy = null,
            limit = 1000
        } = options;

        let filteredEvents = this.events;

        // Filter by date range
        if (startDate || endDate) {
            filteredEvents = filteredEvents.filter(event => {
                const eventTime = new Date(event.properties.timestamp);
                if (startDate && eventTime < new Date(startDate)) return false;
                if (endDate && eventTime > new Date(endDate)) return false;
                return true;
            });
        }

        // Filter by event type
        if (eventType) {
            filteredEvents = filteredEvents.filter(event => event.name === eventType);
        }

        // Limit results
        filteredEvents = filteredEvents.slice(-limit);

        // Group by if specified
        let groupedData = null;
        if (groupBy) {
            groupedData = this._groupEvents(filteredEvents, groupBy);
        }

        return {
            events: filteredEvents,
            grouped: groupedData,
            metrics: this.getMetrics(),
            summary: {
                totalEvents: filteredEvents.length,
                dateRange: {
                    start: startDate,
                    end: endDate
                },
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        // Calculate dynamic metrics
        const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
        const totalSessionDuration = Array.from(this.sessions.values())
            .filter(s => s.duration)
            .reduce((sum, s) => sum + s.duration, 0);
        
        const avgSessionDuration = this.sessions.size > 0 
            ? totalSessionDuration / this.sessions.size 
            : 0;

        return {
            ...this.builtInMetrics,
            totalEvents: this.events.length,
            activeSessions: activeSessions.length,
            totalSessions: this.sessions.size,
            avgSessionDuration: Math.round(avgSessionDuration / 1000), // in seconds
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Generate analytics report
     */
    generateReport(type = 'daily', options = {}) {
        const report = {
            type,
            period: this._getReportPeriod(type),
            metrics: this.getMetrics(),
            topEvents: this._getTopEvents(10),
            topPages: this._getTopPages(10),
            userJourney: this._getUserJourney(),
            conversions: this._getConversions(),
            errors: this._getErrors(),
            generatedAt: new Date().toISOString()
        };

        // Emit report generated event
        this.eventBus.emit('analytics:report-generated', {
            reportType: type,
            metricsIncluded: Object.keys(report.metrics).length,
            timestamp: new Date().toISOString()
        });

        return report;
    }

    /**
     * Export analytics data
     */
    exportData(format = 'json', options = {}) {
        const data = this.getAnalytics(options);
        
        switch (format.toLowerCase()) {
            case 'csv':
                return this._exportToCSV(data.events);
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'xml':
                return this._exportToXML(data);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Clear analytics data
     */
    clearData(options = {}) {
        const { keepMetrics = false, keepSessions = false } = options;
        
        this.events = [];
        
        if (!keepSessions) {
            this.sessions.clear();
        }
        
        if (!keepMetrics) {
            this.builtInMetrics = {
                pageViews: 0,
                uniqueVisitors: 0,
                sessions: 0,
                bounceRate: 0,
                avgSessionDuration: 0,
                conversions: 0,
                revenue: 0
            };
        }

        // Clear stored data
        this._clearStoredData();

        this.eventBus.emit('analytics:data-cleared', {
            clearedEvents: true,
            clearedSessions: !keepSessions,
            clearedMetrics: !keepMetrics,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Helper methods
     */
    _generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _getCurrentSessionId() {
        // Get current active session or create new one
        const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
        if (activeSessions.length > 0) {
            return activeSessions[0].id;
        }
        
        const newSession = this.startSession();
        return newSession.id;
    }

    _getCurrentUserId() {
        // In a real implementation, this would get the current logged-in user
        return 'anonymous_user';
    }

    _updateMetrics(event) {
        switch (event.name) {
            case this.eventTypes.PAGE_VIEW:
                this.builtInMetrics.pageViews++;
                break;
        }

        // Update session activity
        const session = this.sessions.get(event.context.sessionId);
        if (session) {
            session.lastActivity = Date.now();
            session.events++;
            if (event.name === this.eventTypes.PAGE_VIEW) {
                session.pageViews++;
            }
        }
    }

    _updateSessionMetrics(session) {
        // Calculate bounce rate
        const totalSessions = this.sessions.size;
        const bouncedSessions = Array.from(this.sessions.values())
            .filter(s => s.pageViews <= 1).length;
        
        this.builtInMetrics.bounceRate = totalSessions > 0 
            ? (bouncedSessions / totalSessions) * 100 
            : 0;
    }

    _groupEvents(events, groupBy) {
        const grouped = {};
        
        events.forEach(event => {
            let key;
            switch (groupBy) {
                case 'day':
                    key = new Date(event.properties.timestamp).toDateString();
                    break;
                case 'hour':
                    key = new Date(event.properties.timestamp).toISOString().slice(0, 13);
                    break;
                case 'event':
                    key = event.name;
                    break;
                default:
                    key = event.properties[groupBy] || 'unknown';
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(event);
        });
        
        return grouped;
    }

    _getTopEvents(limit = 10) {
        const eventCounts = {};
        this.events.forEach(event => {
            eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
        });
        
        return Object.entries(eventCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    _getTopPages(limit = 10) {
        const pageCounts = {};
        this.events
            .filter(event => event.name === this.eventTypes.PAGE_VIEW)
            .forEach(event => {
                const page = event.properties.page || event.properties.url;
                pageCounts[page] = (pageCounts[page] || 0) + 1;
            });
        
        return Object.entries(pageCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([page, views]) => ({ page, views }));
    }

    _getUserJourney() {
        // Simplified user journey analysis
        const journeys = [];
        this.sessions.forEach(session => {
            const sessionEvents = this.events.filter(e => e.context.sessionId === session.id);
            if (sessionEvents.length > 0) {
                journeys.push({
                    sessionId: session.id,
                    steps: sessionEvents.map(e => ({
                        event: e.name,
                        timestamp: e.properties.timestamp,
                        page: e.properties.page || e.properties.url
                    }))
                });
            }
        });
        
        return journeys.slice(0, 20); // Return recent 20 journeys
    }

    _getConversions() {
        return this.events.filter(event => event.name === this.eventTypes.CONVERSION);
    }

    _getErrors() {
        return this.events.filter(event => event.name === this.eventTypes.ERROR);
    }

    _getReportPeriod(type) {
        const now = new Date();
        const periods = {
            daily: {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: now
            },
            weekly: {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now
            },
            monthly: {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: now
            }
        };
        
        return periods[type] || periods.daily;
    }

    _exportToCSV(events) {
        if (events.length === 0) return '';
        
        const headers = ['Event', 'Timestamp', 'Session ID', 'User ID', 'Properties'];
        const rows = events.map(event => [
            event.name,
            event.properties.timestamp,
            event.context.sessionId,
            event.context.userId,
            JSON.stringify(event.properties)
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    _exportToXML(data) {
        // Simplified XML export
        return `<?xml version="1.0" encoding="UTF-8"?>
<analytics>
    <summary>
        <totalEvents>${data.summary.totalEvents}</totalEvents>
        <generatedAt>${data.summary.generatedAt}</generatedAt>
    </summary>
    <metrics>
        ${Object.entries(data.metrics).map(([key, value]) => 
            `<${key}>${value}</${key}>`
        ).join('\n        ')}
    </metrics>
</analytics>`;
    }

    _loadStoredData() {
        // Load from state manager
        const storedEvents = this.stateManager?.getState('analytics:events') || [];
        const storedSessions = this.stateManager?.getState('analytics:sessions') || [];
        
        this.events = storedEvents;
        storedSessions.forEach(session => {
            this.sessions.set(session.id, session);
        });
    }

    _storeEvent(event) {
        // Store in state manager
        this.stateManager?.setState('analytics:events', this.events);
    }

    _storeSession(session) {
        // Store in state manager
        const sessions = Array.from(this.sessions.values());
        this.stateManager?.setState('analytics:sessions', sessions);
    }

    _clearStoredData() {
        this.stateManager?.setState('analytics:events', []);
        this.stateManager?.setState('analytics:sessions', []);
    }

    _startSessionTracking() {
        // Auto-end inactive sessions
        setInterval(() => {
            const now = Date.now();
            this.sessions.forEach((session, sessionId) => {
                if (session.isActive && 
                    (now - session.lastActivity) > this.config.sessionTimeout) {
                    this.endSession(sessionId);
                }
            });
        }, 60000); // Check every minute
    }

    _setupDataCleanup() {
        // Clean old data periodically
        setInterval(() => {
            const cutoff = Date.now() - this.config.retentionPeriod;
            this.events = this.events.filter(event => event.timestamp > cutoff);
        }, 24 * 60 * 60 * 1000); // Check daily
    }

    _setupEventListeners() {
        // Listen for application events
        this.eventBus.on('router:navigated', (data) => {
            this.trackPageView(data.to, { from: data.from, params: data.params });
        });

        this.eventBus.on('error', (data) => {
            this.trackError(data.error, data.context);
        });
    }

    /**
     * Destroy analytics service
     */
    destroy() {
        this.events = [];
        this.sessions.clear();
        this.metrics.clear();
        console.log('📊 Analytics Service destroyed');
    }
}