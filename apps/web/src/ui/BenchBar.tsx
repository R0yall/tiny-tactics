import React from 'react';
import { PlacedUnit, PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';
import { ColyseusGameClient } from '../network/colyseusClient.js';
import { UnitPortraitGenerator } from '../game/units/UnitPortraitGenerator.js';
import { ArrowUp, Sparkles } from 'lucide-react';

interface BenchBarProps {
  client: ColyseusGameClient;
  benchUnits: PlacedUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unit: PlacedUnit | null) => void;
  playerLevel: number;
  boardCount: number;
  isPrep: boolean;
}

export const BenchBar: React.FC<BenchBarProps> = ({
  client,
  benchUnits,
  selectedUnitId,
  onSelectUnit,
  playerLevel,
  boardCount,
  isPrep
}) => {
  // Map bench slots 0..7
  const slots: (PlacedUnit | null)[] = Array(PROTOCOL_CONSTANTS.BENCH_SIZE).fill(null);
  for (const u of benchUnits) {
    if (u.placement.area === 'bench' && u.placement.benchIndex >= 0 && u.placement.benchIndex < 8) {
      slots[u.placement.benchIndex] = u;
    }
  }

  const handleSlotClick = (index: number, unit: PlacedUnit | null) => {
    if (!isPrep) return;

    if (unit) {
      if (selectedUnitId === unit.instanceId) {
        onSelectUnit(null);
      } else {
        onSelectUnit(unit);
      }
    } else if (selectedUnitId) {
      // Move selected unit to this bench slot
      client.sendCommand({
        type: 'moveUnit',
        instanceId: selectedUnitId,
        target: { area: 'bench', benchIndex: index }
      });
      onSelectUnit(null);
    }
  };

  const handleQuickDeploy = (e: React.MouseEvent, unit: PlacedUnit) => {
    e.stopPropagation();
    if (!isPrep) return;
    if (boardCount >= playerLevel) return;

    const me = client.players.get(client.playerId);
    const boardUnits = me?.boardUnits || [];
    const occupied = new Set(
      boardUnits.map(u => `${(u.placement as { area: 'board'; x: number; y: number }).x}_${(u.placement as { area: 'board'; x: number; y: number }).y}`)
    );

    // Find first free player board tile
    for (let y = 0; y < PROTOCOL_CONSTANTS.PLAYER_ROWS; y++) {
      for (let x = 0; x < PROTOCOL_CONSTANTS.BOARD_WIDTH; x++) {
        if (!occupied.has(`${x}_${y}`)) {
          client.sendCommand({
            type: 'moveUnit',
            instanceId: unit.instanceId,
            target: { area: 'board', x, y }
          });
          onSelectUnit(null);
          return;
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-2xl border border-sky-500/30 shadow-xl bg-slate-950/80 backdrop-blur-md">
      <span className="text-[10px] uppercase font-black tracking-wider text-sky-400 mr-1 select-none flex items-center gap-1">
        <Sparkles size={11} /> Bench
      </span>

      <div className="flex gap-1.5">
        {slots.map((unit, idx) => {
          if (!unit) {
            return (
              <div
                key={`bench_empty_${idx}`}
                onClick={() => handleSlotClick(idx, null)}
                className={`w-10 h-10 rounded-xl border border-dashed flex items-center justify-center text-[10px] font-bold transition select-none ${
                  selectedUnitId
                    ? 'border-sky-400/60 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 cursor-pointer animate-pulse'
                    : 'border-slate-800 bg-slate-900/40 text-slate-600 cursor-default'
                }`}
                title={`Bench Slot ${idx + 1} (Empty)`}
              >
                {idx + 1}
              </div>
            );
          }

          const def = UNITS[unit.unitId];
          if (!def) return null;

          const isSelected = selectedUnitId === unit.instanceId;
          const frames = UnitPortraitGenerator.getFrames(def);
          const iconUrl = frames.length > 0 ? frames[0] : null;

          const tierBorder =
            def.tier === 1
              ? 'border-slate-600'
              : def.tier === 2
              ? 'border-emerald-500'
              : def.tier === 3
              ? 'border-sky-500'
              : 'border-purple-500';

          return (
            <div
              key={unit.instanceId}
              onClick={() => handleSlotClick(idx, unit)}
              className={`relative w-10 h-10 rounded-xl border-2 p-0.5 flex flex-col items-center justify-center transition cursor-pointer select-none group ${tierBorder} ${
                isSelected
                  ? 'ring-2 ring-sky-400 bg-sky-950 scale-105 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 hover:scale-105'
              }`}
              title={`${def.name} (${unit.star}★) - Click to select, click board tile to place`}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={def.name}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <span className="text-[10px] font-black">{def.name.substring(0, 2)}</span>
              )}

              {/* Star Badge */}
              <div className="absolute -top-1.5 -right-1.5 bg-slate-950 px-1 rounded-full text-[9px] font-bold leading-none border border-amber-400/60 text-amber-300 shadow">
                {unit.star}★
              </div>

              {/* Quick Deploy button on hover */}
              {isPrep && boardCount < playerLevel && (
                <button
                  onClick={e => handleQuickDeploy(e, unit)}
                  className="absolute -bottom-1 -right-1 bg-sky-500 hover:bg-sky-400 text-white rounded-full p-0.5 shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Deploy to Board"
                >
                  <ArrowUp size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
