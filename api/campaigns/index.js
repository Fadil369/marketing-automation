/**
 * Campaigns API - Campaign management endpoints
 * Features: CRUD operations, scheduling, analytics integration
 * 
 * @author BrainSAIT Team
 */

import { middleware } from '../_middleware.js';
import { environment } from '../../src/config/environment.js';

class CampaignsAPI {
    constructor() {
        this.campaigns = new Map(); // In production, this would be a database
        this.initializeSampleData();
    }

    /**
     * Initialize with sample data for development
     */
    initializeSampleData() {
        if (environment.env === 'development') {
            const sampleCampaigns = [
                {
                    id: 'camp_001',
                    name: 'BrainSAIT Product Launch',
                    description: 'Multi-platform campaign for new AI features',
                    status: 'active',
                    platforms: ['tiktok', 'instagram', 'youtube'],
                    content: {
                        title: 'Revolutionize Your Marketing with BrainSAIT AI',
                        description: 'Discover how our AI-powered platform can transform your marketing campaigns',
                        hashtags: ['#BrainSAIT', '#AIMarketing', '#MarketingAutomation'],
                        media: [
                            {
                                type: 'image',
                                url: 'https://example.com/campaign-image.jpg',
                                alt: 'BrainSAIT AI Platform Screenshot'
                            }
                        ]
                    },
                    targeting: {
                        demographics: {
                            ageRange: [25, 45],
                            gender: 'all',
                            locations: ['US', 'CA', 'UK', 'AU']
                        },
                        interests: ['technology', 'marketing', 'startups', 'ai'],
                        behaviors: ['active_social_media_users', 'tech_early_adopters']
                    },
                    schedule: {
                        startDate: '2024-01-15T00:00:00Z',
                        endDate: '2024-02-15T23:59:59Z',
                        frequency: 'daily',
                        timeSlots: ['09:00', '13:00', '18:00']
                    },
                    budget: {
                        total: 5000,
                        daily: 167,
                        spent: 1250,
                        currency: 'USD'
                    },
                    metrics: {
                        impressions: 125000,
                        reach: 89000,
                        engagement: 7850,
                        clicks: 3200,
                        conversions: 156,
                        ctr: 2.56,
                        cpc: 0.39,
                        roas: 3.2
                    },
                    createdAt: '2024-01-10T10:00:00Z',
                    updatedAt: '2024-01-20T15:30:00Z',
                    createdBy: 'user_123'
                }
            ];

            sampleCampaigns.forEach(campaign => {
                this.campaigns.set(campaign.id, campaign);
            });
        }
    }

    /**
     * Handle API requests
     */
    async handleRequest(request, env, ctx) {
        // Apply middleware
        const middlewareResponse = await middleware.handle(request, env, ctx);
        if (middlewareResponse) return middlewareResponse;

        const url = new URL(request.url);
        const method = request.method;
        const pathSegments = url.pathname.split('/').filter(Boolean);
        
        try {
            let response;
            
            // Route to appropriate handler
            if (pathSegments.length === 2) { // /api/campaigns
                switch (method) {
                    case 'GET':
                        response = await this.getCampaigns(request);
                        break;
                    case 'POST':
                        response = await this.createCampaign(request);
                        break;
                    default:
                        response = this.createErrorResponse(405, 'Method not allowed');
                }
            } else if (pathSegments.length === 3) { // /api/campaigns/:id
                const campaignId = pathSegments[2];
                
                switch (method) {
                    case 'GET':
                        response = await this.getCampaign(campaignId, request);
                        break;
                    case 'PUT':
                        response = await this.updateCampaign(campaignId, request);
                        break;
                    case 'DELETE':
                        response = await this.deleteCampaign(campaignId, request);
                        break;
                    default:
                        response = this.createErrorResponse(405, 'Method not allowed');
                }
            } else if (pathSegments.length === 4) { // /api/campaigns/:id/action
                const campaignId = pathSegments[2];
                const action = pathSegments[3];
                
                response = await this.handleCampaignAction(campaignId, action, request);
            } else {
                response = this.createErrorResponse(404, 'Endpoint not found');
            }

            return middleware.addResponseHeaders(response, request);
            
        } catch (error) {
            console.error('Campaigns API error:', error);
            const errorResponse = this.createErrorResponse(
                500,
                'Internal server error',
                environment.env === 'development' ? error.message : undefined
            );
            return middleware.addResponseHeaders(errorResponse, request);
        }
    }

    /**
     * Get campaigns list with filtering and pagination
     */
    async getCampaigns(request) {
        const url = new URL(request.url);
        const params = url.searchParams;
        
        // Parse query parameters
        const filters = {
            status: params.get('status'),
            platform: params.get('platform'),
            createdBy: params.get('createdBy'),
            search: params.get('search')
        };
        
        const pagination = {
            page: parseInt(params.get('page')) || 1,
            limit: Math.min(parseInt(params.get('limit')) || 20, 100),
            sortBy: params.get('sortBy') || 'updatedAt',
            sortOrder: params.get('sortOrder') || 'desc'
        };

        // Filter campaigns
        let filteredCampaigns = Array.from(this.campaigns.values());
        
        if (filters.status) {
            filteredCampaigns = filteredCampaigns.filter(c => c.status === filters.status);
        }
        
        if (filters.platform) {
            filteredCampaigns = filteredCampaigns.filter(c => 
                c.platforms.includes(filters.platform)
            );
        }
        
        if (filters.createdBy) {
            filteredCampaigns = filteredCampaigns.filter(c => c.createdBy === filters.createdBy);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredCampaigns = filteredCampaigns.filter(c => 
                c.name.toLowerCase().includes(searchTerm) ||
                c.description.toLowerCase().includes(searchTerm)
            );
        }

        // Sort campaigns
        filteredCampaigns.sort((a, b) => {
            const aValue = a[pagination.sortBy];
            const bValue = b[pagination.sortBy];
            
            if (pagination.sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        // Apply pagination
        const total = filteredCampaigns.length;
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

        // Calculate summary statistics
        const summary = this.calculateCampaignsSummary(filteredCampaigns);

        const response = {
            data: paginatedCampaigns,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
                hasNextPage: endIndex < total,
                hasPrevPage: pagination.page > 1
            },
            summary,
            filters: filters,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Get single campaign
     */
    async getCampaign(campaignId, request) {
        const campaign = this.campaigns.get(campaignId);
        
        if (!campaign) {
            return this.createErrorResponse(404, 'Campaign not found');
        }

        // Check permissions
        if (!this.hasPermission(request.user, campaign, 'read')) {
            return this.createErrorResponse(403, 'Insufficient permissions');
        }

        // Add real-time metrics if available
        const enhancedCampaign = await this.enhanceCampaignData(campaign);

        return new Response(JSON.stringify({
            data: enhancedCampaign,
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Create new campaign
     */
    async createCampaign(request) {
        try {
            const campaignData = await request.json();
            
            // Validate required fields
            const validation = this.validateCampaignData(campaignData);
            if (!validation.valid) {
                return this.createErrorResponse(400, 'Validation failed', validation.errors);
            }

            // Generate campaign ID
            const campaignId = `camp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
            
            // Create campaign object
            const campaign = {
                id: campaignId,
                ...campaignData,
                status: campaignData.status || 'draft',
                metrics: {
                    impressions: 0,
                    reach: 0,
                    engagement: 0,
                    clicks: 0,
                    conversions: 0,
                    ctr: 0,
                    cpc: 0,
                    roas: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: request.user.id
            };

            // Save campaign
            this.campaigns.set(campaignId, campaign);
            
            // Trigger campaign creation workflows
            await this.triggerCampaignWorkflows(campaign, 'created');

            return new Response(JSON.stringify({
                data: campaign,
                message: 'Campaign created successfully',
                timestamp: new Date().toISOString()
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            if (error instanceof SyntaxError) {
                return this.createErrorResponse(400, 'Invalid JSON in request body');
            }
            throw error;
        }
    }

    /**
     * Update campaign
     */
    async updateCampaign(campaignId, request) {
        const existingCampaign = this.campaigns.get(campaignId);
        
        if (!existingCampaign) {
            return this.createErrorResponse(404, 'Campaign not found');
        }

        // Check permissions
        if (!this.hasPermission(request.user, existingCampaign, 'write')) {
            return this.createErrorResponse(403, 'Insufficient permissions');
        }

        try {
            const updateData = await request.json();
            
            // Validate update data
            const validation = this.validateCampaignData(updateData, true);
            if (!validation.valid) {
                return this.createErrorResponse(400, 'Validation failed', validation.errors);
            }

            // Update campaign
            const updatedCampaign = {
                ...existingCampaign,
                ...updateData,
                id: campaignId, // Prevent ID changes
                createdAt: existingCampaign.createdAt, // Prevent timestamp changes
                updatedAt: new Date().toISOString()
            };

            this.campaigns.set(campaignId, updatedCampaign);
            
            // Trigger update workflows
            await this.triggerCampaignWorkflows(updatedCampaign, 'updated');

            return new Response(JSON.stringify({
                data: updatedCampaign,
                message: 'Campaign updated successfully',
                timestamp: new Date().toISOString()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            if (error instanceof SyntaxError) {
                return this.createErrorResponse(400, 'Invalid JSON in request body');
            }
            throw error;
        }
    }

    /**
     * Delete campaign
     */
    async deleteCampaign(campaignId, request) {
        const campaign = this.campaigns.get(campaignId);
        
        if (!campaign) {
            return this.createErrorResponse(404, 'Campaign not found');
        }

        // Check permissions
        if (!this.hasPermission(request.user, campaign, 'delete')) {
            return this.createErrorResponse(403, 'Insufficient permissions');
        }

        // Check if campaign can be deleted
        if (campaign.status === 'active') {
            return this.createErrorResponse(400, 'Cannot delete active campaign. Please pause it first.');
        }

        // Soft delete - mark as deleted instead of removing
        campaign.status = 'deleted';
        campaign.deletedAt = new Date().toISOString();
        campaign.updatedAt = new Date().toISOString();
        
        this.campaigns.set(campaignId, campaign);
        
        // Trigger deletion workflows
        await this.triggerCampaignWorkflows(campaign, 'deleted');

        return new Response(JSON.stringify({
            message: 'Campaign deleted successfully',
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Handle campaign actions (start, pause, resume, etc.)
     */
    async handleCampaignAction(campaignId, action, request) {
        const campaign = this.campaigns.get(campaignId);
        
        if (!campaign) {
            return this.createErrorResponse(404, 'Campaign not found');
        }

        // Check permissions
        if (!this.hasPermission(request.user, campaign, 'write')) {
            return this.createErrorResponse(403, 'Insufficient permissions');
        }

        let newStatus;
        let message;

        switch (action) {
            case 'start':
                if (campaign.status !== 'draft' && campaign.status !== 'paused') {
                    return this.createErrorResponse(400, 'Can only start draft or paused campaigns');
                }
                newStatus = 'active';
                message = 'Campaign started successfully';
                break;
                
            case 'pause':
                if (campaign.status !== 'active') {
                    return this.createErrorResponse(400, 'Can only pause active campaigns');
                }
                newStatus = 'paused';
                message = 'Campaign paused successfully';
                break;
                
            case 'resume':
                if (campaign.status !== 'paused') {
                    return this.createErrorResponse(400, 'Can only resume paused campaigns');
                }
                newStatus = 'active';
                message = 'Campaign resumed successfully';
                break;
                
            case 'complete':
                if (campaign.status !== 'active' && campaign.status !== 'paused') {
                    return this.createErrorResponse(400, 'Can only complete active or paused campaigns');
                }
                newStatus = 'completed';
                message = 'Campaign completed successfully';
                break;
                
            case 'duplicate':
                return await this.duplicateCampaign(campaign, request);
                
            case 'analytics':
                return await this.getCampaignAnalytics(campaign, request);
                
            default:
                return this.createErrorResponse(400, 'Invalid action');
        }

        // Update campaign status
        campaign.status = newStatus;
        campaign.updatedAt = new Date().toISOString();
        
        if (newStatus === 'active' && !campaign.startedAt) {
            campaign.startedAt = new Date().toISOString();
        }
        
        if (newStatus === 'completed' && !campaign.completedAt) {
            campaign.completedAt = new Date().toISOString();
        }

        this.campaigns.set(campaignId, campaign);
        
        // Trigger status change workflows
        await this.triggerCampaignWorkflows(campaign, action);

        return new Response(JSON.stringify({
            data: campaign,
            message,
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Validate campaign data
     */
    validateCampaignData(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate || data.name !== undefined) {
            if (!data.name || data.name.trim().length < 3) {
                errors.push('Campaign name must be at least 3 characters long');
            }
        }
        
        if (!isUpdate || data.platforms !== undefined) {
            if (!Array.isArray(data.platforms) || data.platforms.length === 0) {
                errors.push('At least one platform must be selected');
            }
        }
        
        if (!isUpdate || data.content !== undefined) {
            if (!data.content || !data.content.title) {
                errors.push('Campaign content title is required');
            }
        }
        
        if (data.budget) {
            if (data.budget.total <= 0) {
                errors.push('Budget total must be greater than 0');
            }
        }
        
        if (data.schedule) {
            if (data.schedule.startDate && data.schedule.endDate) {
                const start = new Date(data.schedule.startDate);
                const end = new Date(data.schedule.endDate);
                
                if (start >= end) {
                    errors.push('End date must be after start date');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check user permissions for campaign
     */
    hasPermission(user, campaign, action) {
        if (!user) return false;
        
        // System admin can do everything
        if (user.role === 'admin') return true;
        
        // Campaign owner can do everything
        if (campaign.createdBy === user.id) return true;
        
        // Role-based permissions
        const rolePermissions = {
            'manager': ['read', 'write'],
            'editor': ['read', 'write'],
            'viewer': ['read'],
            'api': ['read', 'write', 'delete']
        };
        
        const userPermissions = rolePermissions[user.role] || ['read'];
        return userPermissions.includes(action);
    }

    /**
     * Calculate campaigns summary statistics
     */
    calculateCampaignsSummary(campaigns) {
        const summary = {
            total: campaigns.length,
            byStatus: {},
            totalBudget: 0,
            totalSpent: 0,
            totalImpressions: 0,
            totalEngagement: 0,
            averageCTR: 0,
            averageROAS: 0
        };

        campaigns.forEach(campaign => {
            // Count by status
            summary.byStatus[campaign.status] = (summary.byStatus[campaign.status] || 0) + 1;
            
            // Sum budgets and metrics
            if (campaign.budget) {
                summary.totalBudget += campaign.budget.total || 0;
                summary.totalSpent += campaign.budget.spent || 0;
            }
            
            if (campaign.metrics) {
                summary.totalImpressions += campaign.metrics.impressions || 0;
                summary.totalEngagement += campaign.metrics.engagement || 0;
            }
        });

        // Calculate averages
        if (campaigns.length > 0) {
            const ctrSum = campaigns.reduce((sum, c) => sum + (c.metrics?.ctr || 0), 0);
            const roasSum = campaigns.reduce((sum, c) => sum + (c.metrics?.roas || 0), 0);
            
            summary.averageCTR = (ctrSum / campaigns.length).toFixed(2);
            summary.averageROAS = (roasSum / campaigns.length).toFixed(2);
        }

        return summary;
    }

    /**
     * Enhance campaign data with real-time metrics
     */
    async enhanceCampaignData(campaign) {
        // In production, this would fetch real-time data from platforms
        const enhanced = { ...campaign };
        
        if (campaign.status === 'active') {
            // Simulate real-time metrics updates
            enhanced.metrics = {
                ...campaign.metrics,
                lastUpdated: new Date().toISOString()
            };
        }

        return enhanced;
    }

    /**
     * Duplicate campaign
     */
    async duplicateCampaign(originalCampaign, request) {
        const duplicateId = `camp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
        
        const duplicate = {
            ...originalCampaign,
            id: duplicateId,
            name: `${originalCampaign.name} (Copy)`,
            status: 'draft',
            metrics: {
                impressions: 0,
                reach: 0,
                engagement: 0,
                clicks: 0,
                conversions: 0,
                ctr: 0,
                cpc: 0,
                roas: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: request.user.id,
            startedAt: undefined,
            completedAt: undefined
        };

        this.campaigns.set(duplicateId, duplicate);

        return new Response(JSON.stringify({
            data: duplicate,
            message: 'Campaign duplicated successfully',
            timestamp: new Date().toISOString()
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Get campaign analytics
     */
    async getCampaignAnalytics(campaign, request) {
        // In production, this would fetch detailed analytics
        const analytics = {
            campaignId: campaign.id,
            overview: campaign.metrics,
            platformBreakdown: campaign.platforms.map(platform => ({
                platform,
                metrics: {
                    impressions: Math.floor(campaign.metrics.impressions / campaign.platforms.length),
                    engagement: Math.floor(campaign.metrics.engagement / campaign.platforms.length),
                    clicks: Math.floor(campaign.metrics.clicks / campaign.platforms.length)
                }
            })),
            timeSeriesData: this.generateTimeSeriesData(campaign),
            audienceInsights: {
                demographics: campaign.targeting.demographics,
                topLocations: ['United States', 'Canada', 'United Kingdom'],
                topInterests: campaign.targeting.interests
            },
            recommendations: [
                'Consider increasing budget for high-performing time slots',
                'Expand to similar audience segments',
                'Test different creative variations'
            ]
        };

        return new Response(JSON.stringify({
            data: analytics,
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /**
     * Generate time series data for analytics
     */
    generateTimeSeriesData(campaign) {
        const days = 7;
        const data = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                impressions: Math.floor(Math.random() * 10000) + 5000,
                engagement: Math.floor(Math.random() * 500) + 200,
                clicks: Math.floor(Math.random() * 200) + 50,
                conversions: Math.floor(Math.random() * 20) + 5
            });
        }
        
        return data;
    }

    /**
     * Trigger campaign workflows
     */
    async triggerCampaignWorkflows(campaign, action) {
        // In production, this would trigger actual workflow systems
        console.log(`Campaign workflow triggered: ${action}`, {
            campaignId: campaign.id,
            status: campaign.status
        });
        
        // Example workflows:
        if (action === 'created') {
            // Send notification to team
            // Setup monitoring
        } else if (action === 'updated' && campaign.status === 'active') {
            // Update platform campaigns
            // Refresh targeting
        } else if (action === 'start') {
            // Activate on platforms
            // Start metric collection
        }
    }

    /**
     * Create standardized error response
     */
    createErrorResponse(status, message, details = null) {
        const error = {
            error: true,
            status,
            message,
            timestamp: new Date().toISOString()
        };

        if (details) {
            error.details = details;
        }

        return new Response(JSON.stringify(error), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Create API instance
const campaignsAPI = new CampaignsAPI();

// Export Cloudflare Workers handler
export default {
    async fetch(request, env, ctx) {
        return await campaignsAPI.handleRequest(request, env, ctx);
    }
};