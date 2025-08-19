/**
 * Workflow Engine - Advanced marketing automation workflows
 * Features: Visual workflow builder, triggers, conditions, actions
 * 
 * @author BrainSAIT Team
 */

class WorkflowEngine {
    constructor(config = {}) {
        this.config = {
            maxWorkflows: 100,
            maxStepsPerWorkflow: 50,
            maxConcurrentExecutions: 10,
            executionTimeout: 300000, // 5 minutes
            retryAttempts: 3,
            retryDelay: 1000,
            enableLogging: true,
            enableMetrics: true,
            ...config
        };

        this.workflows = new Map();
        this.executions = new Map();
        this.triggers = new Map();
        this.actions = new Map();
        this.conditions = new Map();
        this.scheduledTasks = new Map();
        
        this.isRunning = false;
        this.executionQueue = [];
        this.metrics = {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0
        };

        this.setupBuiltInComponents();
    }

    /**
     * Initialize workflow engine
     */
    async initialize() {
        console.log('🔄 Initializing Workflow Engine...');
        
        this.isRunning = true;
        this.startExecutionLoop();
        this.startScheduler();
        
        console.log('✅ Workflow Engine initialized');
    }

    /**
     * Setup built-in triggers, actions, and conditions
     */
    setupBuiltInComponents() {
        // Built-in triggers
        this.registerTrigger('campaign_created', new CampaignCreatedTrigger());
        this.registerTrigger('campaign_started', new CampaignStartedTrigger());
        this.registerTrigger('metric_threshold', new MetricThresholdTrigger());
        this.registerTrigger('time_based', new TimeBasedTrigger());
        this.registerTrigger('webhook', new WebhookTrigger());
        this.registerTrigger('user_action', new UserActionTrigger());

        // Built-in actions
        this.registerAction('send_email', new SendEmailAction());
        this.registerAction('post_content', new PostContentAction());
        this.registerAction('generate_content', new GenerateContentAction());
        this.registerAction('update_campaign', new UpdateCampaignAction());
        this.registerAction('pause_campaign', new PauseCampaignAction());
        this.registerAction('send_notification', new SendNotificationAction());
        this.registerAction('create_report', new CreateReportAction());
        this.registerAction('delay', new DelayAction());

        // Built-in conditions
        this.registerCondition('metric_compare', new MetricCompareCondition());
        this.registerCondition('time_range', new TimeRangeCondition());
        this.registerCondition('user_property', new UserPropertyCondition());
        this.registerCondition('campaign_status', new CampaignStatusCondition());
        this.registerCondition('platform_available', new PlatformAvailableCondition());
    }

    /**
     * Create a new workflow
     */
    createWorkflow(workflowData) {
        const workflow = {
            id: workflowData.id || this.generateId(),
            name: workflowData.name,
            description: workflowData.description || '',
            trigger: workflowData.trigger,
            steps: workflowData.steps || [],
            settings: {
                enabled: workflowData.enabled !== false,
                concurrent: workflowData.concurrent || false,
                timeout: workflowData.timeout || this.config.executionTimeout,
                retryOnFailure: workflowData.retryOnFailure !== false,
                notifyOnFailure: workflowData.notifyOnFailure || false,
                ...workflowData.settings
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: workflowData.createdBy,
                version: workflowData.version || 1,
                tags: workflowData.tags || []
            },
            metrics: {
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                averageRunTime: 0,
                lastRun: null,
                lastSuccess: null,
                lastFailure: null
            }
        };

        // Validate workflow
        const validation = this.validateWorkflow(workflow);
        if (!validation.valid) {
            throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
        }

        this.workflows.set(workflow.id, workflow);
        
        // Setup trigger
        this.setupWorkflowTrigger(workflow);
        
        console.log(`📋 Workflow created: ${workflow.name} (${workflow.id})`);
        return workflow;
    }

    /**
     * Update existing workflow
     */
    updateWorkflow(workflowId, updateData) {
        const existingWorkflow = this.workflows.get(workflowId);
        if (!existingWorkflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        // Create updated workflow
        const updatedWorkflow = {
            ...existingWorkflow,
            ...updateData,
            id: workflowId, // Prevent ID changes
            metadata: {
                ...existingWorkflow.metadata,
                ...updateData.metadata,
                updatedAt: new Date().toISOString(),
                version: existingWorkflow.metadata.version + 1
            }
        };

        // Validate updated workflow
        const validation = this.validateWorkflow(updatedWorkflow);
        if (!validation.valid) {
            throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
        }

        // Remove old trigger setup
        this.removeWorkflowTrigger(existingWorkflow);
        
        // Update workflow
        this.workflows.set(workflowId, updatedWorkflow);
        
        // Setup new trigger
        if (updatedWorkflow.settings.enabled) {
            this.setupWorkflowTrigger(updatedWorkflow);
        }

        console.log(`📋 Workflow updated: ${updatedWorkflow.name} (${workflowId})`);
        return updatedWorkflow;
    }

    /**
     * Delete workflow
     */
    deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        // Remove trigger setup
        this.removeWorkflowTrigger(workflow);
        
        // Cancel any running executions
        this.cancelWorkflowExecutions(workflowId);
        
        // Remove workflow
        this.workflows.delete(workflowId);
        
        console.log(`📋 Workflow deleted: ${workflow.name} (${workflowId})`);
    }

    /**
     * Execute workflow manually
     */
    async executeWorkflow(workflowId, context = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        if (!workflow.settings.enabled) {
            throw new Error(`Workflow is disabled: ${workflowId}`);
        }

        const execution = {
            id: this.generateId(),
            workflowId,
            status: 'pending',
            context: { ...context },
            startTime: Date.now(),
            endTime: null,
            steps: [],
            error: null,
            retryAttempt: 0
        };

        this.executions.set(execution.id, execution);
        this.executionQueue.push(execution);
        
        console.log(`🚀 Workflow execution queued: ${workflow.name} (${execution.id})`);
        return execution.id;
    }

    /**
     * Start execution loop
     */
    startExecutionLoop() {
        const processQueue = async () => {
            if (!this.isRunning) {return;}

            const activeExecutions = Array.from(this.executions.values())
                .filter(exec => exec.status === 'running').length;

            if (activeExecutions >= this.config.maxConcurrentExecutions) {
                setTimeout(processQueue, 1000);
                return;
            }

            const execution = this.executionQueue.shift();
            if (!execution) {
                setTimeout(processQueue, 1000);
                return;
            }

            try {
                await this.processExecution(execution);
            } catch (error) {
                console.error('Execution processing error:', error);
            }

            // Continue processing
            setTimeout(processQueue, 100);
        };

        processQueue();
    }

    /**
     * Process single workflow execution
     */
    async processExecution(execution) {
        const workflow = this.workflows.get(execution.workflowId);
        if (!workflow) {
            execution.status = 'failed';
            execution.error = 'Workflow not found';
            return;
        }

        execution.status = 'running';
        
        try {
            console.log(`🔄 Executing workflow: ${workflow.name} (${execution.id})`);
            
            // Execute workflow steps
            for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                const stepResult = await this.executeStep(step, execution, workflow);
                
                execution.steps.push({
                    stepIndex: i,
                    stepId: step.id,
                    stepType: step.type,
                    status: stepResult.success ? 'completed' : 'failed',
                    startTime: stepResult.startTime,
                    endTime: stepResult.endTime,
                    result: stepResult.result,
                    error: stepResult.error
                });

                // Handle step failure
                if (!stepResult.success) {
                    if (step.continueOnFailure) {
                        console.warn(`Step failed but continuing: ${step.id}`);
                        continue;
                    } else {
                        throw new Error(`Step failed: ${step.id} - ${stepResult.error}`);
                    }
                }

                // Handle conditional branches
                if (stepResult.result && stepResult.result.nextStep) {
                    i = this.findStepIndex(workflow.steps, stepResult.result.nextStep) - 1;
                }
            }

            // Execution completed successfully
            execution.status = 'completed';
            execution.endTime = Date.now();
            
            // Update workflow metrics
            this.updateWorkflowMetrics(workflow, execution, true);
            
            console.log(`✅ Workflow completed: ${workflow.name} (${execution.id})`);

        } catch (error) {
            execution.status = 'failed';
            execution.endTime = Date.now();
            execution.error = error.message;
            
            // Update workflow metrics
            this.updateWorkflowMetrics(workflow, execution, false);
            
            console.error(`❌ Workflow failed: ${workflow.name} (${execution.id})`, error);

            // Handle retry
            if (workflow.settings.retryOnFailure && execution.retryAttempt < this.config.retryAttempts) {
                execution.retryAttempt++;
                execution.status = 'retrying';
                
                setTimeout(() => {
                    this.executionQueue.push(execution);
                }, this.config.retryDelay * execution.retryAttempt);
                
                console.log(`🔄 Retrying workflow: ${workflow.name} (attempt ${execution.retryAttempt})`);
            } else if (workflow.settings.notifyOnFailure) {
                await this.notifyWorkflowFailure(workflow, execution);
            }
        }
    }

    /**
     * Execute single workflow step
     */
    async executeStep(step, execution, workflow) {
        const startTime = Date.now();
        
        try {
            console.log(`🔧 Executing step: ${step.id} (${step.type})`);

            // Check conditions first
            if (step.conditions && step.conditions.length > 0) {
                const conditionsMet = await this.evaluateConditions(step.conditions, execution.context);
                if (!conditionsMet) {
                    return {
                        success: true,
                        startTime,
                        endTime: Date.now(),
                        result: { skipped: true, reason: 'Conditions not met' }
                    };
                }
            }

            let result;

            // Execute based on step type
            switch (step.type) {
                case 'action':
                    result = await this.executeAction(step.action, execution.context);
                    break;
                    
                case 'condition':
                    const conditionResult = await this.evaluateCondition(step.condition, execution.context);
                    result = {
                        conditionMet: conditionResult,
                        nextStep: conditionResult ? step.trueStep : step.falseStep
                    };
                    break;
                    
                case 'loop':
                    result = await this.executeLoop(step, execution, workflow);
                    break;
                    
                case 'parallel':
                    result = await this.executeParallel(step.branches, execution.context);
                    break;
                    
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }

            // Update execution context with step results
            if (step.outputVariable && result) {
                execution.context[step.outputVariable] = result;
            }

            return {
                success: true,
                startTime,
                endTime: Date.now(),
                result
            };

        } catch (error) {
            return {
                success: false,
                startTime,
                endTime: Date.now(),
                error: error.message
            };
        }
    }

    /**
     * Execute action step
     */
    async executeAction(actionConfig, context) {
        const action = this.actions.get(actionConfig.type);
        if (!action) {
            throw new Error(`Action not found: ${actionConfig.type}`);
        }

        const parameters = this.resolveParameters(actionConfig.parameters, context);
        return await action.execute(parameters, context);
    }

    /**
     * Evaluate condition
     */
    async evaluateCondition(conditionConfig, context) {
        const condition = this.conditions.get(conditionConfig.type);
        if (!condition) {
            throw new Error(`Condition not found: ${conditionConfig.type}`);
        }

        const parameters = this.resolveParameters(conditionConfig.parameters, context);
        return await condition.evaluate(parameters, context);
    }

    /**
     * Evaluate multiple conditions
     */
    async evaluateConditions(conditions, context) {
        for (const conditionConfig of conditions) {
            const result = await this.evaluateCondition(conditionConfig, context);
            if (!result) {return false;}
        }
        return true;
    }

    /**
     * Execute loop step
     */
    async executeLoop(step, execution, workflow) {
        const iterations = step.iterations || 1;
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            execution.context.loopIndex = i;
            
            for (const loopStep of step.steps) {
                const stepResult = await this.executeStep(loopStep, execution, workflow);
                if (!stepResult.success && !loopStep.continueOnFailure) {
                    throw new Error(`Loop step failed: ${stepResult.error}`);
                }
            }
            
            results.push(execution.context);
        }
        
        delete execution.context.loopIndex;
        return results;
    }

    /**
     * Execute parallel branches
     */
    async executeParallel(branches, context) {
        const promises = branches.map(async (branch, index) => {
            const branchContext = { ...context, branchIndex: index };
            const results = [];
            
            for (const step of branch.steps) {
                const stepResult = await this.executeStep(step, { context: branchContext }, null);
                if (!stepResult.success) {
                    throw new Error(`Parallel step failed: ${stepResult.error}`);
                }
                results.push(stepResult.result);
            }
            
            return results;
        });

        return await Promise.all(promises);
    }

    /**
     * Setup workflow trigger
     */
    setupWorkflowTrigger(workflow) {
        const trigger = this.triggers.get(workflow.trigger.type);
        if (!trigger) {
            console.warn(`Trigger not found: ${workflow.trigger.type}`);
            return;
        }

        trigger.setup(workflow.trigger.parameters, (context) => {
            this.executeWorkflow(workflow.id, context);
        });
    }

    /**
     * Remove workflow trigger
     */
    removeWorkflowTrigger(workflow) {
        const trigger = this.triggers.get(workflow.trigger.type);
        if (trigger && trigger.cleanup) {
            trigger.cleanup(workflow.trigger.parameters);
        }
    }

    /**
     * Start scheduler for time-based workflows
     */
    startScheduler() {
        setInterval(() => {
            const now = new Date();
            
            for (const [workflowId, workflow] of this.workflows) {
                if (!workflow.settings.enabled) {continue;}
                if (workflow.trigger.type !== 'time_based') {continue;}
                
                const schedule = workflow.trigger.parameters.schedule;
                if (this.shouldExecuteScheduled(schedule, now)) {
                    this.executeWorkflow(workflowId, { scheduledAt: now.toISOString() });
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Check if scheduled workflow should execute
     */
    shouldExecuteScheduled(schedule, now) {
        // Implementation for cron-like scheduling
        // This is a simplified version
        if (schedule.type === 'interval') {
            const lastRun = this.scheduledTasks.get(schedule.id);
            const interval = schedule.intervalMinutes * 60 * 1000;
            
            if (!lastRun || (now.getTime() - lastRun) >= interval) {
                this.scheduledTasks.set(schedule.id, now.getTime());
                return true;
            }
        }
        
        return false;
    }

    /**
     * Validate workflow configuration
     */
    validateWorkflow(workflow) {
        const errors = [];

        if (!workflow.name || workflow.name.length < 3) {
            errors.push('Workflow name must be at least 3 characters');
        }

        if (!workflow.trigger || !workflow.trigger.type) {
            errors.push('Workflow must have a trigger');
        }

        if (!workflow.steps || workflow.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        }

        if (workflow.steps && workflow.steps.length > this.config.maxStepsPerWorkflow) {
            errors.push(`Workflow cannot have more than ${this.config.maxStepsPerWorkflow} steps`);
        }

        // Validate each step
        if (workflow.steps) {
            workflow.steps.forEach((step, index) => {
                if (!step.id) {
                    errors.push(`Step ${index} must have an ID`);
                }
                if (!step.type) {
                    errors.push(`Step ${index} must have a type`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Register custom trigger
     */
    registerTrigger(type, trigger) {
        this.triggers.set(type, trigger);
    }

    /**
     * Register custom action
     */
    registerAction(type, action) {
        this.actions.set(type, action);
    }

    /**
     * Register custom condition
     */
    registerCondition(type, condition) {
        this.conditions.set(type, condition);
    }

    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId) {
        return this.workflows.get(workflowId);
    }

    /**
     * Get all workflows
     */
    getWorkflows() {
        return Array.from(this.workflows.values());
    }

    /**
     * Get workflow execution
     */
    getExecution(executionId) {
        return this.executions.get(executionId);
    }

    /**
     * Get workflow executions
     */
    getExecutions(workflowId = null) {
        const executions = Array.from(this.executions.values());
        
        if (workflowId) {
            return executions.filter(exec => exec.workflowId === workflowId);
        }
        
        return executions;
    }

    /**
     * Utility methods
     */
    resolveParameters(parameters, context) {
        if (!parameters) {return {};}
        
        const resolved = {};
        
        for (const [key, value] of Object.entries(parameters)) {
            resolved[key] = this.resolveValue(value, context);
        }
        
        return resolved;
    }

    resolveValue(value, context) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const path = value.slice(2, -2).trim();
            return this.getValueByPath(context, path);
        }
        
        return value;
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    findStepIndex(steps, stepId) {
        return steps.findIndex(step => step.id === stepId);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    updateWorkflowMetrics(workflow, execution, success) {
        const runTime = execution.endTime - execution.startTime;
        
        workflow.metrics.totalRuns++;
        workflow.metrics.lastRun = new Date(execution.endTime).toISOString();
        
        if (success) {
            workflow.metrics.successfulRuns++;
            workflow.metrics.lastSuccess = new Date(execution.endTime).toISOString();
        } else {
            workflow.metrics.failedRuns++;
            workflow.metrics.lastFailure = new Date(execution.endTime).toISOString();
        }
        
        // Update average run time
        const totalRunTime = workflow.metrics.averageRunTime * (workflow.metrics.totalRuns - 1) + runTime;
        workflow.metrics.averageRunTime = Math.round(totalRunTime / workflow.metrics.totalRuns);
        
        // Update global metrics
        this.metrics.totalExecutions++;
        if (success) {
            this.metrics.successfulExecutions++;
        } else {
            this.metrics.failedExecutions++;
        }
        
        const globalTotalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + runTime;
        this.metrics.averageExecutionTime = Math.round(globalTotalTime / this.metrics.totalExecutions);
    }

    cancelWorkflowExecutions(workflowId) {
        for (const [executionId, execution] of this.executions) {
            if (execution.workflowId === workflowId && execution.status === 'running') {
                execution.status = 'cancelled';
                execution.endTime = Date.now();
            }
        }
    }

    async notifyWorkflowFailure(workflow, execution) {
        // Implementation for failure notifications
        console.error(`Workflow failure notification: ${workflow.name}`, {
            workflowId: workflow.id,
            executionId: execution.id,
            error: execution.error
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            activeWorkflows: this.workflows.size,
            runningExecutions: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
            queuedExecutions: this.executionQueue.length
        };
    }

    /**
     * Stop workflow engine
     */
    stop() {
        this.isRunning = false;
        console.log('🛑 Workflow Engine stopped');
    }
}

// Base classes for workflow components

class BaseTrigger {
    setup(parameters, callback) {
        throw new Error('setup method must be implemented');
    }
    
    cleanup(parameters) {
        // Optional cleanup method
    }
}

class BaseAction {
    async execute(parameters, context) {
        throw new Error('execute method must be implemented');
    }
}

class BaseCondition {
    async evaluate(parameters, context) {
        throw new Error('evaluate method must be implemented');
    }
}

// Example built-in components

class CampaignCreatedTrigger extends BaseTrigger {
    setup(parameters, callback) {
        // Listen for campaign creation events
        window.addEventListener('campaign:created', (event) => {
            callback({ campaign: event.detail });
        });
    }
}

class CampaignStartedTrigger extends BaseTrigger {
    setup(parameters, callback) {
        window.addEventListener('campaign:started', (event) => {
            callback({ campaign: event.detail });
        });
    }
}

class MetricThresholdTrigger extends BaseTrigger {
    setup(parameters, callback) {
        // Monitor metrics and trigger when threshold is reached
        setInterval(() => {
            // Check metrics against threshold
            // This would integrate with analytics service
        }, parameters.checkInterval || 60000);
    }
}

class TimeBasedTrigger extends BaseTrigger {
    setup(parameters, callback) {
        // Handled by the scheduler
    }
}

class WebhookTrigger extends BaseTrigger {
    setup(parameters, callback) {
        // Setup webhook endpoint
        // This would be handled by the API layer
    }
}

class UserActionTrigger extends BaseTrigger {
    setup(parameters, callback) {
        window.addEventListener(`user:${parameters.action}`, (event) => {
            callback({ user: event.detail.user, action: parameters.action });
        });
    }
}

class SendEmailAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Sending email:', parameters);
        // Implementation would integrate with email service
        return { sent: true, messageId: 'msg_123' };
    }
}

class PostContentAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Posting content:', parameters);
        // Implementation would integrate with platform service
        return { posted: true, postId: 'post_123' };
    }
}

class GenerateContentAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Generating content:', parameters);
        // Implementation would integrate with AI service
        return { 
            generated: true, 
            content: 'AI-generated content based on parameters'
        };
    }
}

class UpdateCampaignAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Updating campaign:', parameters);
        return { updated: true, campaignId: parameters.campaignId };
    }
}

class PauseCampaignAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Pausing campaign:', parameters);
        return { paused: true, campaignId: parameters.campaignId };
    }
}

class SendNotificationAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Sending notification:', parameters);
        return { sent: true, notificationId: 'notif_123' };
    }
}

class CreateReportAction extends BaseAction {
    async execute(parameters, context) {
        console.log('Creating report:', parameters);
        return { created: true, reportId: 'report_123' };
    }
}

class DelayAction extends BaseAction {
    async execute(parameters, context) {
        const delay = parameters.delay || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { delayed: true, duration: delay };
    }
}

class MetricCompareCondition extends BaseCondition {
    async evaluate(parameters, context) {
        const { metric, operator, value } = parameters;
        const metricValue = context.metrics?.[metric];
        
        if (metricValue === undefined) {return false;}
        
        switch (operator) {
            case '>': return metricValue > value;
            case '<': return metricValue < value;
            case '>=': return metricValue >= value;
            case '<=': return metricValue <= value;
            case '==': return metricValue == value;
            case '!=': return metricValue != value;
            default: return false;
        }
    }
}

class TimeRangeCondition extends BaseCondition {
    async evaluate(parameters, context) {
        const now = new Date();
        const currentHour = now.getHours();
        
        return currentHour >= parameters.startHour && currentHour < parameters.endHour;
    }
}

class UserPropertyCondition extends BaseCondition {
    async evaluate(parameters, context) {
        const userValue = context.user?.[parameters.property];
        return userValue === parameters.value;
    }
}

class CampaignStatusCondition extends BaseCondition {
    async evaluate(parameters, context) {
        return context.campaign?.status === parameters.status;
    }
}

class PlatformAvailableCondition extends BaseCondition {
    async evaluate(parameters, context) {
        // Check if platform is available/connected
        // This would integrate with platform service
        return true; // Placeholder
    }
}

export { WorkflowEngine };