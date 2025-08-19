/**
 * AI Hub Manager - Centralized AI services interface and workflow management
 * Provides unified access to AI capabilities, content generation, and automation
 */

export class AIHubManager {
    constructor(eventBus, stateManager, services) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.services = services;
        this.activeJobs = new Map();
        this.templates = new Map();
        this.workflows = new Map();
        this.history = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            maxConcurrentJobs: 10,
            defaultTimeout: 300000, // 5 minutes
            enableBatching: true,
            batchSize: 5,
            enableCaching: true,
            cacheTimeout: 3600000 // 1 hour
        };
        
        // UI elements
        this.elements = {
            container: null,
            toolbar: null,
            contentArea: null,
            sidebar: null
        };
        
        // Cache for AI responses
        this.cache = new Map();
    }

    /**
     * Initialize AI Hub Manager
     */
    async initialize() {
        console.log('🤖 Initializing AI Hub Manager...');
        
        try {
            // Initialize UI
            this._initializeUI();
            
            // Load templates
            await this._loadTemplates();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Initialize workflows
            await this._initializeWorkflows();
            
            // Load history
            await this._loadHistory();
            
            this.isInitialized = true;
            console.log('✅ AI Hub Manager initialized');
            
            this.eventBus.emit('ai-hub:initialized', {
                templates: this.templates.size,
                workflows: this.workflows.size,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ AI Hub Manager initialization failed:', error);
            throw error;
        }
    }

    /**
     * Generate content using AI
     */
    async generateContent(request) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Check cache first
        if (this.config.enableCaching) {
            const cachedResult = this._getCachedResult(request);
            if (cachedResult) {
                return { ...cachedResult, fromCache: true };
            }
        }
        
        // Check concurrent job limit
        if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
            throw new Error('Maximum concurrent jobs reached. Please try again later.');
        }
        
        const job = {
            id: jobId,
            request,
            status: 'pending',
            startTime: Date.now(),
            endTime: null,
            result: null,
            error: null,
            progress: 0
        };
        
        this.activeJobs.set(jobId, job);
        
        try {
            this.eventBus.emit('ai-hub:job-started', {
                jobId,
                request,
                timestamp: new Date().toISOString()
            });
            
            // Update job status
            job.status = 'running';
            job.progress = 10;
            this._updateJobUI(job);
            
            // Get AI service
            const aiService = this.services.get('ai');
            if (!aiService) {
                throw new Error('AI service not available');
            }
            
            // Generate content based on type
            let result;
            switch (request.type) {
                case 'text':
                    result = await this._generateText(aiService, request);
                    break;
                case 'image':
                    result = await this._generateImage(aiService, request);
                    break;
                case 'video':
                    result = await this._generateVideo(aiService, request);
                    break;
                case 'voice':
                    result = await this._generateVoice(aiService, request);
                    break;
                case 'campaign':
                    result = await this._generateCampaign(aiService, request);
                    break;
                default:
                    throw new Error(`Unsupported content type: ${request.type}`);
            }
            
            job.status = 'completed';
            job.progress = 100;
            job.endTime = Date.now();
            job.result = result;
            
            // Cache result
            if (this.config.enableCaching) {
                this._cacheResult(request, result);
            }
            
            // Add to history
            this._addToHistory(job);
            
            // Update UI
            this._updateJobUI(job);
            
            this.eventBus.emit('ai-hub:job-completed', {
                jobId,
                result,
                duration: job.endTime - job.startTime,
                timestamp: new Date().toISOString()
            });
            
            return result;
            
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.endTime = Date.now();
            
            this._updateJobUI(job);
            
            this.eventBus.emit('ai-hub:job-failed', {
                jobId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
            
        } finally {
            // Clean up job after delay
            setTimeout(() => {
                this.activeJobs.delete(jobId);
            }, 30000); // Keep for 30 seconds for UI updates
        }
    }

    /**
     * Create AI workflow
     */
    async createWorkflow(definition) {
        const workflowId = definition.id || `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const workflow = {
            id: workflowId,
            name: definition.name,
            description: definition.description || '',
            steps: definition.steps || [],
            triggers: definition.triggers || [],
            settings: {
                enabled: true,
                parallel: false,
                retryAttempts: 2,
                ...(definition.settings || {})
            },
            metadata: {
                createdAt: new Date().toISOString(),
                author: definition.author || 'user',
                version: '1.0.0'
            },
            statistics: {
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                lastExecuted: null
            }
        };
        
        this.workflows.set(workflowId, workflow);
        
        this.eventBus.emit('ai-hub:workflow-created', {
            workflowId,
            workflow,
            timestamp: new Date().toISOString()
        });
        
        return workflowId;
    }

    /**
     * Execute AI workflow
     */
    async executeWorkflow(workflowId, input = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        if (!workflow.settings.enabled) {
            throw new Error(`Workflow is disabled: ${workflowId}`);
        }
        
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const results = new Map();
        
        try {
            workflow.statistics.executionCount++;
            
            this.eventBus.emit('ai-hub:workflow-started', {
                workflowId,
                executionId,
                input,
                timestamp: new Date().toISOString()
            });
            
            // Execute steps
            if (workflow.settings.parallel) {
                // Execute steps in parallel
                const promises = workflow.steps.map(step => 
                    this._executeWorkflowStep(step, input, results)
                );
                await Promise.allSettled(promises);
            } else {
                // Execute steps sequentially
                for (const step of workflow.steps) {
                    const stepResult = await this._executeWorkflowStep(step, input, results);
                    results.set(step.id, stepResult);
                    
                    // Use step result as input for next step
                    if (stepResult.output) {
                        input = { ...input, ...stepResult.output };
                    }
                }
            }
            
            workflow.statistics.successCount++;
            workflow.statistics.lastExecuted = new Date().toISOString();
            
            const finalResult = {
                executionId,
                workflowId,
                success: true,
                results: Object.fromEntries(results),
                duration: Date.now(),
                timestamp: new Date().toISOString()
            };
            
            this.eventBus.emit('ai-hub:workflow-completed', finalResult);
            
            return finalResult;
            
        } catch (error) {
            workflow.statistics.failureCount++;
            
            const errorResult = {
                executionId,
                workflowId,
                success: false,
                error: error.message,
                results: Object.fromEntries(results),
                timestamp: new Date().toISOString()
            };
            
            this.eventBus.emit('ai-hub:workflow-failed', errorResult);
            
            throw error;
        }
    }

    /**
     * Create content template
     */
    createTemplate(template) {
        const templateId = template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const templateData = {
            id: templateId,
            name: template.name,
            description: template.description || '',
            type: template.type, // 'text', 'image', 'video', 'campaign'
            prompt: template.prompt,
            parameters: template.parameters || {},
            tags: template.tags || [],
            isPublic: template.isPublic || false,
            metadata: {
                createdAt: new Date().toISOString(),
                author: template.author || 'user',
                usageCount: 0
            }
        };
        
        this.templates.set(templateId, templateData);
        
        this.eventBus.emit('ai-hub:template-created', {
            templateId,
            template: templateData,
            timestamp: new Date().toISOString()
        });
        
        return templateId;
    }

    /**
     * Use template to generate content
     */
    async useTemplate(templateId, parameters = {}) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        // Merge template parameters with provided parameters
        const mergedParams = { ...template.parameters, ...parameters };
        
        // Replace placeholders in prompt
        let prompt = template.prompt;
        for (const [key, value] of Object.entries(mergedParams)) {
            prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        
        // Create generation request
        const request = {
            type: template.type,
            prompt,
            parameters: mergedParams,
            templateId
        };
        
        // Update usage count
        template.metadata.usageCount++;
        
        // Generate content
        const result = await this.generateContent(request);
        
        this.eventBus.emit('ai-hub:template-used', {
            templateId,
            parameters: mergedParams,
            result,
            timestamp: new Date().toISOString()
        });
        
        return result;
    }

    /**
     * Initialize UI
     */
    _initializeUI() {
        // Create main container
        this.elements.container = document.getElementById('ai-hub-container') || 
            this._createAIHubContainer();
        
        // Create toolbar
        this.elements.toolbar = this._createToolbar();
        
        // Create content area
        this.elements.contentArea = this._createContentArea();
        
        // Create sidebar
        this.elements.sidebar = this._createSidebar();
        
        // Append to container
        this.elements.container.appendChild(this.elements.toolbar);
        this.elements.container.appendChild(this.elements.contentArea);
        this.elements.container.appendChild(this.elements.sidebar);
    }

    /**
     * Create AI Hub container
     */
    _createAIHubContainer() {
        const existing = document.getElementById('ai-hub-container');
        if (existing) {return existing;}
        
        const container = document.createElement('div');
        container.id = 'ai-hub-container';
        container.className = 'ai-hub-container';
        container.innerHTML = `
            <style>
                .ai-hub-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: #f8fafc;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .ai-hub-toolbar {
                    background: white;
                    padding: 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .ai-hub-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }
                
                .ai-hub-main {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                }
                
                .ai-hub-sidebar {
                    width: 320px;
                    background: white;
                    border-left: 1px solid #e2e8f0;
                    padding: 24px;
                    overflow-y: auto;
                }
                
                .generation-form {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                }
                
                .form-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                }
                
                .form-textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    min-height: 120px;
                    resize: vertical;
                    font-family: inherit;
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-primary {
                    background: #6366f1;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5855eb;
                }
                
                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .job-card {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border: 1px solid #e5e7eb;
                }
                
                .job-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .job-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .job-status.pending {
                    background: #fbbf24;
                    color: #92400e;
                }
                
                .job-status.running {
                    background: #60a5fa;
                    color: #1e40af;
                }
                
                .job-status.completed {
                    background: #34d399;
                    color: #065f46;
                }
                
                .job-status.failed {
                    background: #f87171;
                    color: #991b1b;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: #6366f1;
                    transition: width 0.3s ease;
                }
                
                .result-card {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 16px;
                    margin-top: 12px;
                }
                
                .template-card {
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border: 1px solid #e5e7eb;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .template-card:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transform: translateY(-1px);
                }
            </style>
        `;
        
        document.body.appendChild(container);
        return container;
    }

    /**
     * Create toolbar
     */
    _createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'ai-hub-toolbar';
        toolbar.innerHTML = `
            <div>
                <h1 style="margin: 0; font-size: 24px; color: #1f2937;">🤖 AI Content Hub</h1>
                <p style="margin: 4px 0 0 0; color: #6b7280;">Generate, automate, and optimize content with AI</p>
            </div>
            <div>
                <button id="create-template-btn" class="btn btn-secondary" style="margin-right: 12px;">
                    📝 Create Template
                </button>
                <button id="new-workflow-btn" class="btn btn-primary">
                    ⚡ New Workflow
                </button>
            </div>
        `;
        
        return toolbar;
    }

    /**
     * Create content area
     */
    _createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'ai-hub-content';
        contentArea.innerHTML = `
            <div class="ai-hub-main">
                <div class="generation-form">
                    <h2 style="margin-bottom: 20px; color: #1f2937;">Generate Content</h2>
                    
                    <div class="form-group">
                        <label class="form-label">Content Type</label>
                        <select id="content-type" class="form-input">
                            <option value="text">📝 Text Content</option>
                            <option value="image">🖼️ Image</option>
                            <option value="video">🎥 Video</option>
                            <option value="voice">🎙️ Voice</option>
                            <option value="campaign">📢 Campaign</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Platform</label>
                        <select id="platform" class="form-input">
                            <option value="general">General</option>
                            <option value="tiktok">TikTok</option>
                            <option value="instagram">Instagram</option>
                            <option value="snapchat">Snapchat</option>
                            <option value="youtube">YouTube</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Prompt</label>
                        <textarea id="prompt" class="form-textarea" placeholder="Describe what you want to generate..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Language</label>
                        <select id="language" class="form-input">
                            <option value="en">English</option>
                            <option value="ar">Arabic</option>
                        </select>
                    </div>
                    
                    <button id="generate-btn" class="btn btn-primary">
                        🚀 Generate Content
                    </button>
                </div>
                
                <div id="active-jobs">
                    <h3 style="margin-bottom: 16px; color: #1f2937;">Active Jobs</h3>
                    <div id="jobs-list"></div>
                </div>
            </div>
        `;
        
        return contentArea;
    }

    /**
     * Create sidebar
     */
    _createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'ai-hub-sidebar';
        sidebar.innerHTML = `
            <div>
                <h3 style="margin-bottom: 16px; color: #1f2937;">📚 Templates</h3>
                <div id="templates-list"></div>
            </div>
            
            <div style="margin-top: 32px;">
                <h3 style="margin-bottom: 16px; color: #1f2937;">📊 Recent History</h3>
                <div id="history-list"></div>
            </div>
            
            <div style="margin-top: 32px;">
                <h3 style="margin-bottom: 16px; color: #1f2937;">⚙️ AI Status</h3>
                <div id="ai-status"></div>
            </div>
        `;
        
        return sidebar;
    }

    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Generate button
        document.getElementById('generate-btn')?.addEventListener('click', () => {
            this._handleGenerateContent();
        });
        
        // Create template button
        document.getElementById('create-template-btn')?.addEventListener('click', () => {
            this._showCreateTemplateDialog();
        });
        
        // New workflow button
        document.getElementById('new-workflow-btn')?.addEventListener('click', () => {
            this._showCreateWorkflowDialog();
        });
        
        // Listen for AI service events
        this.eventBus.on('ai:content-generated', (data) => {
            this._handleAIContentGenerated(data);
        });
    }

    /**
     * Handle generate content
     */
    async _handleGenerateContent() {
        const contentType = document.getElementById('content-type')?.value;
        const platform = document.getElementById('platform')?.value;
        const prompt = document.getElementById('prompt')?.value;
        const language = document.getElementById('language')?.value;
        
        if (!prompt.trim()) {
            alert('Please enter a prompt');
            return;
        }
        
        const request = {
            type: contentType,
            prompt: prompt.trim(),
            platform,
            language,
            options: {}
        };
        
        try {
            const result = await this.generateContent(request);
            console.log('Generated content:', result);
            
            // Clear form
            document.getElementById('prompt').value = '';
            
        } catch (error) {
            console.error('Content generation failed:', error);
            alert(`Content generation failed: ${error.message}`);
        }
    }

    /**
     * Generate text content
     */
    async _generateText(aiService, request) {
        const result = await aiService.generateText(request.prompt, {
            platform: request.platform,
            language: request.language,
            tone: request.options?.tone || 'professional'
        });
        
        return {
            type: 'text',
            content: result.content,
            metadata: result.metadata
        };
    }

    /**
     * Generate image content
     */
    async _generateImage(aiService, request) {
        const result = await aiService.generateImage(request.prompt, {
            platform: request.platform,
            style: request.options?.style || 'modern'
        });
        
        return {
            type: 'image',
            content: result.content,
            metadata: result.metadata
        };
    }

    /**
     * Generate video content
     */
    async _generateVideo(aiService, request) {
        const result = await aiService.generateVideo(request.prompt, {
            platform: request.platform,
            duration: request.options?.duration || '30s'
        });
        
        return {
            type: 'video',
            content: result.content,
            metadata: result.metadata
        };
    }

    /**
     * Generate voice content
     */
    async _generateVoice(aiService, request) {
        const result = await aiService.generateVoice(request.prompt, {
            language: request.language,
            voice: request.options?.voice || 'professional'
        });
        
        return {
            type: 'voice',
            content: result.content,
            metadata: result.metadata
        };
    }

    /**
     * Generate campaign content
     */
    async _generateCampaign(aiService, request) {
        // Generate multiple content types for a campaign
        const promises = [
            aiService.generateText(`Campaign text: ${request.prompt}`, { platform: request.platform }),
            aiService.generateImage(`Campaign visual: ${request.prompt}`, { platform: request.platform })
        ];
        
        const results = await Promise.allSettled(promises);
        
        return {
            type: 'campaign',
            content: {
                text: results[0].status === 'fulfilled' ? results[0].value.content : null,
                image: results[1].status === 'fulfilled' ? results[1].value.content : null,
                platform: request.platform
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                components: results.filter(r => r.status === 'fulfilled').length
            }
        };
    }

    /**
     * Execute workflow step
     */
    async _executeWorkflowStep(step, input, previousResults) {
        switch (step.type) {
            case 'generate':
                return await this.generateContent({
                    type: step.contentType,
                    prompt: step.prompt,
                    platform: step.platform || input.platform,
                    options: step.options || {}
                });
                
            case 'transform':
                // Transform previous result
                const prevResult = previousResults.get(step.inputStep);
                return await this._transformContent(prevResult, step.transformation);
                
            case 'validate':
                // Validate content
                return await this._validateContent(input, step.validationRules);
                
            default:
                throw new Error(`Unknown workflow step type: ${step.type}`);
        }
    }

    /**
     * Update job UI
     */
    _updateJobUI(job) {
        const jobsList = document.getElementById('jobs-list');
        if (!jobsList) {return;}
        
        let jobElement = document.getElementById(`job-${job.id}`);
        
        if (!jobElement) {
            jobElement = document.createElement('div');
            jobElement.id = `job-${job.id}`;
            jobElement.className = 'job-card';
            jobsList.appendChild(jobElement);
        }
        
        jobElement.innerHTML = `
            <div class="job-header">
                <div>
                    <strong>${job.request.type.charAt(0).toUpperCase() + job.request.type.slice(1)} Generation</strong>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                        ${job.request.platform || 'General'} • ${new Date(job.startTime).toLocaleTimeString()}
                    </div>
                </div>
                <span class="job-status ${job.status}">${job.status}</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${job.progress}%"></div>
            </div>
            
            ${job.result ? `
                <div class="result-card">
                    <strong>Result:</strong>
                    <div style="margin-top: 8px; font-size: 14px; color: #4b5563;">
                        ${this._formatResult(job.result)}
                    </div>
                </div>
            ` : ''}
            
            ${job.error ? `
                <div style="color: #ef4444; margin-top: 8px; font-size: 14px;">
                    Error: ${job.error}
                </div>
            ` : ''}
        `;
    }

    /**
     * Format result for display
     */
    _formatResult(result) {
        if (result.type === 'text') {
            return result.content.content || result.content;
        } else if (result.type === 'image') {
            return `Image generated: ${result.content.prompt || 'Visual content'}`;
        } else if (result.type === 'video') {
            return `Video generated with ${Object.keys(result.content).length} components`;
        } else if (result.type === 'voice') {
            return `Voice content: ${result.content.duration || 'Audio generated'}`;
        } else if (result.type === 'campaign') {
            const components = Object.keys(result.content).filter(key => result.content[key]).length;
            return `Campaign with ${components} components`;
        }
        
        return 'Content generated successfully';
    }

    /**
     * Get cached result
     */
    _getCachedResult(request) {
        const cacheKey = JSON.stringify(request);
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.result;
        }
        
        return null;
    }

    /**
     * Cache result
     */
    _cacheResult(request, result) {
        const cacheKey = JSON.stringify(request);
        this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Add to history
     */
    _addToHistory(job) {
        const historyEntry = {
            id: job.id,
            type: job.request.type,
            platform: job.request.platform,
            prompt: job.request.prompt.substring(0, 100) + (job.request.prompt.length > 100 ? '...' : ''),
            status: job.status,
            duration: job.endTime - job.startTime,
            timestamp: job.endTime
        };
        
        this.history.unshift(historyEntry);
        
        // Keep only last 50 entries
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this._updateHistoryUI();
    }

    /**
     * Update history UI
     */
    _updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        if (!historyList) {return;}
        
        historyList.innerHTML = this.history.slice(0, 10).map(entry => `
            <div style="margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; font-size: 12px;">
                <div style="font-weight: 600; color: #374151;">${entry.type} - ${entry.platform}</div>
                <div style="color: #6b7280; margin-top: 2px;">${entry.prompt}</div>
                <div style="color: #9ca3af; margin-top: 4px;">${new Date(entry.timestamp).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    /**
     * Load templates
     */
    async _loadTemplates() {
        // Load default templates
        const defaultTemplates = [
            {
                name: 'Social Media Post',
                type: 'text',
                prompt: 'Create an engaging social media post about {{topic}} for {{platform}}',
                parameters: { topic: '', platform: 'instagram' },
                tags: ['social', 'marketing']
            },
            {
                name: 'Product Description',
                type: 'text',
                prompt: 'Write a compelling product description for {{product}} highlighting {{features}}',
                parameters: { product: '', features: '' },
                tags: ['ecommerce', 'copywriting']
            },
            {
                name: 'Campaign Visual',
                type: 'image',
                prompt: 'Design a {{style}} visual for {{campaign}} targeting {{audience}}',
                parameters: { style: 'modern', campaign: '', audience: '' },
                tags: ['visual', 'campaign']
            }
        ];
        
        for (const template of defaultTemplates) {
            this.createTemplate(template);
        }
        
        this._updateTemplatesUI();
    }

    /**
     * Update templates UI
     */
    _updateTemplatesUI() {
        const templatesList = document.getElementById('templates-list');
        if (!templatesList) {return;}
        
        templatesList.innerHTML = Array.from(this.templates.values()).map(template => `
            <div class="template-card" onclick="window.aiHubManager?.useTemplate('${template.id}', {})">
                <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${template.name}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                    ${template.description}
                </div>
                <div style="font-size: 11px; color: #9ca3af;">
                    ${template.tags.map(tag => `#${tag}`).join(' ')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize workflows
     */
    async _initializeWorkflows() {
        // Create default workflow
        await this.createWorkflow({
            name: 'Content Campaign Generator',
            description: 'Generate a complete content campaign with text and visuals',
            steps: [
                {
                    id: 'text',
                    type: 'generate',
                    contentType: 'text',
                    prompt: 'Create campaign text',
                    platform: 'instagram'
                },
                {
                    id: 'visual',
                    type: 'generate',
                    contentType: 'image',
                    prompt: 'Create campaign visual',
                    platform: 'instagram'
                }
            ]
        });
    }

    /**
     * Load history
     */
    async _loadHistory() {
        const savedHistory = this.stateManager.getState('aiHubHistory') || [];
        this.history = savedHistory.slice(0, 50);
        this._updateHistoryUI();
    }

    /**
     * Get manager metrics
     */
    getMetrics() {
        return {
            activeJobs: this.activeJobs.size,
            templates: this.templates.size,
            workflows: this.workflows.size,
            historyEntries: this.history.length,
            cacheSize: this.cache.size,
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Destroy AI Hub Manager
     */
    destroy() {
        // Save history
        this.stateManager.setState('aiHubHistory', this.history);
        
        this.activeJobs.clear();
        this.templates.clear();
        this.workflows.clear();
        this.cache.clear();
        this.history = [];
        
        console.log('🤖 AI Hub Manager destroyed');
    }
}

// Make available globally for template interactions
window.aiHubManager = null;