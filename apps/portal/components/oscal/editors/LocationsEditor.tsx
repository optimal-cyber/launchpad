'use client';

import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, Save, X, Search, Building2 } from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import type { Location, Address } from '@/lib/oscal/types';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function LocationsEditor() {
  const { document, addLocation, updateLocation, deleteLocation } = useOscalStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Location>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    title: '',
    address: { city: '', state: '', 'postal-code': '', country: '' },
  });
  const [searchTerm, setSearchTerm] = useState('');

  if (!document) return null;

  const locations = document['system-security-plan'].metadata.locations || [];

  const filteredLocations = locations.filter(
    (loc) =>
      (loc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.address?.state || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (location: Location) => {
    setEditingId(location.uuid);
    setEditForm({ ...location });
  };

  const handleSave = () => {
    if (editingId) {
      updateLocation(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newLocation.title || newLocation.address?.city) {
      addLocation({
        uuid: generateUUID(),
        title: newLocation.title || newLocation.address?.city || 'New Location',
        address: newLocation.address as Address,
      });
      setNewLocation({
        title: '',
        address: { city: '', state: '', 'postal-code': '', country: '' },
      });
      setShowAddForm(false);
    }
  };

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      deleteLocation(uuid);
    }
  };

  const formatAddress = (address?: Address) => {
    if (!address) return 'No address';
    const parts = [
      address.city,
      address.state,
      address['postal-code'],
      address.country,
    ].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              System Locations
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {locations.length} locations defined
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="enterprise-btn enterprise-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="enterprise-card p-4 mb-4 border-2 border-dashed border-green-500">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Add New Location
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Location Name
              </label>
              <input
                type="text"
                value={newLocation.title || ''}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, title: e.target.value })
                }
                placeholder="e.g., Primary Data Center"
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newLocation.address?.city || ''}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, city: e.target.value } as Address,
                    })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={newLocation.address?.state || ''}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, state: e.target.value } as Address,
                    })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={newLocation.address?.['postal-code'] || ''}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      address: {
                        ...newLocation.address,
                        'postal-code': e.target.value,
                      } as Address,
                    })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={newLocation.address?.country || ''}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      address: { ...newLocation.address, country: e.target.value } as Address,
                    })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewLocation({
                  title: '',
                  address: { city: '', state: '', 'postal-code': '', country: '' },
                });
              }}
              className="enterprise-btn enterprise-btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleAdd} className="enterprise-btn enterprise-btn-primary">
              Add Location
            </button>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="space-y-2">
        {filteredLocations.length === 0 ? (
          <div className="enterprise-card p-8 text-center">
            <Building2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">
              {searchTerm ? 'No locations match your search' : 'No locations defined yet'}
            </p>
          </div>
        ) : (
          filteredLocations.map((location) => (
            <div
              key={location.uuid}
              className="enterprise-card p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              {editingId === location.uuid ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.city || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, city: e.target.value } as Address,
                          })
                        }
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.state || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: { ...editForm.address, state: e.target.value } as Address,
                          })
                        }
                        className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      <MapPin className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {location.title || 'Unnamed Location'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatAddress(location.address)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.uuid)}
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
