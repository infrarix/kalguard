import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ──────────────────────────────────────────────
   SVG Icon Set
   ────────────────────────────────────────────── */

const Icon = {
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.2" />
    </svg>
  ),
  Bolt: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Document: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
};

/* ──────────────────────────────────────────────
   Parallax
   ────────────────────────────────────────────── */

function useParallax(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(1, rect.height)));
      el.style.setProperty('--p', String(progress));
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/* ──────────────────────────────────────────────
   Scroll Reveal
   ────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      {threshold: 0.15, rootMargin: '0px 0px -50px 0px'},
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

/* ──────────────────────────────────────────────
   Hero — docs-focused
   ────────────────────────────────────────────── */

function HeroBackground() {
  return (
    <div className={styles.heroBackground} aria-hidden="true">
      <div className={`${styles.orb} ${styles.orbA}`} />
      <div className={`${styles.orb} ${styles.orbB}`} />
      <div className={`${styles.orb} ${styles.orbC}`} />
      <div className={styles.gridOverlay} />

      <svg className={`${styles.floater} ${styles.floater1}`} viewBox="0 0 64 64" fill="none">
        <path
          d="M32 6 12 13v17c0 13 9 23 20 27 11-4 20-14 20-27V13L32 6Z"
          stroke="url(#g1)" strokeWidth="1.2"
        />
        <path d="M22 32l8 8 14-14" stroke="url(#g1)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      <svg className={`${styles.floater} ${styles.floater3}`} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="22" stroke="url(#g3)" strokeWidth="1" />
        <circle cx="32" cy="32" r="14" stroke="url(#g3)" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="32" cy="32" r="3" fill="url(#g3)" />
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.particles}>
        {Array.from({length: 12}).map((_, i) => (
          <span key={i} className={styles.particle} style={{['--i' as string]: i}} />
        ))}
      </div>

      <div className={styles.scanline} />
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const heroRef = useRef<HTMLElement | null>(null);
  const logoUrl = useBaseUrl('/img/logo.png');
  useParallax(heroRef);

  return (
    <header ref={heroRef} className={styles.heroBanner}>
      <HeroBackground />

      <div className={`container ${styles.heroContainer}`} style={{gridTemplateColumns: '1fr', textAlign: 'center', justifyItems: 'center'}}>
        <div className={styles.heroContent} style={{textAlign: 'center'}}>
          <div className={styles.badges}>
            <span className={styles.badge}>
              <span className={styles.badgeDot} /> Open Source
            </span>
            <span className={styles.badge}>Apache-2.0</span>
            <span className={styles.badge}>v1.1.1</span>
          </div>

          <div className={styles.logoContainer}>
            <div className={styles.logoRing}>
              <img src={logoUrl} alt="KalGuard" className={styles.heroLogo} />
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleGlow}>KAL</span>
            <span className={styles.heroTitleAccent}>GUARD</span>
          </h1>

          <p className={styles.heroTagline}>{siteConfig.tagline}</p>
          <p className={styles.heroDescription}>
            Open-source Zero Trust security sidecar for AI agents. Read the docs
            to get started, or visit the dashboard for token management and analytics.
          </p>

          <div className={styles.buttons}>
            <Link className={styles.ctaButton} to="/docs/quick-start">
              <span>Read the Docs</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a className={styles.secondaryButton} href="https://kalguard.dev" target="_blank" rel="noopener noreferrer">
              Open Dashboard
            </a>
            <Link
              className={styles.githubButton}
              href="https://github.com/infrarix/kalguard">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.2-3.37-1.2-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
              </svg>
              GitHub
            </Link>
          </div>

          <div className={styles.installHint}>
            <span className={styles.installPrompt}>$</span>
            <code>pnpm add kalguard</code>
            <span className={styles.installCursor} />
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </header>
  );
}

function ScrollIndicator() {
  return (
    <div className={styles.scrollIndicator} aria-hidden="true">
      <span className={styles.scrollLabel}>Scroll</span>
      <span className={styles.scrollLine} />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Stats
   ────────────────────────────────────────────── */

const STATS: {label: string; value: string; suffix?: string; sub: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; accent: string}[] = [
  {label: 'Latency overhead', value: '<2', suffix: 'ms', sub: 'p50 in-process check', icon: Icon.Bolt, accent: '#3b82f6'},
  {label: 'Policy primitives', value: '12', suffix: '+', sub: 'composable rules', icon: Icon.Shield, accent: '#a78bfa'},
  {label: 'Default posture', value: '100', suffix: '%', sub: 'fail-closed', icon: Icon.Lock, accent: '#f43f5e'},
  {label: 'Audit retention', value: '∞', sub: 'append-only, signed', icon: Icon.Document, accent: '#f59e0b'},
];

function StatsSection() {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.stats}>
      <div
        ref={ref}
        className={`container ${styles.statsGrid} ${shown ? styles.revealed : styles.hidden}`}>
        {STATS.map((s, i) => {
          const StatIcon = s.icon;
          return (
            <div key={s.label} className={styles.statCard} style={{['--d' as string]: `${i * 80}ms`, ['--stat-accent' as string]: s.accent}}>
              <div className={styles.statIconWrap}>
                <StatIcon width={18} height={18} />
              </div>
              <div className={styles.statValue}>
                {s.value}
                {s.suffix ? <span className={styles.statSuffix}>{s.suffix}</span> : null}
              </div>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statSub}>{s.sub}</div>
              <span className={styles.statGlow} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Docs Navigation Cards
   ────────────────────────────────────────────── */

const DOC_LINKS: {title: string; description: string; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; accent: string}[] = [
  {
    title: 'Quick Start',
    description: 'Install KalGuard, start the sidecar, and secure your first agent in under five minutes.',
    href: '/docs/quick-start',
    icon: Icon.Bolt,
    accent: '#3b82f6',
  },
  {
    title: 'Core Concepts',
    description: 'Understand Zero Trust architecture, policy engine, prompt firewall, and audit logging.',
    href: '/docs/concepts/architecture',
    icon: Icon.Shield,
    accent: '#a78bfa',
  },
  {
    title: 'Deployment Guide',
    description: 'Deploy to Docker, Kubernetes, or bare metal with Cloud mode for dashboard-managed tokens.',
    href: '/docs/deployment/overview',
    icon: Icon.Lock,
    accent: '#22d3ee',
  },
  {
    title: 'API Reference',
    description: 'Full reference for the sidecar HTTP API, SDK methods, and policy configuration.',
    href: '/docs/api/overview',
    icon: Icon.Document,
    accent: '#f59e0b',
  },
];

function DocsNavSection() {
  const [headerRef, headerShown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.features}>
      <div className="container">
        <div
          ref={headerRef}
          className={`${styles.sectionHeader} ${headerShown ? styles.revealed : styles.hidden}`}>
          <h2 className={styles.sectionTitle}>Explore the Documentation</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to integrate KalGuard into your stack.
            For product features, token management, and analytics, visit the{' '}
            <a href="https://kalguard.dev" target="_blank" rel="noopener noreferrer" style={{color: '#a78bfa', textDecoration: 'underline'}}>
              KalGuard Dashboard
            </a>.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {DOC_LINKS.map((item, i) => {
            const DocIcon = item.icon;
            return <DocCard key={item.title} item={item} index={i} Icon={DocIcon} />;
          })}
        </div>
      </div>
    </section>
  );
}

function DocCard({
  item,
  index,
  Icon: DocIcon,
}: {
  item: (typeof DOC_LINKS)[number];
  index: number;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <Link to={item.href} style={{textDecoration: 'none', color: 'inherit'}}>
      <div
        ref={ref}
        className={`${styles.featureCard} ${shown ? styles.revealed : styles.hidden}`}
        style={{
          ['--accent' as string]: item.accent,
          ['--d' as string]: `${index * 70}ms`,
          cursor: 'pointer',
        }}>
        <div className={styles.featureIconWrap}>
          <DocIcon className={styles.featureIcon} width={26} height={26} />
          <span className={styles.featureIconRing} />
        </div>
        <h3 className={styles.featureTitle}>{item.title}</h3>
        <p className={styles.featureDescription}>{item.description}</p>
        <span className={styles.featureCornerGlow} />
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────
   Final CTA
   ────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className={styles.finalCta}>
      <div className={styles.finalCtaInner}>
        <div className={styles.finalGlow} aria-hidden="true" />
        <div className={styles.finalContent}>
          <Icon.Shield className={styles.finalIcon} width={40} height={40} />
          <h2>Ready to secure your AI agents?</h2>
          <p>
            Read the docs to integrate KalGuard, or visit the dashboard to
            manage access tokens, view analytics, and control your agent fleet.
          </p>
          <div className={styles.finalButtons}>
            <Link className={styles.ctaButton} to="/docs/quick-start">
              Read the Docs
            </Link>
            <a className={styles.secondaryButton} href="https://kalguard.dev" target="_blank" rel="noopener noreferrer">
              Open Dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Page — Hero, Stats, Doc Nav, CTA
   ────────────────────────────────────────────── */

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — AI Agent Runtime Security`}
      description="Enterprise-grade, open-source security platform for AI agents. Zero Trust, fail-closed, framework-agnostic runtime security.">
      <HomepageHeader />
      <main className={styles.main}>
        <StatsSection />
        <DocsNavSection />
        <FinalCTA />
      </main>
    </Layout>
  );
}
