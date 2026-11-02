import React, { useState, useEffect } from 'react';
import { ColyseusGameClient, PlayerPublicData } from '../network/colyseusClient.js';
import { Copy, Users, Play, CheckCircle, Clock } from 'lucide-react';

interface LobbyScreenProps {
  client: ColyseusGameClient;
  players: Map<string, PlayerPublicData>;
  roomCode: string;
  isHost: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  client,
  players,
  roomCode,
  isHost
}) => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('tt_player_name') || 'Guest' + Math.floor(1000 + Math.random() * 9000));
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [openLobbies, setOpenLobbies] = useState<{ roomId: string; roomCode: string; clients: number; maxClients: number }[]>([]);
  const [showLobbyBrowser, setShowLobbyBrowser] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('tt_player_name', playerName);
  }, [playerName]);

  const fetchOpenLobbies = async () => {
    try {
      const serverHttp = import.meta.env.VITE_SERVER_URL?.replace('ws', 'http') || `http://${window.location.hostname}:2567`;
      const res = await fetch(`${serverHttp}/api/lobbies`);
      const data = await res.json();
      setOpenLobbies(data.lobbies || []);
      setShowLobbyBrowser(true);
    } catch (err: any) {
      setErrorMsg('Failed to fetch open lobbies');
    }
  };

  const handleCreate = async () => {
    try {
      setErrorMsg('');
      await client.createLobby(playerName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create lobby');
    }
  };

  const handleJoin = async (codeToJoin?: string) => {
    try {
      setErrorMsg('');
      const code = codeToJoin || joinCodeInput;
      if (!code) {
        setErrorMsg('Please enter a room code');
        return;
      }
      await client.joinByCode(code, playerName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join lobby');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleReady = () => {
    const me = players.get(client.playerId);
    if (!me) return;
    client.sendCommand({ type: 'setReady', ready: !me.isReady });
  };

  const handleStartMatch = () => {
    client.sendCommand({ type: 'startMatch' });
  };

  const playerList = Array.from(players.values());
  const canStart = isHost && playerList.length >= 2 && playerList.every(p => p.isHost || p.isReady);
  const me = players.get(client.playerId);

  // If not yet joined a room
  if (!roomCode) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl flex flex-col items-center gap-6 text-center border border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚔️</span>
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              TINY TACTICS
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Playable browser 3D fantasy auto-battler for 2–8 players.
          </p>

          {errorMsg && (
            <div className="w-full py-2 px-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="w-full text-left">
            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Display Name</label>
            <input
              type="text"
              value={playerName}
              maxLength={16}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500 text-sm"
              placeholder="Enter your name"
            />
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleCreate}
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users size={18} /> Create New Lobby
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ROOM CODE"
                value={joinCodeInput}
                maxLength={6}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-2/3 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl uppercase tracking-widest font-mono text-center text-sm focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleJoin()}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition border border-slate-600 cursor-pointer text-sm"
              >
                Join Code
              </button>
            </div>

            <button
              onClick={fetchOpenLobbies}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
            >
              Browse Open Lobbies
            </button>
          </div>

          {showLobbyBrowser && (
            <div className="w-full border-t border-slate-800 pt-4 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Lobbies</h3>
              {openLobbies.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">No active open lobbies found. Create one!</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {openLobbies.map(lob => (
                    <div key={lob.roomId} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div>
                        <span className="font-mono text-amber-400 font-bold text-sm">{lob.roomCode}</span>
                        <span className="text-xs text-slate-400 ml-2">({lob.clients}/{lob.maxClients})</span>
                      </div>
                      <button
                        onClick={() => handleJoin(lob.roomCode)}
                        className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inside Joined Lobby Waiting Room
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-xl p-8 rounded-2xl flex flex-col gap-6 border border-slate-700/60">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">LOBBY ROOM</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-mono font-black tracking-widest text-amber-400">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition cursor-pointer"
                title="Copy Room Code"
              >
                <Copy size={16} />
              </button>
              {copiedCode && <span className="text-xs text-emerald-400 font-semibold">Copied!</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-sm text-slate-300">
            <Users size={16} />
            <span>{playerList.length} / 8 Players</span>
          </div>
        </div>

        {errorMsg && (
          <div className="py-2 px-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* 8 Seats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, idx) => {
            const player = playerList[idx];
            if (player) {
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    player.id === client.playerId
                      ? 'bg-sky-950/40 border-sky-500/50'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {player.isHost && <span className="text-xs text-amber-400" title="Host">👑</span>}
                        {player.id === client.playerId && <span className="text-[10px] text-sky-400 uppercase font-bold">(You)</span>}
                      </div>
                      <div className="text-xs text-slate-400">
                        {player.isHost ? 'Host' : player.isReady ? 'Ready' : 'Not ready'}
                      </div>
                    </div>
                  </div>
                  <div>
                    {player.isHost || player.isReady ? (
                      <CheckCircle size={18} className="text-emerald-400" />
                    ) : (
                      <Clock size={18} className="text-slate-500" />
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty_${idx}`}
                className="p-3 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 flex items-center justify-center text-xs text-slate-600 font-medium"
              >
                Slot {idx + 1} Open
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          {!isHost && (
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3 px-4 font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                me?.isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
              }`}
            >
              <CheckCircle size={18} />
              {me?.isReady ? 'Ready (Click to unready)' : 'Ready Up'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartMatch}
              disabled={!canStart}
              className={`flex-1 py-3 px-4 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play size={18} fill="currentColor" />
              Start Match ({playerList.length < 2 ? 'Need 2+ Players' : !playerList.every(p => p.isHost || p.isReady) ? 'Waiting for Ready' : 'Ready to Start'})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
