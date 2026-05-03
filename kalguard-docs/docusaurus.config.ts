import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'KalGuard',
  tagline: 'Enterprise-grade AI Agent Runtime Security Platform',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://infrarix.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/kalguard/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'infrarix', // Usually your GitHub org/user name.
  projectName: 'kalguard', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/infrarix/kalguard/tree/main/kalguard-docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/infrarix/kalguard/tree/main/kalguard-docs/',
          onInlineTags: 'ignore',
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/kalguard-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'KalGuard',
      logo: {
        alt: 'KalGuard Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          to: '/docs/cloud',
          label: 'Cloud',
          position: 'left',
        },
        {
          href: 'https://github.com/infrarix/kalguard',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/introduction',
            },
            {
              label: 'Quick Setup',
              to: '/docs/quick-start',
            },
            {
              label: 'Integration Guide',
              to: '/docs/integration/overview',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Architecture',
              to: '/docs/concepts/architecture',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
            {
              label: 'Deployment',
              to: '/docs/deployment/overview',
            },
            {
              label: 'Cloud & Pricing',
              to: '/docs/cloud',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/infrarix/kalguard',
            },
            {
              label: 'Issues',
              href: 'https://github.com/infrarix/kalguard/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/infrarix/kalguard/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Changelog',
              href: 'https://github.com/infrarix/kalguard/releases',
            },
            {
              label: 'License',
              href: 'https://github.com/infrarix/kalguard/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `
        <div style="margin-top: 1rem;">
          <img src="https://avatars.githubusercontent.com/u/281149417?s=96&v=4" width="28" style="vertical-align: middle; margin-right: 8px;" />
          <strong>by Infrarix</strong> | Part of the <strong>Infrarix AI Infrastructure ecosystem</strong>
        </div>
        <div style="margin-top: 0.5rem;">
          Copyright © ${new Date().getFullYear()} Infrarix. Licensed under Apache-2.0.
        </div>
      `,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'javascript', 'json', 'yaml', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
