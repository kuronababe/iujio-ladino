import React from 'react';
import { RunState } from '../types/game';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  run: RunState;
  onRestartRun: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ run, onRestartRun }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-3xl mb-4 shadow-lg">
          💀
        </div>

        <div className="text-xs uppercase font-bold tracking-widest text-rose-400 mb-1">
          Capturado pelas Sombras de Maer
        </div>

        <h2 className="text-3xl font-cinzel font-black text-slate-100 mb-2">
          Fim da Fuga!
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          Você perdeu todas as suas Vidas. Os guardas de Aleister arrastaram você de volta para as masmorras frias de Maer. Reúna sua coragem e tente escapar novamente!
        </p>

        {/* Stats card */}
        <div className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 mb-6 grid grid-cols-2 gap-3 text-left">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Vitórias Conquistadas</div>
            <div className="text-xl font-mono-num font-extrabold text-amber-300">
              {run.currentMatchIndex} / 10
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total de Rodadas Vencidas</div>
            <div className="text-xl font-mono-num font-extrabold text-emerald-400">
              {run.stats.roundsWon}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Cartas Colecionadas</div>
            <div className="text-xl font-mono-num font-extrabold text-indigo-300">
              {12 + run.collection.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Habilidades Clutches</div>
            <div className="text-xl font-mono-num font-extrabold text-rose-400">
              {run.stats.clutchAbilitiesUsed}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onRestartRun();
          }}
          className="w-full py-4 rounded-xl font-cinzel font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          🔄 Iniciar Nova Tentativa
        </button>
      </div>
    </div>
  );
};
