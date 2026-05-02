import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

/* ──────────────────────────────────────────────
   SVG Icon Set — used in features + diagrams
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
  Flame: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3c1 3 4 4.5 4 8a4 4 0 1 1-8 0c0-1.5.5-2.5 1.5-3.5C10.5 6 11.5 4.5 12 3Z" />
      <path d="M12 21a3 3 0 0 0 3-3c0-1.5-1.5-2.5-3-4-1.5 1.5-3 2.5-3 4a3 3 0 0 0 3 3Z" />
    </svg>
  ),
  Wrench: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-2.1 2.5-2.5Z" />
    </svg>
  ),
  Document: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  ),
  Bolt: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Eye: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Code: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />
    </svg>
  ),
  Fingerprint: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12a7 7 0 0 1 14 0v3" />
      <path d="M9 21c-.5-1.5-1-3-1-5a4 4 0 0 1 8 0c0 1 .2 2 .5 3" />
      <path d="M12 12v3c0 1.5.3 3 1 4.5" />
    </svg>
  ),
};

/* ──────────────────────────────────────────────
   Parallax — bind window scroll to CSS vars
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
   Scroll Reveal — fade/translate when in viewport
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
   Hero — multi-layer parallax + animated SVGs
   ────────────────────────────────────────────── */

function HeroBackground() {
  return (
    <div className={styles.heroBackground} aria-hidden="true">
      {/* Animated gradient orbs */}
      <div className={`${styles.orb} ${styles.orbA}`} />
      <div className={`${styles.orb} ${styles.orbB}`} />
      <div className={`${styles.orb} ${styles.orbC}`} />

      {/* Grid */}
      <div className={styles.gridOverlay} />

      {/* Floating SVG shields/locks at varying depths */}
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

      <svg className={`${styles.floater} ${styles.floater2}`} viewBox="0 0 64 64" fill="none">
        <rect x="14" y="28" width="36" height="28" rx="4" stroke="url(#g2)" strokeWidth="1.2" />
        <path d="M22 28v-8a10 10 0 0 1 20 0v8" stroke="url(#g2)" strokeWidth="1.2" />
        <circle cx="32" cy="42" r="3" fill="url(#g2)" />
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
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

      <svg className={`${styles.floater} ${styles.floater4}`} viewBox="0 0 80 24" fill="none">
        <path
          d="M2 12 Q20 0 40 12 T78 12"
          stroke="url(#g4)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <defs>
          <linearGradient id="g4" x1="0" y1="0" x2="80" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg className={`${styles.floater} ${styles.floater5}`} viewBox="0 0 64 64" fill="none">
        <path
          d="M5 12a14 14 0 0 1 28 0v6"
          stroke="url(#g5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
          transform="translate(13 14)"
        />
        <path
          d="M12 28c-1-3-2-6-2-10a8 8 0 0 1 16 0c0 2 .4 4 1 6"
          stroke="url(#g5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
          transform="translate(13 14)"
        />
        <defs>
          <linearGradient id="g5" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>

      {/* Particle dots */}
      <div className={styles.particles}>
        {Array.from({length: 18}).map((_, i) => (
          <span key={i} className={styles.particle} style={{['--i' as string]: i}} />
        ))}
      </div>

      {/* Scanline */}
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

      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={styles.badge}>
              <span className={styles.badgeDot} /> Open Source
            </span>
            <span className={styles.badge}>Apache-2.0</span>
            <span className={styles.badge}>v0.1.0</span>
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
            A Zero Trust security sidecar for AI agents — policy-driven prompt
            firewall, tool mediation, and immutable audit logging.
            Framework-agnostic. Fail-closed by default.
          </p>

          <div className={styles.buttons}>
            <Link className={styles.ctaButton} to="/docs/quick-start">
              <span>Get Started</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link className={styles.secondaryButton} to="/docs/introduction">
              Documentation
            </Link>
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

        <HeroTerminal />
      </div>

      <ScrollIndicator />
    </header>
  );
}

/* ──────────────────────────────────────────────
   Hero Terminal — animated request → decision
   ────────────────────────────────────────────── */

function HeroTerminal() {
  return (
    <div className={styles.terminal} aria-hidden="true">
      <div className={styles.terminalBar}>
        <span className={styles.terminalDot} data-c="r" />
        <span className={styles.terminalDot} data-c="y" />
        <span className={styles.terminalDot} data-c="g" />
        <span className={styles.terminalTitle}>kalguard › prompt-check</span>
      </div>
      <div className={styles.terminalBody}>
        <div className={styles.terminalLine}>
          <span className={styles.tPrompt}>POST</span>
          <span className={styles.tPath}>/v1/prompt/check</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.tKey}>"messages"</span>
          <span className={styles.tColon}>:</span>
          <span className={styles.tStr}>[ user → "ignore prior rules…" ]</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.tComment}>// policy evaluating</span>
          <span className={styles.tSpinner} />
        </div>
        <div className={styles.terminalLineDeny}>
          <Icon.Lock width={14} height={14} />
          <span>decision: <strong>deny</strong></span>
          <span className={styles.tTag}>injection.detected</span>
        </div>
        <div className={styles.terminalLineAllow}>
          <Icon.Shield width={14} height={14} />
          <span>audit.id: <strong>aud_8f3c9</strong></span>
          <span className={styles.tTag}>logged</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Scroll indicator
   ────────────────────────────────────────────── */

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

const STATS: {label: string; value: string; suffix?: string; sub: string}[] = [
  {label: 'Latency overhead', value: '<2', suffix: 'ms', sub: 'p50 in-process check'},
  {label: 'Policy primitives', value: '12', suffix: '+', sub: 'composable rules'},
  {label: 'Default posture', value: '100', suffix: '%', sub: 'fail-closed'},
  {label: 'Audit retention', value: '∞', sub: 'append-only, signed'},
];

function StatsSection() {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.stats}>
      <div
        ref={ref}
        className={`container ${styles.statsGrid} ${shown ? styles.revealed : styles.hidden}`}>
        {STATS.map((s, i) => (
          <div key={s.label} className={styles.statCard} style={{['--d' as string]: `${i * 80}ms`}}>
            <div className={styles.statValue}>
              {s.value}
              {s.suffix ? <span className={styles.statSuffix}>{s.suffix}</span> : null}
            </div>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Features
   ────────────────────────────────────────────── */

interface FeatureProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  accent: string;
}

const FEATURES: FeatureProps[] = [
  {
    Icon: Icon.Shield,
    title: 'Zero Trust Architecture',
    description:
      'Every agent request is untrusted by default. All prompts and tool calls are validated against policy before execution — no implicit trust.',
    accent: 'var(--kg-accent-blue)',
  },
  {
    Icon: Icon.Lock,
    title: 'Fail-Closed Enforcement',
    description:
      'If policy evaluation errors or the sidecar is unreachable, access is denied. No unsafe fallbacks or bypass mechanisms exist.',
    accent: 'var(--kg-accent-violet)',
  },
  {
    Icon: Icon.Flame,
    title: 'Prompt Firewall',
    description:
      'Real-time risk scoring, injection detection, PII redaction, and content filtering. Sanitizes prompts before they reach the LLM.',
    accent: 'var(--kg-accent-rose)',
  },
  {
    Icon: Icon.Wrench,
    title: 'Tool Mediation',
    description:
      'Allowlist/denylist tool access, validate arguments against schemas, and enforce per-tool rate limits — all declaratively.',
    accent: 'var(--kg-accent-cyan)',
  },
  {
    Icon: Icon.Document,
    title: 'Immutable Audit Trail',
    description:
      'Every decision is logged as structured JSON. SIEM-ready, append-only, and tamper-evident for compliance and forensics.',
    accent: 'var(--kg-accent-amber)',
  },
  {
    Icon: Icon.Bolt,
    title: 'Sidecar Architecture',
    description:
      'Runs as a separate process — not embedded in your agent. Deploy alongside any framework on any platform.',
    accent: 'var(--kg-accent-emerald)',
  },
];

function FeatureCard({Icon, title, description, accent, index}: FeatureProps & {index: number}) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${styles.featureCard} ${shown ? styles.revealed : styles.hidden}`}
      style={{
        ['--accent' as string]: accent,
        ['--d' as string]: `${index * 70}ms`,
      }}>
      <div className={styles.featureIconWrap}>
        <Icon className={styles.featureIcon} width={26} height={26} />
        <span className={styles.featureIconRing} />
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
      <span className={styles.featureCornerGlow} />
    </div>
  );
}

function FeaturesSection() {
  const [headerRef, headerShown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.features}>
      <div className="container">
        <div
          ref={headerRef}
          className={`${styles.sectionHeader} ${headerShown ? styles.revealed : styles.hidden}`}>
          <span className={styles.eyebrow}>
            <Icon.Eye width={14} height={14} /> Capabilities
          </span>
          <h2 className={styles.sectionTitle}>Built for autonomous agents under attack</h2>
          <p className={styles.sectionSubtitle}>
            Six policy primitives, one sidecar. Compose them to enforce security
            on any LLM-driven workload.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Architecture diagram — animated SVG
   ────────────────────────────────────────────── */

function ArchitectureSection() {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.architecture}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>
            <Icon.Code width={14} height={14} /> Architecture
          </span>
          <h2 className={styles.sectionTitle}>One sidecar between your agent and the world</h2>
          <p className={styles.sectionSubtitle}>
            KalGuard sits in-line: every prompt and tool call routes through
            policy, every decision lands in an immutable audit stream.
          </p>
        </div>

        <div
          ref={ref}
          className={`${styles.diagramWrap} ${shown ? styles.revealed : styles.hidden}`}>
          <svg className={styles.diagram} viewBox="0 0 920 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Architecture diagram">
            <defs>
              <linearGradient id="dlink" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="dlinkR" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <filter id="dglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines (animated dashes) */}
            <path d="M170 180 L 380 180" stroke="url(#dlink)" strokeWidth="2.5" fill="none" className={styles.dPath} />
            <path d="M540 180 L 750 180" stroke="url(#dlinkR)" strokeWidth="2.5" fill="none" className={styles.dPath} />
            <path d="M460 230 L 460 300" stroke="url(#dlink)" strokeWidth="2" strokeDasharray="6 6" fill="none" className={styles.dPathSlow} />

            {/* Agent node */}
            <g className={styles.dNode} transform="translate(60 130)">
              <rect width="120" height="100" rx="14" fill="rgba(96,165,250,0.08)" stroke="rgba(96,165,250,0.5)" />
              <rect x="20" y="22" width="80" height="6" rx="3" fill="rgba(96,165,250,0.6)" />
              <rect x="20" y="36" width="56" height="6" rx="3" fill="rgba(96,165,250,0.35)" />
              <rect x="20" y="50" width="68" height="6" rx="3" fill="rgba(96,165,250,0.5)" />
              <text x="60" y="84" textAnchor="middle" fontSize="13" fontWeight="600" fill="#cbd5e1">Agent</text>
            </g>

            {/* KalGuard core node */}
            <g className={styles.dCore} transform="translate(380 100)" filter="url(#dglow)">
              <rect width="160" height="160" rx="20" fill="rgba(124,58,237,0.12)" stroke="url(#dlink)" strokeWidth="1.5" />
              <g transform="translate(80 60)">
                <path
                  d="M0 -28 -22 -20 -22 4 c0 16 10 28 22 32 12 -4 22 -16 22 -32 V-20 L0 -28Z"
                  fill="rgba(124,58,237,0.25)"
                  stroke="url(#dlink)"
                  strokeWidth="2"
                  className={styles.dShield}
                />
                <path d="M-10 4 l8 8 14 -14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
              <text x="80" y="130" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">KalGuard</text>
              <text x="80" y="148" textAnchor="middle" fontSize="11" fill="#94a3b8">policy · firewall · audit</text>
            </g>

            {/* LLM node */}
            <g className={styles.dNode} transform="translate(750 130)">
              <rect width="120" height="100" rx="14" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.5)" />
              <circle cx="60" cy="40" r="14" fill="none" stroke="rgba(34,211,238,0.7)" strokeWidth="2" />
              <circle cx="60" cy="40" r="6" fill="rgba(34,211,238,0.7)" />
              <circle cx="42" cy="40" r="3" fill="rgba(34,211,238,0.5)" />
              <circle cx="78" cy="40" r="3" fill="rgba(34,211,238,0.5)" />
              <text x="60" y="84" textAnchor="middle" fontSize="13" fontWeight="600" fill="#cbd5e1">LLM / Tools</text>
            </g>

            {/* Audit log node */}
            <g className={styles.dNode} transform="translate(390 290)">
              <rect width="140" height="58" rx="12" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.5)" />
              <rect x="14" y="18" width="112" height="4" rx="2" fill="rgba(245,158,11,0.6)" />
              <rect x="14" y="28" width="80" height="4" rx="2" fill="rgba(245,158,11,0.4)" />
              <rect x="14" y="38" width="98" height="4" rx="2" fill="rgba(245,158,11,0.5)" />
              <text x="70" y="-6" textAnchor="middle" fontSize="11" fill="#94a3b8">immutable audit log</text>
            </g>

            {/* Direction labels */}
            <text x="275" y="170" textAnchor="middle" fontSize="11" fill="#64748b">prompt / tool</text>
            <text x="645" y="170" textAnchor="middle" fontSize="11" fill="#64748b">sanitized</text>

            {/* Moving packets */}
            <circle r="4" fill="#60a5fa" className={styles.dPacket1}>
              <animateMotion dur="3.4s" repeatCount="indefinite" path="M170 180 L 380 180" />
            </circle>
            <circle r="4" fill="#22d3ee" className={styles.dPacket2}>
              <animateMotion dur="3.4s" repeatCount="indefinite" begin="1.2s" path="M540 180 L 750 180" />
            </circle>
            <circle r="3" fill="#f59e0b" className={styles.dPacket3}>
              <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.4s" path="M460 230 L 460 300" />
            </circle>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   How It Works
   ────────────────────────────────────────────── */

interface StepProps {
  num: number;
  title: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function Step({num, title, description, Icon, index}: StepProps & {index: number}) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${styles.workflowStep} ${shown ? styles.revealed : styles.hidden}`}
      style={{['--d' as string]: `${index * 120}ms`}}>
      <div className={styles.stepNumber}>
        <span>{String(num).padStart(2, '0')}</span>
        <Icon width={18} height={18} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className={styles.howItWorks}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>
            <Icon.Bolt width={14} height={14} /> Workflow
          </span>
          <h2 className={styles.sectionTitle}>Three steps to production</h2>
          <p className={styles.sectionSubtitle}>
            From zero to enforced policy in under five minutes — no proprietary
            agent runtime required.
          </p>
        </div>

        <div className={styles.workflowContainer}>
          <Step index={0} num={1} Icon={Icon.Bolt} title="Deploy the Sidecar"
            description="Run the KalGuard sidecar alongside your agent — locally, in Docker, or on Kubernetes. It exposes an HTTP API for security checks." />
          <div className={styles.workflowConnector} aria-hidden="true">
            <svg viewBox="0 0 80 12" preserveAspectRatio="none">
              <path d="M0 6 H80" stroke="url(#wfConn)" strokeWidth="2" strokeDasharray="4 4" />
              <defs>
                <linearGradient id="wfConn" x1="0" y1="0" x2="80" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <Step index={1} num={2} Icon={Icon.Code} title="Integrate Your Agent"
            description="Before each LLM call or tool execution, your agent calls KalGuard via the TypeScript SDK or a simple HTTP request." />
          <div className={styles.workflowConnector} aria-hidden="true">
            <svg viewBox="0 0 80 12" preserveAspectRatio="none">
              <path d="M0 6 H80" stroke="url(#wfConn2)" strokeWidth="2" strokeDasharray="4 4" />
              <defs>
                <linearGradient id="wfConn2" x1="0" y1="0" x2="80" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <Step index={2} num={3} Icon={Icon.Document} title="Enforce & Audit"
            description="KalGuard evaluates the request against policy, returns allow/deny with optional sanitization, and writes an immutable audit log." />
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Quick Start
   ────────────────────────────────────────────── */

const INSTALL_CODE = `# Install the KalGuard package
pnpm add kalguard

# Generate a token secret
export KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32)

# Start the sidecar
pnpm --filter kalguard/sidecar start`;

const INTEGRATE_CODE = `import { KalGuardClient, withPromptCheck } from 'kalguard';

const client = new KalGuardClient({
  baseUrl: 'http://localhost:9292',
  token: process.env.KALGUARD_AGENT_TOKEN,
});

// Wrap every LLM call with a security check
const response = await withPromptCheck(client, messages, async (safe) => {
  return await llm.chat(safe);
});`;

function QuickStartSection() {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>
            <Icon.Code width={14} height={14} /> Quick Start
          </span>
          <h2 className={styles.sectionTitle}>Up and running in five minutes</h2>
          <p className={styles.sectionSubtitle}>
            Install the package, drop the sidecar in front of your agent, ship.
          </p>
        </div>
        <div
          ref={ref}
          className={`${styles.codeBlocks} ${shown ? styles.revealed : styles.hidden}`}>
          <div className={styles.codeBlock}>
            <h3>
              <span className={styles.codeStep}>01</span>
              Install &amp; Run
            </h3>
            <CodeBlock language="bash">{INSTALL_CODE}</CodeBlock>
          </div>
          <div className={styles.codeBlock}>
            <h3>
              <span className={styles.codeStep}>02</span>
              Integrate
            </h3>
            <CodeBlock language="typescript">{INTEGRATE_CODE}</CodeBlock>
          </div>
        </div>
        <div className={styles.ctaCenter}>
          <Link className={styles.ctaButton} to="/docs/quick-start">
            <span>Read the Full Guide</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
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
          <h2>Stop trusting your agents.</h2>
          <p>
            Wrap them in a policy that fails closed. Open source under
            Apache-2.0 — read the docs, run it locally in minutes.
          </p>
          <div className={styles.finalButtons}>
            <Link className={styles.ctaButton} to="/docs/quick-start">
              Get Started
            </Link>
            <Link className={styles.secondaryButton} href="https://github.com/infrarix/kalguard">
              Star on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   Page
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
        <FeaturesSection />
        <ArchitectureSection />
        <HowItWorksSection />
        <QuickStartSection />
        <FinalCTA />
      </main>
    </Layout>
  );
}
