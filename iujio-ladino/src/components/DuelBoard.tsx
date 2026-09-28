import React, { useState } from 'react';
import {
  Artifact,
  Card,
  CombatEffectLog,
  CombatRoundState,
  EngasteNumber,
  MatchState,
  UniversalAbilityType,
} from '../types/game';
import { CardView } from './CardView';
import {
  calculateProvisory,
  decideOpponentAbility,
  rollD12,
  rollD6,
  rollD4,
  UNIVERSAL_ABILITIES,
} from '../utils/combatEngine';
import { sounds } from '../utils/audio';
import { IUJIO_TALENTS } from '../data/talents';

interface DuelBoardProps {
  match: MatchState;
  playerHearts: number;
  artifacts?: Artifact[];
  onRoundComplete: (round: CombatRoundState) => void;
  onMatchComplete: (winner: 'player' | 'opponent') => void;
}

export const DuelBoard: React.FC<DuelBoardProps> = ({
  match,
  playerHearts,
  artifacts = [],
  onRoundComplete,
  onMatchComplete,
}) => {
  // Round phase
  const [phase, setPhase] = useState<
    | 'IDLE_START'
    | 'ROLLING_DICE'
    | 'DUEL_RESULT'
    | 'WAITING_DRAW'
    | 'REVEALING_FIRST'
    | 'REVEALING_SECOND'
    | 'CHECK_HEART_OF_CARDS'
    | 'SHOWING_PROVISORY'
    | 'FIRST_ABILITY_DECISION'
    | 'SECOND_ABILITY_DECISION'
    | 'RESOLVING_FINAL'
    | 'ROUND_FINISHED'
  >('IDLE_START');

  // Dice values
  const [playerRoll, setPlayerRoll] = useState<number>(0);
  const [opponentRoll, setOpponentRoll] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Carta Decisiva drawn for this round
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [playerSocket, setPlayerSocket] = useState<EngasteNumber | null>(null);
  const [opponentCard, setOpponentCard] = useState<Card | null>(null);
  const [opponentSocket, setOpponentSocket] = useState<EngasteNumber | null>(null);

  // First revealer
  const [firstRevealer, setFirstRevealer] = useState<'player' | 'opponent' | null>(null);

  // Combat calculations
  const [combatBonusPlayer, setCombatBonusPlayer] = useState<number>(0);
  const [combatBonusOpponent, setCombatBonusOpponent] = useState<number>(0);
  const [effectBonusPlayer, setEffectBonusPlayer] = useState<number>(0);
  const [effectBonusOpponent, setEffectBonusOpponent] = useState<number>(0);
  const [effectLogs, setEffectLogs] = useState<CombatEffectLog[]>([]);

  // Provisory results
  const [provisoryPlayer, setProvisoryPlayer] = useState<number>(0);
  const [provisoryOpponent, setProvisoryOpponent] = useState<number>(0);
  const [underdog, setUnderdog] = useState<'player' | 'opponent' | 'tie' | null>(null);

  // Abilities used in this round
  const [playerAbility, setPlayerAbility] = useState<UniversalAbilityType | null>(null);
  const [opponentAbility, setOpponentAbility] = useState<UniversalAbilityType | null>(null);
  const [playerAbilityBonus, setPlayerAbilityBonus] = useState<number>(0);
  const [opponentAbilityBonus, setOpponentAbilityBonus] = useState<number>(0);

  // Interactive prompts for abilities
  const [trapCardChoices, setTrapCardChoices] = useState<EngasteNumber[] | null>(null);
  const [unexpectedCardChoice, setUnexpectedCardChoice] = useState<Card | null>(null);

  // Special card effect outcome flags
  const [forceDrawRound, setForceDrawRound] = useState<boolean>(false);
  const [pTiesIfLossByTwo, setPTiesIfLossByTwo] = useState<boolean>(false);
  const [oTiesIfLossByTwo, setOTiesIfLossByTwo] = useState<boolean>(false);
  const [pWinsIfProvisoryTie, setPWinsIfProvisoryTie] = useState<boolean>(false);
  const [oWinsIfProvisoryTie, setOWinsIfProvisoryTie] = useState<boolean>(false);
  const [isPlayerAbilityBlocked, setIsPlayerAbilityBlocked] = useState<boolean>(false);
  const [isOpponentAbilityBlocked, setIsOpponentAbilityBlocked] = useState<boolean>(false);

  // Rerolls count (for "Combeiro" talent)
  const [rerollsCount, setRerollsCount] = useState<number>(0);

  // Final Results
  const [finalPlayer, setFinalPlayer] = useState<number>(0);
  const [finalOpponent, setFinalOpponent] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);

  // Announcement banner
  const [bannerText, setBannerText] = useState<string>('Clique em "Rolar Duelo d12" para iniciar a rodada!');

  const activeTalent = IUJIO_TALENTS.find((t) => t.id === match.selectedTalent);

  // Curva Perfeita: +(roundNumber - 1) bonus on player duel roll
  const perfectCurveBonus =
    match.selectedTalent === 'PERFECT_CURVE' ? match.currentRoundNumber - 1 : 0;

  // 1. ROLL D12 DICE
  const handleStartDiceRoll = () => {
    sounds.playClick();
    setIsRolling(true);
    setPhase('ROLLING_DICE');
    setBannerText('Rolando dados d12...');

    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setPlayerRoll(Math.floor(Math.random() * 12) + 1);
      setOpponentRoll(Math.floor(Math.random() * 12) + 1);
      sounds.playDiceTick();

      if (ticks > 12) {
        clearInterval(interval);
        finalizeDiceRoll();
      }
    }, 70);
  };

  const finalizeDiceRoll = () => {
    let pRoll = rollD12();
    let oRoll = rollD12();
    while (pRoll === oRoll) {
      oRoll = rollD12();
    }

    // Apply Curva Perfeita bonus to player roll if talent is active
    const finalPlayerRoll = pRoll + perfectCurveBonus;
    setPlayerRoll(finalPlayerRoll);
    setOpponentRoll(oRoll);
    setIsRolling(false);
    sounds.playDiceImpact(finalPlayerRoll > 8);

    const winner = finalPlayerRoll > oRoll ? 'player' : 'opponent';
    setFirstRevealer(winner);
    setPhase('WAITING_DRAW');

    const talentMsg = perfectCurveBonus > 0 ? ` (+${perfectCurveBonus} de Curva Perfeita)` : '';
    if (winner === 'player') {
      setBannerText(`Você venceu o Duelo (${finalPlayerRoll}${talentMsg} vs ${oRoll})! Clique para puxar a Carta Decisiva.`);
    } else {
      setBannerText(`${match.opponent.name} venceu o Duelo (${oRoll} vs ${finalPlayerRoll}${talentMsg}) e revelará primeiro. Clique para puxar.`);
    }
  };

  // 2. TACTILE "PUXAR CARTA DECISIVA" BUTTON
  const handlePullDecisiveCards = () => {
    sounds.playCardWhoosh();

    // Pick random socket from 1..12 for player
    const pSockets = Object.keys(match.playerDeckRecord).map(Number) as EngasteNumber[];
    const pSock = pSockets[Math.floor(Math.random() * pSockets.length)];
    const pCard = match.playerDeckRecord[pSock];

    // Pick random socket for opponent
    const oSockets = Object.keys(match.opponentDeckRecord).map(Number) as EngasteNumber[];
    const oSock = oSockets[Math.floor(Math.random() * oSockets.length)];
    const oCard = match.opponentDeckRecord[oSock];

    setPlayerSocket(pSock);
    setOpponentSocket(oSock);

    const winner = firstRevealer!;
    setPhase('REVEALING_FIRST');

    if (winner === 'player') {
      setPlayerCard(pCard);
      setBannerText(`Sua Carta Decisiva: ${pCard.name} (Engaste ${pSock})!`);

      setTimeout(() => {
        sounds.playCardWhoosh();
        setPhase('REVEALING_SECOND');
        setOpponentCard(oCard);
        setBannerText(`Carta Decisiva de ${match.opponent.name}: ${oCard.name} (Engaste ${oSock})!`);

        setTimeout(() => {
          checkHeartOfCardsOrCombat(pSock, pCard, oCard);
        }, 1200);
      }, 1200);
    } else {
      setOpponentCard(oCard);
      setBannerText(`Carta Decisiva de ${match.opponent.name}: ${oCard.name} (Engaste ${oSock})!`);

      setTimeout(() => {
        sounds.playCardWhoosh();
        setPhase('REVEALING_SECOND');
        setPlayerCard(pCard);
        setBannerText(`Sua Carta Decisiva: ${pCard.name} (Engaste ${pSock})!`);

        setTimeout(() => {
          checkHeartOfCardsOrCombat(pSock, pCard, oCard);
        }, 1200);
      }, 1200);
    }
  };

  // Check Talent: Coração das Cartas
  const checkHeartOfCardsOrCombat = (pSock: EngasteNumber, pCard: Card, oCard: Card) => {
    if (match.selectedTalent === 'HEART_OF_THE_CARDS' && pSock === 1) {
      setPhase('CHECK_HEART_OF_CARDS');
      setBannerText('🃏 Coração das Cartas Ativo! Você revelou a carta do Engaste 1. Deseja revelar outra carta do seu deck?');
      return;
    }
    runCombatCalculation(pCard, oCard);
  };

  // Coração das Cartas trigger
  const handleHeartOfCardsTrigger = (accept: boolean) => {
    if (!accept) {
      sounds.playClick();
      setPhase('SHOWING_PROVISORY');
      runCombatCalculation(playerCard!, opponentCard!);
      return;
    }

    sounds.playCardWhoosh();
    // Pick another socket different from 1
    const otherSockets = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as EngasteNumber[];
    const newSock = otherSockets[Math.floor(Math.random() * otherSockets.length)];
    const newCard = match.playerDeckRecord[newSock];

    setPlayerSocket(newSock);
    setPlayerCard(newCard);
    setRerollsCount((r) => r + 1);
    setBannerText(`Coração das Cartas invocou: ${newCard.name} (Engaste ${newSock})!`);

    setTimeout(() => {
      runCombatCalculation(newCard, opponentCard!);
    }, 1400);
  };

  // 3. COMBAT CALCULATION (Provisory Result)
  const runCombatCalculation = (pCard: Card, oCard: Card) => {
    sounds.playClash();
    const result = calculateProvisory(
      playerRoll,
      opponentRoll,
      pCard,
      oCard,
      playerHearts,
      playerSocket ?? undefined,
      opponentSocket ?? undefined,
      artifacts
    );

    setCombatBonusPlayer(result.playerCombatBonus);
    setCombatBonusOpponent(result.opponentCombatBonus);
    setEffectBonusPlayer(result.playerEffectBonus);
    setEffectBonusOpponent(result.opponentEffectBonus);
    setEffectLogs(result.effectLogs);
    setProvisoryPlayer(result.playerProvisory);
    setProvisoryOpponent(result.opponentProvisory);
    setUnderdog(result.underdog);

    // Save special flags
    setForceDrawRound(result.forceDraw);
    setPTiesIfLossByTwo(result.playerTiesIfLossByTwo);
    setOTiesIfLossByTwo(result.opponentTiesIfLossByTwo);
    setPWinsIfProvisoryTie(result.playerWinsIfProvisoryTie);
    setOWinsIfProvisoryTie(result.opponentWinsIfProvisoryTie);
    setIsPlayerAbilityBlocked(result.blocksPlayerAbilities);
    setIsOpponentAbilityBlocked(result.blocksOpponentAbilities);

    if (result.shouldRechargePlayerAbility) {
      match.playerUniversalAbilityUsed = false;
      match.playerUsedAbilityType = null;
    }
    if (result.shouldRechargeOpponentAbility) {
      match.opponentUniversalAbilityUsed = false;
      match.opponentUsedAbilityType = null;
    }

    setPhase('SHOWING_PROVISORY');
    setBannerText(`Resultado Provisório: Você ${result.playerProvisory} × ${result.opponentProvisory} ${match.opponent.name}`);

    // Begin sequential ability opportunity: First the underdog chooses!
    setTimeout(() => {
      startSequentialAbilityPhase(result.underdog, result.playerProvisory, result.opponentProvisory);
    }, 1600);
  };

  // 4. SEQUENTIAL ABILITY OPPORTUNITY
  const startSequentialAbilityPhase = (
    underdogSide: 'player' | 'opponent' | 'tie',
    pProv: number,
    oProv: number
  ) => {
    setPhase('FIRST_ABILITY_DECISION');

    // If Player is underdog: Player decides first, then Opponent decides!
    if (underdogSide === 'player') {
      if (!match.playerUniversalAbilityUsed) {
        setBannerText('Você está em desvantagem no Resultado Provisório! Escolha se deseja usar uma Habilidade Universal:');
      } else {
        // Player already used their ability, proceed directly to Opponent's opportunity
        setBannerText('Você já usou sua Habilidade nesta partida. Vez do oponente decidir...');
        setTimeout(() => {
          promptOpponentAbility(pProv, oProv, true);
        }, 1200);
      }
    } else {
      // Opponent is underdog (or tie): Opponent decides first, then Player gets opportunity!
      if (!match.opponentUniversalAbilityUsed) {
        setBannerText(`${match.opponent.name} está em desvantagem e está avaliando suas habilidades...`);
        setTimeout(() => {
          promptOpponentAbility(pProv, oProv, false);
        }, 1500);
      } else {
        // Opponent already used ability, prompt player!
        promptPlayerSecondAbility(pProv, oProv);
      }
    }
  };

  // AI Opponent evaluates using their ability
  const promptOpponentAbility = (currentPProv: number, currentOProv: number, isLastTurn: boolean) => {
    const aiDecision = decideOpponentAbility(
      currentOProv,
      currentPProv,
      opponentSocket || 1,
      match.opponentDeckRecord,
      match.opponentUniversalAbilityUsed || !!opponentAbility,
      match.playerWins,
      match.opponentWins
    );

    if (aiDecision) {
      executeOpponentAbility(aiDecision.ability, aiDecision.trapSocketChoice, currentPProv, currentOProv, isLastTurn);
    } else {
      setBannerText(`${match.opponent.name} decidiu guardar sua Habilidade Universal.`);
      setTimeout(() => {
        if (!isLastTurn && !match.playerUniversalAbilityUsed && !playerAbility) {
          // Player now gets their response opportunity!
          promptPlayerSecondAbility(currentPProv, currentOProv);
        } else {
          resolveFinalRound(currentPProv, currentOProv);
        }
      }, 1200);
    }
  };

  const executeOpponentAbility = (
    abil: UniversalAbilityType,
    trapSock: EngasteNumber | undefined,
    currentPProv: number,
    currentOProv: number,
    isLastTurn: boolean
  ) => {
    sounds.playAbilityCast();
    setOpponentAbility(abil);

    let nextPProv = currentPProv;
    let nextOProv = currentOProv;

    if (abil === 'TRAP_CARD' && trapSock) {
      const newCard = match.opponentDeckRecord[trapSock];
      setOpponentSocket(trapSock);
      setOpponentCard(newCard);
      setBannerText(`${match.opponent.name} ativou Carta Armadilha e mudou para ${newCard.name} (Engaste ${trapSock})!`);
      // Recalculate provisory with new card
      const re = calculateProvisory(playerRoll, opponentRoll, playerCard!, newCard, playerHearts, undefined, undefined, artifacts);
      nextPProv = re.playerProvisory;
      nextOProv = re.opponentProvisory;
      setProvisoryPlayer(nextPProv);
      setProvisoryOpponent(nextOProv);
    } else if (abil === 'CHEAT') {
      const d = rollD4();
      nextPProv = Math.max(0, currentPProv - d);
      setProvisoryPlayer(nextPProv);
      setBannerText(`${match.opponent.name} usou Trapacear! Rolou ${d} e reduziu seu provisório.`);
    } else if (abil === 'UNEXPECTED_PLAY') {
      const oSockets = Object.keys(match.opponentDeckRecord).map(Number) as EngasteNumber[];
      const randomSock = oSockets[Math.floor(Math.random() * oSockets.length)];
      const newCard = match.opponentDeckRecord[randomSock];
      setOpponentSocket(randomSock);
      setOpponentCard(newCard);
      setBannerText(`${match.opponent.name} jogou Jogada Inesperada e revelou ${newCard.name}!`);
      const re = calculateProvisory(playerRoll, opponentRoll, playerCard!, newCard, playerHearts, undefined, undefined, artifacts);
      nextPProv = re.playerProvisory;
      nextOProv = re.opponentProvisory;
      setProvisoryPlayer(nextPProv);
      setProvisoryOpponent(nextOProv);
    }

    setTimeout(() => {
      if (!isLastTurn && !match.playerUniversalAbilityUsed && !playerAbility) {
        promptPlayerSecondAbility(nextPProv, nextOProv);
      } else {
        resolveFinalRound(nextPProv, nextOProv);
      }
    }, 1800);
  };

  const promptPlayerSecondAbility = (currentPProv: number, currentOProv: number) => {
    if (match.playerUniversalAbilityUsed || playerAbility) {
      resolveFinalRound(currentPProv, currentOProv);
      return;
    }
    setPhase('SECOND_ABILITY_DECISION');
    setBannerText('Oponente concluiu. Deseja usar sua Habilidade Universal para responder ou finalizar a rodada?');
  };

  // Player chooses an ability
  const handleSelectPlayerAbility = (type: UniversalAbilityType) => {
    if (type === 'TRAP_CARD') {
      // Calculate available adjacent sockets for Carta Armadilha
      const currentSock = playerSocket || 1;
      const choices: EngasteNumber[] = [];
      if (currentSock > 1) choices.push((currentSock - 1) as EngasteNumber);
      if (currentSock < 12) choices.push((currentSock + 1) as EngasteNumber);
      setTrapCardChoices(choices);
    } else if (type === 'UNEXPECTED_PLAY') {
      // Reveal a new card from remaining deck
      const currentSock = playerSocket || 1;
      const pSockets = Object.keys(match.playerDeckRecord).map(Number).filter((s) => s !== currentSock) as EngasteNumber[];
      const newSock = pSockets[Math.floor(Math.random() * pSockets.length)];
      const candidate = match.playerDeckRecord[newSock];
      setUnexpectedCardChoice(candidate);
    } else if (type === 'CHEAT') {
      // Roll d4 or d6 (if Toxic talent)
      sounds.playAbilityCast();
      setPlayerAbility('CHEAT');
      const isToxic = match.selectedTalent === 'TOXIC';
      const dieValue = isToxic ? rollD6() : rollD4();

      const nextOProv = Math.max(0, provisoryOpponent - dieValue);
      setProvisoryOpponent(nextOProv);
      setBannerText(`Você usou Trapacear! Rolou 1d${isToxic ? 6 : 4} [${dieValue}] e reduziu o placar do oponente para ${nextOProv}!`);

      proceedAfterPlayerAbility(provisoryPlayer, nextOProv);
    }
  };

  // Carta Armadilha Choice
  const handleConfirmTrapCard = (chosenSocket: EngasteNumber) => {
    sounds.playAbilityCast();
    setPlayerAbility('TRAP_CARD');
    setTrapCardChoices(null);

    const newCard = match.playerDeckRecord[chosenSocket];
    setPlayerSocket(chosenSocket);
    setPlayerCard(newCard);
    setBannerText(`Carta Armadilha ativada! Sua Carta Decisiva passou a ser ${newCard.name} (Engaste ${chosenSocket}).`);

    // Recalculate
    const re = calculateProvisory(playerRoll, opponentRoll, newCard, opponentCard!, playerHearts, undefined, undefined, artifacts);
    setCombatBonusPlayer(re.playerCombatBonus);
    setEffectBonusPlayer(re.playerEffectBonus);
    setProvisoryPlayer(re.playerProvisory);
    setProvisoryOpponent(re.opponentProvisory);

    proceedAfterPlayerAbility(re.playerProvisory, re.opponentProvisory);
  };

  // Jogada Inesperada Choice
  const handleConfirmUnexpectedPlay = (acceptNew: boolean) => {
    sounds.playAbilityCast();
    setPlayerAbility('UNEXPECTED_PLAY');

    if (acceptNew && unexpectedCardChoice) {
      const sock = Object.entries(match.playerDeckRecord).find(
        ([, c]) => c.id === unexpectedCardChoice.id
      )?.[0];
      const newSock = Number(sock) as EngasteNumber;

      setPlayerSocket(newSock);
      setPlayerCard(unexpectedCardChoice);
      setRerollsCount((r) => r + 1);
      setUnexpectedCardChoice(null);

      setBannerText(`Jogada Inesperada adotada! Nova Carta Decisiva: ${unexpectedCardChoice.name} (Engaste ${newSock})!`);

      // Recalculate
      const re = calculateProvisory(playerRoll, opponentRoll, unexpectedCardChoice, opponentCard!, playerHearts, undefined, undefined, artifacts);
      setCombatBonusPlayer(re.playerCombatBonus);
      setEffectBonusPlayer(re.playerEffectBonus);
      setProvisoryPlayer(re.playerProvisory);
      setProvisoryOpponent(re.opponentProvisory);

      proceedAfterPlayerAbility(re.playerProvisory, re.opponentProvisory);
    } else {
      setUnexpectedCardChoice(null);
      setBannerText('Você manteve sua Carta Decisiva atual.');
      proceedAfterPlayerAbility(provisoryPlayer, provisoryOpponent);
    }
  };

  // Player skips ability
  const handleSkipPlayerAbility = () => {
    sounds.playClick();
    setBannerText('Você decidiu guardar sua Habilidade Universal.');

    if (phase === 'FIRST_ABILITY_DECISION') {
      // Opponent now gets their opportunity
      setTimeout(() => {
        promptOpponentAbility(provisoryPlayer, provisoryOpponent, true);
      }, 1200);
    } else {
      // Both sides had opportunity, finish!
      setTimeout(() => {
        resolveFinalRound(provisoryPlayer, provisoryOpponent);
      }, 1000);
    }
  };

  const proceedAfterPlayerAbility = (pProv: number, oProv: number) => {
    setTimeout(() => {
      if (phase === 'FIRST_ABILITY_DECISION') {
        // Now opponent gets response opportunity!
        promptOpponentAbility(pProv, oProv, true);
      } else {
        resolveFinalRound(pProv, oProv);
      }
    }, 1600);
  };

  // 5. RESOLVE FINAL RESULT
  const resolveFinalRound = (pProv: number, oProv: number) => {
    setPhase('RESOLVING_FINAL');

    // Combeiro talent: +1 for each reroll
    const combeiroBonus = match.selectedTalent === 'COMBER' ? rerollsCount : 0;
    const fPlayer = pProv + combeiroBonus;
    const fOpponent = oProv;

    setFinalPlayer(fPlayer);
    setFinalOpponent(fOpponent);

    let winner: 'player' | 'opponent' | 'draw' = 'draw';
    if (forceDrawRound) {
      winner = 'draw';
      sounds.playDiceImpact(false);
      setBannerText(`EMPATE FORÇADO POR EFEITO DE CARTA! (${fPlayer} a ${fOpponent}) Uma rodada extra será gerada.`);
    } else if (fPlayer > fOpponent) {
      if (oTiesIfLossByTwo && (fPlayer - fOpponent) <= 2) {
        winner = 'draw';
        sounds.playDiceImpact(false);
        setBannerText(`Efeito defensivo do oponente converteu a quase-derrota em EMPATE! (${fPlayer} a ${fOpponent})`);
      } else {
        winner = 'player';
        sounds.playRoundWin();
        setBannerText(`VITÓRIA NA RODADA! (${fPlayer} vs ${fOpponent})`);
      }
    } else if (fOpponent > fPlayer) {
      if (pTiesIfLossByTwo && (fOpponent - fPlayer) <= 2) {
        winner = 'draw';
        sounds.playDiceImpact(false);
        setBannerText(`Seu efeito de Juramento da Guarda converteu a quase-derrota em EMPATE! (${fPlayer} a ${fOpponent})`);
      } else {
        winner = 'opponent';
        sounds.playRoundLose();
        setBannerText(`DERROTA NA RODADA! (${fOpponent} vs ${fPlayer})`);
      }
    } else {
      // Tie in scores
      if (pWinsIfProvisoryTie && !oWinsIfProvisoryTie) {
        winner = 'player';
        sounds.playRoundWin();
        setBannerText(`Mestre de Cerimônias: Desempate rúnico a seu favor! VITÓRIA! (${fPlayer} a ${fOpponent})`);
      } else {
        winner = 'draw';
        sounds.playDiceImpact(false);
        setBannerText(`EMPATE! (${fPlayer} a ${fOpponent}) Uma rodada extra será gerada.`);
      }
    }

    setRoundWinner(winner);
    setPhase('ROUND_FINISHED');

    const roundRecord: CombatRoundState = {
      roundNumber: match.currentRoundNumber,
      phase: 'ROUND_OVER',
      playerDuelRoll: playerRoll,
      opponentDuelRoll: opponentRoll,
      firstRevealer,
      playerCard,
      opponentCard,
      playerSocketDrawn: playerSocket,
      opponentSocketDrawn: opponentSocket,
      playerCombatBonus: combatBonusPlayer,
      opponentCombatBonus: combatBonusOpponent,
      playerEffectBonus: effectBonusPlayer,
      opponentEffectBonus: effectBonusOpponent,
      effectLogs,
      playerProvisory: pProv,
      opponentProvisory: oProv,
      underdog,
      playerUsedAbility: playerAbility,
      opponentUsedAbility: opponentAbility,
      playerAbilityBonus: combeiroBonus,
      opponentAbilityBonus: 0,
      rerollsThisRound: rerollsCount,
      playerFinalResult: fPlayer,
      opponentFinalResult: fOpponent,
      winner,
    };

    const nextPlayerWins = winner === 'player' ? match.playerWins + 1 : match.playerWins;
    const nextOpponentWins = winner === 'opponent' ? match.opponentWins + 1 : match.opponentWins;

    setTimeout(() => {
      onRoundComplete(roundRecord);
      if (nextPlayerWins >= 2) {
        sounds.playMatchVictory();
        onMatchComplete('player');
      } else if (nextOpponentWins >= 2) {
        sounds.playMatchDefeat();
        onMatchComplete('opponent');
      }
    }, 2800);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 gap-4">
      {/* Top Arena Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
        {/* Opponent Profile */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-md">
            {match.opponent.avatar.startsWith('/') ? (
              <img
                src={match.opponent.avatar}
                alt={match.opponent.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{match.opponent.avatar}</span>
            )}
            {match.opponent.isBoss && (
              <span className="absolute bottom-0 right-0 bg-red-600 text-white font-bold text-[8px] px-1 rounded-tl">
                CHEFE
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel font-bold text-slate-100 text-sm sm:text-base">
                {match.opponent.name}
              </span>
              <span className="text-[10px] text-amber-400 font-medium hidden sm:inline">
                ({match.opponent.archetype})
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {match.opponent.title} · Rodada {match.currentRoundNumber}
            </div>
          </div>
        </div>

        {/* Center: Match Score (Best of 3) */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Placar (Melhor de 3)
          </div>
          <div className="flex items-center gap-3 mt-1 font-mono-num font-bold text-lg">
            <span className="text-amber-400">{match.playerWins}</span>
            <span className="text-slate-600">×</span>
            <span className="text-rose-400">{match.opponentWins}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs">
            <span className={match.playerWins >= 1 ? 'text-amber-400' : 'text-slate-600'}>●</span>
            <span className={match.playerWins >= 2 ? 'text-amber-400' : 'text-slate-600'}>●</span>
            <span className="text-slate-700">|</span>
            <span className={match.opponentWins >= 1 ? 'text-rose-400' : 'text-slate-600'}>●</span>
            <span className={match.opponentWins >= 2 ? 'text-rose-400' : 'text-slate-600'}>●</span>
          </div>
        </div>

        {/* Opponent Ability Status Indicator */}
        <div className="hidden sm:flex flex-col items-end text-xs">
          <span className="text-slate-400">Habilidade Inimiga</span>
          <span
            className={`font-semibold ${
              match.opponentUniversalAbilityUsed || opponentAbility
                ? 'text-slate-600 line-through'
                : 'text-emerald-400'
            }`}
          >
            {match.opponentUniversalAbilityUsed || opponentAbility ? 'Gasta (1/1)' : 'Disponível (1x)'}
          </span>
        </div>
      </div>

      {/* Arena Center Battlefield Table */}
      <div className="relative flex flex-col items-center justify-between min-h-[480px] p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Background Runes */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-96 h-96 rounded-full border-4 border-dashed border-amber-500 animate-spin [animation-duration:60s]" />
        </div>

        {/* Status / Announcement Banner */}
        <div className="z-10 w-full text-center py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-xs text-xs sm:text-sm font-medium text-amber-200 shadow-md">
          {bannerText}
        </div>

        {/* Opponent Carta Decisiva */}
        <div className="z-10 flex flex-col items-center gap-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Carta Decisiva do Oponente</span>
            {opponentSocket && (
              <span className="text-[10px] text-amber-400 font-normal">
                · Engaste {opponentSocket}
              </span>
            )}
            {firstRevealer === 'opponent' && phase !== 'IDLE_START' && phase !== 'ROLLING_DICE' && phase !== 'WAITING_DRAW' && (
              <span className="text-[10px] text-amber-300 font-semibold">(Revelou 1º)</span>
            )}
          </div>
          {opponentCard ? (
            <CardView card={opponentCard} size="md" activeSocket={opponentSocket || undefined} />
          ) : (
            <div className="w-36 h-52 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-slate-600 text-xs">
              <span className="text-2xl mb-1">🃏</span>
              <span>Aguardando Saque</span>
            </div>
          )}
        </div>

        {/* Center Clash Zone */}
        <div className="z-10 w-full flex flex-col items-center justify-center my-3">
          {/* Phase 1: Dice Rolling */}
          {(phase === 'IDLE_START' || phase === 'ROLLING_DICE' || phase === 'DUEL_RESULT' || phase === 'WAITING_DRAW') && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-8 sm:gap-14">
                {/* Player D12 */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Seu Duelo (d12)</span>
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center font-mono-num font-extrabold border-2 shadow-lg transition-all ${
                      isRolling
                        ? 'border-amber-400 bg-amber-950/60 text-amber-300 scale-105 text-3xl'
                        : playerRoll > opponentRoll && (phase === 'DUEL_RESULT' || phase === 'WAITING_DRAW')
                        ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-400 text-3xl'
                        : 'border-slate-700 bg-slate-900 text-slate-200 text-3xl'
                    }`}
                  >
                    <span>{playerRoll > 0 ? playerRoll : '?'}</span>
                    {perfectCurveBonus > 0 && playerRoll > 0 && (
                      <span className="text-[9px] text-amber-400 font-normal">+{perfectCurveBonus} curva</span>
                    )}
                  </div>
                </div>

                <div className="font-cinzel font-bold text-slate-500 text-lg">VS</div>

                {/* Opponent D12 */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Duelo Inimigo (d12)</span>
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-mono-num font-extrabold text-2xl sm:text-3xl border-2 shadow-lg transition-all ${
                      isRolling
                        ? 'border-rose-400 bg-rose-950/60 text-rose-300 scale-105'
                        : opponentRoll > playerRoll && (phase === 'DUEL_RESULT' || phase === 'WAITING_DRAW')
                        ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-400'
                        : 'border-slate-700 bg-slate-900 text-slate-200'
                    }`}
                  >
                    {opponentRoll > 0 ? opponentRoll : '?'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {phase === 'IDLE_START' && (
                <button
                  onClick={handleStartDiceRoll}
                  className="mt-2 px-8 py-3.5 rounded-xl font-cinzel font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  🎲 Rolar Duelo (d12)
                </button>
              )}

              {phase === 'WAITING_DRAW' && (
                <button
                  onClick={handlePullDecisiveCards}
                  className="mt-2 px-8 py-3.5 rounded-xl font-cinzel font-black text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 shadow-xl shadow-amber-500/40 animate-pulse hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>🃏</span>
                  <span>Puxar Carta Decisiva</span>
                </button>
              )}
            </div>
          )}

          {/* Coração das Cartas Prompt */}
          {phase === 'CHECK_HEART_OF_CARDS' && (
            <div className="w-full max-w-md p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 shadow-2xl flex flex-col items-center text-center gap-3 animate-fadeIn">
              <div className="text-xl">🃏</div>
              <div className="font-cinzel font-bold text-amber-200 text-sm">
                Coração das Cartas Ativado!
              </div>
              <p className="text-xs text-slate-300">
                Você revelou a carta do Engaste 1 (<strong>{playerCard?.name}</strong>). Deseja descartá-la e puxar outra carta do baralho?
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => handleHeartOfCardsTrigger(true)}
                  className="flex-1 py-2 rounded-lg font-cinzel font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow cursor-pointer"
                >
                  Sim, puxar outra carta!
                </button>
                <button
                  onClick={() => handleHeartOfCardsTrigger(false)}
                  className="flex-1 py-2 rounded-lg font-cinzel font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Não, manter esta carta
                </button>
              </div>
            </div>
          )}

          {/* Combat Calculation & Provisory Box */}
          {playerCard && opponentCard && phase !== 'CHECK_HEART_OF_CARDS' && (
            <div className="w-full max-w-xl p-3.5 rounded-xl bg-slate-950/85 border border-slate-800 shadow-xl backdrop-blur-md">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Player Breakdown */}
                <div className="flex flex-col gap-1 border-r border-slate-800/80 pr-3">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span>Você</span>
                    <span className="font-mono-num text-sm">
                      {phase === 'RESOLVING_FINAL' || phase === 'ROUND_FINISHED' ? finalPlayer : provisoryPlayer} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between font-mono-num">
                    <span>Duelo (d12):</span>
                    <span>+{playerRoll}</span>
                  </div>
                  <div className="text-[11px] text-rose-300 flex justify-between font-mono-num">
                    <span>Combate (Atk {playerCard.atk} - Def {opponentCard.def}):</span>
                    <span>+{combatBonusPlayer}</span>
                  </div>
                  {effectBonusPlayer !== 0 && (
                    <div className="text-[11px] text-amber-400 flex justify-between font-mono-num">
                      <span>Efeitos de Carta:</span>
                      <span>{effectBonusPlayer > 0 ? `+${effectBonusPlayer}` : effectBonusPlayer}</span>
                    </div>
                  )}
                  {rerollsCount > 0 && match.selectedTalent === 'COMBER' && (
                    <div className="text-[11px] text-emerald-400 flex justify-between font-mono-num font-bold">
                      <span>Combeiro ({rerollsCount} re-rolls):</span>
                      <span>+{rerollsCount}</span>
                    </div>
                  )}
                </div>

                {/* Opponent Breakdown */}
                <div className="flex flex-col gap-1 pl-1">
                  <div className="font-bold text-rose-300 flex items-center justify-between">
                    <span>{match.opponent.name}</span>
                    <span className="font-mono-num text-sm">
                      {phase === 'RESOLVING_FINAL' || phase === 'ROUND_FINISHED' ? finalOpponent : provisoryOpponent} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between font-mono-num">
                    <span>Duelo (d12):</span>
                    <span>+{opponentRoll}</span>
                  </div>
                  <div className="text-[11px] text-rose-300 flex justify-between font-mono-num">
                    <span>Combate (Atk {opponentCard.atk} - Def {playerCard.def}):</span>
                    <span>+{combatBonusOpponent}</span>
                  </div>
                  {effectBonusOpponent !== 0 && (
                    <div className="text-[11px] text-amber-400 flex justify-between font-mono-num">
                      <span>Efeitos de Carta:</span>
                      <span>{effectBonusOpponent > 0 ? `+${effectBonusOpponent}` : effectBonusOpponent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Combat Effect Logs */}
              {effectLogs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col gap-0.5">
                  {effectLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className={log.source === 'player' ? 'text-amber-400' : 'text-rose-400'}>
                        {log.source === 'player' ? '• Seu' : '• Inimigo'}
                      </span>
                      <span className="text-slate-300 truncate">{log.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Universal Ability Selection Prompt */}
          {(phase === 'FIRST_ABILITY_DECISION' || phase === 'SECOND_ABILITY_DECISION') &&
            !match.playerUniversalAbilityUsed &&
            !playerAbility &&
            !trapCardChoices &&
            !unexpectedCardChoice && (
              <div className="mt-3 w-full max-w-xl p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/60 shadow-xl flex flex-col gap-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel font-bold text-amber-200 text-xs">
                    ⚡ Habilidade Universal (1 uso por partida)
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono-num">
                    {phase === 'FIRST_ABILITY_DECISION' ? 'Sua Vez de Decidir' : 'Oportunidade de Resposta'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {UNIVERSAL_ABILITIES.map((ability) => (
                    <button
                      key={ability.id}
                      onClick={() => handleSelectPlayerAbility(ability.id)}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 hover:bg-slate-800 transition-all text-left flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-xs text-amber-300 group-hover:text-amber-200 flex items-center gap-1.5">
                          <span>{ability.icon}</span>
                          <span>{ability.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 leading-tight">
                          {ability.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSkipPlayerAbility}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                >
                  Guardar Habilidade (Não usar agora)
                </button>
              </div>
            )}

          {/* Carta Armadilha Socket Choice Prompt */}
          {trapCardChoices && (
            <div className="mt-3 w-full max-w-xl p-4 rounded-xl bg-amber-950/80 border border-amber-500/60 shadow-xl flex flex-col items-center gap-3 animate-fadeIn">
              <div className="font-cinzel font-bold text-amber-200 text-xs sm:text-sm">
                🪤 Carta Armadilha: Escolha o Novo Engaste
              </div>
              <p className="text-xs text-slate-300 text-center">
                Sua Carta Decisiva atual era do Engaste {playerSocket}. Para qual engaste adjacente deseja trocar?
              </p>
              <div className="flex items-center gap-3">
                {trapCardChoices.map((s) => {
                  const cardAtSocket = match.playerDeckRecord[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleConfirmTrapCard(s)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-400/60 hover:bg-slate-800 text-left flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-amber-300">
                        {s < (playerSocket || 1) ? `← Recuar (Engaste ${s})` : `Avançar (Engaste ${s}) →`}
                      </span>
                      <span className="text-[11px] text-slate-200">{cardAtSocket?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono-num">
                        Atk {cardAtSocket?.atk} · Def {cardAtSocket?.def}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setTrapCardChoices(null)}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Jogada Inesperada Choice Prompt */}
          {unexpectedCardChoice && (
            <div className="mt-3 w-full max-w-xl p-4 rounded-xl bg-amber-950/80 border border-amber-500/60 shadow-xl flex flex-col items-center gap-3 animate-fadeIn">
              <div className="font-cinzel font-bold text-amber-200 text-xs sm:text-sm">
                ✨ Jogada Inesperada: Nova Carta Revelada!
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 mb-1">Carta Atual</span>
                  <CardView card={playerCard!} size="sm" activeSocket={playerSocket || undefined} />
                </div>
                <div className="text-amber-400 font-bold">➔</div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-amber-300 font-bold mb-1">Nova Opção</span>
                  <CardView card={unexpectedCardChoice} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 w-full max-w-xs mt-1">
                <button
                  onClick={() => handleConfirmUnexpectedPlay(true)}
                  className="flex-1 py-2 rounded-lg font-cinzel font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow cursor-pointer"
                >
                  Usar Nova Carta
                </button>
                <button
                  onClick={() => handleConfirmUnexpectedPlay(false)}
                  className="flex-1 py-2 rounded-lg font-cinzel font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Manter Atual
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Carta Decisiva */}
        <div className="z-10 flex flex-col items-center gap-1">
          {playerCard ? (
            <CardView card={playerCard} size="md" activeSocket={playerSocket || undefined} />
          ) : (
            <div className="w-36 h-52 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-slate-600 text-xs">
              <span className="text-2xl mb-1">🛡️</span>
              <span>Aguardando Saque</span>
            </div>
          )}
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Sua Carta Decisiva</span>
            {playerSocket && (
              <span className="text-[10px] text-amber-400 font-normal">
                · Engaste {playerSocket}
              </span>
            )}
            {firstRevealer === 'player' && phase !== 'IDLE_START' && phase !== 'ROLLING_DICE' && phase !== 'WAITING_DRAW' && (
              <span className="text-[10px] text-amber-300 font-semibold">(Revelou 1º)</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Player HUD */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md gap-3">
        {/* Lives & Active Talent */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Vidas:</span>
            <div className="flex items-center gap-1 text-base">
              <span className={playerHearts >= 1 ? 'text-rose-500 scale-110' : 'text-slate-700'}>❤️</span>
              <span className={playerHearts >= 2 ? 'text-rose-500 scale-110' : 'text-slate-700'}>❤️</span>
            </div>
          </div>

          {activeTalent && (
            <div className="flex items-center gap-1 text-xs text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
              <span>{activeTalent.icon}</span>
              <span className="font-medium font-cinzel">{activeTalent.name}</span>
            </div>
          )}
        </div>

        {/* Universal Ability Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Sua Habilidade Universal:</span>
          <span
            className={`font-semibold ${
              match.playerUniversalAbilityUsed || playerAbility ? 'text-slate-600 line-through' : 'text-emerald-400'
            }`}
          >
            {match.playerUniversalAbilityUsed || playerAbility ? 'Gasta (1/1)' : 'Disponível (1x)'}
          </span>
        </div>

        {/* Next Round Action if Finished */}
        {phase === 'ROUND_FINISHED' && match.playerWins < 2 && match.opponentWins < 2 && (
          <button
            onClick={() => {
              sounds.playClick();
              // Reset board for next round
              setPhase('IDLE_START');
              setPlayerRoll(0);
              setOpponentRoll(0);
              setPlayerCard(null);
              setPlayerSocket(null);
              setOpponentCard(null);
              setOpponentSocket(null);
              setFirstRevealer(null);
              setCombatBonusPlayer(0);
              setCombatBonusOpponent(0);
              setEffectBonusPlayer(0);
              setEffectBonusOpponent(0);
              setEffectLogs([]);
              setPlayerAbility(null);
              setOpponentAbility(null);
              setPlayerAbilityBonus(0);
              setOpponentAbilityBonus(0);
              setTrapCardChoices(null);
              setUnexpectedCardChoice(null);
              setRerollsCount(0);
              setFinalPlayer(0);
              setFinalOpponent(0);
              setRoundWinner(null);
              setBannerText('Próxima rodada! Rolar Duelo d12.');
            }}
            className="px-4 py-2 rounded-lg font-cinzel font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer"
          >
            Próxima Rodada ➔
          </button>
        )}
      </div>
    </div>
  );
};
