import React from 'react';
import { ColyseusGameClient, PlayerPublicData } from '../network/colyseusClient.js';
import { MatchPhase, PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';
import { Heart, Coins, FastForward } from 'lucide-react';
import { getXpProgressForLevel } from '@tiny-tactics/core';

interface HUDProps {
  client: ColyseusGameClient;
  players: Map<string, PlayerPublicData>;
  phase: MatchPhase;
  phaseTimeRemaining: number;
  roundNumber: number;
  isHost: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  client,
  players,
  phase,
  phaseTimeRemaining,
  roundNumber,
  isHost
}) => {
  const me = players.get(client.playerId);
  if (!me) return null;

  const xpProgress = getXpProgressForLevel(me.xp, me.level);
  const totalPhaseTime =
    phase === 'preparation'
      ? PROTOCOL_CONSTANTS.PREPARATION_TIME_SEC
      : phase === 'combat'
      ? PROTOCOL_CONSTANTS.COMBAT_TIME_SEC
      : PROTOCOL_CONSTANTS.RESULTS_TIME_SEC;
  const timeProgress = Math.max(0, Math.min(1, phaseTimeRemaining / totalPhaseTime));

  const sortedOpponents = Array.from(players.values()).sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.hp - a.hp;
  });

  return (
    <>
      {/* Top Center Round & Timer Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div className="glass-panel px-6 py-2.5 rounded-2xl flex items-center gap-6 border border-slate-700/60">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Round</span>
            <span className="text-xl font-black text-amber-400">#{roundNumber}</span>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
              {phase.toUpperCase()}
            </span>
            <span className={`text-2xl font-black font-mono ${phaseTimeRemaining <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
              {phaseTimeRemaining}s
            </span>
          </div>

          {isHost && phase !== 'ended' && (
            <button
              onClick={() => client.sendCommand({ type: 'forceNextPhase' })}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl text-sky-400 hover:text-sky-300 transition cursor-pointer border border-slate-600"
              title="Host Fast-Forward to Next Phase"
            >
              <FastForward size={16} />
            </button>
          )}
        </div>

        {/* Phase Timer Progress Line */}
        <div className="w-56 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              phase === 'preparation' ? 'bg-sky-400' : phase === 'combat' ? 'bg-amber-500' : 'bg-emerald-400'
            }`}
            style={{ width: `${timeProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Top Left Player Stats (HP, Gold, Level, XP) */}
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
        <div className="glass-panel p-4 rounded-2xl border border-slate-700/60 flex flex-col gap-3 min-w-[240px]">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm text-slate-200">{me.name}</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 font-extrabold text-sm">
              <Coins size={15} />
              <span>{me.gold}</span>
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart size={13} fill="currentColor" /> HP
              </span>
              <span className="text-slate-300 font-mono">{me.hp} / 100</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300"
                style={{ width: `${Math.max(0, me.hp)}%` }}
              />
            </div>
          </div>

          {/* Level & XP */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-sky-400 font-bold">Level {me.level}</span>
              <span className="text-slate-400 text-[11px] font-mono">
                {me.level >= PROTOCOL_CONSTANTS.MAX_LEVEL ? 'MAX' : `${xpProgress.current} / ${xpProgress.max} XP`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                style={{
                  width: `${me.level >= PROTOCOL_CONSTANTS.MAX_LEVEL ? 100 : (xpProgress.current / xpProgress.max) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: All Players Ranking / Health List */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-1.5 max-w-[200px]">
        {sortedOpponents.map((p, idx) => {
          const isMe = p.id === client.playerId;
          return (
            <div
              key={p.id}
              className={`glass-panel px-3 py-2 rounded-xl border flex flex-col gap-1 text-xs transition ${
                p.eliminated
                  ? 'opacity-40 border-slate-800 bg-slate-950/40'
                  : isMe
                  ? 'border-sky-500/60 bg-sky-950/40'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold truncate max-w-[100px] flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                  <span className={isMe ? 'text-sky-300' : 'text-slate-200'}>{p.name}</span>
                </span>
                <span className="font-mono font-bold text-rose-400">{p.eliminated ? 'DEAD' : `${p.hp}`}</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${Math.max(0, p.hp)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
