// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Optimal Launchpad',
  tagline: 'Secure Software Delivery Platform',
  favicon: 'img/favicon.ico',

  url: 'https://launchpad.gooptimal.io',
  baseUrl: '/',

  organizationName: 'optimal-platform',
  projectName: 'optimal-platform',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/optimal-platform/optimal-platform/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/optimal-social-card.png',
      navbar: {
        title: 'Optimal Launchpad',
        logo: {
          alt: 'Optimal Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/docs/reference/overview',
            label: 'Reference',
            position: 'left',
          },
          {
            to: '/docs/deployment/overview',
            label: 'Deployment',
            position: 'left',
          },
          {
            to: '/docs/tutorials/overview',
            label: 'Tutorials',
            position: 'left',
          },
          {
            href: 'https://github.com/optimal-platform/optimal-platform',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started/overview',
              },
              {
                label: 'Architecture',
                to: '/docs/getting-started/architecture',
              },
              {
                label: 'Quick Start',
                to: '/docs/getting-started/quickstart',
              },
            ],
          },
          {
            title: 'Reference',
            items: [
              {
                label: 'Configuration',
                to: '/docs/reference/configuration',
              },
              {
                label: 'Security',
                to: '/docs/reference/security/overview',
              },
              {
                label: 'CLI Reference',
                to: '/docs/reference/cli',
              },
            ],
          },
          {
            title: 'Deployment',
            items: [
              {
                label: 'Cloud Deployment',
                to: '/docs/deployment/cloud',
              },
              {
                label: 'Airgap (Outpost)',
                to: '/docs/deployment/outpost',
              },
              {
                label: 'Local Development',
                to: '/docs/deployment/local',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/optimal-platform/optimal-platform',
              },
              {
                label: 'Support',
                href: 'mailto:support@gooptimal.io',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Optimal Platform. Built for secure software delivery.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'yaml', 'json', 'hcl', 'typescript'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
};

export default config;
