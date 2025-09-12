# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `ng serve` - Start development server on http://localhost:4200
- `npm run build` - Build for development 
- `npm run build:prod` - Production build with optimizations
- `npm run watch` - Build in watch mode for development
- `npm test` - Run unit tests with Karma/Jasmine
- `npm run serve:ssr:HsDuarte` - Serve the SSR build locally

### Docker & Deployment
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container locally on port 4000
- `npm run docker:compose:up` - Start all services with docker-compose
- `npm run docker:compose:down` - Stop all services
- `npm run deploy:hetzner` - Deploy to Hetzner server (manual)

### Production Server
The production build runs on a custom Fastify server (server.ts) on port 4000 with:
- Angular SSR (Server-Side Rendering) 
- Prometheus metrics on `/metrics`
- Health check on `/_health` (private networks only)
- Analytics route secured to private networks only

## Architecture Overview

### Technology Stack
- **Angular 20.2** with standalone components and SSR
- **TypeScript 5.9** with strict compiler options
- **SCSS** styling with Angular Material theme (deeppurple-amber)
- **Fastify** server for SSR with monitoring and security features
- **Docker** multi-stage builds for production deployment

### Application Structure
```
src/app/
├── pages/           # Feature pages (lazy-loaded components)
│   ├── home/        # Main portfolio page
│   ├── apartment/   # Real estate listing (t1-prelada route)
│   └── analytics/   # Private analytics dashboard
├── services/        # Core services
│   ├── analytics.service.ts  # Visitor tracking
│   ├── seo.service.ts       # SEO meta management  
│   └── theme.service.ts     # Dark/light theme handling
└── app.routes.ts    # Lazy-loaded routing with 404 redirect to home
```

### Key Features
- **Bilingual Support**: English/Portuguese with theme-aware branding
- **Theme System**: Auto system detection + manual toggle with persistent storage
- **SSR Optimization**: Prerendering with lazy-loaded standalone components
- **Performance Monitoring**: Prometheus metrics, Sentry error tracking (optional)
- **Security**: Private network restrictions for analytics and health endpoints

### Routing Strategy
All routes are lazy-loaded using Angular's loadComponent:
- `/` - Home component (main portfolio)
- `/t1-prelada` - Apartment listing page
- `/analytics` - Analytics dashboard (server-side protected)
- `/**` - Wildcard redirects to home (no 404 pages)

### Server Architecture
The custom Fastify server (server.ts) provides:
- **SSR Rendering**: Angular Universal with CommonEngine
- **Static Assets**: Optimized caching for JS/CSS/images (1 year cache)
- **Metrics Collection**: HTTP request metrics, visitor tracking by IP/country
- **Security Headers**: Helmet integration, CSP ready
- **Error Handling**: Sentry integration for production error tracking
- **Health Monitoring**: Container health checks and Prometheus metrics

### Deployment Infrastructure
- **Docker**: Multi-stage build (Node.js → Nginx optional proxy)
- **Blue/Green Deployment**: Zero-downtime deployments with port switching
- **Monitoring Stack**: Prometheus + Grafana with custom dashboards
- **SSL/TLS**: Let's Encrypt certificates with automated renewal
- **GitHub Actions**: Automated CI/CD with Discord notifications

### Development Guidelines
- Use Angular standalone components (no NgModules)
- Follow strict TypeScript configuration
- Implement proper error boundaries for SSR
- Utilize lazy loading for all page components
- Use SCSS with Angular Material theming conventions
- Test server endpoints privately (analytics, health checks)

### Monitoring & Analytics
- **Visitor Metrics**: IP-based tracking with country detection
- **Performance Metrics**: HTTP request duration and count
- **Error Tracking**: Sentry integration for production issues
- **Health Monitoring**: Container and application health checks
- **Analytics Dashboard**: Private network access only (/analytics route)

### Security Considerations
- Analytics routes restricted to private networks only
- Health checks limited to localhost/private IPs
- Static assets cached with proper headers
- Helmet security headers enabled
- No sensitive data in client-side code