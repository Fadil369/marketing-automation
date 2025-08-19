/**
 * Advanced UI Components Library
 * Provides reusable, accessible, and interactive components for the BrainSAIT platform
 */

export class UIComponents {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.components = new Map();
        this.instances = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize UI Components
     */
    initialize() {
        console.log('🎨 Initializing UI Components...');
        
        try {
            // Register all components
            this._registerComponents();
            
            // Set up global event listeners
            this._setupGlobalEventListeners();
            
            // Initialize existing components in DOM
            this._initializeExistingComponents();
            
            this.isInitialized = true;
            console.log('✅ UI Components initialized');
            
            this.eventBus?.emit('ui:components-initialized', {
                components: Array.from(this.components.keys()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ UI Components initialization failed:', error);
            throw error;
        }
    }

    /**
     * Register all component types
     */
    _registerComponents() {
        // Modal Component
        this.components.set('modal', {
            selector: '.modal, [data-component="modal"]',
            factory: (element, options) => new Modal(element, options, this.eventBus)
        });
        
        // Dropdown Component
        this.components.set('dropdown', {
            selector: '.dropdown, [data-component="dropdown"]',
            factory: (element, options) => new Dropdown(element, options, this.eventBus)
        });
        
        // Tooltip Component
        this.components.set('tooltip', {
            selector: '[data-tooltip], [data-component="tooltip"]',
            factory: (element, options) => new Tooltip(element, options, this.eventBus)
        });
        
        // Tabs Component
        this.components.set('tabs', {
            selector: '.tabs, [data-component="tabs"]',
            factory: (element, options) => new Tabs(element, options, this.eventBus)
        });
        
        // Toast Component
        this.components.set('toast', {
            selector: '.toast, [data-component="toast"]',
            factory: (element, options) => new Toast(element, options, this.eventBus)
        });
        
        // Accordion Component
        this.components.set('accordion', {
            selector: '.accordion, [data-component="accordion"]',
            factory: (element, options) => new Accordion(element, options, this.eventBus)
        });
        
        // Progress Component
        this.components.set('progress', {
            selector: '.progress, [data-component="progress"]',
            factory: (element, options) => new Progress(element, options, this.eventBus)
        });
        
        // DataTable Component
        this.components.set('datatable', {
            selector: '.data-table, [data-component="datatable"]',
            factory: (element, options) => new DataTable(element, options, this.eventBus)
        });
    }

    /**
     * Initialize existing components in DOM
     */
    _initializeExistingComponents() {
        for (const [name, component] of this.components) {
            const elements = document.querySelectorAll(component.selector);
            elements.forEach(element => {
                if (!element.dataset.uiInitialized) {
                    this.createComponent(name, element);
                }
            });
        }
    }

    /**
     * Create component instance
     */
    createComponent(type, element, options = {}) {
        const component = this.components.get(type);
        if (!component) {
            throw new Error(`Unknown component type: ${type}`);
        }

        // Create unique instance ID
        const instanceId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create component instance
        const instance = component.factory(element, { ...options, instanceId }, this.eventBus);
        
        // Store instance
        this.instances.set(instanceId, instance);
        
        // Mark element as initialized
        element.dataset.uiInitialized = 'true';
        element.dataset.uiInstanceId = instanceId;
        
        // Initialize the instance
        if (instance.initialize) {
            instance.initialize();
        }
        
        return instance;
    }

    /**
     * Get component instance
     */
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }

    /**
     * Destroy component instance
     */
    destroyComponent(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance) {
            if (instance.destroy) {
                instance.destroy();
            }
            this.instances.delete(instanceId);
        }
    }

    /**
     * Set up global event listeners
     */
    _setupGlobalEventListeners() {
        // Auto-initialize components when new elements are added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        this._initializeComponentsInElement(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this._handleGlobalKeydown(event);
        });
        
        // Global click handling for dropdowns and modals
        document.addEventListener('click', (event) => {
            this._handleGlobalClick(event);
        });
    }

    /**
     * Initialize components in a specific element
     */
    _initializeComponentsInElement(element) {
        for (const [name, component] of this.components) {
            const elements = element.querySelectorAll ? 
                element.querySelectorAll(component.selector) : 
                (element.matches && element.matches(component.selector) ? [element] : []);
                
            elements.forEach(el => {
                if (!el.dataset.uiInitialized) {
                    this.createComponent(name, el);
                }
            });
        }
    }

    /**
     * Handle global keyboard events
     */
    _handleGlobalKeydown(event) {
        // ESC key - close modals, dropdowns, etc.
        if (event.key === 'Escape') {
            this._closeAllOverlays();
        }
        
        // Tab key - focus management
        if (event.key === 'Tab') {
            this._handleTabNavigation(event);
        }
    }

    /**
     * Handle global click events
     */
    _handleGlobalClick(event) {
        // Close dropdowns when clicking outside
        this._handleOutsideClick(event);
    }

    /**
     * Close all overlay components
     */
    _closeAllOverlays() {
        for (const instance of this.instances.values()) {
            if (instance.close && instance.isOpen) {
                instance.close();
            }
        }
    }

    /**
     * Handle outside clicks for dropdowns
     */
    _handleOutsideClick(event) {
        for (const instance of this.instances.values()) {
            if (instance.handleOutsideClick) {
                instance.handleOutsideClick(event);
            }
        }
    }

    /**
     * Handle tab navigation
     */
    _handleTabNavigation(event) {
        // Focus trap for modals
        const activeModal = Array.from(this.instances.values())
            .find(instance => instance.type === 'modal' && instance.isOpen);
            
        if (activeModal && activeModal.trapFocus) {
            activeModal.trapFocus(event);
        }
    }
}

/**
 * Base Component Class
 */
class BaseComponent {
    constructor(element, options = {}, eventBus = null) {
        this.element = element;
        this.options = { ...this.defaultOptions, ...options };
        this.eventBus = eventBus;
        this.instanceId = options.instanceId;
        this.isInitialized = false;
    }

    get defaultOptions() {
        return {};
    }

    initialize() {
        this.isInitialized = true;
    }

    destroy() {
        this.isInitialized = false;
    }

    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, { 
            detail: { ...data, instanceId: this.instanceId },
            bubbles: true 
        });
        this.element.dispatchEvent(event);
        
        // Also emit through global event bus if available
        this.eventBus?.emit(`ui:${eventName}`, { ...data, instanceId: this.instanceId });
    }
}

/**
 * Modal Component
 */
class Modal extends BaseComponent {
    get defaultOptions() {
        return {
            backdrop: true,
            keyboard: true,
            focus: true,
            show: false
        };
    }

    initialize() {
        super.initialize();
        this.type = 'modal';
        this.isOpen = false;
        this._setupEventListeners();
        
        if (this.options.show) {
            this.show();
        }
    }

    show() {
        if (this.isOpen) {return;}
        
        this.isOpen = true;
        this.element.style.display = 'block';
        this.element.classList.add('show');
        
        // Add backdrop
        if (this.options.backdrop) {
            this._createBackdrop();
        }
        
        // Focus management
        if (this.options.focus) {
            this._setFocus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        this.emit('modal:shown');
    }

    hide() {
        if (!this.isOpen) {return;}
        
        this.isOpen = false;
        this.element.classList.remove('show');
        
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 150);
        
        // Remove backdrop
        this._removeBackdrop();
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        this.emit('modal:hidden');
    }

    toggle() {
        this.isOpen ? this.hide() : this.show();
    }

    _setupEventListeners() {
        // Close button
        const closeButtons = this.element.querySelectorAll('[data-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.hide());
        });
    }

    _createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        this.backdrop.addEventListener('click', () => {
            if (this.options.backdrop === true) {
                this.hide();
            }
        });
        document.body.appendChild(this.backdrop);
    }

    _removeBackdrop() {
        if (this.backdrop) {
            this.backdrop.remove();
            this.backdrop = null;
        }
    }

    _setFocus() {
        const focusableElement = this.element.querySelector('[autofocus]') ||
                                this.element.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])');
        
        if (focusableElement) {
            focusableElement.focus();
        }
    }

    trapFocus(event) {
        const focusableElements = this.element.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    destroy() {
        super.destroy();
        this.hide();
        this._removeBackdrop();
    }
}

/**
 * Dropdown Component
 */
class Dropdown extends BaseComponent {
    get defaultOptions() {
        return {
            trigger: 'click',
            placement: 'bottom-start',
            offset: [0, 2],
            autoClose: true
        };
    }

    initialize() {
        super.initialize();
        this.type = 'dropdown';
        this.isOpen = false;
        this.trigger = this.element.querySelector('[data-toggle="dropdown"]');
        this.menu = this.element.querySelector('.dropdown-menu');
        
        this._setupEventListeners();
    }

    show() {
        if (this.isOpen) {return;}
        
        this.isOpen = true;
        this.element.classList.add('show');
        this.menu.classList.add('show');
        
        this._positionMenu();
        this.emit('dropdown:shown');
    }

    hide() {
        if (!this.isOpen) {return;}
        
        this.isOpen = false;
        this.element.classList.remove('show');
        this.menu.classList.remove('show');
        
        this.emit('dropdown:hidden');
    }

    toggle() {
        this.isOpen ? this.hide() : this.show();
    }

    _setupEventListeners() {
        if (this.trigger) {
            this.trigger.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.toggle();
            });
        }
        
        // Close when clicking menu items
        if (this.options.autoClose) {
            this.menu.addEventListener('click', (event) => {
                if (event.target.matches('.dropdown-item')) {
                    this.hide();
                }
            });
        }
    }

    _positionMenu() {
        // Simple positioning - can be enhanced with a positioning library
        const rect = this.trigger.getBoundingClientRect();
        const menuRect = this.menu.getBoundingClientRect();
        
        // Calculate position based on placement option
        let top, left;
        
        switch (this.options.placement) {
            case 'bottom-start':
                top = rect.bottom + this.options.offset[1];
                left = rect.left + this.options.offset[0];
                break;
            case 'bottom-end':
                top = rect.bottom + this.options.offset[1];
                left = rect.right - menuRect.width + this.options.offset[0];
                break;
            case 'top-start':
                top = rect.top - menuRect.height - this.options.offset[1];
                left = rect.left + this.options.offset[0];
                break;
            default:
                top = rect.bottom + this.options.offset[1];
                left = rect.left + this.options.offset[0];
        }
        
        this.menu.style.position = 'fixed';
        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
        this.menu.style.zIndex = '1000';
    }

    handleOutsideClick(event) {
        if (this.isOpen && !this.element.contains(event.target)) {
            this.hide();
        }
    }

    destroy() {
        super.destroy();
        this.hide();
    }
}

/**
 * Tooltip Component
 */
class Tooltip extends BaseComponent {
    get defaultOptions() {
        return {
            placement: 'top',
            trigger: 'hover',
            delay: { show: 500, hide: 100 },
            html: false,
            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
        };
    }

    initialize() {
        super.initialize();
        this.type = 'tooltip';
        this.tooltip = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        
        this.title = this.element.dataset.tooltip || this.element.getAttribute('title');
        this.element.removeAttribute('title'); // Prevent default tooltip
        
        this._setupEventListeners();
    }

    show() {
        if (!this.title) {return;}
        
        clearTimeout(this.hideTimeout);
        
        if (!this.tooltip) {
            this._createTooltip();
        }
        
        this.tooltip.style.display = 'block';
        this._positionTooltip();
        
        // Add show class after positioning
        requestAnimationFrame(() => {
            this.tooltip.classList.add('show');
        });
        
        this.emit('tooltip:shown');
    }

    hide() {
        clearTimeout(this.showTimeout);
        
        if (this.tooltip) {
            this.tooltip.classList.remove('show');
            
            setTimeout(() => {
                if (this.tooltip) {
                    this.tooltip.style.display = 'none';
                }
            }, 150);
        }
        
        this.emit('tooltip:hidden');
    }

    _setupEventListeners() {
        if (this.options.trigger === 'hover') {
            this.element.addEventListener('mouseenter', () => {
                this.showTimeout = setTimeout(() => this.show(), this.options.delay.show);
            });
            
            this.element.addEventListener('mouseleave', () => {
                clearTimeout(this.showTimeout);
                this.hideTimeout = setTimeout(() => this.hide(), this.options.delay.hide);
            });
        } else if (this.options.trigger === 'focus') {
            this.element.addEventListener('focus', () => this.show());
            this.element.addEventListener('blur', () => this.hide());
        }
    }

    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.innerHTML = this.options.template;
        this.tooltip = this.tooltip.firstElementChild;
        
        const inner = this.tooltip.querySelector('.tooltip-inner');
        if (this.options.html) {
            inner.innerHTML = this.title;
        } else {
            inner.textContent = this.title;
        }
        
        document.body.appendChild(this.tooltip);
    }

    _positionTooltip() {
        if (!this.tooltip) {return;}
        
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (this.options.placement) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
            default:
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
        }
        
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.top = `${Math.max(0, top)}px`;
        this.tooltip.style.left = `${Math.max(0, left)}px`;
        this.tooltip.style.zIndex = '1070';
    }

    destroy() {
        super.destroy();
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
        
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
}

/**
 * Toast Component
 */
class Toast extends BaseComponent {
    get defaultOptions() {
        return {
            autohide: true,
            delay: 5000,
            position: 'top-right'
        };
    }

    initialize() {
        super.initialize();
        this.type = 'toast';
        this.hideTimeout = null;
        
        this._setupEventListeners();
        this._positionToast();
        
        if (this.options.autohide) {
            this.hideTimeout = setTimeout(() => this.hide(), this.options.delay);
        }
    }

    show() {
        this.element.classList.add('show');
        this.emit('toast:shown');
    }

    hide() {
        clearTimeout(this.hideTimeout);
        this.element.classList.remove('show');
        
        setTimeout(() => {
            this.element.remove();
        }, 150);
        
        this.emit('toast:hidden');
    }

    _setupEventListeners() {
        const closeButton = this.element.querySelector('[data-dismiss="toast"]');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }
        
        // Pause autohide on hover
        if (this.options.autohide) {
            this.element.addEventListener('mouseenter', () => {
                clearTimeout(this.hideTimeout);
            });
            
            this.element.addEventListener('mouseleave', () => {
                this.hideTimeout = setTimeout(() => this.hide(), this.options.delay);
            });
        }
    }

    _positionToast() {
        // Create or get toast container
        let container = document.querySelector(`.toast-container-${this.options.position}`);
        if (!container) {
            container = document.createElement('div');
            container.className = `toast-container toast-container-${this.options.position}`;
            
            // Position the container
            const [vPos, hPos] = this.options.position.split('-');
            container.style.position = 'fixed';
            container.style.zIndex = '1055';
            container.style[vPos] = '1rem';
            container.style[hPos] = '1rem';
            
            document.body.appendChild(container);
        }
        
        container.appendChild(this.element);
        this.show();
    }

    destroy() {
        super.destroy();
        clearTimeout(this.hideTimeout);
    }
}

// Create global instance
export const uiComponents = new UIComponents();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        uiComponents.initialize();
    });
} else {
    uiComponents.initialize();
}

// Export for manual usage
export { Modal, Dropdown, Tooltip, Toast };