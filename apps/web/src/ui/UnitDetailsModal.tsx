import React from 'react';
import { PlacedUnit, MatchPhase } from '@tiny-tactics/shared';
import { UNITS, ALLIANCES, ABILITIES, UNIT_COSTS } from '@tiny-tactics/data';
import { ColyseusGameClient } from '../network/colyseusClient.js';
import { X, Coins, Shield, Swords, Zap, Crosshair } from 'lucide-react';

interface UnitDetailsModalProps {
  unit: PlacedUnit | null;
  onClose: () => void;
  client: ColyseusGameClient;
  phase: MatchPhase;
}

export const UnitDetailsModal: React.FC<UnitDetailsModalProps> = ({
  unit,
  onClose,
  client,
  phase
}) => {
  if (!unit) return null;

  const def = UNITS[unit.unitId];
  if (!def) return null;

  const ability = ABILITIES[def.abilityId];
  const starMultiplier = unit.star === 3 ? 9 : unit.star === 2 ? 3 : 1;
  const sellValue = UNIT_COSTS[def.tier] * starMultiplier;
  const isPrep = phase === 'preparation';

  const handleSell = () => {
    if (!isPrep) return;
    client.sendCommand({ type: 'sellUnit', instanceId: unit.instanceId });
    onClose();
  };

  return (
    <div className="absolute top-20 right-4 z-50">
      <div className="glass-panel w-72 p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="text-xl">
              {unit.star === 3 ? '⭐⭐⭐' : unit.star === 2 ? '⭐⭐' : '⭐'}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">{def.name}</h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Tier {def.tier} • {def.shapeArchetype}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alliances */}
        <div className="flex gap-1.5">
          {def.alliances.map(alKey => {
            const al = ALLIANCES[alKey];
            return (
              <span
                key={alKey}
                className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center gap-1"
              >
                <span>{al.icon}</span> {al.name}
              </span>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Swords size={13} className="text-amber-400" />
            <span>Attack: <b className="text-slate-100">{Math.round(def.baseAttack * (unit.star === 3 ? 2.25 : unit.star === 2 ? 1.5 : 1))}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Shield size={13} className="text-sky-400" />
            <span>Armor: <b className="text-slate-100">{def.armor}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap size={13} className="text-rose-400" />
            <span>Max HP: <b className="text-slate-100">{unit.maxHp}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Crosshair size={13} className="text-emerald-400" />
            <span>Range: <b className="text-slate-100">{def.range} {def.range === 1 ? 'tile' : 'tiles'}</b></span>
          </div>
        </div>

        {/* Ability Description */}
        {ability && (
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sky-400">{ability.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">100 Mana</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {ability.description}
            </p>
          </div>
        )}

        {/* Sell Button */}
        {isPrep && (
          <button
            onClick={handleSell}
            className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-950 text-rose-300 font-bold rounded-xl transition border border-rose-800/60 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <Coins size={14} className="text-amber-400" />
            <span>Sell for {sellValue} Gold</span>
          </button>
        )}
      </div>
    </div>
  );
};
