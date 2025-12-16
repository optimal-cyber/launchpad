'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Shield,
  Save,
  Download,
  Upload,
  RefreshCw,
  Undo2,
  Redo2,
  FileText,
  Code,
  Eye,
  PanelLeftClose,
  PanelLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  History,
} from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import OscalTreeNavigator from '@/components/oscal/OscalTreeNavigator';
import OscalFormEditor from '@/components/oscal/OscalFormEditor';
import OscalPreview from '@/components/oscal/OscalPreview';

// Dynamically import Monaco editor to avoid SSR issues
const OscalJsonEditor = dynamic(
  () => import('@/components/oscal/OscalJsonEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[var(--bg-surface)]">
        <div className="text-[var(--text-muted)]">Loading editor...</div>
      </div>
    ),
  }
);

type EditorTab = 'form' | 'json' | 'preview';

export default function OSCALPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('form');
  const [showHistory, setShowHistory] = useState(false);

  const {
    document,
    isLoading,
    isSaving,
    isDirty,
    saveStatus,
    loadDocument,
    saveDocument,
    discardChanges,
    undo,
    redo,
    undoStack,
    redoStack,
  } = useOscalStore();

  // Load document on mount
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleExport = () => {
    if (!document) return;

    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `oscal-ssp-${new Date().toISOString().split('T')[0]}.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        useOscalStore.getState().loadFromJson(json);
      } catch (error) {
        console.error('Failed to import file:', error);
        alert('Failed to import file. Please ensure it is a valid OSCAL JSON file.');
      }
    };
    input.click();
  };

  const formatLastSaved = () => {
    if (!saveStatus.lastSaved) return 'Never';
    const diff = Date.now() - saveStatus.lastSaved.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return saveStatus.lastSaved.toLocaleTimeString();
  };

  const getStatusIcon = () => {
    switch (saveStatus.status) {
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'saving':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'modified':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-48px)] flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[var(--accent-cyan)] animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Loading OSCAL SSP
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Parsing system security plan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col bg-[var(--bg-base)]">
      {/* Header Toolbar */}
      <div className="h-14 px-4 border-b border-[var(--border-default)] bg-[var(--bg-void)] flex items-center justify-between">
        {/* Left: Title and Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-cyan)]/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--text-primary)]">
                OSCAL SSP Editor
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                {document?.['system-security-plan']?.metadata?.title || 'Untitled'}
              </p>
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
            {getStatusIcon()}
            <span className="text-xs text-[var(--text-muted)]">
              {saveStatus.status === 'saved' && 'Saved'}
              {saveStatus.status === 'saving' && 'Saving...'}
              {saveStatus.status === 'modified' && 'Unsaved changes'}
              {saveStatus.status === 'error' && 'Error saving'}
            </span>
            {saveStatus.lastSaved && (
              <span className="text-xs text-[var(--text-subtle)]">
                {formatLastSaved()}
              </span>
            )}
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-default)]">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'form'
                ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Form
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'json'
                ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Code className="w-4 h-4" />
            JSON
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Import/Export */}
          <button
            onClick={handleImport}
            className="enterprise-btn enterprise-btn-secondary"
            title="Import OSCAL JSON"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="enterprise-btn enterprise-btn-secondary"
            title="Export OSCAL JSON"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Save */}
          <button
            onClick={saveDocument}
            disabled={!isDirty || isSaving}
            className="enterprise-btn enterprise-btn-primary disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-r-lg hover:bg-[var(--bg-hover)] transition-colors"
          style={{ marginLeft: sidebarCollapsed ? 0 : 'calc(18rem - 1px)' }}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </button>

        {/* Tree Navigator */}
        {!sidebarCollapsed && (
          <OscalTreeNavigator
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Editor Panel */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'form' && (
            <div className="h-full overflow-y-auto bg-[var(--bg-surface)]">
              <OscalFormEditor />
            </div>
          )}
          {activeTab === 'json' && <OscalJsonEditor />}
          {activeTab === 'preview' && <OscalPreview />}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 px-4 border-t border-[var(--border-default)] bg-[var(--bg-void)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            OSCAL 1.1.3
          </span>
          <span>
            {document?.['system-security-plan']?.['control-implementation']?.[
              'implemented-requirements'
            ]?.length || 0}{' '}
            controls
          </span>
          <span>
            {document?.['system-security-plan']?.metadata?.roles?.length || 0} roles
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isDirty && (
            <button
              onClick={discardChanges}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Discard Changes
            </button>
          )}
          <span>
            {undoStack.length} undo{undoStack.length !== 1 ? 's' : ''} available
          </span>
        </div>
      </div>
    </div>
  );
}
