import React, { useEffect, useState } from 'react';
import {
  Artifact,
  Card,
  CombatRoundState,
  EngasteNumber,
  MatchState,
  RunState,
  TalentId,
} from './types/game';
import { getStarterCollection, getStarterDeck } from './data/cards';
import { generateOpponentDeck, MAER_OPPONENTS_POOL } from './data/opponents';
import { generateDraftChoices } from './utils/draftEngine';
import { generateDungeonMap } from './utils/mapGenerator';
import { getArtifactDraftChoices } from './data/artifacts';
import { sounds } from './utils/audio';

import { RunLadder } from './components/RunLadder';
import { DeckBuilder } from './components/DeckBuilder';
import { DuelBoard } from './components/DuelBoard';
import { RewardDraft } from './components/RewardDraft';
import { ArtifactDraft } from './components/ArtifactDraft';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { RulebookModal } from './components/RulebookModal';
import { TalentSelectorModal } from './components/TalentSelectorModal';
import { OpeningDraftModal } from './components/OpeningDraftModal';

type AppScreen = 'TITLE_SCREEN' | 'RUN_LADDER' | 'DECK_BUILDER' | 'COMBAT' | 'REWARD_DRAFT' | 'ARTIFACT_DRAFT';

// Applies a Heart node's outcome to a run: heals 1 missing heart, or if already
// at full health and below the 3-heart cap, raises max hearts by 1 instead.
function applyHeartNode(run: RunState): { next: RunState; message: string } {
  if (run.hearts < run.maxHearts) {
    return { next: { ...run, hearts: run.hearts + 1 }, message: '❤️ Vida recuperada!' };
  }
  if (run.maxHearts < 3) {
    const newMax = run.maxHearts + 1;
    return {
      next: { ...run, maxHearts: newMax, hearts: newMax },
      message: `💛 Vida máxima aumentada para ${newMax}!`,
    };
  }
  return { next: run, message: '❤️ Você já está com a vida cheia.' };
}

const IUJIO_COVER_IMG = '/src/assets/images/cover-oficial.webp';
const IUJIO_TITLE_LOGO = '/src/assets/images/title-logo-oficial.png';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('TITLE_SCREEN');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRulebookOpen, setIsRulebookOpen] = useState<boolean>(false);
  const [isTalentModalOpen, setIsTalentModalOpen] = useState<boolean>(false);
  const [isOpeningDraftOpen, setIsOpeningDraftOpen] = useState<boolean>(false);
  const [selectedTalent, setSelectedTalent] = useState<TalentId>('PERFECT_CURVE');
  const [customCover, setCustomCover] = useState<string | null>(() => {
    try {
      return localStorage.getItem('iujio_custom_cover');
    } catch {
      return null;
    }
  });

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomCover(dataUrl);
        try {
          localStorage.setItem('iujio_custom_cover', dataUrl);
        } catch {
          // localStorage full or restricted
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Active Run State
  const [run, setRun] = useState<RunState>(() => createFreshRun());

  // Active Match State (when in COMBAT)
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);

  // Active Draft Choices (when in REWARD_DRAFT / ARTIFACT_DRAFT)
  const [draftChoices, setDraftChoices] = useState<Card[]>([]);
  const [artifactChoices, setArtifactChoices] = useState<Artifact[]>([]);

  // The map node currently being resolved (combat in progress, or awaiting artifact pick)
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);

  // Transient feedback for Heart nodes ("❤️ Vida recuperada!" etc.)
  const [heartToast, setHeartToast] = useState<string | null>(null);
  useEffect(() => {
    if (!heartToast) return;
    const t = setTimeout(() => setHeartToast(null), 2600);
    return () => clearTimeout(t);
  }, [heartToast]);

  // Function to create fresh Roguelike run
  function createFreshRun(): RunState {
    const starterDeck = getStarterDeck();
    const starterColl = getStarterCollection();

    return {
      hearts: 2, // Starts with 2 hearts
      maxHearts: 2, // Can grow up to 3 via Heart nodes
      currentMatchIndex: 0,
      deck: starterDeck,
      collection: starterColl,
      primaryArchetype: null,
      runSeed: Date.now(),
      map: generateDungeonMap(),
      currentNodeId: null,
      visitedNodeIds: [],
      artifacts: [],
      isCompleted: false,
      isDefeated: false,
      stats: {
        matchesWon: 0,
        matchesLost: 0,
        roundsWon: 0,
        highestRoll: 0,
        totalDamageDealt: 0,
        clutchAbilitiesUsed: 0,
      },
    };
  }

  // Toggle audio
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playClick();
  };

  // Start new run from title or game over -> Opens Initial Draft
  const handleStartRun = () => {
    sounds.playClick();
    const fresh = createFreshRun();
    setRun(fresh);
    setIsOpeningDraftOpen(true);
  };

  // Callback when initial draft completes
  const handleOpeningDraftComplete = (slottedDeck: Record<EngasteNumber, Card>, primaryArch: string) => {
    setRun((prev) => ({
      ...prev,
      deck: slottedDeck,
      primaryArchetype: primaryArch,
    }));
    setIsOpeningDraftOpen(false);
    setScreen('RUN_LADDER');
  };

  // Resolve clicking a node on the Dungeon Map, based on its type
  const handleSelectNode = (nodeId: string) => {
    const node = run.map.nodes[nodeId];
    if (!node) return;

    if (node.type === 'COMBAT' || node.type === 'BOSS') {
      startBattleForNode(nodeId);
      return;
    }

    if (node.type === 'TREASURE') {
      sounds.playClick();
      setArtifactChoices(getArtifactDraftChoices(run.artifacts.map((a) => a.id)));
      setPendingNodeId(nodeId);
      setScreen('ARTIFACT_DRAFT');
      return;
    }

    if (node.type === 'HEART') {
      sounds.playClick();
      const { next, message } = applyHeartNode(run);
      setRun(next);
      setHeartToast(message);
      setRun((prev) => ({
        ...prev,
        currentNodeId: nodeId,
        visitedNodeIds: [...prev.visitedNodeIds, nodeId],
      }));
    }
  };

  // Start a battle for a COMBAT or BOSS node
  const startBattleForNode = (nodeId: string) => {
    const node = run.map.nodes[nodeId];
    const currentOpponent = node ? MAER_OPPONENTS_POOL.find((o) => o.id === node.opponentId) : undefined;
    if (!node || !currentOpponent) return;

    sounds.playClash();
    const oppDeckRecord = generateOpponentDeck(currentOpponent);

    const playerRemaining = (Object.entries(run.deck) as [string, Card][]).map(([s, c]) => ({
      socket: Number(s) as EngasteNumber,
      card: c,
    }));
    const opponentRemaining = (Object.entries(oppDeckRecord) as [string, Card][]).map(([s, c]) => ({
      socket: Number(s) as EngasteNumber,
      card: c,
    }));

    const newMatch: MatchState = {
      currentMatchIndex: run.currentMatchIndex,
      opponent: currentOpponent,
      selectedTalent,
      playerWins: 0,
      opponentWins: 0,
      draws: 0,
      currentRoundNumber: 1,
      roundHistory: [],
      currentRound: null,
      playerDeckRecord: run.deck,
      opponentDeckRecord: oppDeckRecord,
      playerDeckRemaining: playerRemaining,
      opponentDeckRemaining: opponentRemaining,
      playerUniversalAbilityUsed: false,
      opponentUniversalAbilityUsed: false,
      playerUsedAbilityType: null,
      opponentUsedAbilityType: null,
      matchWinner: null,
    };

    setActiveMatch(newMatch);
    setPendingNodeId(nodeId);
    setScreen('COMBAT');
  };

  // Handle a round completed inside DuelBoard
  const handleRoundComplete = (round: CombatRoundState) => {
    if (!activeMatch) return;

    const isPlayerWin = round.winner === 'player';
    const isOpponentWin = round.winner === 'opponent';

    // Update match state
    setActiveMatch((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        playerWins: isPlayerWin ? prev.playerWins + 1 : prev.playerWins,
        opponentWins: isOpponentWin ? prev.opponentWins + 1 : prev.opponentWins,
        draws: round.winner === 'draw' ? prev.draws + 1 : prev.draws,
        currentRoundNumber: prev.currentRoundNumber + 1,
        roundHistory: [...prev.roundHistory, round],
        playerUniversalAbilityUsed: prev.playerUniversalAbilityUsed || !!round.playerUsedAbility,
        opponentUniversalAbilityUsed: prev.opponentUniversalAbilityUsed || !!round.opponentUsedAbility,
      };
    });

    // Update run stats
    setRun((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        roundsWon: isPlayerWin ? prev.stats.roundsWon + 1 : prev.stats.roundsWon,
        highestRoll: Math.max(prev.stats.highestRoll, round.playerDuelRoll),
        clutchAbilitiesUsed: round.playerUsedAbility
          ? prev.stats.clutchAbilitiesUsed + 1
          : prev.stats.clutchAbilitiesUsed,
      },
    }));
  };

  // Handle entire match finished (Best 2 of 3)
  const handleMatchComplete = (winner: 'player' | 'opponent') => {
    if (!pendingNodeId) return;
    const node = run.map.nodes[pendingNodeId];
    if (!node) return;

    if (winner === 'player') {
      // VICTORY! Advance to this node on the map.
      const isGameFinished = node.type === 'BOSS';
      const wonMatchCount = run.currentMatchIndex + 1;

      setRun((prev) => ({
        ...prev,
        currentMatchIndex: wonMatchCount,
        currentNodeId: pendingNodeId,
        visitedNodeIds: [...prev.visitedNodeIds, pendingNodeId],
        isCompleted: isGameFinished,
        stats: {
          ...prev.stats,
          matchesWon: prev.stats.matchesWon + 1,
        },
      }));
      setPendingNodeId(null);

      if (isGameFinished) {
        // Player defeated Aleister and escaped Maer!
        return;
      }

      // Generate 3 reward draft choices for the player with ~30% archetype synergy
      const choices = generateDraftChoices(wonMatchCount, run.deck, run.collection, run.primaryArchetype);
      setDraftChoices(choices);
      setScreen('REWARD_DRAFT');
    } else {
      // DEFEAT! Cost 1 heart, node stays unresolved so the player can retry it.
      const nextHearts = run.hearts - 1;
      const isDefeated = nextHearts <= 0;

      setRun((prev) => ({
        ...prev,
        hearts: nextHearts,
        isDefeated,
        stats: {
          ...prev.stats,
          matchesLost: prev.stats.matchesLost + 1,
        },
      }));
      setPendingNodeId(null);

      if (!isDefeated) {
        // Still has hearts left! Return to the map to retry or pick another node.
        setScreen('RUN_LADDER');
      }
    }
  };

  // Player picked an artifact from a Treasure node
  const handleSelectArtifact = (artifact: Artifact) => {
    if (!pendingNodeId) return;
    sounds.playEquip();
    setRun((prev) => ({
      ...prev,
      artifacts: [...prev.artifacts, artifact],
      currentNodeId: pendingNodeId,
      visitedNodeIds: [...prev.visitedNodeIds, pendingNodeId],
    }));
    setPendingNodeId(null);
    setScreen('RUN_LADDER');
  };

  // Draft Choice Picked
  const handleSelectDraftCard = (selectedCard: Card) => {
    const nextCollection = [...run.collection, selectedCard];
    setRun((prev) => ({
      ...prev,
      collection: nextCollection,
    }));
    setScreen('DECK_BUILDER');
  };

  // Save changes from Deck Builder
  const handleSaveDeck = (newDeck: Record<EngasteNumber, Card>, newCollection: Card[]) => {
    setRun((prev) => ({
      ...prev,
      deck: newDeck,
      collection: newCollection,
    }));
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Universal Top Bar */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Brand */}
        <div
          onClick={() => setScreen('RUN_LADDER')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="text-xl">🗡️</span>
          <span className="text-lg sm:text-xl font-cinzel font-black tracking-wider text-amber-200 group-hover:text-amber-300 transition-colors uppercase">
            Iujio: Ladino
          </span>
        </div>

        {/* Status / Quick Links */}
        <div className="flex items-center gap-3">
          {screen !== 'TITLE_SCREEN' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono-num text-slate-400 mr-2">
              <span>Vitórias {run.currentMatchIndex}/10</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {Array.from({ length: run.maxHearts }).map((_, i) => (
                  <span key={i} className={run.hearts >= i + 1 ? 'text-rose-500' : 'text-slate-700'}>❤️</span>
                ))}
              </span>
              {run.artifacts.length > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5" title={run.artifacts.map((a) => a.name).join(', ')}>
                    {run.artifacts.map((a) => (
                      <span key={a.id}>{a.icon}</span>
                    ))}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
          </button>

          {/* Rules Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsRulebookOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-300 font-cinzel font-bold text-xs cursor-pointer transition-colors"
          >
            Manual
          </button>
        </div>
      </header>

      {/* Main Game Screen Router */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {/* TITLE SCREEN: Cover Art with Title & Subtitle at bottom & Aleister's Lore */}
        {screen === 'TITLE_SCREEN' && (
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto px-4 py-6 animate-fadeIn">
            {/* Cover Illustration with Title Logo & Subtitle at the bottom of the image */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] rounded-3xl overflow-hidden border-2 border-stone-600/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] mb-6 bg-black group">
              <img
                src={customCover || IUJIO_COVER_IMG}
                alt="Iujio: Ladino - Capa Oficial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Optional Local File Selector */}
              <label 
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/95 text-slate-400 hover:text-amber-300 border border-slate-700/60 cursor-pointer text-xs backdrop-blur transition-all opacity-40 group-hover:opacity-100 z-10"
                title="Trocar a imagem de capa por outro arquivo do computador"
              >
                <span>🖼️</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCustomCoverUpload} 
                  className="hidden" 
                />
              </label>

              {/* Title & Subtitle at the bottom of the image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 text-center pointer-events-none">
                <img
                  src={IUJIO_TITLE_LOGO}
                  alt="Iujio: Ladino"
                  referrerPolicy="no-referrer"
                  className="max-h-20 sm:max-h-24 w-auto object-contain mx-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mb-1"
                />
                <div className="text-sm sm:text-base font-cinzel font-bold text-amber-300 tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase">
                  A Fuga de Maer
                </div>
              </div>
            </div>

            {/* Narrative Flavor Text: Aleister's Words */}
            <div className="p-5 sm:p-6 rounded-2xl bg-black/75 border border-amber-600/40 max-w-xl mb-6 text-left shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-amber-700" />
              <div className="text-[10px] uppercase font-mono-num font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                <span>🔮</span>
                <span>Aleister, o Mago Louco</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic font-serif">
                &ldquo;Ladrãozinho sujo. Cobiçou minhas riquezas e meus poderes? Agora será meu entretenimento. Os corredores e perigos de Maer lhe aguardam. Lute com o que conseguiu roubar. Desbrave os salões arcanos. Morra, e eu lhe trarei a vida novamente. A morte não é escapatória. Vá. Lute!&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
              <button
                onClick={handleStartRun}
                className="w-full py-4 rounded-2xl font-cinzel font-black text-base bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-slate-950 shadow-2xl shadow-amber-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚔️</span>
                <span>Iniciar Fuga de Maer (Draft)</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsRulebookOpen(true);
                }}
                className="w-full py-4 rounded-2xl font-cinzel font-bold text-sm bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer"
              >
                📖 Manual de Regras
              </button>
            </div>
          </div>
        )}

        {/* RUN LADDER / DUNGEON MAP SCREEN */}
        {screen === 'RUN_LADDER' && (
          <RunLadder
            run={run}
            selectedTalent={selectedTalent}
            onOpenTalentSelector={() => setIsTalentModalOpen(true)}
            onSelectNode={handleSelectNode}
            onOpenDeckBuilder={() => setScreen('DECK_BUILDER')}
            onOpenRulebook={() => setIsRulebookOpen(true)}
          />
        )}

        {/* DECK BUILDER SCREEN */}
        {screen === 'DECK_BUILDER' && (
          <DeckBuilder
            deck={run.deck}
            collection={run.collection}
            onSaveDeck={handleSaveDeck}
            onReadyToFight={() => setScreen('RUN_LADDER')}
          />
        )}

        {/* COMBAT / ARENA DUEL SCREEN */}
        {screen === 'COMBAT' && activeMatch && (
          <DuelBoard
            match={activeMatch}
            playerHearts={run.hearts}
            artifacts={run.artifacts}
            onRoundComplete={handleRoundComplete}
            onMatchComplete={handleMatchComplete}
          />
        )}

        {/* REWARD DRAFT SCREEN (venceu um Combate) */}
        {screen === 'REWARD_DRAFT' && (
          <RewardDraft
            choices={draftChoices}
            currentMatchNumber={run.currentMatchIndex}
            currentDeck={run.deck}
            onSelectCard={handleSelectDraftCard}
          />
        )}

        {/* ARTIFACT DRAFT SCREEN (abriu um Baú de Tesouro) */}
        {screen === 'ARTIFACT_DRAFT' && (
          <ArtifactDraft
            choices={artifactChoices}
            ownedArtifacts={run.artifacts}
            onSelectArtifact={handleSelectArtifact}
          />
        )}
      </main>

      {/* Heart Node Toast */}
      {heartToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-2xl text-sm font-cinzel font-bold text-amber-200 animate-fadeIn">
          {heartToast}
        </div>
      )}

      {/* Universal Footer */}
      <footer className="py-3 px-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Iujio: Ladino · Sistema de 12 Engastes, Duelos de d12 e Calabouços de Maer
      </footer>

      {/* OPENING DRAFT MODAL */}
      {isOpeningDraftOpen && (
        <OpeningDraftModal onDraftComplete={handleOpeningDraftComplete} />
      )}

      {/* TALENT SELECTOR MODAL */}
      {isTalentModalOpen && (
        <TalentSelectorModal
          currentTalent={selectedTalent}
          onSelectTalent={(t) => setSelectedTalent(t)}
          onClose={() => setIsTalentModalOpen(false)}
        />
      )}

      {/* RULEBOOK MODAL */}
      {isRulebookOpen && <RulebookModal onClose={() => setIsRulebookOpen(false)} />}

      {/* GAME OVER MODAL (0 Hearts) */}
      {run.isDefeated && (
        <GameOverModal run={run} onRestartRun={handleStartRun} />
      )}

      {/* VICTORY MODAL (10 Wins vs Aleister) */}
      {run.isCompleted && (
        <VictoryModal run={run} onRestartRun={handleStartRun} />
      )}
    </div>
  );
}

