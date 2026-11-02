import React from 'react';
import { PlacedUnit, MatchPhase } from '@tiny-tactics/shared';
import { UNITS, ALLIANCES, ABILITIES, UNIT_COSTS } from '@tiny-tactics/data';
import { Swords, Shield, Heart, Zap, Crosshair, Sparkles } from 'lucide-react';

interface UnitTooltipProps {
  unit: PlacedUnit;
  screenPos: { x: number; y: number };
  isOwner?: boolean;
  phase?: MatchPhase;
}

export const UnitTooltip: React.FC<UnitTooltipProps> = ({
  unit,
  screenPos,
  isOwner = true,
  phase = 'preparation'
}) => {
  const def = UNITS[unit.unitId];
  if (!def) return null;

  const ability = ABILITIES[def.abilityId];
  const starMultiplier = unit.star === 3 ? 9 : unit.star === 2 ? 3 : 1;
  const sellValue = UNIT_COSTS[def.tier] * starMultiplier;

  // Smart screen clamping: place tooltip above or to the side of the unit
  const tooltipWidth = 280;
  const tooltipHeight = 240;

  let left = screenPos.x + 20;
  let top = screenPos.y - tooltipHeight / 2;

  // Prevent right overflow
  if (left + tooltipWidth > window.innerWidth - 16) {
    left = screenPos.x - tooltipWidth - 20;
  }
  // Prevent left overflow
  if (left < 16) left = 16;

  // Prevent bottom overflow (leave space for shop)
  if (top + tooltipHeight > window.innerHeight - 80) {
    top = window.innerHeight - tooltipHeight - 80;
  }
  // Prevent top overflow
  if (top < 16) top = 16;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-75 ease-out animate-in fade-in zoom-in-95"
      style={{ left: `${left}px`, top: `${top}px`, width: `${tooltipWidth}px` }}
    >
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5">
        {/* Header: Star, Name, Tier */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-100">{def.name}</span>
              <span className="text-amber-400 text-xs">
                {unit.star === 3 ? '⭐⭐⭐' : unit.star === 2 ? '⭐⭐' : '⭐'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Tier {def.tier} • {def.shapeArchetype}
            </span>
          </div>

          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
              def.tier === 1
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : def.tier === 2
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                : def.tier === 3
                ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                : 'bg-purple-950 text-purple-300 border-purple-500/50'
            }`}
          >
            Tier {def.tier}
          </span>
        </div>

        {/* Alliances */}
        <div className="flex gap-1.5 flex-wrap">
          {def.alliances.map(alKey => {
            const al = ALLIANCES[alKey];
            if (!al) return null;
            return (
              <span
                key={alKey}
                className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1"
              >
                <span>{al.icon}</span> {al.name}
              </span>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Heart size={12} className="text-rose-400" />
            <span>HP: <b className="text-slate-100">{unit.currentHp} / {unit.maxHp}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap size={12} className="text-sky-400" />
            <span>Mana: <b className="text-slate-100">{unit.currentMana} / {unit.maxMana}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Swords size={12} className="text-amber-400" />
            <span>Attack: <b className="text-slate-100">{Math.round(def.baseAttack * (unit.star === 3 ? 2.25 : unit.star === 2 ? 1.5 : 1))}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Shield size={12} className="text-blue-400" />
            <span>Armor: <b className="text-slate-100">{def.armor}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 col-span-2">
            <Crosshair size={12} className="text-emerald-400" />
            <span>Range: <b className="text-slate-100">{def.range} {def.range === 1 ? 'tile (Melee)' : 'tiles (Ranged)'}</b></span>
          </div>
        </div>

        {/* Ability Description */}
        {ability && (
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-sky-400 flex items-center gap-1">
                <Sparkles size={11} /> {ability.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">100 Mana</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              {ability.description}
            </p>
          </div>
        )}

        {/* Sell / Action Hint */}
        {isOwner && phase === 'preparation' && (
          <div className="text-[10px] text-center text-slate-400 border-t border-slate-800/80 pt-1.5">
            Click to select or sell for <span className="text-amber-400 font-bold">{sellValue} Gold</span>
          </div>
        )}
      </div>
    </div>
  );
};
