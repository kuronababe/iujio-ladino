import React from 'react';
import { RunState } from '../types/game';
import { sounds } from '../utils/audio';

interface VictoryModalProps {
  run: RunState;
  onRestartRun: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ run, onRestartRun }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/20 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4 shadow-xl animate-bounce">
          👑
        </div>

        <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-1">
          Fuga de Maer Conquistada!
        </div>

        <h2 className="text-3xl sm:text-4xl font-cinzel font-black text-amber-200 mb-2">
          ALEISTER FOI DERROTADO!
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
          Você superou todos os 10 níveis do calabouço de Maer, subjugou o Mago Louco em seu próprio trono e escapou para a superfície com sua liberdade e os tesouros de Iujio!
        </p>

        {/* Stats card */}
        <div className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 mb-6 grid grid-cols-2 gap-3 text-left">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Combates Vencidos</div>
            <div className="text-xl font-mono-num font-extrabold text-amber-300">
              {run.currentMatchIndex} (Campeão!)
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Vidas Finais</div>
            <div className="text-xl font-mono-num font-extrabold text-rose-400">
              {run.hearts} ❤️ Restante{run.hearts > 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total de Rodadas Vencidas</div>
            <div className="text-xl font-mono-num font-extrabold text-emerald-400">
              {run.stats.roundsWon}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Habilidades Clutches</div>
            <div className="text-xl font-mono-num font-extrabold text-indigo-400">
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
          🏆 Iniciar Nova Jornada
        </button>
      </div>
    </div>
  );
};
