'use client';

import { useState } from 'react';
import { FileText, Calendar, Tag, Clock, Shield, Edit2, Save, X } from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';

export default function MetadataEditor() {
  const { document, updateMetadataField, isDirty } = useOscalStore();
  const [isEditing, setIsEditing] = useState(false);

  if (!document) return null;

  const metadata = document['system-security-plan'].metadata;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleTitleChange = (value: string) => {
    updateMetadataField('title', value);
  };

  const handleVersionChange = (value: string) => {
    updateMetadataField('version', value);
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Document Metadata
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Basic information about this System Security Plan
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`enterprise-btn ${isEditing ? 'enterprise-btn-secondary' : 'enterprise-btn-primary'}`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Title */}
        <div className="enterprise-card p-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Document Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent"
            />
          ) : (
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {metadata.title || 'Untitled'}
            </p>
          )}
        </div>

        {/* Version & OSCAL Version */}
        <div className="grid grid-cols-2 gap-4">
          <div className="enterprise-card p-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Version
            </label>
            {isEditing ? (
              <input
                type="text"
                value={metadata.version}
                onChange={(e) => handleVersionChange(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-transparent"
              />
            ) : (
              <p className="text-[var(--text-primary)] font-mono">
                {metadata.version || 'N/A'}
              </p>
            )}
          </div>

          <div className="enterprise-card p-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              OSCAL Version
            </label>
            <p className="text-[var(--text-primary)] font-mono">
              {metadata['oscal-version'] || 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Modified */}
        <div className="enterprise-card p-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Last Modified
          </label>
          <p className="text-[var(--text-primary)]">
            {formatDate(metadata['last-modified'])}
          </p>
        </div>

        {/* Classification */}
        {metadata.props && metadata.props.length > 0 && (
          <div className="enterprise-card p-4">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              Properties
            </label>
            <div className="space-y-2">
              {metadata.props.map((prop, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] rounded-lg"
                >
                  <span className="text-sm text-[var(--text-muted)] font-mono">
                    {prop.name}
                  </span>
                  <span className={`text-sm font-medium ${
                    prop.name === 'marking'
                      ? 'px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded'
                      : 'text-[var(--text-primary)]'
                  }`}>
                    {prop.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--accent-cyan)]">
              {metadata.roles?.length || 0}
            </p>
            <p className="text-sm text-[var(--text-muted)]">Roles</p>
          </div>
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--accent-blue)]">
              {metadata.locations?.length || 0}
            </p>
            <p className="text-sm text-[var(--text-muted)]">Locations</p>
          </div>
          <div className="enterprise-card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--accent-indigo)]">
              {metadata.parties?.length || 0}
            </p>
            <p className="text-sm text-[var(--text-muted)]">Parties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
