'use client';

import { useState } from 'react';
import { Building, Plus, Trash2, Edit2, Save, X, Search, User, Mail } from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import type { Party } from '@/lib/oscal/types';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PartiesEditor() {
  const { document, addParty, updateParty, deleteParty } = useOscalStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Party>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParty, setNewParty] = useState<Partial<Party>>({
    name: '',
    'short-name': '',
    type: 'organization',
    'email-addresses': [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!document) return null;

  const parties = document['system-security-plan'].metadata.parties || [];

  const filteredParties = parties.filter(
    (party) =>
      (party.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party['short-name'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (party: Party) => {
    setEditingId(party.uuid);
    setEditForm({ ...party });
  };

  const handleSave = () => {
    if (editingId) {
      updateParty(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newParty.name || newParty['short-name']) {
      addParty({
        uuid: generateUUID(),
        name: newParty.name,
        'short-name': newParty['short-name'],
        type: newParty.type || 'organization',
        'email-addresses': newParty['email-addresses'],
      });
      setNewParty({
        name: '',
        'short-name': '',
        type: 'organization',
        'email-addresses': [],
      });
      setShowAddForm(false);
    }
  };

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this party?')) {
      deleteParty(uuid);
    }
  };

  const addEmail = (form: 'new' | 'edit') => {
    if (!newEmail) return;

    if (form === 'new') {
      setNewParty({
        ...newParty,
        'email-addresses': [...(newParty['email-addresses'] || []), newEmail],
      });
    } else {
      setEditForm({
        ...editForm,
        'email-addresses': [...(editForm['email-addresses'] || []), newEmail],
      });
    }
    setNewEmail('');
  };

  const removeEmail = (index: number, form: 'new' | 'edit') => {
    if (form === 'new') {
      const emails = [...(newParty['email-addresses'] || [])];
      emails.splice(index, 1);
      setNewParty({ ...newParty, 'email-addresses': emails });
    } else {
      const emails = [...(editForm['email-addresses'] || [])];
      emails.splice(index, 1);
      setEditForm({ ...editForm, 'email-addresses': emails });
    }
  };

  const getPartyType = (type: Party['type']) => {
    if (type === 'person' || type === 1) return 'Person';
    return 'Organization';
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Building className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Responsible Parties
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {parties.length} parties defined
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="enterprise-btn enterprise-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Party
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search parties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="enterprise-card p-4 mb-4 border-2 border-dashed border-purple-500">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Add New Party
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newParty.name || ''}
                  onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  value={newParty['short-name'] || ''}
                  onChange={(e) =>
                    setNewParty({ ...newParty, 'short-name': e.target.value })
                  }
                  placeholder="Abbreviation"
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Type
              </label>
              <select
                value={newParty.type as string}
                onChange={(e) =>
                  setNewParty({
                    ...newParty,
                    type: e.target.value as 'organization' | 'person',
                  })
                }
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="organization">Organization</option>
                <option value="person">Person</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Email Addresses
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Add email..."
                  className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => addEmail('new')}
                  className="enterprise-btn enterprise-btn-secondary"
                >
                  Add
                </button>
              </div>
              {newParty['email-addresses']?.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-elevated)] rounded mb-1"
                >
                  <span className="text-sm text-[var(--text-primary)]">{email}</span>
                  <button
                    onClick={() => removeEmail(index, 'new')}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewParty({
                  name: '',
                  'short-name': '',
                  type: 'organization',
                  'email-addresses': [],
                });
              }}
              className="enterprise-btn enterprise-btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleAdd} className="enterprise-btn enterprise-btn-primary">
              Add Party
            </button>
          </div>
        </div>
      )}

      {/* Parties List */}
      <div className="space-y-2">
        {filteredParties.length === 0 ? (
          <div className="enterprise-card p-8 text-center">
            <Building className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">
              {searchTerm ? 'No parties match your search' : 'No parties defined yet'}
            </p>
          </div>
        ) : (
          filteredParties.map((party) => (
            <div
              key={party.uuid}
              className="enterprise-card p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              {editingId === party.uuid ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={editForm['short-name'] || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, 'short-name': e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      {party.type === 'person' || party.type === 1 ? (
                        <User className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Building className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {party.name || party['short-name'] || 'Unnamed Party'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                          {getPartyType(party.type)}
                        </span>
                        {party['short-name'] && party.name && (
                          <span className="text-xs text-[var(--text-muted)]">
                            ({party['short-name']})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {party['email-addresses']?.length ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-elevated)] rounded text-xs text-[var(--text-muted)]">
                        <Mail className="w-3 h-3" />
                        {party['email-addresses'].length}
                      </div>
                    ) : null}
                    <button
                      onClick={() => handleEdit(party)}
                      className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(party.uuid)}
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
