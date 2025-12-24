/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/overview',
        'getting-started/prerequisites',
        'getting-started/quickstart',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: [
        'reference/overview',
        {
          type: 'category',
          label: 'Security',
          items: [
            'reference/security/overview',
            'reference/security/kyverno-policies',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      collapsed: false,
      items: [
        'deployment/overview',
        {
          type: 'category',
          label: 'Airgap (Outpost)',
          items: [
            'deployment/outpost/overview',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: true,
      items: [
        'tutorials/overview',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      collapsed: true,
      items: [
        'troubleshooting/common-issues',
      ],
    },
  ],
};

export default sidebars;
