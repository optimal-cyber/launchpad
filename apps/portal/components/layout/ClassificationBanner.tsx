'use client';

import { useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';

export type ClassificationLevel =
  | 'UNCLASSIFIED'
  | 'CUI'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP SECRET'
  | 'TOP SECRET//SCI';

interface ClassificationBannerProps {
  level?: ClassificationLevel;
  showSelector?: boolean;
  onLevelChange?: (level: ClassificationLevel) => void;
}

const classificationStyles: Record<ClassificationLevel, { bg: string; text: string; border: string }> = {
  'UNCLASSIFIED': {
    bg: 'bg-green-600',
    text: 'text-white',
    border: 'border-green-700',
  },
  'CUI': {
    bg: 'bg-purple-600',
    text: 'text-white',
    border: 'border-purple-700',
  },
  'CONFIDENTIAL': {
    bg: 'bg-blue-600',
    text: 'text-white',
    border: 'border-blue-700',
  },
  'SECRET': {
    bg: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-700',
  },
  'TOP SECRET': {
    bg: 'bg-orange-500',
    text: 'text-black',
    border: 'border-orange-600',
  },
  'TOP SECRET//SCI': {
    bg: 'bg-yellow-400',
    text: 'text-black',
    border: 'border-yellow-500',
  },
};

const classificationLevels: ClassificationLevel[] = [
  'UNCLASSIFIED',
  'CUI',
  'CONFIDENTIAL',
  'SECRET',
  'TOP SECRET',
  'TOP SECRET//SCI',
];

export default function ClassificationBanner({
  level = 'UNCLASSIFIED',
  showSelector = false,
  onLevelChange
}: ClassificationBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = classificationStyles[level];

  return (
    <>
      {/* Top Banner */}
      <div className={`${styles.bg} ${styles.text} text-center py-1 text-xs font-bold tracking-wider relative z-50`}>
        <div className="flex items-center justify-center gap-2">
          <span>{level}</span>
          {showSelector && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dropdown Selector */}
        {showSelector && isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
            {classificationLevels.map((lvl) => {
              const lvlStyles = classificationStyles[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    onLevelChange?.(lvl);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-3 ${
                    lvl === level ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${lvlStyles.bg}`} />
                  <span className="text-white">{lvl}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// Bottom banner component for footer
export function ClassificationFooterBanner({ level = 'UNCLASSIFIED' }: { level?: ClassificationLevel }) {
  const styles = classificationStyles[level];

  return (
    <div className={`${styles.bg} ${styles.text} text-center py-1 text-xs font-bold tracking-wider`}>
      {level}
    </div>
  );
}
