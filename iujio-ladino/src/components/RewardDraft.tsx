import React, { useState } from 'react';
import { Card, EngasteNumber } from '../types/game';
import { CardView } from './CardView';
import { sounds } from '../utils/audio';

interface RewardDraftProps {
  choices: Card[];
  currentMatchNumber: number; // 1 to 10
  currentDeck: Record<EngasteNumber, Card>;
  onSelectCard: (selectedCard: Card) => void;
}

export const RewardDraft: React.FC<RewardDraftProps> = ({
  choices,
  currentMatchNumber,
  currentDeck,
  onSelectCard,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCard = choices.find((c) => c.id === selectedId);

  const handleConfirm = () => {
    if (!selectedCard) return;
    sounds.playEquip();
    onSelectCard(selectedCard);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-1">
          Vitória na Batalha {currentMatchNumber} / 10!
        </div>
        <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-100">
          Draft de Recompensa: Escolha 1 Carta
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
          Selecione uma das 3 cartas reveladas para reforçar o seu baralho. Cartas com engastes maiores são mais raras e poderosas!
        </p>
      </div>

      {/* 3 Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-8">
        {choices.map((card) => {
          const isSelected = card.id === selectedId;
          const minSocket = Math.min(...card.sockets);
          const rarityLabel =
            minSocket >= 9 ? 'Rara / Dragão' : minSocket >= 5 ? 'Incomum' : 'Básica';
          const rarityColor =
            minSocket >= 9 ? 'text-amber-400' : minSocket >= 5 ? 'text-cyan-400' : 'text-slate-400';

          return (
            <div
              key={card.id}
              onClick={() => {
                sounds.playClick();
                setSelectedId(card.id);
              }}
              className={`
                flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/30 scale-105 shadow-xl shadow-amber-500/20'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:scale-[1.02]'
                }
              `}
            >
              {/* Rarity Tag */}
              <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${rarityColor}`}>
                Engastes [{card.sockets.join(', ')}] · {rarityLabel}
              </div>

              {/* Card View */}
              <CardView card={card} size="md" isSelected={isSelected} />

              {/* Fit check */}
              <div className="mt-3 text-[11px] text-slate-400 text-center">
                Pode ser equipada nos Engastes:
                <div className="flex items-center justify-center gap-1 mt-1 font-mono-num font-bold">
                  {card.sockets.map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
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
        {selectedId ? `Adicionar "${selectedCard?.name}" à Coleção` : 'Selecione uma Carta'}
      </button>
    </div>
  );
};
