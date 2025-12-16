'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Save, X, User, Search } from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import type { Role } from '@/lib/oscal/types';

export default function RolesEditor() {
  const { document, addRole, updateRole, deleteRole } = useOscalStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Role>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRole, setNewRole] = useState<Partial<Role>>({ id: '', title: '' });
  const [searchTerm, setSearchTerm] = useState('');

  if (!document) return null;

  const roles = document['system-security-plan'].metadata.roles || [];

  const filteredRoles = roles.filter(
    (role) =>
      role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (role: Role) => {
    setEditingId(role.id);
    setEditForm({ ...role });
  };

  const handleSave = () => {
    if (editingId && editForm.title) {
      updateRole(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newRole.id && newRole.title) {
      addRole({
        id: newRole.id.toLowerCase().replace(/\s+/g, '-'),
        title: newRole.title,
        description: newRole.description,
      });
      setNewRole({ id: '', title: '' });
      setShowAddForm(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      deleteRole(id);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue)]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              System Roles
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {roles.length} roles defined
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="enterprise-btn enterprise-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="enterprise-card p-4 mb-4 border-2 border-dashed border-[var(--accent-cyan)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Add New Role
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Role ID *
              </label>
              <input
                type="text"
                value={newRole.id}
                onChange={(e) => setNewRole({ ...newRole, id: e.target.value })}
                placeholder="e.g., security-admin"
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newRole.title}
                onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                placeholder="e.g., Security Administrator"
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Description
            </label>
            <textarea
              value={newRole.description || ''}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewRole({ id: '', title: '' });
              }}
              className="enterprise-btn enterprise-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newRole.id || !newRole.title}
              className="enterprise-btn enterprise-btn-primary disabled:opacity-50"
            >
              Add Role
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-2">
        {filteredRoles.length === 0 ? (
          <div className="enterprise-card p-8 text-center">
            <User className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">
              {searchTerm ? 'No roles match your search' : 'No roles defined yet'}
            </p>
          </div>
        ) : (
          filteredRoles.map((role) => (
            <div
              key={role.id}
              className="enterprise-card p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              {editingId === role.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Role ID
                      </label>
                      <input
                        type="text"
                        value={editForm.id || ''}
                        disabled
                        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-muted)] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
                      />
                    </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                      <User className="w-4 h-4 text-[var(--accent-blue)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {role.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {role.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
