import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

/* ─── Types ─── */

interface FeatureProps {
  icon: string;
  title: string;
  description: string;
}

interface StepProps {
  num: number;
  title: string;
  description: string;
}

/* ─── Hero ─── */

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={styles.badge}>Open Source</span>
            <span className={styles.badge}>Apache-2.0</span>
            <span className={styles.badge}>v0.1.0</span>
          </div>
          <div className={styles.logoContainer}>
            <img src="/img/logo.png" alt="KalGuard" className={styles.heroLogo} />
          </div>
          <h1 className={styles.heroTitle}>KALGUARD</h1>
          <p className={styles.heroTagline}>{siteConfig.tagline}</p>
          <p className={styles.heroDescription}>
            A Zero Trust security sidecar for AI agents — policy-driven prompt firewall,
            tool mediation, and immutable audit logging. Framework-agnostic. Fail-closed by default.
          </p>
          <div className={styles.buttons}>
            <Link className={styles.ctaButton} to="/docs/quick-start">
              Get Started
            </Link>
            <Link className={styles.secondaryButton} to="/docs/introduction">
              Documentation
            </Link>
            <Link
              className={styles.githubButton}
              href="https://github.com/kalguard/kalguard">
              GitHub
            </Link>
          </div>
          <div className={styles.installHint}>
            <code>pnpm add kalguard</code>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Features ─── */

function Feature({icon, title, description}: FeatureProps) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
}

const FEATURES: FeatureProps[] = [
  {
    icon: '🛡️',
    title: 'Zero Trust Architecture',
    description:
      'Every agent request is untrusted by default. All prompts and tool calls are validated against policy before execution — no implicit trust.',
  },
  {
    icon: '🔒',
    title: 'Fail-Closed Enforcement',
    description:
      'If policy evaluation errors or the sidecar is unreachable, access is denied. No unsafe fallbacks or bypass mechanisms exist.',
  },
  {
    icon: '🔥',
    title: 'Prompt Firewall',
    description:
      'Real-time risk scoring, injection detection, PII redaction, and content filtering. Sanitizes prompts before they reach the LLM.',
  },
  {
    icon: '🔧',
    title: 'Tool Mediation',
    description:
      'Allowlist/denylist tool access, validate arguments against schemas, and enforce per-tool rate limits — all declaratively.',
  },
  {
    icon: '📋',
    title: 'Immutable Audit Trail',
    description:
      'Every decision is logged as structured JSON. SIEM-ready, append-only, and tamper-evident for compliance and forensics.',
  },
  {
    icon: '⚡',
    title: 'Sidecar Architecture',
    description:
      'Runs as a separate process — not embedded in your agent. Deploy alongside any framework on any platform.',
  },
];

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Core Capabilities</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to enforce security policy on autonomous AI agents at runtime.
        </p>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <Feature key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */

function Step({num, title, description}: StepProps) {
  return (
    <div className={styles.workflowStep}>
      <div className={styles.stepNumber}>{num}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className={styles.howItWorks}>
      <div className="container">
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>
          Three steps to production-grade AI agent security.
        </p>
        <div className={styles.workflowContainer}>
          <Step
            num={1}
            title="Deploy the Sidecar"
            description="Run the KalGuard sidecar alongside your agent — locally, in Docker, or on Kubernetes. It exposes an HTTP API for security checks."
          />
          <div className={styles.workflowArrow}>→</div>
          <Step
            num={2}
            title="Integrate Your Agent"
            description="Before each LLM call or tool execution, your agent calls KalGuard via the TypeScript SDK or a simple HTTP request."
          />
          <div className={styles.workflowArrow}>→</div>
          <Step
            num={3}
            title="Enforce & Audit"
            description="KalGuard evaluates the request against policy, returns allow/deny with optional sanitization, and writes an immutable audit log."
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Quick Start ─── */

const INSTALL_CODE = `# Install the KalGuard package
pnpm add kalguard

# Generate a token secret
export KALGUARD_TOKEN_SECRET=$(openssl rand -hex 32)

# Start the sidecar
pnpm --filter @kalguard/sidecar start`;

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
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Quick Start</h2>
        <p className={styles.sectionSubtitle}>
          Get KalGuard running in under five minutes.
        </p>
        <div className={styles.codeBlocks}>
          <div className={styles.codeBlock}>
            <h3>1. Install &amp; Run</h3>
            <CodeBlock language="bash">{INSTALL_CODE}</CodeBlock>
          </div>
          <div className={styles.codeBlock}>
            <h3>2. Integrate</h3>
            <CodeBlock language="typescript">{INTEGRATE_CODE}</CodeBlock>
          </div>
        </div>
        <div className={styles.ctaCenter}>
          <Link className="cta-button" to="/docs/quick-start">
            Read the Full Guide →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ─── */

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — AI Agent Runtime Security`}
      description="Enterprise-grade, open-source security platform for AI agents. Zero Trust, fail-closed, framework-agnostic runtime security.">
      <HomepageHeader />
      <main>
        <FeaturesSection />
        <HowItWorksSection />
        <QuickStartSection />
      </main>
    </Layout>
  );
}
