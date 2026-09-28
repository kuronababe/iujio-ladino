import React, { useState } from 'react';
import { TalentId } from '../types/game';
import { IUJIO_TALENTS } from '../data/talents';
import { sounds } from '../utils/audio';

interface TalentSelectorModalProps {
  currentTalent: TalentId;
  onSelectTalent: (talentId: TalentId) => void;
  onClose: () => void;
}

export const TalentSelectorModal: React.FC<TalentSelectorModalProps> = ({
  currentTalent,
  onSelectTalent,
  onClose,
}) => {
  const [selected, setSelected] = useState<TalentId>(currentTalent);

  const handleConfirm = () => {
    sounds.playEquip();
    onSelectTalent(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Preparação de Batalha
            </div>
            <h2 className="text-2xl font-cinzel font-bold text-slate-100">
              Escolha seu Talento de Iujio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecione 1 talento especial ativo para toda a duração desta partida.
            </p>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 4 Talents list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IUJIO_TALENTS.map((talent) => {
            const isChosen = selected === talent.id;
            return (
              <div
                key={talent.id}
                onClick={() => {
                  sounds.playClick();
                  setSelected(talent.id);
                }}
                className={`
                  p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between
                  ${
                    isChosen
                      ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                  }
                `}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{talent.icon}</span>
                    <span className="font-cinzel font-bold text-sm text-slate-100">
                      {talent.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {talent.description}
                  </p>
                </div>

                <div className="mt-3 text-right">
                  <span
                    className={`text-[11px] font-bold ${
                      isChosen ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {isChosen ? '✓ Selecionado' : 'Clique para Escolher'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 rounded-xl font-cinzel font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
        >
          Confirmar Talento e Lutar
        </button>
      </div>
    </div>
  );
};
