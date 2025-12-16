'use client';

import { useState } from 'react';
import { Server, Edit2, Save, X, Shield, Info, AlertTriangle } from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';

export default function SystemCharacteristicsEditor() {
  const { document, updateField } = useOscalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  if (!document) return null;

  const sysChar = document['system-security-plan']['system-characteristics'];

  const handleEdit = () => {
    setEditForm({
      'system-name': sysChar['system-name'],
      'system-name-short': sysChar['system-name-short'],
      description: sysChar.description,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateField(
      ['system-security-plan', 'system-characteristics', 'system-name'],
      editForm['system-name']
    );
    updateField(
      ['system-security-plan', 'system-characteristics', 'system-name-short'],
      editForm['system-name-short']
    );
    updateField(
      ['system-security-plan', 'system-characteristics', 'description'],
      editForm.description
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  // Extract key properties
  const getProperty = (name: string) => {
    return sysChar.props?.find((p) => p.name === name)?.value || 'N/A';
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Server className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              System Characteristics
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              System identification and security categorization
            </p>
          </div>
        </div>
        <button
          onClick={isEditing ? handleCancel : handleEdit}
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

      {/* System IDs */}
      <div className="enterprise-card p-4 mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          System Identification
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {sysChar['system-ids']?.map((sysId, index) => (
            <div key={index} className="px-3 py-2 bg-[var(--bg-elevated)] rounded-lg">
              <div className="text-xs text-[var(--text-muted)]">
                {sysId['identifier-type'] || 'System ID'}
              </div>
              <div className="text-sm font-mono text-[var(--text-primary)]">
                {sysId.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Name & Description */}
      <div className="enterprise-card p-4 mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          System Information
        </h3>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                System Name
              </label>
              <input
                type="text"
                value={editForm['system-name'] || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, 'system-name': e.target.value })
                }
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Short Name
              </label>
              <input
                type="text"
                value={editForm['system-name-short'] || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, 'system-name-short': e.target.value })
                }
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Description
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={6}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} className="enterprise-btn enterprise-btn-primary">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                System Name
              </label>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {sysChar['system-name'] || 'Unnamed System'}
              </p>
            </div>
            {sysChar['system-name-short'] && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Short Name
                </label>
                <p className="text-[var(--text-primary)] font-mono">
                  {sysChar['system-name-short']}
                </p>
              </div>
            )}
            {sysChar.description && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Description
                </label>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-h-48 overflow-y-auto">
                  {sysChar.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Properties */}
      {sysChar.props && sysChar.props.length > 0 && (
        <div className="enterprise-card p-4 mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Properties
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sysChar.props.slice(0, 12).map((prop, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 bg-[var(--bg-elevated)] rounded-lg"
              >
                <span className="text-xs text-[var(--text-muted)] truncate flex-1">
                  {prop.name.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-xs font-medium ml-2 ${
                  prop.value === 'Yes' ? 'text-green-400' :
                  prop.value === 'No' ? 'text-red-400' :
                  'text-[var(--text-primary)]'
                }`}>
                  {prop.value}
                </span>
              </div>
            ))}
          </div>
          {sysChar.props.length > 12 && (
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              +{sysChar.props.length - 12} more properties
            </p>
          )}
        </div>
      )}

      {/* Security Impact */}
      {sysChar['security-impact-level'] && (
        <div className="enterprise-card p-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Security Impact Level
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[var(--bg-elevated)] rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">Confidentiality</div>
              <div className="text-lg font-bold text-blue-400">
                {sysChar['security-impact-level']['security-objective-confidentiality'] || 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-[var(--bg-elevated)] rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">Integrity</div>
              <div className="text-lg font-bold text-green-400">
                {sysChar['security-impact-level']['security-objective-integrity'] || 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-[var(--bg-elevated)] rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">Availability</div>
              <div className="text-lg font-bold text-orange-400">
                {sysChar['security-impact-level']['security-objective-availability'] || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
