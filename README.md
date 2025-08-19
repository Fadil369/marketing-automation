# 🚀 BrainSAIT Marketing Automation Platform v2.0

[![CI/CD Pipeline](https://github.com/Fadil369/marketing-automation/actions/workflows/deploy.yml/badge.svg)](https://github.com/Fadil369/marketing-automation/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/package-json/v/Fadil369/marketing-automation)](https://github.com/Fadil369/marketing-automation)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=brainsait-marketing&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=brainsait-marketing)

**🎉 NEW v2.0 Architecture**: Complete platform rebuild with modular event-driven architecture, advanced AI integrations, real-time WebSocket updates, and enterprise-grade scalability.

An enterprise-grade AI-powered marketing automation platform that revolutionizes how businesses create, manage, and optimize their social media campaigns across multiple platforms with cutting-edge technology.

## 🌟 Key Features

### 🤖 AI-Powered Content Generation
- **Multi-Provider AI Integration**: OpenAI GPT-4, Anthropic Claude, Midjourney
- **Intelligent Content Optimization**: Platform-specific content adaptation
- **Multilingual Support**: Arabic and English content generation
- **Voice Content**: Coqui TTS integration for Arabic voiceovers

### 📱 Multi-Platform Management
- **Unified Dashboard**: Manage TikTok, Instagram, Snapchat, YouTube campaigns
- **Real-Time Analytics**: Live performance metrics and insights
- **Automated Posting**: Intelligent scheduling across all platforms
- **Cross-Platform Optimization**: Platform-specific content adaptation

### 📊 Advanced Analytics & Reporting
- **Real-Time Metrics**: Live campaign performance tracking
- **Predictive Analytics**: AI-powered performance forecasting
- **Custom Reports**: Automated report generation and distribution
- **Anomaly Detection**: Intelligent performance issue identification

### 🔄 Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop automation creation
- **Trigger-Based Actions**: Event-driven campaign management
- **Conditional Logic**: Smart decision-making in workflows
- **Integration Ready**: Zapier, webhooks, and API integration

### 🏢 Enterprise Features
- **Multi-User Support**: Role-based access control
- **White-Label Ready**: Customizable branding
- **API-First Architecture**: Comprehensive REST API
- **Real-Time Collaboration**: Team workflow management

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend SPA  │    │  Cloudflare      │    │   External      │
│   (React-like)  │◄──►│  Workers API     │◄──►│   Services      │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Core Services  │    │   Workflow       │    │   AI Services   │
│  • State Mgmt   │    │   Engine         │    │   • OpenAI      │
│  • Router       │    │                  │    │   • Anthropic   │
│  • Event Bus    │    └──────────────────┘    │   • Midjourney  │
└─────────────────┘                            └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Analytics     │    │   Platform       │    │   Social        │
│   Engine        │    │   Manager        │    │   Platforms     │
│                 │    │                  │    │   • TikTok      │
└─────────────────┘    └──────────────────┘    │   • Instagram   │
                                               │   • Snapchat    │
                                               └─────────────────┘
```

## 🚦 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Fadil369/marketing-automation.git
   cd marketing-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your API keys
   nano .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=development
API_BASE_URL=http://localhost:8787

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
MIDJOURNEY_API_KEY=your_midjourney_key
COQUI_API_KEY=your_coqui_key

# Social Platforms
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_secret
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_secret
SNAPCHAT_CLIENT_ID=your_snapchat_client_id
SNAPCHAT_CLIENT_SECRET=your_snapchat_secret

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### Feature Flags

Enable/disable features in `src/config/environment.js`:

```javascript
const features = {
  'ai-content-generation': true,
  'multi-platform-posting': true,
  'real-time-analytics': true,
  'predictive-analytics': true,
  'a-b-testing': false,
  'voice-content-generation': false
};
```

## 📚 API Documentation

### Authentication

```javascript
// Bearer Token
Authorization: Bearer <your_jwt_token>

// API Key
X-API-Key: <your_api_key>
```

### Key Endpoints

#### Campaigns
```bash
GET    /api/campaigns           # List campaigns
POST   /api/campaigns           # Create campaign
GET    /api/campaigns/:id       # Get campaign
PUT    /api/campaigns/:id       # Update campaign
DELETE /api/campaigns/:id       # Delete campaign
POST   /api/campaigns/:id/start # Start campaign
```

#### Analytics
```bash
GET /api/analytics/metrics      # Get metrics
POST /api/analytics/query       # Custom query
GET /api/analytics/reports      # Get reports
```

#### AI Services
```bash
POST /api/ai/generate/text      # Generate text content
POST /api/ai/generate/image     # Generate images
POST /api/ai/generate/voice     # Generate voice content
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit           # Run unit tests
npm run test:coverage       # Run with coverage
npm run test:watch          # Watch mode
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:headed    # Run with browser UI
```

### Test Structure
```
tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── e2e/                   # End-to-end tests
├── fixtures/              # Test data
└── utils/                 # Test utilities
```

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to staging**
   ```bash
   npm run deploy:staging
   ```

3. **Deploy to production**
   ```bash
   npm run deploy:production
   ```

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t brainsait-marketing .
   ```

2. **Run container**
   ```bash
   docker run -p 8080:8080 brainsait-marketing
   ```

3. **Docker Compose**
   ```bash
   docker-compose up -d
   ```

## 📊 Monitoring & Analytics

### Health Checks
- **Application Health**: `/health`
- **API Health**: `/api/health`
- **Database Health**: `/api/health/db`

### Metrics Endpoints
- **Application Metrics**: `/metrics`
- **Performance Metrics**: `/api/metrics/performance`
- **Business Metrics**: `/api/metrics/business`

### Logging
- **Development**: Console output with colors
- **Production**: Structured JSON logs
- **Error Tracking**: Integrated with monitoring service

## 🛡️ Security

### Security Features
- **HTTPS Everywhere**: TLS 1.3 encryption
- **CSRF Protection**: Double-submit cookie pattern
- **XSS Prevention**: Content Security Policy
- **Rate Limiting**: API and UI protection
- **Input Validation**: Server-side validation
- **Authentication**: JWT + API keys
- **Authorization**: Role-based access control

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## 🌍 Internationalization

### Supported Languages
- **English (en)**: Default language
- **Arabic (ar)**: RTL support included

### Adding New Languages

1. **Create language file**
   ```bash
   src/assets/locales/fr.json
   ```

2. **Add translations**
   ```json
   {
     "dashboard.title": "Tableau de bord",
     "campaigns.create": "Créer une campagne"
   }
   ```

3. **Register language**
   ```javascript
   // In src/core/app/I18nManager.js
   this.supportedLanguages.add('fr');
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes**
4. **Run tests**
   ```bash
   npm run validate
   ```
5. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create Pull Request**

### Code Style

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality
- **Conventional Commits**: Commit message format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://reach.brainsait.io](https://reach.brainsait.io)
- **Staging**: [https://staging.reach.brainsait.io](https://staging.reach.brainsait.io)
- **Documentation**: [https://docs.brainsait.io](https://docs.brainsait.io)
- **API Docs**: [https://api.brainsait.io/docs](https://api.brainsait.io/docs)
- **Status Page**: [https://status.brainsait.io](https://status.brainsait.io)

## 💬 Support

- **Email**: support@brainsait.io
- **Documentation**: [docs.brainsait.io](https://docs.brainsait.io)
- **GitHub Issues**: [Create an issue](https://github.com/Fadil369/marketing-automation/issues)
- **Discord**: [Join our community](https://discord.gg/brainsait)

## 🏆 Acknowledgments

- **OpenAI** for GPT-4 integration
- **Anthropic** for Claude AI services
- **Cloudflare** for edge computing platform
- **All contributors** who helped make this project possible

---

<div align="center">

**[🌐 Website](https://brainsait.io) • [📚 Documentation](https://docs.brainsait.io) • [🐛 Report Bug](https://github.com/Fadil369/marketing-automation/issues) • [✨ Request Feature](https://github.com/Fadil369/marketing-automation/issues)**

Made with ❤️ by the [BrainSAIT Team](https://brainsait.io)

</div>