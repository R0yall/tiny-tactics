import React from 'react';
import { ALLIANCES } from '@tiny-tactics/data';
import { AllianceType } from '@tiny-tactics/shared';

interface AlliancePanelProps {
  activeAlliances: Record<string, number>;
}

export const AlliancePanel: React.FC<AlliancePanelProps> = ({ activeAlliances }) => {
  const allianceList = Object.keys(ALLIANCES) as AllianceType[];

  // Sort: active synergies first, then by count descending
  const sorted = [...allianceList].sort((a, b) => {
    const countA = activeAlliances[a] || 0;
    const countB = activeAlliances[b] || 0;
    return countB - countA;
  });

  return (
    <div className="absolute top-28 left-4 z-40 flex flex-col gap-1.5 max-w-[210px]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
        Synergies
      </div>
      {sorted.map(type => {
        const al = ALLIANCES[type];
        const count = activeAlliances[type] || 0;
        const tier = count >= 4 ? 2 : count >= 2 ? 1 : 0;
        const isActive = tier > 0;

        return (
          <div
            key={type}
            className={`glass-panel px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs transition ${
              isActive
                ? 'border-sky-500/50 bg-slate-900/90 shadow-md'
                : 'border-slate-800/80 bg-slate-950/40 opacity-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{al.icon}</span>
              <div className="flex flex-col">
                <span className={`font-bold text-[11px] ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                  {al.name}
                </span>
                {isActive && (
                  <span className="text-[9px] text-sky-400 font-semibold truncate max-w-[120px]">
                    {al.thresholds[tier - 1].description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] font-extrabold">
              <span className={isActive ? 'text-amber-400' : 'text-slate-500'}>{count}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">2</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">4</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
