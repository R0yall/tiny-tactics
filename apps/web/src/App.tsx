import React, { useEffect, useRef, useState } from 'react';
import { ColyseusGameClient } from './network/colyseusClient.js';
import { GameScene } from './game/GameScene.js';
import { LobbyScreen } from './ui/LobbyScreen.js';
import { HUD } from './ui/HUD.js';
import { ShopPanel } from './ui/ShopPanel.js';
import { AlliancePanel } from './ui/AlliancePanel.js';
import { UnitDetailsModal } from './ui/UnitDetailsModal.js';
import { GameOverModal } from './ui/GameOverModal.js';
import { PlacedUnit, UnitPlacement } from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';
import { UnitPortraitGenerator } from './game/units/UnitPortraitGenerator.js';

interface DamagePopup {
  id: string;
  damage: number;
  screenPos: { x: number; y: number };
}

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [client] = useState(() => new ColyseusGameClient());
  const sceneRef = useRef<GameScene | null>(null);

  const [, setTick] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<PlacedUnit | null>(null);
  const [gameOverData, setGameOverData] = useState<{ winnerName: string; rankings: any[] } | null>(null);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);

  useEffect(() => {
    // Preload rotating 3D turntables into lightweight cached frames
    UnitPortraitGenerator.preloadAll(UNITS);
  }, []);

  useEffect(() => {
    if (containerRef.current && !sceneRef.current) {
      const scene = new GameScene(containerRef.current);
      sceneRef.current = scene;

      scene.onUnitSelected = unit => setSelectedUnit(unit);
      scene.onMoveRequested = (instanceId: string, target: UnitPlacement) => {
        client.sendCommand({ type: 'moveUnit', instanceId, target });
      };
      scene.onSpawnDamageText = (damage: number, screenPos: { x: number; y: number }) => {
        const id = `dmg_${Math.random()}`;
        setDamagePopups(prev => [...prev, { id, damage, screenPos }]);
        setTimeout(() => {
          setDamagePopups(prev => prev.filter(p => p.id !== id));
        }, 1200);
      };
    }

    client.onStateChanged = () => {
      setTick(t => t + 1);

      if (sceneRef.current && client.phase === 'preparation') {
        const me = client.players.get(client.playerId);
        if (me) {
          sceneRef.current.syncPreparationUnits(me.boardUnits, client.privateState.benchUnits);
        }
      }
    };

    client.onCombatStarted = (_oppName, _isGhost, sim) => {
      if (sceneRef.current) {
        sceneRef.current.startCombatPlayback(sim);
      }
      setSelectedUnit(null);
    };

    client.onUnitMerged = (upgradedUnitId, _newStar) => {
      if (sceneRef.current) {
        sceneRef.current.playUpgradePop(upgradedUnitId);
      }
    };

    client.onMatchEnded = (winnerName, rankings) => {
      setGameOverData({ winnerName, rankings });
    };

    // Try auto-resuming disconnected session if available
    client.resumePreviousSession();

    return () => {
      sceneRef.current?.dispose();
      client.leave();
    };
  }, [client]);

  const me = client.players.get(client.playerId);
  const isLobby = client.phase === 'lobby';

  const handlePlayAgain = () => {
    setGameOverData(null);
    window.location.reload();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Floating 2D Damage Numbers */}
      {damagePopups.map(p => (
        <div
          key={p.id}
          className="floating-damage text-rose-400"
          style={{ left: `${p.screenPos.x}px`, top: `${p.screenPos.y}px` }}
        >
          -{p.damage}
        </div>
      ))}

      {/* Lobby Overlay */}
      {isLobby && (
        <LobbyScreen
          client={client}
          players={client.players}
          roomCode={client.roomCode}
          isHost={client.isHost}
        />
      )}

      {/* Active Game HUD & Overlays */}
      {!isLobby && me && (
        <>
          <HUD
            client={client}
            players={client.players}
            phase={client.phase}
            phaseTimeRemaining={client.phaseTimeRemaining}
            roundNumber={client.roundNumber}
            isHost={client.isHost}
          />

          <AlliancePanel activeAlliances={me.activeAlliances} />

          <ShopPanel
            client={client}
            privateState={client.privateState}
            player={me}
            phase={client.phase}
          />

          <UnitDetailsModal
            unit={selectedUnit}
            onClose={() => setSelectedUnit(null)}
            client={client}
            phase={client.phase}
          />
        </>
      )}

      {/* Game Over Screen */}
      {gameOverData && (
        <GameOverModal
          winnerName={gameOverData.winnerName}
          isWinner={gameOverData.winnerName === me?.name}
          rankings={gameOverData.rankings}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};
