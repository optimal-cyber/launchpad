'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import type { ImplementedRequirement } from '@/lib/oscal/types';

const STATUS_OPTIONS = [
  { value: 'Implemented', label: 'Implemented', color: 'text-green-400', bg: 'bg-green-500/20' },
  { value: 'Partially Implemented', label: 'Partially Implemented', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { value: 'Planned', label: 'Planned', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { value: 'Alternative', label: 'Alternative Implementation', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { value: 'Not Applicable', label: 'Not Applicable', color: 'text-gray-400', bg: 'bg-gray-500/20' },
];

function getStatusIcon(status?: string) {
  switch (status) {
    case 'Implemented':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'Partially Implemented':
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'Planned':
      return <Clock className="w-4 h-4 text-blue-400" />;
    case 'Not Applicable':
      return <XCircle className="w-4 h-4 text-gray-400" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  }
}

function getStatusStyle(status?: string) {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  return option || { color: 'text-gray-400', bg: 'bg-gray-500/20' };
}

export default function ControlImplementationEditor() {
  const { document, updateControl, selectedPath } = useOscalStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ImplementedRequirement>>({});
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  // Extract controls - must be before any hooks that depend on it
  const controls = useMemo(() => {
    if (!document) return [];
    return document['system-security-plan']['control-implementation']['implemented-requirements'] || [];
  }, [document]);

  // Filter and search controls
  const filteredControls = useMemo(() => {
    return controls.filter((ctrl) => {
      const matchesSearch =
        searchTerm === '' ||
        ctrl['control-id'].toLowerCase().includes(searchTerm.toLowerCase());

      const status = ctrl.props?.find((p) => p.name === 'Implementation-Status')?.value;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [controls, searchTerm, statusFilter]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: controls.length };
    controls.forEach((ctrl) => {
      const status = ctrl.props?.find((p) => p.name === 'Implementation-Status')?.value || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [controls]);

  // Get selected control from path
  const selectedControlId = selectedPath[selectedPath.length - 1];
  const selectedControl = controls.find((c) => c.uuid === selectedControlId);

  if (!document) return null;

  const handleEdit = (control: ImplementedRequirement) => {
    setEditingId(control.uuid);
    setEditForm({ ...control });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      updateControl(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const toggleExpand = (uuid: string) => {
    const newExpanded = new Set(expandedControls);
    if (newExpanded.has(uuid)) {
      newExpanded.delete(uuid);
    } else {
      newExpanded.add(uuid);
    }
    setExpandedControls(newExpanded);
  };

  const updateStatus = (controlId: string, newStatus: string) => {
    const control = controls.find((c) => c.uuid === controlId);
    if (!control) return;

    const props = [...(control.props || [])];
    const statusIndex = props.findIndex((p) => p.name === 'Implementation-Status');

    if (statusIndex >= 0) {
      props[statusIndex] = { ...props[statusIndex], value: newStatus };
    } else {
      props.push({
        name: 'Implementation-Status',
        ns: 'https://emass.apps.mil/ns/oscal',
        value: newStatus,
      });
    }

    updateControl(controlId, { props });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Control Implementation
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {controls.length} controls implemented
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() =>
              setStatusFilter(statusFilter === status.value ? 'all' : status.value)
            }
            className={`p-2 rounded-lg border transition-colors ${
              statusFilter === status.value
                ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
            }`}
          >
            <div className={`text-lg font-bold ${status.color}`}>
              {statusCounts[status.value] || 0}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">{status.label}</div>
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search controls (e.g., AC-1, AU-2)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
          />
        </div>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="enterprise-btn enterprise-btn-secondary"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </button>
        )}
      </div>

      {/* Controls List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredControls.length === 0 ? (
          <div className="enterprise-card p-8 text-center">
            <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">
              {searchTerm || statusFilter !== 'all'
                ? 'No controls match your search'
                : 'No controls implemented'}
            </p>
          </div>
        ) : (
          filteredControls.map((control) => {
            const status = control.props?.find((p) => p.name === 'Implementation-Status')?.value;
            const statusStyle = getStatusStyle(status);
            const isExpanded = expandedControls.has(control.uuid);
            const designation = control.props?.find((p) => p.name === 'Designation')?.value;

            return (
              <div
                key={control.uuid}
                className={`enterprise-card overflow-hidden transition-colors ${
                  selectedControl?.uuid === control.uuid
                    ? 'border-[var(--accent-cyan)]'
                    : ''
                }`}
              >
                {/* Control Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)]"
                  onClick={() => toggleExpand(control.uuid)}
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                    {getStatusIcon(status)}
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      {control['control-id'].toUpperCase()}
                    </span>
                    {designation && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded">
                        {designation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${statusStyle.bg} ${statusStyle.color}`}>
                      {status || 'Unknown'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(control);
                      }}
                      className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[var(--border-default)]">
                    {editingId === control.uuid ? (
                      // Edit Mode
                      <div className="pt-4 space-y-4">
                        <div>
                          <label className="block text-xs text-[var(--text-muted)] mb-2">
                            Implementation Status
                          </label>
                          <select
                            value={
                              editForm.props?.find((p) => p.name === 'Implementation-Status')
                                ?.value || status
                            }
                            onChange={(e) => {
                              const props = [...(editForm.props || control.props || [])];
                              const idx = props.findIndex(
                                (p) => p.name === 'Implementation-Status'
                              );
                              if (idx >= 0) {
                                props[idx] = { ...props[idx], value: e.target.value };
                              }
                              setEditForm({ ...editForm, props });
                            }}
                            className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--text-muted)] mb-2">
                            Remarks
                          </label>
                          <textarea
                            value={editForm.remarks || control.remarks || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, remarks: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] resize-none"
                            placeholder="Add implementation notes..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleCancel}
                            className="enterprise-btn enterprise-btn-secondary"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            className="enterprise-btn enterprise-btn-primary"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="pt-4">
                        {/* Properties */}
                        {control.props && control.props.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase">
                              Properties
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {control.props
                                .filter((p) => p.name !== 'Implementation-Status')
                                .slice(0, 6)
                                .map((prop, idx) => (
                                  <div
                                    key={idx}
                                    className="px-3 py-2 bg-[var(--bg-elevated)] rounded-lg"
                                  >
                                    <div className="text-xs text-[var(--text-muted)]">
                                      {prop.name.replace(/-/g, ' ')}
                                    </div>
                                    <div className="text-sm text-[var(--text-primary)]">
                                      {prop.value}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Status Change */}
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase">
                            Quick Status Update
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(control.uuid, opt.value)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  status === opt.value
                                    ? `${opt.bg} ${opt.color} border-transparent`
                                    : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
