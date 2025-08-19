/**
 * Analytics Chart Component - Advanced data visualization
 * Features: Multiple chart types, real-time updates, interactive tooltips
 * 
 * @author BrainSAIT Team
 */

class AnalyticsChart {
    constructor(container, config = {}) {
        this.container = container;
        this.config = {
            type: 'line', // 'line', 'bar', 'area', 'pie', 'doughnut', 'scatter'
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            },
            realTimeUpdates: false,
            updateInterval: 30000, // 30 seconds
            theme: 'light', // 'light', 'dark', 'auto'
            ...config
        };

        this.chart = null;
        this.updateTimer = null;
        this.isDestroyed = false;
        
        // Load Chart.js if not already loaded
        this.loadChartJS().then(() => {
            this.initialize();
        });
    }

    /**
     * Load Chart.js library
     */
    async loadChartJS() {
        if (typeof Chart !== 'undefined') {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize the chart
     */
    initialize() {
        this.setupContainer();
        this.applyTheme();
        this.createChart();
        this.setupEventListeners();
        
        if (this.config.realTimeUpdates) {
            this.startRealTimeUpdates();
        }
    }

    /**
     * Setup chart container
     */
    setupContainer() {
        this.container.innerHTML = `
            <div class="analytics-chart">
                <div class="analytics-chart__header">
                    <h3 class="analytics-chart__title">${this.config.title || ''}</h3>
                    <div class="analytics-chart__controls">
                        ${this.renderControls()}
                    </div>
                </div>
                <div class="analytics-chart__body">
                    <canvas class="analytics-chart__canvas"></canvas>
                </div>
                <div class="analytics-chart__footer">
                    ${this.renderFooter()}
                </div>
            </div>
        `;

        this.canvasElement = this.container.querySelector('.analytics-chart__canvas');
        this.chartElement = this.container.querySelector('.analytics-chart');
    }

    /**
     * Render chart controls
     */
    renderControls() {
        return `
            <div class="chart-controls">
                <div class="chart-controls__time-range">
                    <select class="chart-control chart-control--time-range" data-control="timeRange">
                        <option value="1h">Last Hour</option>
                        <option value="24h" selected>Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>
                </div>
                <div class="chart-controls__view-type">
                    <button class="chart-control chart-control--view" data-view="line" ${this.config.type === 'line' ? 'aria-pressed="true"' : ''}>
                        <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                    </button>
                    <button class="chart-control chart-control--view" data-view="bar" ${this.config.type === 'bar' ? 'aria-pressed="true"' : ''}>
                        <svg viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>
                    </button>
                    <button class="chart-control chart-control--view" data-view="area" ${this.config.type === 'area' ? 'aria-pressed="true"' : ''}>
                        <svg viewBox="0 0 24 24"><path d="M3 18h18v2H3v-2zM5 14h3v3H5v-3zm5-7h3v10h-3V7zm5 3h3v7h-3v-7z"/></svg>
                    </button>
                </div>
                <div class="chart-controls__actions">
                    <button class="chart-control chart-control--refresh" data-action="refresh" title="Refresh Data">
                        <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    </button>
                    <button class="chart-control chart-control--fullscreen" data-action="fullscreen" title="Fullscreen">
                        <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                    </button>
                    <button class="chart-control chart-control--export" data-action="export" title="Export Data">
                        <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render chart footer
     */
    renderFooter() {
        return `
            <div class="chart-footer">
                <div class="chart-footer__stats">
                    ${this.renderStats()}
                </div>
                <div class="chart-footer__timestamp">
                    Last updated: <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render chart statistics
     */
    renderStats() {
        if (!this.config.data.datasets.length) {return '';}
        
        const stats = this.calculateStats();
        return `
            <div class="chart-stats">
                <div class="chart-stat">
                    <span class="chart-stat__label">Total</span>
                    <span class="chart-stat__value">${stats.total.toLocaleString()}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Average</span>
                    <span class="chart-stat__value">${stats.average.toLocaleString()}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Peak</span>
                    <span class="chart-stat__value">${stats.peak.toLocaleString()}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Growth</span>
                    <span class="chart-stat__value chart-stat__value--${stats.growth >= 0 ? 'positive' : 'negative'}">
                        ${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Apply theme to chart
     */
    applyTheme() {
        const theme = this.config.theme === 'auto' ? this.detectTheme() : this.config.theme;
        
        if (theme === 'dark') {
            this.chartElement.classList.add('analytics-chart--dark');
            this.applyDarkTheme();
        } else {
            this.chartElement.classList.add('analytics-chart--light');
            this.applyLightTheme();
        }
    }

    /**
     * Detect system theme
     */
    detectTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * Apply light theme colors
     */
    applyLightTheme() {
        this.config.options.plugins.legend.labels = {
            ...this.config.options.plugins.legend.labels,
            color: '#374151'
        };
        
        if (this.config.options.scales.x) {
            this.config.options.scales.x.ticks = {
                ...this.config.options.scales.x.ticks,
                color: '#6b7280'
            };
        }
        
        if (this.config.options.scales.y) {
            this.config.options.scales.y.ticks = {
                ...this.config.options.scales.y.ticks,
                color: '#6b7280'
            };
        }
    }

    /**
     * Apply dark theme colors
     */
    applyDarkTheme() {
        this.config.options.plugins.legend.labels = {
            ...this.config.options.plugins.legend.labels,
            color: '#d1d5db'
        };
        
        if (this.config.options.scales.x) {
            this.config.options.scales.x.ticks = {
                ...this.config.options.scales.x.ticks,
                color: '#9ca3af'
            };
            this.config.options.scales.x.grid = {
                ...this.config.options.scales.x.grid,
                color: 'rgba(255, 255, 255, 0.1)'
            };
        }
        
        if (this.config.options.scales.y) {
            this.config.options.scales.y.ticks = {
                ...this.config.options.scales.y.ticks,
                color: '#9ca3af'
            };
            this.config.options.scales.y.grid = {
                ...this.config.options.scales.y.grid,
                color: 'rgba(255, 255, 255, 0.1)'
            };
        }
    }

    /**
     * Create Chart.js instance
     */
    createChart() {
        const ctx = this.canvasElement.getContext('2d');
        
        // Prepare data with default colors if not specified
        const processedData = this.processData(this.config.data);
        
        this.chart = new Chart(ctx, {
            type: this.config.type,
            data: processedData,
            options: this.config.options
        });
    }

    /**
     * Process chart data and add default styling
     */
    processData(data) {
        const processedData = { ...data };
        const colorPalette = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];

        processedData.datasets = data.datasets.map((dataset, index) => {
            const color = dataset.backgroundColor || colorPalette[index % colorPalette.length];
            
            const processedDataset = {
                ...dataset,
                backgroundColor: this.config.type === 'line' ? `${color}20` : color,
                borderColor: color,
                borderWidth: 2,
                pointRadius: this.config.type === 'line' ? 4 : 0,
                pointHoverRadius: this.config.type === 'line' ? 6 : 0,
                pointBackgroundColor: color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: this.config.type === 'area'
            };

            return processedDataset;
        });

        return processedData;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Control buttons
        this.container.addEventListener('click', (e) => {
            const control = e.target.closest('[data-control], [data-view], [data-action]');
            if (!control) {return;}

            if (control.dataset.control) {
                this.handleControlChange(control.dataset.control, control.value);
            } else if (control.dataset.view) {
                this.handleViewChange(control.dataset.view);
            } else if (control.dataset.action) {
                this.handleAction(control.dataset.action);
            }
        });

        // Time range selector
        this.container.addEventListener('change', (e) => {
            if (e.target.dataset.control === 'timeRange') {
                this.handleTimeRangeChange(e.target.value);
            }
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            if (this.chart) {
                this.chart.resize();
            }
        }, 250));
    }

    /**
     * Handle control changes
     */
    handleControlChange(control, value) {
        switch (control) {
            case 'timeRange':
                this.handleTimeRangeChange(value);
                break;
        }
    }

    /**
     * Handle view changes
     */
    handleViewChange(viewType) {
        if (this.config.type === viewType) {return;}

        this.config.type = viewType;
        
        // Update active state
        this.container.querySelectorAll('[data-view]').forEach(btn => {
            btn.setAttribute('aria-pressed', btn.dataset.view === viewType);
        });

        // Recreate chart with new type
        if (this.chart) {
            this.chart.destroy();
            this.createChart();
        }

        this.emit('viewChanged', { type: viewType });
    }

    /**
     * Handle actions
     */
    handleAction(action) {
        switch (action) {
            case 'refresh':
                this.refresh();
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'export':
                this.export();
                break;
        }
    }

    /**
     * Handle time range changes
     */
    handleTimeRangeChange(timeRange) {
        this.emit('timeRangeChanged', { timeRange });
    }

    /**
     * Update chart data
     */
    updateData(newData) {
        if (!this.chart) {return;}

        this.config.data = newData;
        const processedData = this.processData(newData);
        
        this.chart.data = processedData;
        this.chart.update('active');

        // Update footer stats
        const footerStats = this.container.querySelector('.chart-footer__stats');
        if (footerStats) {
            footerStats.innerHTML = this.renderStats();
        }

        // Update timestamp
        const timestamp = this.container.querySelector('.timestamp');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleTimeString();
        }

        this.emit('dataUpdated', { data: newData });
    }

    /**
     * Add data point (for real-time updates)
     */
    addDataPoint(label, values) {
        if (!this.chart) {return;}

        this.chart.data.labels.push(label);
        
        values.forEach((value, index) => {
            if (this.chart.data.datasets[index]) {
                this.chart.data.datasets[index].data.push(value);
            }
        });

        // Remove oldest data point if we have too many
        const maxPoints = this.config.maxDataPoints || 50;
        if (this.chart.data.labels.length > maxPoints) {
            this.chart.data.labels.shift();
            this.chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        this.chart.update('none');
        this.emit('dataPointAdded', { label, values });
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        if (!this.config.data.datasets.length) {
            return { total: 0, average: 0, peak: 0, growth: 0 };
        }

        const primaryDataset = this.config.data.datasets[0];
        const data = primaryDataset.data || [];
        
        const total = data.reduce((sum, value) => sum + (value || 0), 0);
        const average = data.length ? total / data.length : 0;
        const peak = Math.max(...data);
        
        // Calculate growth (last vs first)
        let growth = 0;
        if (data.length >= 2 && data[0] > 0) {
            growth = ((data[data.length - 1] - data[0]) / data[0]) * 100;
        }

        return { total, average, peak, growth };
    }

    /**
     * Refresh chart data
     */
    async refresh() {
        const refreshBtn = this.container.querySelector('[data-action="refresh"]');
        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }

        try {
            this.emit('refreshRequested');
            
            // Update timestamp
            const timestamp = this.container.querySelector('.timestamp');
            if (timestamp) {
                timestamp.textContent = new Date().toLocaleTimeString();
            }
            
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
                refreshBtn.disabled = false;
            }
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        this.chartElement.classList.toggle('analytics-chart--fullscreen');
        
        if (this.chartElement.classList.contains('analytics-chart--fullscreen')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Resize chart after fullscreen change
        setTimeout(() => {
            if (this.chart) {
                this.chart.resize();
            }
        }, 300);
    }

    /**
     * Export chart data
     */
    export(format = 'png') {
        if (!this.chart) {return;}

        const link = document.createElement('a');
        
        switch (format) {
            case 'png':
                link.download = `chart_${Date.now()}.png`;
                link.href = this.chart.toBase64Image();
                break;
                
            case 'json':
                const data = JSON.stringify(this.config.data, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                link.download = `chart_data_${Date.now()}.json`;
                link.href = URL.createObjectURL(blob);
                break;
                
            case 'csv':
                const csv = this.convertToCSV(this.config.data);
                const csvBlob = new Blob([csv], { type: 'text/csv' });
                link.download = `chart_data_${Date.now()}.csv`;
                link.href = URL.createObjectURL(csvBlob);
                break;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Convert chart data to CSV
     */
    convertToCSV(data) {
        const headers = ['Label', ...data.datasets.map(d => d.label || 'Dataset')];
        const rows = [headers];

        data.labels.forEach((label, index) => {
            const row = [label];
            data.datasets.forEach(dataset => {
                row.push(dataset.data[index] || '');
            });
            rows.push(row);
        });

        return rows.map(row => row.join(',')).join('\n');
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        this.updateTimer = setInterval(() => {
            this.emit('realTimeUpdate');
        }, this.config.updateInterval);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Emit custom events
     */
    emit(eventName, data = {}) {
        const event = new CustomEvent(`chart:${eventName}`, { 
            detail: { ...data, chartId: this.config.id }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * Utility function for debouncing
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Destroy the chart and clean up
     */
    destroy() {
        this.isDestroyed = true;
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        this.stopRealTimeUpdates();
        
        // Remove fullscreen if active
        if (this.chartElement.classList.contains('analytics-chart--fullscreen')) {
            document.body.style.overflow = '';
        }
        
        this.container.innerHTML = '';
    }
}

export { AnalyticsChart };