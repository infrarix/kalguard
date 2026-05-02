# KalGuard Documentation Site

Professional documentation website for **KalGuard** - Enterprise-grade AI Agent Runtime Security Platform.

Built with [Docusaurus 3](https://docusaurus.io/).

## 🚀 Quick Start

```bash
pnpm install
pnpm start    # Opens http://localhost:3000
pnpm build    # Production build
```

## 🎨 Features

✨ **Modern Landing Page** with animated logo and gradient effects  
📚 **Comprehensive Docs** - Installation, concepts, integration, deployment, API  
🌓 **Light/Dark Mode** with auto-detection  
🎯 **SEO Optimized** with social cards  
📱 **Fully Responsive** design  
🔍 **Built-in Search** functionality  

## 📁 Structure

```
docs/                    # Documentation content
├── introduction.md      # Overview
├── quick-start.md       # 5-min setup
├── installation.md      # Install guide
├── concepts/            # Architecture, policy, firewall
├── integration/         # SDK & API guides
├── deployment/          # Docker, K8s, systemd
└── api/                 # Complete API reference

src/pages/               # Custom pages
├── index.tsx            # Landing page
└── index.module.css     # Page styles

static/img/              # Logos & images
├── logo.svg             # Icon only
├── kalguard-logo-full.svg    # With text
└── kalguard-social-card.svg  # Social preview
```

## 🎨 Customization

**Brand Colors**: Edit `src/css/custom.css`  
**Navigation**: Edit `docusaurus.config.ts`  
**Sidebar**: Edit `sidebars.ts`  

## 🚢 Deployment

**Netlify/Vercel**: Build command `pnpm build`, publish directory `build`  
**GitHub Pages**: `GIT_USER=<username> pnpm deploy`  

## 📄 License

Apache-2.0
