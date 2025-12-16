'use client';

import { LucideIcon, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';

export type IntegrationCategory = 'development' | 'security' | 'cloud' | 'monitoring' | 'collaboration';
export type ConnectionStatus = 'connected' | 'disconnected' | 'configuring' | 'not_configured';

export interface Integration {
  id: string;
  name: string;
  icon: LucideIcon;
  category: IntegrationCategory;
  description: string;
  launchUrl: string;
  configPath: string;
  isExternal: boolean;
  status: ConnectionStatus;
}

interface IntegrationCardProps {
  integration: Integration;
  showLaunchButton?: boolean;
  showConfigButton?: boolean;
  variant?: 'default' | 'compact';
}

const categoryLabels: Record<IntegrationCategory, string> = {
  development: 'Development',
  security: 'Security',
  cloud: 'Cloud',
  monitoring: 'Monitoring',
  collaboration: 'Collaboration',
};

const statusLabels: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  configuring: 'Configuring',
  not_configured: 'Not Configured',
};

export default function IntegrationCard({
  integration,
  showLaunchButton = true,
  showConfigButton = true,
  variant = 'default',
}: IntegrationCardProps) {
  const Icon = integration.icon;

  const handleLaunch = () => {
    if (integration.isExternal) {
      window.open(integration.launchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="integration-card">
      {/* Icon */}
      <div className="card-icon">
        <Icon className="w-6 h-6" />
      </div>

      {/* Category Badge */}
      <span className={`card-category ${integration.category}`}>
        {categoryLabels[integration.category]}
      </span>

      {/* Title */}
      <h3 className="card-title">{integration.name}</h3>

      {/* Description */}
      {variant === 'default' && (
        <p className="card-description line-clamp-2">
          {integration.description}
        </p>
      )}

      {/* Status Indicator */}
      <div className={`connection-status ${integration.status.replace('_', '-')}`}>
        <span className="status-dot rounded-full" />
        <span>{statusLabels[integration.status]}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto pt-2">
        {showLaunchButton && (
          integration.isExternal ? (
            <button
              onClick={handleLaunch}
              className="launch-btn flex-1"
              disabled={integration.status === 'not_configured'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Launch
            </button>
          ) : (
            <Link href={integration.launchUrl} className="launch-btn flex-1 text-center">
              Launch
            </Link>
          )
        )}
        {showConfigButton && (
          <Link
            href={integration.configPath}
            className="enterprise-btn enterprise-btn-secondary flex-1 text-center"
          >
            <Settings className="w-3.5 h-3.5" />
            Configure
          </Link>
        )}
      </div>
    </div>
  );
}
