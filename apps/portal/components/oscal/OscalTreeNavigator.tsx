'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
  User,
  MapPin,
  Building,
  Server,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  Search,
  ChevronsUpDown,
  FolderOpen,
  FolderClosed,
} from 'lucide-react';
import { useOscalStore } from '@/lib/oscal/store';
import type { TreeNode, TreeNodeType } from '@/lib/oscal/types';

interface OscalTreeNavigatorProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  User,
  MapPin,
  Building,
  Server,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
};

function getIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return FileText;
  return iconMap[iconName] || FileText;
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'complete':
      return 'text-green-400';
    case 'incomplete':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-orange-400';
    default:
      return 'text-[var(--text-muted)]';
  }
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (path: string[]) => void;
  onToggle: (nodeId: string) => void;
}

function TreeNodeItem({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const Icon = getIcon(node.icon);
  const statusColor = getStatusColor(node.status);

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md
          transition-all duration-150 group
          ${isSelected
            ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-l-2 border-[var(--accent-cyan)]'
            : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.path)}
      >
        {/* Expand/Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-[var(--bg-active)] rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 ${statusColor}`} />

        {/* Label */}
        <span className="flex-1 text-sm truncate font-medium">{node.label}</span>

        {/* Badge */}
        {node.badge !== undefined && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-active)] text-[var(--text-muted)] font-mono">
            {node.badge}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line indicator */}
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-[var(--border-subtle)]"
            style={{ marginLeft: `${depth * 12 + 16}px` }}
          />
          {node.children!.map((child) => (
            <TreeNodeItemWrapper key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNodeItemWrapper({ node, depth }: { node: TreeNode; depth: number }) {
  const { selectedPath, expandedNodes, setSelectedPath, toggleNodeExpanded } = useOscalStore();

  const isSelected = selectedPath.join('/') === node.path.join('/');
  const isExpanded = expandedNodes.has(node.id);

  return (
    <TreeNodeItem
      node={node}
      depth={depth}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={setSelectedPath}
      onToggle={toggleNodeExpanded}
    />
  );
}

export default function OscalTreeNavigator({
  collapsed = false,
  onToggleCollapse,
}: OscalTreeNavigatorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { buildTreeNodes, expandAll, collapseAll, document } = useOscalStore();

  const treeNodes = buildTreeNodes();

  // Filter nodes based on search
  const filterNodes = (nodes: TreeNode[], term: string): TreeNode[] => {
    if (!term) return nodes;

    return nodes
      .map((node) => {
        const matchesSearch = node.label.toLowerCase().includes(term.toLowerCase());
        const filteredChildren = node.children
          ? filterNodes(node.children, term)
          : [];

        if (matchesSearch || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
            expanded: true,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeNode[];
  };

  const filteredNodes = filterNodes(treeNodes, searchTerm);

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[var(--bg-hover)] rounded-md transition-colors"
          title="Expand navigator"
        >
          <FolderOpen className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Document Structure
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            title="Collapse navigator"
          >
            <FolderClosed className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)]"
          />
        </div>

        {/* Expand/Collapse all */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={expandAll}
            className="flex-1 text-xs px-2 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 text-xs px-2 py-1 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {!document ? (
          <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
            No document loaded
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
            No matching items
          </div>
        ) : (
          filteredNodes.map((node) => (
            <TreeNodeItemWrapper key={node.id} node={node} depth={0} />
          ))
        )}
      </div>

      {/* Footer stats */}
      {document && (
        <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>OSCAL 1.1.3</span>
            <span className="font-mono">
              {document['system-security-plan']['control-implementation']['implemented-requirements']?.length || 0} controls
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
