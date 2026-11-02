import React from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

interface GameOverModalProps {
  winnerName: string;
  isWinner: boolean;
  rankings: { name: string; rank: number }[];
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerName,
  isWinner,
  rankings,
  onPlayAgain
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl flex flex-col items-center gap-6 text-center border border-slate-700/60 shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy size={36} />
          </div>
          <h2 className={`text-3xl font-black tracking-wide ${isWinner ? 'text-amber-400' : 'text-slate-100'}`}>
            {isWinner ? 'VICTORY!' : 'MATCH FINISHED'}
          </h2>
          <p className="text-slate-400 text-sm">
            Winner: <b className="text-slate-200">{winnerName}</b>
          </p>
        </div>

        {/* Final Standings */}
        <div className="w-full flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">
            Final Standings
          </h4>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {rankings.map((r, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center p-2.5 rounded-xl border text-sm ${
                  r.rank === 1
                    ? 'bg-amber-500/20 border-amber-500/40 font-bold text-amber-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs w-6">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}</span>
                  <span>{r.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={18} /> Play Again
        </button>
      </div>
    </div>
  );
};
