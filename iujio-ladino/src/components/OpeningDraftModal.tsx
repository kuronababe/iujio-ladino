import React, { useState } from 'react';
import { Card, EngasteNumber } from '../types/game';
import { CardView } from './CardView';
import { generateOpeningDraftChoices, autoSlotDraftedDeck, getPrimaryArchetype } from '../utils/draftEngine';
import { sounds } from '../utils/audio';

interface OpeningDraftModalProps {
  onDraftComplete: (deck: Record<EngasteNumber, Card>, primaryArchetype: string) => void;
}

export const OpeningDraftModal: React.FC<OpeningDraftModalProps> = ({ onDraftComplete }) => {
  const [pickIndex, setPickIndex] = useState<number>(0); // 0 to 11 (12 picks)
  const [draftedCards, setDraftedCards] = useState<Card[]>([]);
  const [chosenArchetype, setChosenArchetype] = useState<string | null>(null);

  // Generate current choices
  const [currentDraft, setCurrentDraft] = useState(() =>
    generateOpeningDraftChoices(0, [], null)
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handlePickCard = (card: Card) => {
    sounds.playEquip();

    const nextDrafted = [...draftedCards, card];
    setDraftedCards(nextDrafted);

    // If first card, lock in primary archetype
    let nextArchetype = chosenArchetype;
    if (!chosenArchetype) {
      nextArchetype = getPrimaryArchetype(card);
      setChosenArchetype(nextArchetype);
    }

    const nextPick = pickIndex + 1;
    if (nextPick >= 12) {
      // Draft complete! Auto-slot the 12 drafted cards
      const slottedDeck = autoSlotDraftedDeck(nextDrafted);
      sounds.playMatchVictory();
      onDraftComplete(slottedDeck, nextArchetype || 'Ladino');
      return;
    }

    // Proceed to next pick
    setPickIndex(nextPick);
    setSelectedCardId(null);
    const nextChoices = generateOpeningDraftChoices(nextPick, nextDrafted, nextArchetype);
    setCurrentDraft(nextChoices);
  };

  const selectedCard = currentDraft.choices.find((c) => c.id === selectedCardId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl p-5 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl flex flex-col items-center">
        {/* Top Header */}
        <div className="text-center mb-5">
          <div className="text-xs uppercase font-mono-num font-bold tracking-widest text-amber-400 mb-1">
            Calabouços de Maer · Draft Inicial ({pickIndex + 1} de 12)
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-black text-slate-100">
            Forje seu Baralho de 12 Engastes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1">
            Escolha 1 carta por rodada para montar seu baralho antes de enfrentar o calabouço.
          </p>

          {chosenArchetype && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs">
              <span>🎯 Afinidade de Arquétipo:</span>
              <strong className="font-bold">{chosenArchetype}</strong>
              <span className="text-[10px] text-slate-400">(+30% de presença)</span>
            </div>
          )}
        </div>

        {/* 3 Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mb-6">
          {currentDraft.choices.map((card) => {
            const isSelected = card.id === selectedCardId;
            const primaryArch = getPrimaryArchetype(card);
            const isArchSynergy = chosenArchetype && card.arquetipo.toLowerCase().includes(chosenArchetype.toLowerCase());

            return (
              <div
                key={card.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCardId(card.id);
                }}
                className={`
                  flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                  ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/40 scale-105 shadow-2xl shadow-amber-500/30 ring-2 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:scale-[1.02]'
                  }
                `}
              >
                {/* Synergy Badge */}
                {isArchSynergy ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 mb-2">
                    ★ Sinergia {primaryArch}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {primaryArch}
                  </span>
                )}

                <CardView card={card} size="md" isSelected={isSelected} />
              </div>
            );
          })}
        </div>

        {/* Confirm Pick Button */}
        <button
          disabled={!selectedCard}
          onClick={() => {
            if (selectedCard) handlePickCard(selectedCard);
          }}
          className={`
            w-full max-w-md py-4 rounded-2xl font-cinzel font-black text-sm transition-all
            ${
              selectedCard
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-600/40 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }
          `}
        >
          {selectedCard
            ? `Confirmar "${selectedCard.name}" (${pickIndex + 1}/12)`
            : 'Selecione uma Carta acima'}
        </button>

        {/* Progress Bar of 12 Draft Picks */}
        <div className="flex items-center gap-1.5 mt-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-mono-num font-bold transition-all ${
                i < pickIndex
                  ? 'bg-amber-400 text-slate-950'
                  : i === pickIndex
                  ? 'border border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
