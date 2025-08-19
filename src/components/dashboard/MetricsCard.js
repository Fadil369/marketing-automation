/**
 * Metrics Card Component - Professional dashboard metric display
 * Features: Real-time updates, animations, trend indicators
 * 
 * @author BrainSAIT Team
 */

class MetricsCard {
    constructor(container, config = {}) {
        this.container = container;
        this.config = {
            title: '',
            value: 0,
            previousValue: null,
            unit: '',
            format: 'number', // 'number', 'currency', 'percentage'
            trend: null, // 'up', 'down', 'neutral'
            trendValue: null,
            icon: null,
            color: 'primary',
            size: 'medium', // 'small', 'medium', 'large'
            animated: true,
            realTimeUpdates: true,
            clickable: false,
            onClick: null,
            ...config
        };

        this.currentValue = 0;
        this.animationFrame = null;
        this.updateTimer = null;
        
        this.render();
        this.setupEventListeners();
        
        if (this.config.animated) {
            this.animateValue(this.config.value);
        } else {
            this.currentValue = this.config.value;
        }
    }

    /**
     * Render the metrics card
     */
    render() {
        const cardClass = `metrics-card metrics-card--${this.config.size} metrics-card--${this.config.color}`;
        const clickableClass = this.config.clickable ? 'metrics-card--clickable' : '';
        
        this.container.innerHTML = `
            <div class="${cardClass} ${clickableClass}" data-testid="metrics-card">
                ${this.renderHeader()}
                ${this.renderValue()}
                ${this.renderTrend()}
                ${this.renderFooter()}
            </div>
        `;

        this.cardElement = this.container.querySelector('.metrics-card');
        this.valueElement = this.container.querySelector('.metrics-card__value');
        this.trendElement = this.container.querySelector('.metrics-card__trend');
    }

    /**
     * Render card header
     */
    renderHeader() {
        if (!this.config.title && !this.config.icon) {return '';}
        
        return `
            <div class="metrics-card__header">
                ${this.config.icon ? `<div class="metrics-card__icon">${this.renderIcon()}</div>` : ''}
                ${this.config.title ? `<h3 class="metrics-card__title">${this.config.title}</h3>` : ''}
            </div>
        `;
    }

    /**
     * Render card value
     */
    renderValue() {
        return `
            <div class="metrics-card__body">
                <div class="metrics-card__value" data-value="${this.config.value}">
                    ${this.formatValue(this.currentValue)}
                </div>
                ${this.config.unit ? `<span class="metrics-card__unit">${this.config.unit}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render trend indicator
     */
    renderTrend() {
        if (!this.config.trend || !this.config.trendValue) {return '';}
        
        const trendClass = `metrics-card__trend metrics-card__trend--${this.config.trend}`;
        const trendIcon = this.getTrendIcon(this.config.trend);
        
        return `
            <div class="${trendClass}">
                <span class="metrics-card__trend-icon">${trendIcon}</span>
                <span class="metrics-card__trend-value">${this.formatTrendValue(this.config.trendValue)}</span>
                <span class="metrics-card__trend-label">vs last period</span>
            </div>
        `;
    }

    /**
     * Render card footer
     */
    renderFooter() {
        return `
            <div class="metrics-card__footer">
                <span class="metrics-card__timestamp">Updated ${this.getRelativeTime()}</span>
            </div>
        `;
    }

    /**
     * Render icon
     */
    renderIcon() {
        if (typeof this.config.icon === 'string') {
            // SVG string or icon name
            if (this.config.icon.startsWith('<svg')) {
                return this.config.icon;
            } else {
                return this.getIconSVG(this.config.icon);
            }
        }
        return '';
    }

    /**
     * Get icon SVG by name
     */
    getIconSVG(iconName) {
        const icons = {
            views: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
            likes: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
            comments: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/></svg>`,
            shares: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>`,
            reach: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
            engagement: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>`,
            revenue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>`
        };
        
        return icons[iconName] || '';
    }

    /**
     * Get trend icon
     */
    getTrendIcon(trend) {
        const icons = {
            up: '↗',
            down: '↘',
            neutral: '→'
        };
        return icons[trend] || '';
    }

    /**
     * Format value based on configuration
     */
    formatValue(value) {
        switch (this.config.format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }).format(value);
                
            case 'percentage':
                return `${value.toFixed(1)}%`;
                
            case 'number':
            default:
                if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                }
                return value.toLocaleString();
        }
    }

    /**
     * Format trend value
     */
    formatTrendValue(value) {
        const prefix = value > 0 ? '+' : '';
        if (this.config.format === 'percentage') {
            return `${prefix}${value.toFixed(1)}%`;
        }
        return `${prefix}${value.toFixed(1)}%`;
    }

    /**
     * Animate value change
     */
    animateValue(targetValue) {
        const startValue = this.currentValue;
        const difference = targetValue - startValue;
        const duration = 1000; // 1 second
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easedProgress = this.easeOutCubic(progress);
            
            this.currentValue = startValue + (difference * easedProgress);
            
            if (this.valueElement) {
                this.valueElement.textContent = this.formatValue(this.currentValue);
            }
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.currentValue = targetValue;
                if (this.valueElement) {
                    this.valueElement.textContent = this.formatValue(targetValue);
                }
            }
        };

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        animate();
    }

    /**
     * Easing function for smooth animation
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Update the card with new data
     */
    update(newData) {
        const previousValue = this.config.value;
        this.config = { ...this.config, ...newData };
        
        // Calculate trend if not provided
        if (!this.config.trend && previousValue !== null && this.config.value !== previousValue) {
            const change = this.config.value - previousValue;
            const changePercent = (change / previousValue) * 100;
            
            this.config.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
            this.config.trendValue = changePercent;
        }

        // Animate to new value
        if (this.config.animated && this.config.value !== this.currentValue) {
            this.animateValue(this.config.value);
        } else {
            this.currentValue = this.config.value;
            if (this.valueElement) {
                this.valueElement.textContent = this.formatValue(this.currentValue);
            }
        }

        // Update trend display
        if (this.trendElement && this.config.trend) {
            this.trendElement.innerHTML = this.renderTrend().match(/<div[^>]*>(.*?)<\/div>/s)[1];
            this.trendElement.className = `metrics-card__trend metrics-card__trend--${this.config.trend}`;
        }

        // Update timestamp
        const timestampElement = this.container.querySelector('.metrics-card__timestamp');
        if (timestampElement) {
            timestampElement.textContent = `Updated ${this.getRelativeTime()}`;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.config.clickable && this.config.onClick) {
            this.container.addEventListener('click', (e) => {
                if (e.target.closest('.metrics-card')) {
                    this.config.onClick(this.config);
                }
            });
        }

        // Real-time updates
        if (this.config.realTimeUpdates) {
            this.updateTimer = setInterval(() => {
                this.updateTimestamp();
            }, 60000); // Update timestamp every minute
        }
    }

    /**
     * Update timestamp display
     */
    updateTimestamp() {
        const timestampElement = this.container.querySelector('.metrics-card__timestamp');
        if (timestampElement) {
            timestampElement.textContent = `Updated ${this.getRelativeTime()}`;
        }
    }

    /**
     * Get relative time string
     */
    getRelativeTime() {
        const now = new Date();
        const seconds = Math.floor((now - (this.lastUpdate || now)) / 1000);
        
        if (seconds < 60) {return 'just now';}
        if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ago`;}
        if (seconds < 86400) {return `${Math.floor(seconds / 3600)}h ago`;}
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    /**
     * Set loading state
     */
    setLoading(isLoading = true) {
        if (isLoading) {
            this.cardElement.classList.add('metrics-card--loading');
            this.valueElement.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            this.cardElement.classList.remove('metrics-card--loading');
            this.valueElement.textContent = this.formatValue(this.currentValue);
        }
    }

    /**
     * Set error state
     */
    setError(errorMessage = 'Failed to load data') {
        this.cardElement.classList.add('metrics-card--error');
        this.valueElement.innerHTML = `<span class="error-message">${errorMessage}</span>`;
    }

    /**
     * Clear error state
     */
    clearError() {
        this.cardElement.classList.remove('metrics-card--error');
        this.valueElement.textContent = this.formatValue(this.currentValue);
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.container.innerHTML = '';
    }
}

// CSS styles for the metrics card
const METRICS_CARD_STYLES = `
.metrics-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.metrics-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.metrics-card:hover::before {
    opacity: 1;
}

.metrics-card--clickable {
    cursor: pointer;
}

.metrics-card--clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.metrics-card--small {
    padding: 16px;
}

.metrics-card--large {
    padding: 32px;
}

.metrics-card--primary::before {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
}

.metrics-card--success::before {
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.metrics-card--warning::before {
    background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.metrics-card--danger::before {
    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.metrics-card__header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.metrics-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    color: #6b7280;
}

.metrics-card__icon svg {
    width: 20px;
    height: 20px;
}

.metrics-card__title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.metrics-card__body {
    display: flex;
    align-items: baseline;
    margin-bottom: 12px;
}

.metrics-card__value {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    line-height: 1;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.metrics-card--small .metrics-card__value {
    font-size: 24px;
}

.metrics-card--large .metrics-card__value {
    font-size: 40px;
}

.metrics-card__unit {
    font-size: 14px;
    color: #6b7280;
    margin-left: 4px;
    font-weight: 500;
}

.metrics-card__trend {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
}

.metrics-card__trend--up {
    color: #059669;
}

.metrics-card__trend--down {
    color: #dc2626;
}

.metrics-card__trend--neutral {
    color: #6b7280;
}

.metrics-card__trend-icon {
    margin-right: 4px;
    font-size: 14px;
}

.metrics-card__trend-value {
    margin-right: 4px;
}

.metrics-card__trend-label {
    color: #6b7280;
    font-weight: 400;
}

.metrics-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.metrics-card__timestamp {
    font-size: 11px;
    color: #9ca3af;
    font-weight: 400;
}

.metrics-card--loading {
    pointer-events: none;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.metrics-card--error {
    border-color: #fca5a5;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.error-message {
    color: #dc2626;
    font-size: 14px;
    font-weight: 500;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .metrics-card {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border-color: rgba(55, 65, 81, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .metrics-card__title {
        color: #d1d5db;
    }
    
    .metrics-card__value {
        color: #f9fafb;
    }
    
    .metrics-card__unit {
        color: #9ca3af;
    }
    
    .metrics-card__timestamp {
        color: #6b7280;
    }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = METRICS_CARD_STYLES;
    document.head.appendChild(styleSheet);
}

export { MetricsCard };