import React from 'react';
import { ColyseusGameClient, PrivateStateData, PlayerPublicData } from '../network/colyseusClient.js';
import { UNITS, ALLIANCES, SHOP_TIER_ODDS_BY_LEVEL, UNIT_COSTS } from '@tiny-tactics/data';
import { MatchPhase, PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';
import { RefreshCw, Lock, Unlock, ArrowUpCircle, Coins } from 'lucide-react';

interface ShopPanelProps {
  client: ColyseusGameClient;
  privateState: PrivateStateData;
  player: PlayerPublicData;
  phase: MatchPhase;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({
  client,
  privateState,
  player,
  phase
}) => {
  const isPrep = phase === 'preparation';
  const odds = SHOP_TIER_ODDS_BY_LEVEL[player.level] || SHOP_TIER_ODDS_BY_LEVEL[2];

  const handleBuy = (slotIndex: number) => {
    if (!isPrep) return;
    client.sendCommand({ type: 'buyUnit', shopSlot: slotIndex });
  };

  const handleReroll = () => {
    if (!isPrep) return;
    client.sendCommand({ type: 'rerollShop' });
  };

  const handleToggleLock = () => {
    if (!isPrep) return;
    client.sendCommand({ type: 'toggleShopLock' });
  };

  const handleBuyXp = () => {
    if (!isPrep) return;
    client.sendCommand({ type: 'buyXp' });
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      {/* Tier Probability Bar */}
      <div className="glass-panel px-4 py-1 rounded-full text-[11px] font-semibold flex items-center gap-4 text-slate-400 border border-slate-700/60">
        <span className="text-slate-300">Level {player.level} Odds:</span>
        <span className="text-slate-200">T1: {odds[0]}%</span>
        <span className="text-emerald-400">T2: {odds[1]}%</span>
        <span className="text-sky-400">T3: {odds[2]}%</span>
        <span className="text-purple-400">T4: {odds[3]}%</span>
      </div>

      <div className="glass-panel p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
        {/* Left Side Buttons: Buy XP & Reroll & Lock */}
        <div className="flex flex-col gap-2">
          {/* Buy XP */}
          <button
            onClick={handleBuyXp}
            disabled={!isPrep || player.gold < PROTOCOL_CONSTANTS.XP_COST || player.level >= PROTOCOL_CONSTANTS.MAX_LEVEL}
            className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-bold transition border ${
              isPrep && player.gold >= PROTOCOL_CONSTANTS.XP_COST && player.level < PROTOCOL_CONSTANTS.MAX_LEVEL
                ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/30 cursor-pointer shadow-md'
                : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle size={15} />
              <span>Buy XP</span>
            </div>
            <span className="flex items-center gap-0.5 text-amber-300 font-extrabold font-mono">
              <Coins size={12} /> 5
            </span>
          </button>

          {/* Reroll Shop */}
          <button
            onClick={handleReroll}
            disabled={!isPrep || player.gold < PROTOCOL_CONSTANTS.REROLL_COST}
            className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-bold transition border ${
              isPrep && player.gold >= PROTOCOL_CONSTANTS.REROLL_COST
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/30 cursor-pointer shadow-md'
                : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <RefreshCw size={14} />
              <span>Reroll</span>
            </div>
            <span className="flex items-center gap-0.5 text-amber-300 font-extrabold font-mono">
              <Coins size={12} /> 2
            </span>
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={handleToggleLock}
            disabled={!isPrep}
            className={`px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition border ${
              privateState.shopLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400 border-slate-700'
            } cursor-pointer`}
          >
            {privateState.shopLocked ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{privateState.shopLocked ? 'Locked' : 'Lock'}</span>
          </button>
        </div>

        {/* 5 Shop Cards */}
        <div className="flex gap-2">
          {privateState.shop.map((unitId, slotIdx) => {
            if (!unitId) {
              return (
                <div
                  key={`empty_${slotIdx}`}
                  className="w-36 h-44 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-xs text-slate-600 font-semibold"
                >
                  Purchased
                </div>
              );
            }

            const def = UNITS[unitId];
            if (!def) return null;
            const cost = UNIT_COSTS[def.tier];
            const canAfford = player.gold >= cost;

            return (
              <div
                key={`shop_${slotIdx}_${unitId}`}
                onClick={() => canAfford && isPrep && handleBuy(slotIdx)}
                className={`w-36 h-44 rounded-xl p-3 border flex flex-col justify-between transition cursor-pointer select-none relative overflow-hidden group ${
                  canAfford && isPrep
                    ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700 hover:border-amber-400/80 shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Cost Pill */}
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    def.tier === 1 ? 'bg-slate-700 text-slate-300' :
                    def.tier === 2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                    def.tier === 3 ? 'bg-sky-950 text-sky-400 border border-sky-500/40' :
                    'bg-purple-950 text-purple-400 border border-purple-500/40'
                  }`}>
                    Tier {def.tier}
                  </span>
                  <span className="flex items-center gap-0.5 font-black text-amber-400 text-xs">
                    <Coins size={12} /> {cost}
                  </span>
                </div>

                {/* Silhouette / Name */}
                <div className="flex flex-col items-center my-1 text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner mb-1.5"
                    style={{ backgroundColor: `${def.colorPalette.primary}33`, borderColor: def.colorPalette.primary, borderWidth: 1 }}
                  >
                    {def.shapeArchetype === 'knight' ? '🛡️' :
                     def.shapeArchetype === 'archer' ? '🏹' :
                     def.shapeArchetype === 'caster' ? '🔮' :
                     def.shapeArchetype === 'rogue' ? '🗡️' :
                     def.shapeArchetype === 'beast' ? '🐾' : '🗿'}
                  </div>
                  <span className="font-extrabold text-xs text-slate-100 truncate w-full">{def.name}</span>
                </div>

                {/* Alliances Badges */}
                <div className="flex flex-col gap-1">
                  {def.alliances.map(alKey => {
                    const al = ALLIANCES[alKey];
                    return (
                      <div
                        key={alKey}
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-800"
                      >
                        <span>{al.icon}</span>
                        <span className="text-slate-300 font-semibold">{al.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
