'use client';

import { useOscalStore } from '@/lib/oscal/store';
import {
  Shield,
  FileText,
  Users,
  MapPin,
  Building,
  Server,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Tag,
} from 'lucide-react';

export default function OscalPreview() {
  const { document } = useOscalStore();

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
        No document to preview
      </div>
    );
  }

  const ssp = document['system-security-plan'];
  const metadata = ssp.metadata;
  const sysChar = ssp['system-characteristics'];
  const controls = ssp['control-implementation']['implemented-requirements'] || [];

  // Calculate control stats
  const controlStats = {
    total: controls.length,
    implemented: controls.filter(
      (c) => c.props?.find((p) => p.name === 'Implementation-Status')?.value === 'Implemented'
    ).length,
    partial: controls.filter(
      (c) =>
        c.props?.find((p) => p.name === 'Implementation-Status')?.value === 'Partially Implemented'
    ).length,
    planned: controls.filter(
      (c) => c.props?.find((p) => p.name === 'Implementation-Status')?.value === 'Planned'
    ).length,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="enterprise-card-glass p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-[var(--accent-cyan)]" />
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  System Security Plan
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {metadata.title}
              </h1>
              <p className="text-[var(--text-secondary)] max-w-2xl">
                {sysChar.description?.slice(0, 200)}
                {sysChar.description && sysChar.description.length > 200 ? '...' : ''}
              </p>
            </div>
            {metadata.props?.find((p) => p.name === 'marking') && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">
                {metadata.props.find((p) => p.name === 'marking')?.value}
              </span>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-4 gap-6 mt-8 pt-6 border-t border-[var(--border-default)]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <Tag className="w-3.5 h-3.5" />
                Version
              </div>
              <p className="font-mono text-[var(--text-primary)]">{metadata.version}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <Shield className="w-3.5 h-3.5" />
                OSCAL Version
              </div>
              <p className="font-mono text-[var(--text-primary)]">{metadata['oscal-version']}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Last Modified
              </div>
              <p className="text-[var(--text-primary)]">{formatDate(metadata['last-modified'])}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <Server className="w-3.5 h-3.5" />
                System ID
              </div>
              <p className="font-mono text-[var(--text-primary)]">
                {sysChar['system-ids']?.[0]?.id || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Control Implementation Summary */}
        <div className="enterprise-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent-cyan)]" />
            Control Implementation Summary
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-[var(--bg-elevated)] rounded-lg">
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {controlStats.total}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Total Controls</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-400">{controlStats.implemented}</p>
              <p className="text-xs text-[var(--text-muted)]">Implemented</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-3xl font-bold text-yellow-400">{controlStats.partial}</p>
              <p className="text-xs text-[var(--text-muted)]">Partial</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <p className="text-3xl font-bold text-blue-400">{controlStats.planned}</p>
              <p className="text-xs text-[var(--text-muted)]">Planned</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Implementation Progress</span>
              <span className="text-[var(--text-primary)] font-medium">
                {controlStats.total > 0
                  ? Math.round((controlStats.implemented / controlStats.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all"
                style={{
                  width: `${(controlStats.implemented / controlStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{
                  width: `${(controlStats.partial / controlStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{
                  width: `${(controlStats.planned / controlStats.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metadata Summary */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Roles */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-blue)]" />
              Roles ({metadata.roles?.length || 0})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metadata.roles?.slice(0, 10).map((role) => (
                <div
                  key={role.id}
                  className="px-3 py-2 bg-[var(--bg-elevated)] rounded text-sm"
                >
                  <p className="text-[var(--text-primary)]">{role.title}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{role.id}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              Locations ({metadata.locations?.length || 0})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metadata.locations?.slice(0, 10).map((loc) => (
                <div
                  key={loc.uuid}
                  className="px-3 py-2 bg-[var(--bg-elevated)] rounded text-sm"
                >
                  <p className="text-[var(--text-primary)]">{loc.title || 'Unnamed'}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {[loc.address?.city, loc.address?.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parties */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400" />
              Parties ({metadata.parties?.length || 0})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metadata.parties?.slice(0, 10).map((party) => (
                <div
                  key={party.uuid}
                  className="px-3 py-2 bg-[var(--bg-elevated)] rounded text-sm"
                >
                  <p className="text-[var(--text-primary)]">
                    {party.name || party['short-name'] || 'Unnamed'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {party.type === 'person' || party.type === 1 ? 'Person' : 'Organization'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-muted)] py-4">
          <p>OSCAL System Security Plan • Generated from OSCAL 1.1.3 Format</p>
        </div>
      </div>
    </div>
  );
}
