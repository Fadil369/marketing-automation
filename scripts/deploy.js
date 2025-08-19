#!/usr/bin/env node

/**
 * Deployment Script for BrainSAIT Marketing Platform
 * Handles building, testing, and deploying to Cloudflare Workers and Pages
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { environmentConfig } from '../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const execAsync = promisify(exec);

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

/**
 * Logger utility
 */
class Logger {
    static info(message) {
        console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
    }

    static success(message) {
        console.log(`${colors.green}✅ ${message}${colors.reset}`);
    }

    static warning(message) {
        console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
    }

    static error(message) {
        console.log(`${colors.red}❌ ${message}${colors.reset}`);
    }

    static step(message) {
        console.log(`${colors.cyan}🚀 ${message}${colors.reset}`);
    }
}

/**
 * Deployment configuration
 */
class DeploymentConfig {
    constructor(environment = 'production') {
        this.environment = environment;
        this.config = environmentConfig.getCloudflareConfig();
        this.startTime = Date.now();
    }

    validate() {
        const errors = [];

        if (!this.config.accountId) {
            errors.push('CLOUDFLARE_ACCOUNT_ID is not set');
        }

        if (!this.config.apiToken) {
            errors.push('CLOUDFLARE_API_TOKEN is not set');
        }

        if (errors.length > 0) {
            Logger.error('Deployment configuration validation failed:');
            errors.forEach(error => Logger.error(`  - ${error}`));
            return false;
        }

        return true;
    }

    getDuration() {
        return ((Date.now() - this.startTime) / 1000).toFixed(2);
    }
}

/**
 * Build manager
 */
class BuildManager {
    constructor(config) {
        this.config = config;
    }

    async clean() {
        Logger.step('Cleaning build artifacts...');
        try {
            await execAsync('npm run clean');
            Logger.success('Build artifacts cleaned');
        } catch (error) {
            Logger.warning('Clean failed (continuing anyway)');
        }
    }

    async installDependencies() {
        Logger.step('Installing dependencies...');
        try {
            await execAsync('npm ci --production=false');
            Logger.success('Dependencies installed');
        } catch (error) {
            Logger.error('Failed to install dependencies');
            throw error;
        }
    }

    async runLinting() {
        Logger.step('Running linting...');
        try {
            await execAsync('npm run lint');
            Logger.success('Linting passed');
        } catch (error) {
            Logger.error('Linting failed');
            throw error;
        }
    }

    async runTests() {
        Logger.step('Running tests...');
        try {
            await execAsync('npm run test');
            Logger.success('All tests passed');
        } catch (error) {
            Logger.error('Tests failed');
            throw error;
        }
    }

    async buildApplication() {
        Logger.step('Building application...');
        try {
            await execAsync('npm run build');
            Logger.success('Application built successfully');
        } catch (error) {
            Logger.error('Build failed');
            throw error;
        }
    }

    async validateBuild() {
        Logger.step('Validating build output...');
        
        const distDir = path.join(rootDir, 'dist');
        const requiredFiles = ['index.html', 'manifest.json'];
        
        try {
            const files = await fs.readdir(distDir);
            
            for (const file of requiredFiles) {
                if (!files.includes(file)) {
                    throw new Error(`Required file missing: ${file}`);
                }
            }

            Logger.success('Build validation passed');
        } catch (error) {
            Logger.error(`Build validation failed: ${error.message}`);
            throw error;
        }
    }

    async generateBuildReport() {
        Logger.step('Generating build report...');
        
        try {
            const distDir = path.join(rootDir, 'dist');
            const files = await this.getDirectorySize(distDir);
            
            const report = {
                timestamp: new Date().toISOString(),
                environment: this.config.environment,
                totalFiles: files.count,
                totalSize: this.formatBytes(files.size),
                files: files.details
            };

            await fs.writeFile(
                path.join(rootDir, 'build-report.json'),
                JSON.stringify(report, null, 2)
            );

            Logger.success(`Build report generated - ${report.totalFiles} files, ${report.totalSize}`);
            return report;
        } catch (error) {
            Logger.warning('Failed to generate build report');
            return null;
        }
    }

    async getDirectorySize(dirPath) {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        let totalSize = 0;
        let totalCount = 0;
        const details = [];

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            
            if (file.isDirectory()) {
                const subDir = await this.getDirectorySize(fullPath);
                totalSize += subDir.size;
                totalCount += subDir.count;
            } else {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
                totalCount++;
                details.push({
                    name: file.name,
                    size: this.formatBytes(stats.size),
                    sizeBytes: stats.size
                });
            }
        }

        return { size: totalSize, count: totalCount, details };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Cloudflare deployment manager
 */
class CloudflareDeployer {
    constructor(config) {
        this.config = config;
    }

    async deployWorkers() {
        Logger.step('Deploying Cloudflare Workers...');
        
        try {
            const command = `wrangler publish --env ${this.config.environment}`;
            await execAsync(command);
            Logger.success('Workers deployed successfully');
        } catch (error) {
            Logger.error('Workers deployment failed');
            throw error;
        }
    }

    async deployPages() {
        Logger.step('Deploying Cloudflare Pages...');
        
        try {
            const command = `wrangler pages publish dist --project-name brainsait-marketing --env ${this.config.environment}`;
            await execAsync(command);
            Logger.success('Pages deployed successfully');
        } catch (error) {
            Logger.error('Pages deployment failed');
            throw error;
        }
    }

    async updateKVData() {
        Logger.step('Updating KV data...');
        
        try {
            // Update application config in KV
            const appConfig = environmentConfig.exportClientConfig();
            const command = `echo '${JSON.stringify(appConfig)}' | wrangler kv:key put --binding CACHE "app_config" --env ${this.config.environment}`;
            await execAsync(command);
            
            Logger.success('KV data updated');
        } catch (error) {
            Logger.warning('KV data update failed (continuing anyway)');
        }
    }

    async waitForDeployment() {
        Logger.step('Waiting for deployment to propagate...');
        
        const maxAttempts = 10;
        const delay = 5000; // 5 seconds
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const healthUrl = `${this.config.workers.apiUrl}/health`;
                const response = await fetch(healthUrl);
                
                if (response.ok) {
                    Logger.success('Deployment is live and healthy');
                    return true;
                }
            } catch (error) {
                // Ignore errors during health checks
            }
            
            if (attempt < maxAttempts) {
                Logger.info(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        Logger.warning('Deployment health check timed out');
        return false;
    }

    async validateDeployment() {
        Logger.step('Validating deployment...');
        
        try {
            const healthUrl = `${this.config.workers.apiUrl}/health`;
            const response = await fetch(healthUrl);
            const data = await response.json();
            
            if (data.status === 'healthy') {
                Logger.success(`Deployment validated - Version: ${data.version}, Environment: ${data.environment}`);
                return true;
            } else {
                Logger.error('Deployment validation failed - unhealthy status');
                return false;
            }
        } catch (error) {
            Logger.error(`Deployment validation failed: ${error.message}`);
            return false;
        }
    }
}

/**
 * Rollback manager
 */
class RollbackManager {
    constructor(config) {
        this.config = config;
    }

    async createBackup() {
        Logger.step('Creating deployment backup...');
        
        try {
            // In a real implementation, you would backup the current deployment
            const backup = {
                timestamp: new Date().toISOString(),
                environment: this.config.environment,
                version: environmentConfig.get('app.version')
            };
            
            await fs.writeFile(
                path.join(rootDir, 'deployment-backup.json'),
                JSON.stringify(backup, null, 2)
            );
            
            Logger.success('Deployment backup created');
            return backup;
        } catch (error) {
            Logger.warning('Failed to create deployment backup');
            return null;
        }
    }

    async rollback() {
        Logger.step('Rolling back deployment...');
        
        try {
            // In a real implementation, you would restore from backup
            Logger.warning('Rollback functionality not implemented yet');
            return false;
        } catch (error) {
            Logger.error(`Rollback failed: ${error.message}`);
            return false;
        }
    }
}

/**
 * Main deployment orchestrator
 */
class DeploymentOrchestrator {
    constructor(environment = 'production', options = {}) {
        this.config = new DeploymentConfig(environment);
        this.buildManager = new BuildManager(this.config);
        this.cloudflareDeployer = new CloudflareDeployer(this.config);
        this.rollbackManager = new RollbackManager(this.config);
        this.options = {
            skipTests: false,
            skipLinting: false,
            dryRun: false,
            ...options
        };
    }

    async deploy() {
        Logger.info(`Starting deployment to ${this.config.environment} environment...`);
        
        try {
            // Validate configuration
            if (!this.config.validate()) {
                throw new Error('Configuration validation failed');
            }

            // Create backup
            await this.rollbackManager.createBackup();

            // Build phase
            await this.buildManager.clean();
            await this.buildManager.installDependencies();
            
            if (!this.options.skipLinting) {
                await this.buildManager.runLinting();
            }
            
            if (!this.options.skipTests) {
                await this.buildManager.runTests();
            }
            
            await this.buildManager.buildApplication();
            await this.buildManager.validateBuild();
            
            const buildReport = await this.buildManager.generateBuildReport();

            if (this.options.dryRun) {
                Logger.info('Dry run mode - skipping actual deployment');
                Logger.success(`Dry run completed in ${this.config.getDuration()}s`);
                return true;
            }

            // Deployment phase
            await this.cloudflareDeployer.deployWorkers();
            await this.cloudflareDeployer.deployPages();
            await this.cloudflareDeployer.updateKVData();

            // Validation phase
            const isLive = await this.cloudflareDeployer.waitForDeployment();
            const isValid = await this.cloudflareDeployer.validateDeployment();

            if (!isValid) {
                Logger.error('Deployment validation failed');
                throw new Error('Deployment validation failed');
            }

            // Success
            Logger.success(`🎉 Deployment completed successfully in ${this.config.getDuration()}s`);
            Logger.info(`Environment: ${this.config.environment}`);
            Logger.info(`Version: ${environmentConfig.get('app.version')}`);
            
            if (buildReport) {
                Logger.info(`Build size: ${buildReport.totalSize} (${buildReport.totalFiles} files)`);
            }

            return true;

        } catch (error) {
            Logger.error(`Deployment failed: ${error.message}`);
            
            // Attempt rollback if this is production
            if (this.config.environment === 'production') {
                Logger.warning('Attempting rollback...');
                await this.rollbackManager.rollback();
            }
            
            throw error;
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    const environment = args[0] || 'production';
    
    const options = {
        skipTests: args.includes('--skip-tests'),
        skipLinting: args.includes('--skip-linting'),
        dryRun: args.includes('--dry-run')
    };

    const orchestrator = new DeploymentOrchestrator(environment, options);
    
    try {
        await orchestrator.deploy();
        process.exit(0);
    } catch (error) {
        Logger.error('Deployment script failed');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { DeploymentOrchestrator, BuildManager, CloudflareDeployer };