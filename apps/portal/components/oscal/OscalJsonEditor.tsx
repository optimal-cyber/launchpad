'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { useOscalStore } from '@/lib/oscal/store';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function OscalJsonEditor() {
  const { document, loadFromJson, isDirty } = useOscalStore();
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const editorRef = useRef<any>(null);
  const [localValue, setLocalValue] = useState<string>('');

  // Sync document to local value
  useEffect(() => {
    if (document) {
      setLocalValue(JSON.stringify(document, null, 2));
      setError(null);
      setIsValid(true);
    }
  }, [document]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure JSON defaults
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false,
    });

    // Define custom OSCAL dark theme
    monaco.editor.defineTheme('oscal-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '06b6d4' }, // Cyan for keys
        { token: 'string.value.json', foreground: '94a3b8' }, // Muted for values
        { token: 'number', foreground: 'f59e0b' }, // Amber for numbers
        { token: 'keyword', foreground: '6366f1' }, // Indigo for keywords
      ],
      colors: {
        'editor.background': '#0f1420',
        'editor.foreground': '#f1f5f9',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#1f294060',
        'editor.lineHighlightBackground': '#151c2c',
        'editorCursor.foreground': '#06b6d4',
        'editorIndentGuide.background': '#1f2940',
        'editorIndentGuide.activeBackground': '#334155',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#1f294080',
        'scrollbarSlider.hoverBackground': '#334155',
        'scrollbarSlider.activeBackground': '#475569',
        'editorGutter.background': '#0f1420',
        'editor.selectionHighlightBackground': '#06b6d420',
      },
    });

    monaco.editor.setTheme('oscal-dark');

    // Set up keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      applyChanges();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    setLocalValue(value);

    // Validate JSON
    try {
      const parsed = JSON.parse(value);
      setError(null);
      setIsValid(true);

      // Basic OSCAL validation
      if (!parsed['system-security-plan']) {
        setError('Missing required "system-security-plan" root element');
        setIsValid(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setIsValid(false);
    }
  };

  const applyChanges = () => {
    if (!isValid) return;

    try {
      const parsed = JSON.parse(localValue);
      loadFromJson(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply changes');
    }
  };

  const resetChanges = () => {
    if (document) {
      setLocalValue(JSON.stringify(document, null, 2));
      setError(null);
      setIsValid(true);
    }
  };

  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-surface)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            JSON Editor
          </span>
          {isValid ? (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              Valid OSCAL
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              Invalid
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={formatDocument}
            className="text-xs px-2 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] rounded transition-colors"
          >
            Format
          </button>
          <button
            onClick={resetChanges}
            className="text-xs px-2 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] rounded transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={applyChanges}
            disabled={!isValid}
            className="text-xs px-3 py-1 bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/80 disabled:bg-[var(--bg-hover)] disabled:text-[var(--text-muted)] text-white rounded transition-colors font-medium"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400 font-mono">{error}</p>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={localValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="oscal-dark"
          options={{
            minimap: { enabled: true, scale: 1 },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            padding: { top: 16, bottom: 16 },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              strings: true,
              comments: false,
              other: true,
            },
          }}
          loading={
            <div className="h-full flex items-center justify-center bg-[var(--bg-surface)]">
              <div className="text-[var(--text-muted)]">Loading editor...</div>
            </div>
          }
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border-default)] bg-[var(--bg-void)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span>JSON</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            {localValue.split('\n').length.toLocaleString()} lines
          </span>
          <span>
            {(localValue.length / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    </div>
  );
}
