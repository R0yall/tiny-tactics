import React from 'react';
import { ColyseusGameClient, PrivateStateData, PlayerPublicData } from '../network/colyseusClient.js';
import { UNITS, ALLIANCES, ABILITIES, SHOP_TIER_ODDS_BY_LEVEL, UNIT_COSTS } from '@tiny-tactics/data';
import { MatchPhase, PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';
import { RefreshCw, Lock, Unlock, ArrowUpCircle, Coins, ChevronDown, ShoppingBag } from 'lucide-react';
import { ShopUnitPreview } from './ShopUnitPreview.js';

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
  const [isCollapsed, setIsCollapsed] = React.useState(phase === 'combat');

  // Auto-collapse when combat begins, auto-expand when preparation begins
  React.useEffect(() => {
    if (phase === 'combat') {
      setIsCollapsed(true);
    } else if (phase === 'preparation') {
      setIsCollapsed(false);
    }
  }, [phase]);

  // Spacebar or 'D' hotkey to toggle shop
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  if (isCollapsed) {
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="glass-panel px-5 py-2 rounded-full border border-sky-400/50 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold shadow-2xl flex items-center gap-3 cursor-pointer transition hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-1.5 text-amber-300 font-mono font-extrabold">
            <Coins size={14} /> {player.gold} Gold
          </span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="flex items-center gap-1.5 text-sky-300">
            <ShoppingBag size={14} /> Open Shop <span className="text-[10px] text-slate-400 font-normal">[Space]</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5">
      {/* Tier Probability Bar & Collapse Button */}
      <div className="flex items-center gap-2">
        <div className="glass-panel px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-2.5 text-slate-400 border border-slate-700/60">
          <span className="text-slate-300">Level {player.level} Odds:</span>
          <span className="text-slate-200">T1: {odds[0]}%</span>
          <span className="text-emerald-400">T2: {odds[1]}%</span>
          <span className="text-sky-400">T3: {odds[2]}%</span>
          <span className="text-purple-400">T4: {odds[3]}%</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          title="Minimize Shop (Space)"
          className="glass-panel px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <span>Hide</span>
          <ChevronDown size={13} />
        </button>
      </div>

      <div className="glass-panel p-2.5 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
        {/* Left Side Buttons: Buy XP & Reroll & Lock */}
        <div className="flex flex-col gap-1.5">
          {/* Buy XP */}
          <button
            onClick={handleBuyXp}
            disabled={!isPrep || player.gold < PROTOCOL_CONSTANTS.XP_COST || player.level >= PROTOCOL_CONSTANTS.MAX_LEVEL}
            className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-1.5 text-xs font-bold transition border ${
              isPrep && player.gold >= PROTOCOL_CONSTANTS.XP_COST && player.level < PROTOCOL_CONSTANTS.MAX_LEVEL
                ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/30 cursor-pointer shadow-md'
                : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1">
              <ArrowUpCircle size={14} />
              <span>Buy XP</span>
            </div>
            <span className="flex items-center gap-0.5 text-amber-300 font-extrabold font-mono text-[11px]">
              <Coins size={11} /> 5
            </span>
          </button>

          {/* Reroll Shop */}
          <button
            onClick={handleReroll}
            disabled={!isPrep || player.gold < PROTOCOL_CONSTANTS.REROLL_COST}
            className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-1.5 text-xs font-bold transition border ${
              isPrep && player.gold >= PROTOCOL_CONSTANTS.REROLL_COST
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400/30 cursor-pointer shadow-md'
                : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1">
              <RefreshCw size={13} />
              <span>Reroll</span>
            </div>
            <span className="flex items-center gap-0.5 text-amber-300 font-extrabold font-mono text-[11px]">
              <Coins size={11} /> 2
            </span>
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={handleToggleLock}
            disabled={!isPrep}
            className={`px-2.5 py-1 rounded-xl flex items-center justify-center gap-1 text-[11px] font-semibold transition border ${
              privateState.shopLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400 border-slate-700'
            } cursor-pointer`}
          >
            {privateState.shopLocked ? <Lock size={12} /> : <Unlock size={12} />}
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
                  className="w-28 sm:w-32 h-36 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-center text-xs text-slate-600 font-semibold"
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
                className={`w-28 sm:w-32 h-36 rounded-xl p-2 border flex flex-col justify-between transition cursor-pointer select-none relative overflow-hidden group ${
                  canAfford && isPrep
                    ? 'bg-slate-900/95 hover:bg-slate-800/95 border-slate-700 hover:border-amber-400/80 shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Cost Pill */}
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    def.tier === 1 ? 'bg-slate-700 text-slate-300' :
                    def.tier === 2 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                    def.tier === 3 ? 'bg-sky-950 text-sky-400 border border-sky-500/40' :
                    'bg-purple-950 text-purple-400 border border-purple-500/40'
                  }`}>
                    T{def.tier}
                  </span>
                  <span className="flex items-center gap-0.5 font-black text-amber-400 text-xs">
                    <Coins size={11} /> {cost}
                  </span>
                </div>

                {/* 3D Model Preview / Name */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-[84px] h-[66px] flex items-center justify-center">
                    <ShopUnitPreview unitDef={def} />
                  </div>
                  <span className="font-extrabold text-[11px] text-slate-100 truncate w-full">{def.name}</span>
                </div>

                {/* Alliances Badges */}
                <div className="flex gap-1 justify-center flex-wrap">
                  {def.alliances.map(alKey => {
                    const al = ALLIANCES[alKey];
                    return (
                      <div
                        key={alKey}
                        title={al.name}
                        className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-slate-950/80 border border-slate-800/80"
                      >
                        <span>{al.icon}</span>
                        <span className="text-slate-300 font-semibold">{al.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Hover Popover with full stats & ability preview */}
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20 text-[10px]">
                  <div>
                    <div className="font-extrabold text-slate-100 text-[11px] truncate">{def.name}</div>
                    <div className="text-[9px] text-amber-400 font-bold uppercase">{def.shapeArchetype}</div>
                  </div>
                  <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                    <span className="font-bold text-sky-400 text-[9px] block">
                      {ABILITIES[def.abilityId]?.name || 'Ability'}
                    </span>
                    <p className="text-[9px] text-slate-300 leading-tight line-clamp-3">
                      {ABILITIES[def.abilityId]?.description || ''}
                    </p>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-300 font-semibold pt-0.5 border-t border-slate-800/80">
                    <span>⚔️ {def.baseAttack}</span>
                    <span>🛡️ {def.armor}</span>
                    <span>❤️ {def.baseHp}</span>
                    <span>🎯 {def.range}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
