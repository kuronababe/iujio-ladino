import React, { useState } from 'react';
import { Card, EngasteNumber } from '../types/game';
import { CardView } from './CardView';
import { sounds } from '../utils/audio';

interface DeckBuilderProps {
  deck: Record<EngasteNumber, Card>;
  collection: Card[];
  onSaveDeck: (newDeck: Record<EngasteNumber, Card>, newCollection: Card[]) => void;
  onReadyToFight: () => void;
}

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  deck,
  collection,
  onSaveDeck,
  onReadyToFight,
}) => {
  const [activeDeck, setActiveDeck] = useState<Record<EngasteNumber, Card>>({ ...deck });
  const [activeCollection, setActiveCollection] = useState<Card[]>([...collection]);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    source: 'deck' | 'collection';
    socket?: EngasteNumber;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<{
    card: Card;
    source: 'deck' | 'collection';
    sourceSocket?: EngasteNumber;
  } | null>(null);

  const showError = (msg: string) => {
    sounds.playError();
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  // Attempt to slot a card into targetSocket
  const trySlotCard = (cardToSlot: Card, targetSocket: EngasteNumber, fromSource: 'deck' | 'collection', sourceSocket?: EngasteNumber) => {
    // 1. Compatibility check
    if (!cardToSlot.sockets.includes(targetSocket)) {
      showError(
        `"${cardToSlot.name}" não é compatível com o Engaste ${targetSocket}! Engastes válidos: [${cardToSlot.sockets.join(', ')}]`
      );
      return false;
    }

    const currentOccupant = activeDeck[targetSocket];

    // If card is already in this exact socket, do nothing
    if (fromSource === 'deck' && sourceSocket === targetSocket) {
      setSelectedCard(null);
      return true;
    }

    // 2. Prevent duplicates: Check if cardToSlot is already in another socket
    if (fromSource === 'collection') {
      const alreadyInSlot = (Object.entries(activeDeck) as [string, Card][]).find(
        ([s, c]) => c.id === cardToSlot.id && Number(s) !== targetSocket
      );
      if (alreadyInSlot) {
        showError(`"${cardToSlot.name}" já está equipada no Engaste ${alreadyInSlot[0]}!`);
        return false;
      }
    }

    // 3. If swapping from another socket:
    if (fromSource === 'deck' && sourceSocket) {
      // Check if currentOccupant is compatible with sourceSocket
      if (!currentOccupant.sockets.includes(sourceSocket)) {
        showError(
          `Troca inválida: "${currentOccupant.name}" não cabe no Engaste ${sourceSocket}! Válidos: [${currentOccupant.sockets.join(', ')}]`
        );
        return false;
      }

      // Legal swap between two deck sockets
      const nextDeck = { ...activeDeck };
      nextDeck[targetSocket] = cardToSlot;
      nextDeck[sourceSocket] = currentOccupant;
      setActiveDeck(nextDeck);
      sounds.playEquip();
      setSelectedCard(null);
      onSaveDeck(nextDeck, activeCollection);
      return true;
    }

    // 4. If equipping from collection:
    if (fromSource === 'collection') {
      const nextDeck = { ...activeDeck, [targetSocket]: cardToSlot };
      // Replace occupant into collection, remove newly equipped card from collection
      const nextCollection = activeCollection.filter((c) => c.id !== cardToSlot.id);
      if (currentOccupant) {
        nextCollection.push(currentOccupant);
      }
      setActiveDeck(nextDeck);
      setActiveCollection(nextCollection);
      sounds.playEquip();
      setSelectedCard(null);
      onSaveDeck(nextDeck, nextCollection);
      return true;
    }

    return false;
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, card: Card, source: 'deck' | 'collection', socket?: EngasteNumber) => {
    setDraggedCard({ card, source, sourceSocket: socket });
    e.dataTransfer.setData('text/plain', card.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSocket = (e: React.DragEvent, targetSocket: EngasteNumber) => {
    e.preventDefault();
    if (!draggedCard) return;
    trySlotCard(draggedCard.card, targetSocket, draggedCard.source, draggedCard.sourceSocket);
    setDraggedCard(null);
  };

  // Tap-to-select & Tap-to-place logic (Great for mobile & quick clicks)
  const handleSocketClick = (socketNumber: EngasteNumber) => {
    sounds.playClick();
    if (selectedCard) {
      // If we already selected a card, try to place it in this socket
      trySlotCard(selectedCard.card, socketNumber, selectedCard.source, selectedCard.socket);
    } else {
      // Otherwise, select the card in this socket
      setSelectedCard({
        card: activeDeck[socketNumber],
        source: 'deck',
        socket: socketNumber,
      });
    }
  };

  const handleCollectionCardClick = (card: Card) => {
    sounds.playClick();
    if (selectedCard && selectedCard.source === 'deck' && selectedCard.socket) {
      // If a deck socket is selected, try to place this collection card into that socket!
      trySlotCard(card, selectedCard.socket, 'collection');
    } else if (selectedCard?.card.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard({
        card,
        source: 'collection',
      });
    }
  };

  const socketsList: EngasteNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-amber-200">
            Montador de Baralho (12 Engastes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Arraste ou clique para trocar cartas entre os engastes e a sua reserva. Cada engaste aceita apenas cartas com o valor correspondente.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onReadyToFight();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-cinzel font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
        >
          ⚔️ Pronto para a Batalha
        </button>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selected Card Hint Pill */}
      {selectedCard && (
        <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>👉 Carta selecionada: <strong>{selectedCard.card.name}</strong></span>
            <span className="text-slate-400 font-mono-num">(Engastes válidos: [{selectedCard.card.sockets.join(', ')}])</span>
          </div>
          <span className="text-xs text-amber-400 underline cursor-pointer" onClick={() => setSelectedCard(null)}>
            Cancelar Seleção
          </span>
        </div>
      )}

      {/* 12 Active Deck Sockets Grid with Filter Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-slate-200 text-sm sm:text-base">
              Baralho Ativo (12 Cartas Obrigatórias)
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-amber-400 font-mono-num font-semibold">
              12 / 12 Engastes Preenchidos
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Formato de carta vertical clássico de TCG · Clique ou arraste para trocar
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {socketsList.map((socketNum) => {
            const card = activeDeck[socketNum];
            const isTargetCompatible = selectedCard ? selectedCard.card.sockets.includes(socketNum) : false;
            const isCurrentlySelected = selectedCard?.source === 'deck' && selectedCard.socket === socketNum;

            return (
              <div
                key={socketNum}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSocket(e, socketNum)}
                className={`
                  relative flex flex-col items-center rounded-2xl p-3 border transition-all duration-150
                  bg-slate-900/80 shadow-md
                  ${
                    selectedCard
                      ? isTargetCompatible
                        ? 'border-emerald-500/80 bg-emerald-950/25 ring-2 ring-emerald-500/50 shadow-emerald-900/40'
                        : 'border-slate-800 opacity-60'
                      : 'border-slate-800/90 hover:border-slate-700'
                  }
                  ${isCurrentlySelected ? 'ring-3 ring-amber-400 bg-amber-950/20' : ''}
                `}
              >
                {/* Socket Number Badge Header */}
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-600/10 text-amber-300 font-mono-num font-black text-xs border border-amber-500/50 shadow-sm">
                      {socketNum}
                    </span>
                    <span className="text-[11px] uppercase font-cinzel font-bold tracking-wider text-slate-300">
                      Engaste #{socketNum}
                    </span>
                  </div>

                  {selectedCard && isTargetCompatible ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/50 animate-pulse">
                      Compatível ✓
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-mono-num">
                      Aceita E: {socketNum}
                    </span>
                  )}
                </div>

                {/* Card slotted in this socket */}
                {card ? (
                  <div className="w-full flex justify-center py-1">
                    <CardView
                      card={card}
                      activeSocket={socketNum}
                      size="sm"
                      isSelected={isCurrentlySelected}
                      onClick={() => handleSocketClick(socketNum)}
                      onDragStart={(e) => handleDragStart(e, card, 'deck', socketNum)}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => handleSocketClick(socketNum)}
                    className="w-full min-h-[260px] border-2 border-dashed border-slate-700/60 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-xs text-slate-500 hover:text-slate-400 hover:border-amber-500/50 cursor-pointer transition-colors"
                  >
                    <span className="text-3xl mb-2">📭</span>
                    <span className="font-bold text-slate-300 text-sm">Engaste {socketNum} Vazio</span>
                    <span className="text-[11px] mt-1 text-slate-400 max-w-[150px]">
                      Clique para equipar uma carta compatível da reserva
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reserve Collection / Coleção Reserva */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="font-cinzel font-bold text-slate-100 text-base">
              Coleção Reserva ({activeCollection.length} {activeCollection.length === 1 ? 'Carta' : 'Cartas'})
            </h3>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              Cartas conquistadas nos drafts de Maer
            </span>
          </div>
          {activeCollection.length > 0 && (
            <span className="text-[11px] text-amber-300/80">
              💡 Dica: Clique em uma carta da reserva e depois no engaste desejado
            </span>
          )}
        </div>

        {activeCollection.length === 0 ? (
          <div className="py-10 text-center text-xs sm:text-sm text-slate-400 italic bg-black/30 rounded-xl border border-slate-800/60">
            Nenhuma carta na reserva no momento. Vença as batalhas de Maer para obter mais cartas no Draft de Recompensa!
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
            {activeCollection.map((card) => {
              const isSelected = selectedCard?.card.id === card.id;
              return (
                <div key={card.id} className="shrink-0 flex flex-col items-center">
                  <CardView
                    card={card}
                    size="sm"
                    isSelected={isSelected}
                    onClick={() => handleCollectionCardClick(card)}
                    onDragStart={(e) => handleDragStart(e, card, 'collection')}
                    className="hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={() => handleCollectionCardClick(card)}
                    className="mt-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                  >
                    {isSelected ? '✓ Selecionada' : 'Selecionar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
