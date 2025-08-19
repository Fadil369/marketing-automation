// wrangler.toml - Cloudflare Workers Configuration
export default {
  name: "brainsait-platform",
  main: "./dist/index.js",
  compatibility_date: "2024-01-01",
  compatibility_flags: ["nodejs_compat"],
  
  vars: {
    ENVIRONMENT: "production",
    API_BASE_URL: "https://api.brainsait.com",
    CALENDLY_URL: "https://calendly.com/fadil369",
    CONTACT_EMAIL: "dr.mf.12298@gmail.com"
  },

  // Routes for custom domain
  routes: [
    { pattern: "brainsait.com/*", zone_name: "brainsait.com" },
    { pattern: "www.brainsait.com/*", zone_name: "brainsait.com" }
  ],

  // R2 storage for assets
  r2_buckets: [
    { binding: "ASSETS", bucket_name: "brainsait-assets" },
    { binding: "REPORTS", bucket_name: "brainsait-reports" }
  ],

  // D1 database for analytics
  d1_databases: [
    { binding: "DB", database_name: "brainsait-analytics", database_id: "xxx" }
  ],

  // KV for caching
  kv_namespaces: [
    { binding: "CACHE", id: "xxx" },
    { binding: "SESSIONS", id: "xxx" }
  ]
};

// vite.config.ts - Build Configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'BrainSAIT - Healthcare AI Platform',
        short_name: 'BrainSAIT',
        description: 'Advanced AI solutions for Saudi healthcare transformation',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.brainsait\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          charts: ['recharts']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  }
});

// tailwind.config.js - Tailwind Configuration
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Tajawal', 'system-ui'],
        english: ['Inter', 'system-ui']
      },
      colors: {
        brand: {
          purple: '#7c3aed',
          blue: '#3b82f6',
          teal: '#14b8a6'
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'bounce-gentle': 'bounceGentle 3s infinite'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};

// package.json - Dependencies
{
  "name": "brainsait-platform",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && wrangler publish",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "recharts": "^2.8.0",
    "clsx": "^2.0.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "wrangler": "^3.0.0",
    "vite-plugin-pwa": "^0.16.0"
  }
}

// src/utils/analytics.ts - Analytics Integration
export class BrainSAITAnalytics {
  private static instance: BrainSAITAnalytics;
  
  static getInstance(): BrainSAITAnalytics {
    if (!BrainSAITAnalytics.instance) {
      BrainSAITAnalytics.instance = new BrainSAITAnalytics();
    }
    return BrainSAITAnalytics.instance;
  }

  // ROI Calculator Events
  trackROICalculation(data: any) {
    this.sendEvent('roi_calculation', {
      hospital_type: data.hospitalType,
      bed_count: data.bedCount,
      patient_count: data.patientCount,
      selected_services: Object.keys(data.services).filter(k => data.services[k]),
      calculated_roi: data.roi,
      timestamp: new Date().toISOString()
    });
  }

  // Lead Generation Events
  trackCalendlyClick(source: string) {
    this.sendEvent('calendly_click', { source });
  }

  trackEmailClick(source: string) {
    this.sendEvent('email_click', { source });
  }

  // Page Navigation Events
  trackPageView(page: string) {
    this.sendEvent('page_view', { 
      page, 
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  }

  private async sendEvent(event: string, data: any) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
}

// src/utils/pdfGenerator.ts - PDF Export Utility
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFReportGenerator {
  static async generateROIReport(results: any, formData: any): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add Arabic font support
    // pdf.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
    // pdf.setFont('Tajawal');
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(124, 58, 237); // Purple color
    pdf.text('BrainSAIT - تقرير عائد الاستثمار', 105, 20, { align: 'center' });
    
    // Hospital Info
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`نوع المنشأة: ${this.getHospitalTypeLabel(formData.hospitalType)}`, 20, 40);
    pdf.text(`عدد الأسرة: ${formData.bedCount}`, 20, 50);
    pdf.text(`المرضى الشهري: ${formData.patientCount.toLocaleString()}`, 20, 60);
    
    // Key Metrics
    pdf.setFontSize(14);
    pdf.setTextColor(124, 58, 237);
    pdf.text('النتائج الرئيسية', 20, 80);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`عائد الاستثمار: ${results.roi.toFixed(0)}%`, 20, 95);
    pdf.text(`التوفير السنوي: ${results.annualSavings.toLocaleString()} ريال`, 20, 105);
    pdf.text(`فترة الاسترداد: ${results.paybackMonths} شهر`, 20, 115);
    
    // 5-Year Projection Table
    pdf.setFontSize(14);
    pdf.setTextColor(124, 58, 237);
    pdf.text('التوقعات المالية (5 سنوات)', 20, 140);
    
    // Add table headers
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const headers = ['السنة', 'التوفير', 'الاستثمار', 'صافي الفائدة', 'عائد الاستثمار'];
    headers.forEach((header, index) => {
      pdf.text(header, 20 + (index * 35), 155);
    });
    
    // Add table data
    results.projectionData.forEach((data: any, index: number) => {
      const y = 165 + (index * 10);
      pdf.text(data.year.toString(), 25, y);
      pdf.text((data.savings / 1000).toFixed(0) + 'K', 50, y);
      pdf.text((data.costs / 1000).toFixed(0) + 'K', 85, y);
      pdf.text((data.netBenefit / 1000).toFixed(0) + 'K', 120, y);
      pdf.text(data.roi.toFixed(0) + '%', 155, y);
    });
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generated by BrainSAIT ROI Calculator', 20, 280);
    pdf.text(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, 150, 280);
    
    return pdf.output('blob');
  }

  private static getHospitalTypeLabel(type: string): string {
    const labels = {
      primary: 'مركز رعاية أولية',
      regional: 'مستشفى إقليمي',
      medical_city: 'مدينة طبية'
    };
    return labels[type] || type;
  }
}

// deployment.yml - GitHub Actions CI/CD
name: Deploy BrainSAIT Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Build project
        run: npm run build
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: publish
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

// Arabic Font Loading Configuration
// public/fonts/fonts.css
@font-face {
  font-family: 'Tajawal';
  src: url('./Tajawal-Regular.woff2') format('woff2'),
       url('./Tajawal-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Tajawal';
  src: url('./Tajawal-Bold.woff2') format('woff2'),
       url('./Tajawal-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Tajawal';
  src: url('./Tajawal-Black.woff2') format('woff2'),
       url('./Tajawal-Black.woff') format('woff');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}