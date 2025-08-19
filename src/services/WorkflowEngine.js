/**
 * Workflow Engine - Advanced automation and trigger-based campaign management
 * Supports visual workflow builder, conditional logic, and event-driven actions
 */

export class WorkflowEngine {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.workflows = new Map();
        this.activeExecutions = new Map();
        this.triggers = new Map();
        this.actions = new Map();
        this.conditions = new Map();
        this.isInitialized = false;
        
        // Workflow execution metrics
        this.metrics = {
            totalWorkflows: 0,
            activeWorkflows: 0,
            executedWorkflows: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0
        };
    }

    /**
     * Initialize workflow engine with default triggers and actions
     */
    async initialize() {
        console.log('⚡ Initializing Workflow Engine...');
        
        try {
            // Register default triggers
            this._registerDefaultTriggers();
            
            // Register default actions
            this._registerDefaultActions();
            
            // Register default conditions
            this._registerDefaultConditions();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Initialize from state
            await this._loadWorkflowsFromState();
            
            this.isInitialized = true;
            console.log('✅ Workflow Engine initialized');
            
            this.eventBus.emit('workflows:initialized', {
                triggers: Array.from(this.triggers.keys()),
                actions: Array.from(this.actions.keys()),
                conditions: Array.from(this.conditions.keys()),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Workflow Engine initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create a new workflow
     */
    async createWorkflow(definition) {
        const workflowId = definition.id || `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate workflow definition
        this._validateWorkflowDefinition(definition);
        
        const workflow = {
            id: workflowId,
            name: definition.name,
            description: definition.description || '',
            trigger: definition.trigger,
            actions: definition.actions || [],
            conditions: definition.conditions || [],
            settings: {
                enabled: true,
                retryAttempts: 3,
                timeout: 300000, // 5 minutes
                ...(definition.settings || {})
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: '1.0.0',
                author: definition.author || 'system'
            },
            statistics: {
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                lastExecuted: null,
                averageExecutionTime: 0
            }
        };
        
        this.workflows.set(workflowId, workflow);
        this.metrics.totalWorkflows++;
        
        // Save to state
        this._saveWorkflowsToState();
        
        // Register trigger if enabled
        if (workflow.settings.enabled) {
            await this._registerWorkflowTrigger(workflow);
            this.metrics.activeWorkflows++;
        }
        
        this.eventBus.emit('workflows:created', {
            workflowId,
            workflow,
            timestamp: new Date().toISOString()
        });
        
        return { workflowId, status: 'created' };
    }

    /**
     * Execute a workflow manually or by trigger
     */
    async executeWorkflow(workflowId, triggerData = {}, options = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        if (!workflow.settings.enabled && !options.force) {
            throw new Error(`Workflow is disabled: ${workflowId}`);
        }
        
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();
        
        const execution = {
            id: executionId,
            workflowId,
            status: 'running',
            startTime: new Date().toISOString(),
            endTime: null,
            triggerData,
            context: { ...triggerData },
            currentStep: 0,
            completedSteps: [],
            errors: [],
            results: new Map()
        };
        
        this.activeExecutions.set(executionId, execution);
        workflow.statistics.executionCount++;
        this.metrics.executedWorkflows++;
        
        try {
            this.eventBus.emit('workflows:execution-started', {
                executionId,
                workflowId,
                triggerData,
                timestamp: execution.startTime
            });
            
            // Execute workflow steps
            await this._executeWorkflowSteps(execution, workflow);
            
            // Mark as completed
            execution.status = 'completed';
            execution.endTime = new Date().toISOString();
            
            const executionTime = performance.now() - startTime;
            workflow.statistics.successCount++;
            workflow.statistics.lastExecuted = execution.endTime;
            workflow.statistics.averageExecutionTime = 
                (workflow.statistics.averageExecutionTime + executionTime) / 2;
            
            this.metrics.successfulExecutions++;
            this.metrics.averageExecutionTime = 
                (this.metrics.averageExecutionTime + executionTime) / 2;
            
            this.eventBus.emit('workflows:execution-completed', {
                executionId,
                workflowId,
                executionTime,
                results: Object.fromEntries(execution.results),
                timestamp: execution.endTime
            });
            
            return {
                success: true,
                executionId,
                results: Object.fromEntries(execution.results),
                executionTime,
                completedSteps: execution.completedSteps.length
            };
            
        } catch (error) {
            execution.status = 'failed';
            execution.endTime = new Date().toISOString();
            execution.errors.push({
                message: error.message,
                step: execution.currentStep,
                timestamp: new Date().toISOString()
            });
            
            workflow.statistics.failureCount++;
            this.metrics.failedExecutions++;
            
            this.eventBus.emit('workflows:execution-failed', {
                executionId,
                workflowId,
                error: error.message,
                step: execution.currentStep,
                timestamp: execution.endTime
            });
            
            throw error;
            
        } finally {
            this.activeExecutions.delete(executionId);
            this._saveWorkflowsToState();
        }
    }

    /**
     * Update existing workflow
     */
    async updateWorkflow(workflowId, updates) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        // Merge updates
        const updatedWorkflow = {
            ...workflow,
            ...updates,
            metadata: {
                ...workflow.metadata,
                updatedAt: new Date().toISOString(),
                version: this._incrementVersion(workflow.metadata.version)
            }
        };
        
        // Validate updated definition
        this._validateWorkflowDefinition(updatedWorkflow);
        
        this.workflows.set(workflowId, updatedWorkflow);
        
        // Re-register trigger if changed
        if (updates.trigger || updates.settings?.enabled !== undefined) {
            await this._registerWorkflowTrigger(updatedWorkflow);
        }
        
        this._saveWorkflowsToState();
        
        this.eventBus.emit('workflows:updated', {
            workflowId,
            updates,
            timestamp: new Date().toISOString()
        });
        
        return { workflowId, status: 'updated' };
    }

    /**
     * Delete workflow
     */
    async deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        // Stop any active executions
        for (const [execId, execution] of this.activeExecutions) {
            if (execution.workflowId === workflowId) {
                execution.status = 'cancelled';
                this.activeExecutions.delete(execId);
            }
        }
        
        this.workflows.delete(workflowId);
        this.metrics.totalWorkflows--;
        
        if (workflow.settings.enabled) {
            this.metrics.activeWorkflows--;
        }
        
        this._saveWorkflowsToState();
        
        this.eventBus.emit('workflows:deleted', {
            workflowId,
            timestamp: new Date().toISOString()
        });
        
        return { workflowId, status: 'deleted' };
    }

    /**
     * Enable/disable workflow
     */
    async toggleWorkflow(workflowId, enabled) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        const wasEnabled = workflow.settings.enabled;
        workflow.settings.enabled = enabled;
        workflow.metadata.updatedAt = new Date().toISOString();
        
        if (enabled && !wasEnabled) {
            await this._registerWorkflowTrigger(workflow);
            this.metrics.activeWorkflows++;
        } else if (!enabled && wasEnabled) {
            this.metrics.activeWorkflows--;
        }
        
        this._saveWorkflowsToState();
        
        this.eventBus.emit('workflows:toggled', {
            workflowId,
            enabled,
            timestamp: new Date().toISOString()
        });
        
        return { workflowId, enabled, status: 'updated' };
    }

    /**
     * Execute workflow steps sequentially
     */
    async _executeWorkflowSteps(execution, workflow) {
        const steps = [
            // First evaluate conditions
            ...workflow.conditions.map(condition => ({ type: 'condition', ...condition })),
            // Then execute actions
            ...workflow.actions.map(action => ({ type: 'action', ...action }))
        ];
        
        for (let i = 0; i < steps.length; i++) {
            execution.currentStep = i;
            const step = steps[i];
            
            try {
                let result;
                
                if (step.type === 'condition') {
                    result = await this._evaluateCondition(step, execution.context);
                    
                    // If condition fails, stop execution
                    if (!result.passed) {
                        throw new Error(`Condition failed: ${step.name || step.type}`);
                    }
                } else if (step.type === 'action') {
                    result = await this._executeAction(step, execution.context);
                    
                    // Update context with action results
                    if (result.output) {
                        execution.context = { ...execution.context, ...result.output };
                    }
                }
                
                execution.completedSteps.push({
                    step: i,
                    type: step.type,
                    name: step.name || step.type,
                    result,
                    timestamp: new Date().toISOString()
                });
                
                execution.results.set(step.name || `${step.type}_${i}`, result);
                
            } catch (error) {
                execution.errors.push({
                    step: i,
                    type: step.type,
                    name: step.name || step.type,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                throw new Error(`Step ${i} (${step.type}) failed: ${error.message}`);
            }
        }
    }

    /**
     * Evaluate a condition
     */
    async _evaluateCondition(condition, context) {
        const conditionHandler = this.conditions.get(condition.type);
        if (!conditionHandler) {
            throw new Error(`Unknown condition type: ${condition.type}`);
        }
        
        try {
            const result = await conditionHandler.evaluate(condition.config, context);
            return {
                passed: Boolean(result),
                value: result,
                condition: condition.type,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Condition evaluation failed: ${error.message}`);
        }
    }

    /**
     * Execute an action
     */
    async _executeAction(action, context) {
        const actionHandler = this.actions.get(action.type);
        if (!actionHandler) {
            throw new Error(`Unknown action type: ${action.type}`);
        }
        
        try {
            const result = await actionHandler.execute(action.config, context);
            return {
                success: true,
                output: result,
                action: action.type,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            throw new Error(`Action execution failed: ${error.message}`);
        }
    }

    /**
     * Register workflow trigger
     */
    async _registerWorkflowTrigger(workflow) {
        const trigger = workflow.trigger;
        const triggerHandler = this.triggers.get(trigger.type);
        
        if (!triggerHandler) {
            console.warn(`Unknown trigger type: ${trigger.type}`);
            return;
        }
        
        // Register trigger with handler
        triggerHandler.register(workflow.id, trigger.config, (triggerData) => {
            this.executeWorkflow(workflow.id, triggerData).catch(error => {
                console.error(`Workflow execution failed for ${workflow.id}:`, error);
            });
        });
    }

    /**
     * Register default triggers
     */
    _registerDefaultTriggers() {
        // Time-based trigger
        this.triggers.set('schedule', {
            name: 'Schedule Trigger',
            register: (workflowId, config, callback) => {
                const { cron, interval } = config;
                
                if (cron) {
                    // Simplified cron simulation (run every hour for demo)
                    setInterval(() => {
                        callback({ trigger: 'schedule', time: new Date().toISOString() });
                    }, 3600000);
                } else if (interval) {
                    setInterval(() => {
                        callback({ trigger: 'schedule', time: new Date().toISOString() });
                    }, interval);
                }
            }
        });
        
        // Event-based trigger
        this.triggers.set('event', {
            name: 'Event Trigger',
            register: (workflowId, config, callback) => {
                const { eventName } = config;
                this.eventBus.on(eventName, (data) => {
                    callback({ trigger: 'event', eventName, data });
                });
            }
        });
        
        // Webhook trigger
        this.triggers.set('webhook', {
            name: 'Webhook Trigger',
            register: (workflowId, config, callback) => {
                // Simulate webhook registration
                console.log(`Webhook registered for workflow ${workflowId}`);
                // In real implementation, this would register an HTTP endpoint
            }
        });
        
        // Performance trigger
        this.triggers.set('metric', {
            name: 'Metric Trigger',
            register: (workflowId, config, callback) => {
                const { metric, threshold, operator } = config;
                
                // Check metrics periodically
                setInterval(() => {
                    // Simulate metric check
                    const currentValue = Math.random() * 100;
                    let triggered = false;
                    
                    switch (operator) {
                        case 'gt':
                            triggered = currentValue > threshold;
                            break;
                        case 'lt':
                            triggered = currentValue < threshold;
                            break;
                        case 'eq':
                            triggered = Math.abs(currentValue - threshold) < 1;
                            break;
                    }
                    
                    if (triggered) {
                        callback({
                            trigger: 'metric',
                            metric,
                            currentValue,
                            threshold,
                            operator
                        });
                    }
                }, 60000); // Check every minute
            }
        });
    }

    /**
     * Register default actions
     */
    _registerDefaultActions() {
        // Send notification action
        this.actions.set('notify', {
            name: 'Send Notification',
            execute: async (config, context) => {
                const { message, channel, recipients } = config;
                
                // Simulate sending notification
                await new Promise(resolve => setTimeout(resolve, 500));
                
                return {
                    notificationId: `notif_${Date.now()}`,
                    message,
                    channel,
                    recipients: recipients || ['admin'],
                    sentAt: new Date().toISOString()
                };
            }
        });
        
        // Post content action
        this.actions.set('post_content', {
            name: 'Post Content',
            execute: async (config, context) => {
                const { content, platforms, options } = config;
                
                // Use platform manager if available
                const platformManager = this.stateManager.getState('services.platforms');
                
                if (platformManager) {
                    return await platformManager.postContent(content, platforms, options);
                } else {
                    // Simulate posting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return {
                        postId: `post_${Date.now()}`,
                        platforms,
                        content,
                        postedAt: new Date().toISOString()
                    };
                }
            }
        });
        
        // Generate content action
        this.actions.set('generate_content', {
            name: 'Generate AI Content',
            execute: async (config, context) => {
                const { prompt, type, platform } = config;
                
                // Use AI service if available
                const aiService = this.stateManager.getState('services.ai');
                
                if (aiService) {
                    return await aiService.generateContent({
                        type,
                        prompt,
                        platform
                    });
                } else {
                    // Simulate content generation
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    return {
                        content: `Generated ${type} content for ${platform}: ${prompt}`,
                        type,
                        platform,
                        generatedAt: new Date().toISOString()
                    };
                }
            }
        });
        
        // Update state action
        this.actions.set('update_state', {
            name: 'Update State',
            execute: async (config, context) => {
                const { key, value, operation } = config;
                
                switch (operation) {
                    case 'set':
                        this.stateManager.setState(key, value);
                        break;
                    case 'increment':
                        const current = this.stateManager.getState(key) || 0;
                        this.stateManager.setState(key, current + (value || 1));
                        break;
                    case 'append':
                        const currentArray = this.stateManager.getState(key) || [];
                        this.stateManager.setState(key, [...currentArray, value]);
                        break;
                }
                
                return {
                    key,
                    value,
                    operation,
                    updatedAt: new Date().toISOString()
                };
            }
        });
    }

    /**
     * Register default conditions
     */
    _registerDefaultConditions() {
        // Time condition
        this.conditions.set('time', {
            name: 'Time Condition',
            evaluate: async (config, context) => {
                const { start, end, timezone } = config;
                const now = new Date();
                const currentHour = now.getHours();
                
                const startHour = parseInt(start.split(':')[0]);
                const endHour = parseInt(end.split(':')[0]);
                
                return currentHour >= startHour && currentHour <= endHour;
            }
        });
        
        // State condition
        this.conditions.set('state', {
            name: 'State Condition',
            evaluate: async (config, context) => {
                const { key, operator, value } = config;
                const stateValue = this.stateManager.getState(key);
                
                switch (operator) {
                    case 'equals':
                        return stateValue === value;
                    case 'greater_than':
                        return stateValue > value;
                    case 'less_than':
                        return stateValue < value;
                    case 'contains':
                        return Array.isArray(stateValue) && stateValue.includes(value);
                    default:
                        return false;
                }
            }
        });
        
        // Context condition
        this.conditions.set('context', {
            name: 'Context Condition',
            evaluate: async (config, context) => {
                const { key, operator, value } = config;
                const contextValue = context[key];
                
                switch (operator) {
                    case 'exists':
                        return contextValue !== undefined;
                    case 'equals':
                        return contextValue === value;
                    case 'matches':
                        return new RegExp(value).test(String(contextValue));
                    default:
                        return false;
                }
            }
        });
    }

    /**
     * Validate workflow definition
     */
    _validateWorkflowDefinition(definition) {
        if (!definition.name) {
            throw new Error('Workflow name is required');
        }
        
        if (!definition.trigger || !definition.trigger.type) {
            throw new Error('Workflow trigger is required');
        }
        
        if (!this.triggers.has(definition.trigger.type)) {
            throw new Error(`Unknown trigger type: ${definition.trigger.type}`);
        }
        
        // Validate actions
        if (definition.actions) {
            for (const action of definition.actions) {
                if (!action.type || !this.actions.has(action.type)) {
                    throw new Error(`Unknown action type: ${action.type}`);
                }
            }
        }
        
        // Validate conditions
        if (definition.conditions) {
            for (const condition of definition.conditions) {
                if (!condition.type || !this.conditions.has(condition.type)) {
                    throw new Error(`Unknown condition type: ${condition.type}`);
                }
            }
        }
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Listen for external events that might trigger workflows
        this.eventBus.on('*', (data, event) => {
            // This will be handled by event triggers
        });
    }

    /**
     * Load workflows from state
     */
    async _loadWorkflowsFromState() {
        const savedWorkflows = this.stateManager.getState('workflows') || {};
        
        for (const [id, workflow] of Object.entries(savedWorkflows)) {
            this.workflows.set(id, workflow);
            
            if (workflow.settings.enabled) {
                await this._registerWorkflowTrigger(workflow);
                this.metrics.activeWorkflows++;
            }
        }
        
        this.metrics.totalWorkflows = this.workflows.size;
    }

    /**
     * Save workflows to state
     */
    _saveWorkflowsToState() {
        const workflowsData = Object.fromEntries(this.workflows);
        this.stateManager.setState('workflows', workflowsData);
        this.stateManager.setState('workflowMetrics', this.metrics);
    }

    /**
     * Increment version string
     */
    _incrementVersion(version) {
        const parts = version.split('.');
        parts[2] = String(parseInt(parts[2]) + 1);
        return parts.join('.');
    }

    /**
     * Get all workflows
     */
    getWorkflows() {
        return Array.from(this.workflows.values());
    }

    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }

    /**
     * Get active executions
     */
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }

    /**
     * Get workflow metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            workflows: this.workflows.size,
            activeExecutions: this.activeExecutions.size,
            availableTriggers: Array.from(this.triggers.keys()),
            availableActions: Array.from(this.actions.keys()),
            availableConditions: Array.from(this.conditions.keys()),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Destroy workflow engine
     */
    destroy() {
        // Cancel all active executions
        for (const [executionId, execution] of this.activeExecutions) {
            execution.status = 'cancelled';
        }
        
        this.workflows.clear();
        this.activeExecutions.clear();
        this.triggers.clear();
        this.actions.clear();
        this.conditions.clear();
        
        console.log('⚡ Workflow Engine destroyed');
    }
}