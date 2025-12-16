'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import debounce from 'lodash.debounce';
import type {
  OscalSSPDocument,
  SystemSecurityPlan,
  TreeNode,
  TreeNodeType,
  ValidationError,
  SaveStatus,
  Role,
  Location,
  Party,
  ImplementedRequirement,
} from './types';

// ============================================================================
// Store Types
// ============================================================================

interface OscalEditorState {
  // Document state
  document: OscalSSPDocument | null;
  originalDocument: OscalSSPDocument | null;
  documentId: string | null;

  // Navigation state
  selectedPath: string[];
  expandedNodes: Set<string>;

  // Editor state
  activeTab: 'form' | 'json' | 'preview';
  isDirty: boolean;

  // Validation
  validationErrors: ValidationError[];

  // Save status
  saveStatus: SaveStatus;

  // Undo/Redo
  undoStack: OscalSSPDocument[];
  redoStack: OscalSSPDocument[];
  maxUndoStackSize: number;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
}

interface OscalEditorActions {
  // Document operations
  loadDocument: (id?: string) => Promise<void>;
  loadFromJson: (json: OscalSSPDocument) => void;
  saveDocument: () => Promise<void>;
  createNewDocument: (title: string) => void;
  discardChanges: () => void;

  // Field updates
  updateField: <T>(path: string[], value: T) => void;
  updateMetadataField: <K extends keyof SystemSecurityPlan['metadata']>(
    field: K,
    value: SystemSecurityPlan['metadata'][K]
  ) => void;

  // Array operations
  addRole: (role: Role) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  addLocation: (location: Location) => void;
  updateLocation: (uuid: string, updates: Partial<Location>) => void;
  deleteLocation: (uuid: string) => void;

  addParty: (party: Party) => void;
  updateParty: (uuid: string, updates: Partial<Party>) => void;
  deleteParty: (uuid: string) => void;

  updateControl: (uuid: string, updates: Partial<ImplementedRequirement>) => void;

  // Navigation
  setSelectedPath: (path: string[]) => void;
  toggleNodeExpanded: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Editor
  setActiveTab: (tab: 'form' | 'json' | 'preview') => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushToUndoStack: () => void;

  // Validation
  validate: () => ValidationError[];
  clearValidationErrors: () => void;

  // Utility
  getSSP: () => SystemSecurityPlan | null;
  buildTreeNodes: () => TreeNode[];
}

type OscalEditorStore = OscalEditorState & OscalEditorActions;

// ============================================================================
// Helper Functions
// ============================================================================

const setNestedValue = (obj: any, path: string[], value: any): void => {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (current[path[i]] === undefined) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
};

const getNestedValue = (obj: any, path: string[]): any => {
  let current = obj;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useOscalStore = create<OscalEditorStore>()(
  immer((set, get) => ({
    // Initial state
    document: null,
    originalDocument: null,
    documentId: null,
    selectedPath: ['metadata'],
    expandedNodes: new Set(['root', 'metadata', 'control-implementation']),
    activeTab: 'form',
    isDirty: false,
    validationErrors: [],
    saveStatus: { status: 'saved' },
    undoStack: [],
    redoStack: [],
    maxUndoStackSize: 50,
    isLoading: false,
    isSaving: false,

    // Document operations
    loadDocument: async (id?: string) => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        let data: OscalSSPDocument;

        if (id) {
          // Load from API
          const response = await fetch(`/api/oscal/ssp/${id}`);
          if (!response.ok) throw new Error('Failed to load document');
          const result = await response.json();
          data = result.document;
        } else {
          // Load from public file (default)
          const response = await fetch('/eMASS_OSCAL_SSP.json');
          if (!response.ok) throw new Error('Failed to load OSCAL file');
          data = await response.json();
        }

        set((state) => {
          state.document = data;
          state.originalDocument = JSON.parse(JSON.stringify(data));
          state.documentId = id || 'default';
          state.isDirty = false;
          state.isLoading = false;
          state.undoStack = [];
          state.redoStack = [];
          state.saveStatus = { status: 'saved', lastSaved: new Date() };
        });
      } catch (error) {
        console.error('Error loading document:', error);
        set((state) => {
          state.isLoading = false;
          state.saveStatus = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to load'
          };
        });
      }
    },

    loadFromJson: (json: OscalSSPDocument) => {
      set((state) => {
        state.document = json;
        state.originalDocument = JSON.parse(JSON.stringify(json));
        state.isDirty = false;
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    saveDocument: async () => {
      const { document, documentId } = get();
      if (!document) return;

      set((state) => {
        state.isSaving = true;
        state.saveStatus = { status: 'saving' };
      });

      try {
        // Update last-modified timestamp
        const updatedDoc = JSON.parse(JSON.stringify(document));
        updatedDoc['system-security-plan'].metadata['last-modified'] = new Date().toISOString();

        if (documentId && documentId !== 'default') {
          // Save to API
          const response = await fetch(`/api/oscal/ssp/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: updatedDoc }),
          });

          if (!response.ok) throw new Error('Failed to save document');
        }

        // Also save to localStorage as backup
        localStorage.setItem('oscal_ssp_draft', JSON.stringify(updatedDoc));

        set((state) => {
          state.document = updatedDoc;
          state.originalDocument = JSON.parse(JSON.stringify(updatedDoc));
          state.isDirty = false;
          state.isSaving = false;
          state.saveStatus = { status: 'saved', lastSaved: new Date() };
        });
      } catch (error) {
        console.error('Error saving document:', error);
        set((state) => {
          state.isSaving = false;
          state.saveStatus = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to save'
          };
        });
      }
    },

    createNewDocument: (title: string) => {
      const newDoc: OscalSSPDocument = {
        'system-security-plan': {
          uuid: generateUUID(),
          metadata: {
            title,
            'last-modified': new Date().toISOString(),
            version: '1.0.0',
            'oscal-version': '1.1.3',
            roles: [],
            locations: [],
            parties: [],
          },
          'system-characteristics': {
            'system-ids': [{ id: generateUUID() }],
            'system-name': title,
            description: '',
          },
          'control-implementation': {
            description: '',
            'implemented-requirements': [],
          },
        },
      };

      set((state) => {
        state.document = newDoc;
        state.originalDocument = JSON.parse(JSON.stringify(newDoc));
        state.documentId = null;
        state.isDirty = false;
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    discardChanges: () => {
      const { originalDocument } = get();
      if (originalDocument) {
        set((state) => {
          state.document = JSON.parse(JSON.stringify(originalDocument));
          state.isDirty = false;
          state.undoStack = [];
          state.redoStack = [];
          state.saveStatus = { status: 'saved' };
        });
      }
    },

    // Field updates
    updateField: <T>(path: string[], value: T) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        setNestedValue(state.document, path, value);
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    updateMetadataField: (field, value) => {
      get().updateField(['system-security-plan', 'metadata', field], value);
    },

    // Role operations
    addRole: (role: Role) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const roles = state.document['system-security-plan'].metadata.roles || [];
        roles.push(role);
        state.document['system-security-plan'].metadata.roles = roles;
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    updateRole: (id: string, updates: Partial<Role>) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const roles = state.document['system-security-plan'].metadata.roles || [];
        const index = roles.findIndex((r) => r.id === id);
        if (index !== -1) {
          roles[index] = { ...roles[index], ...updates };
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
          state.redoStack = [];
        }
      });
    },

    deleteRole: (id: string) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const roles = state.document['system-security-plan'].metadata.roles || [];
        state.document['system-security-plan'].metadata.roles = roles.filter((r) => r.id !== id);
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    // Location operations
    addLocation: (location: Location) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const locations = state.document['system-security-plan'].metadata.locations || [];
        locations.push(location);
        state.document['system-security-plan'].metadata.locations = locations;
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    updateLocation: (uuid: string, updates: Partial<Location>) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const locations = state.document['system-security-plan'].metadata.locations || [];
        const index = locations.findIndex((l) => l.uuid === uuid);
        if (index !== -1) {
          locations[index] = { ...locations[index], ...updates };
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
          state.redoStack = [];
        }
      });
    },

    deleteLocation: (uuid: string) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const locations = state.document['system-security-plan'].metadata.locations || [];
        state.document['system-security-plan'].metadata.locations = locations.filter((l) => l.uuid !== uuid);
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    // Party operations
    addParty: (party: Party) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const parties = state.document['system-security-plan'].metadata.parties || [];
        parties.push(party);
        state.document['system-security-plan'].metadata.parties = parties;
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    updateParty: (uuid: string, updates: Partial<Party>) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const parties = state.document['system-security-plan'].metadata.parties || [];
        const index = parties.findIndex((p) => p.uuid === uuid);
        if (index !== -1) {
          parties[index] = { ...parties[index], ...updates };
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
          state.redoStack = [];
        }
      });
    },

    deleteParty: (uuid: string) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const parties = state.document['system-security-plan'].metadata.parties || [];
        state.document['system-security-plan'].metadata.parties = parties.filter((p) => p.uuid !== uuid);
        state.isDirty = true;
        state.saveStatus = { status: 'modified' };
        state.redoStack = [];
      });
    },

    // Control operations
    updateControl: (uuid: string, updates: Partial<ImplementedRequirement>) => {
      get().pushToUndoStack();

      set((state) => {
        if (!state.document) return;
        const controls = state.document['system-security-plan']['control-implementation']['implemented-requirements'] || [];
        const index = controls.findIndex((c) => c.uuid === uuid);
        if (index !== -1) {
          controls[index] = { ...controls[index], ...updates };
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
          state.redoStack = [];
        }
      });
    },

    // Navigation
    setSelectedPath: (path: string[]) => {
      set((state) => {
        state.selectedPath = path;
      });
    },

    toggleNodeExpanded: (nodeId: string) => {
      set((state) => {
        if (state.expandedNodes.has(nodeId)) {
          state.expandedNodes.delete(nodeId);
        } else {
          state.expandedNodes.add(nodeId);
        }
      });
    },

    expandAll: () => {
      const nodes = get().buildTreeNodes();
      const allIds = new Set<string>();

      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(nodes);

      set((state) => {
        state.expandedNodes = allIds;
      });
    },

    collapseAll: () => {
      set((state) => {
        state.expandedNodes = new Set(['root']);
      });
    },

    // Editor
    setActiveTab: (tab) => {
      set((state) => {
        state.activeTab = tab;
      });
    },

    // Undo/Redo
    pushToUndoStack: () => {
      const { document, undoStack, maxUndoStackSize } = get();
      if (!document) return;

      set((state) => {
        const snapshot = JSON.parse(JSON.stringify(document));
        state.undoStack.push(snapshot);

        // Limit stack size
        if (state.undoStack.length > maxUndoStackSize) {
          state.undoStack.shift();
        }
      });
    },

    undo: () => {
      const { undoStack, document } = get();
      if (undoStack.length === 0 || !document) return;

      set((state) => {
        const previous = state.undoStack.pop();
        if (previous) {
          state.redoStack.push(JSON.parse(JSON.stringify(state.document)));
          state.document = previous;
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
        }
      });
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) return;

      set((state) => {
        const next = state.redoStack.pop();
        if (next) {
          state.undoStack.push(JSON.parse(JSON.stringify(state.document)));
          state.document = next;
          state.isDirty = true;
          state.saveStatus = { status: 'modified' };
        }
      });
    },

    // Validation
    validate: () => {
      const { document } = get();
      const errors: ValidationError[] = [];

      if (!document) {
        errors.push({
          path: [],
          message: 'No document loaded',
          severity: 'error',
        });
        return errors;
      }

      const ssp = document['system-security-plan'];

      // Required field validation
      if (!ssp.metadata.title) {
        errors.push({
          path: ['system-security-plan', 'metadata', 'title'],
          message: 'Title is required',
          severity: 'error',
        });
      }

      if (!ssp['system-characteristics']['system-name']) {
        errors.push({
          path: ['system-security-plan', 'system-characteristics', 'system-name'],
          message: 'System name is required',
          severity: 'error',
        });
      }

      // Warn if no controls
      if (!ssp['control-implementation']['implemented-requirements']?.length) {
        errors.push({
          path: ['system-security-plan', 'control-implementation', 'implemented-requirements'],
          message: 'No controls implemented',
          severity: 'warning',
        });
      }

      set((state) => {
        state.validationErrors = errors;
      });

      return errors;
    },

    clearValidationErrors: () => {
      set((state) => {
        state.validationErrors = [];
      });
    },

    // Utility
    getSSP: () => {
      const { document } = get();
      return document?.['system-security-plan'] || null;
    },

    buildTreeNodes: (): TreeNode[] => {
      const { document } = get();
      if (!document) return [];

      const ssp = document['system-security-plan'];
      const metadata = ssp.metadata;
      const controls = ssp['control-implementation']['implemented-requirements'] || [];

      return [
        {
          id: 'metadata',
          type: 'metadata',
          label: 'Metadata',
          path: ['system-security-plan', 'metadata'],
          icon: 'FileText',
          children: [
            {
              id: 'metadata-info',
              type: 'metadata-info',
              label: 'Document Info',
              path: ['system-security-plan', 'metadata', 'title'],
              icon: 'Info',
            },
            {
              id: 'roles',
              type: 'roles',
              label: 'Roles',
              path: ['system-security-plan', 'metadata', 'roles'],
              icon: 'Users',
              badge: metadata.roles?.length || 0,
              children: metadata.roles?.map((role) => ({
                id: `role-${role.id}`,
                type: 'role' as TreeNodeType,
                label: role.title,
                path: ['system-security-plan', 'metadata', 'roles', role.id],
                icon: 'User',
              })),
            },
            {
              id: 'locations',
              type: 'locations',
              label: 'Locations',
              path: ['system-security-plan', 'metadata', 'locations'],
              icon: 'MapPin',
              badge: metadata.locations?.length || 0,
              children: metadata.locations?.map((loc) => ({
                id: `location-${loc.uuid}`,
                type: 'location' as TreeNodeType,
                label: loc.title || loc.address?.city || 'Unknown',
                path: ['system-security-plan', 'metadata', 'locations', loc.uuid],
                icon: 'MapPin',
              })),
            },
            {
              id: 'parties',
              type: 'parties',
              label: 'Parties',
              path: ['system-security-plan', 'metadata', 'parties'],
              icon: 'Building',
              badge: metadata.parties?.length || 0,
              children: metadata.parties?.map((party) => ({
                id: `party-${party.uuid}`,
                type: 'party' as TreeNodeType,
                label: party.name || party['short-name'] || 'Unknown',
                path: ['system-security-plan', 'metadata', 'parties', party.uuid],
                icon: party.type === 'person' || party.type === 1 ? 'User' : 'Building',
              })),
            },
          ],
        },
        {
          id: 'system-characteristics',
          type: 'system-characteristics',
          label: 'System Characteristics',
          path: ['system-security-plan', 'system-characteristics'],
          icon: 'Server',
        },
        {
          id: 'control-implementation',
          type: 'control-implementation',
          label: 'Control Implementation',
          path: ['system-security-plan', 'control-implementation'],
          icon: 'Shield',
          badge: controls.length,
          children: controls.slice(0, 100).map((ctrl) => {
            const status = ctrl.props?.find((p) => p.name === 'Implementation-Status')?.value;
            return {
              id: `control-${ctrl.uuid}`,
              type: 'control' as TreeNodeType,
              label: ctrl['control-id'].toUpperCase(),
              path: ['system-security-plan', 'control-implementation', 'implemented-requirements', ctrl.uuid],
              icon: 'CheckCircle',
              status: status === 'Implemented' ? 'complete' : status === 'Partially Implemented' ? 'incomplete' : 'warning',
            };
          }),
        },
      ];
    },
  }))
);

// ============================================================================
// Debounced Autosave Hook
// ============================================================================

export const useAutosave = (enabled: boolean = true, delay: number = 2000) => {
  const { isDirty, saveDocument } = useOscalStore();

  const debouncedSave = debounce(() => {
    if (enabled && isDirty) {
      saveDocument();
    }
  }, delay);

  return { triggerAutosave: debouncedSave };
};
