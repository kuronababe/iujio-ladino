import React, { useState } from 'react';
import { Artifact } from '../types/game';
import { sounds } from '../utils/audio';

interface ArtifactDraftProps {
  choices: Artifact[];
  ownedArtifacts: Artifact[];
  onSelectArtifact: (artifact: Artifact) => void;
}

const RARITY_LABEL: Record<Artifact['rarity'], string> = {
  incomum: 'Incomum',
  raro: 'Raro',
};

const RARITY_COLOR: Record<Artifact['rarity'], string> = {
  incomum: 'text-cyan-400',
  raro: 'text-amber-400',
};

export const ArtifactDraft: React.FC<ArtifactDraftProps> = ({ choices, ownedArtifacts, onSelectArtifact }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedArtifact = choices.find((a) => a.id === selectedId);

  const handleConfirm = () => {
    if (!selectedArtifact) return;
    sounds.playEquip();
    onSelectArtifact(selectedArtifact);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-1">
          💰 Você abriu um Baú de Tesouro!
        </div>
        <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-100">
          Escolha 1 Artefato
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
          Artefatos concedem bônus permanentes para o resto da tentativa. Escolha com sabedoria!
        </p>
      </div>

      {/* Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mb-8">
        {choices.map((artifact) => {
          const isSelected = artifact.id === selectedId;
          const alreadyOwned = ownedArtifacts.some((a) => a.id === artifact.id);

          return (
            <div
              key={artifact.id}
              onClick={() => {
                sounds.playClick();
                setSelectedId(artifact.id);
              }}
              className={`
                flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/30 scale-105 shadow-xl shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:scale-[1.02]'
                }
              `}
            >
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${RARITY_COLOR[artifact.rarity]}`}>
                {RARITY_LABEL[artifact.rarity]}
              </div>

              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mb-3">
                {artifact.icon}
              </div>

              <div className="font-cinzel font-bold text-sm text-slate-100 mb-1">{artifact.name}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{artifact.description}</p>

              {alreadyOwned && (
                <div className="mt-2 text-[10px] font-bold text-rose-400 uppercase">Já possui (efeito não acumula)</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      <button
        disabled={!selectedId}
        onClick={handleConfirm}
        className={`
          px-10 py-3.5 rounded-xl font-cinzel font-bold text-sm transition-all
          ${
            selectedId
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-600/30 hover:scale-105 active:scale-95 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }
        `}
      >
        {selectedId ? `Guardar "${selectedArtifact?.name}"` : 'Selecione um Artefato'}
      </button>
    </div>
  );
};
