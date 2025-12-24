import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '91c'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '8a2'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'de1'),
            routes: [
              {
                path: '/docs/deployment/outpost/overview',
                component: ComponentCreator('/docs/deployment/outpost/overview', '402'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/deployment/overview',
                component: ComponentCreator('/docs/deployment/overview', 'fa3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/architecture',
                component: ComponentCreator('/docs/getting-started/architecture', '95f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/overview',
                component: ComponentCreator('/docs/getting-started/overview', '557'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/prerequisites',
                component: ComponentCreator('/docs/getting-started/prerequisites', '3e2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/quickstart',
                component: ComponentCreator('/docs/getting-started/quickstart', '165'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/reference/overview',
                component: ComponentCreator('/docs/reference/overview', '4e3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/reference/security/kyverno-policies',
                component: ComponentCreator('/docs/reference/security/kyverno-policies', '1de'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/reference/security/overview',
                component: ComponentCreator('/docs/reference/security/overview', '923'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/troubleshooting/common-issues',
                component: ComponentCreator('/docs/troubleshooting/common-issues', 'b09'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/tutorials/overview',
                component: ComponentCreator('/docs/tutorials/overview', '957'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
