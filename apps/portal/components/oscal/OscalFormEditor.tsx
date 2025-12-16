'use client';

import { useOscalStore } from '@/lib/oscal/store';
import MetadataEditor from './editors/MetadataEditor';
import RolesEditor from './editors/RolesEditor';
import LocationsEditor from './editors/LocationsEditor';
import PartiesEditor from './editors/PartiesEditor';
import ControlImplementationEditor from './editors/ControlImplementationEditor';
import SystemCharacteristicsEditor from './editors/SystemCharacteristicsEditor';

export default function OscalFormEditor() {
  const { selectedPath, document } = useOscalStore();

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        <p>No document loaded</p>
      </div>
    );
  }

  // Determine which editor to show based on selected path
  const pathKey = selectedPath.slice(0, 4).join('/');

  // Route to appropriate editor based on selection
  if (pathKey.includes('metadata/roles') || pathKey === 'system-security-plan/metadata/roles') {
    return <RolesEditor />;
  }

  if (pathKey.includes('metadata/locations') || pathKey === 'system-security-plan/metadata/locations') {
    return <LocationsEditor />;
  }

  if (pathKey.includes('metadata/parties') || pathKey === 'system-security-plan/metadata/parties') {
    return <PartiesEditor />;
  }

  if (pathKey.includes('control-implementation') || selectedPath[1] === 'control-implementation') {
    return <ControlImplementationEditor />;
  }

  if (pathKey.includes('system-characteristics') || selectedPath[1] === 'system-characteristics') {
    return <SystemCharacteristicsEditor />;
  }

  // Default to metadata editor
  return <MetadataEditor />;
}
