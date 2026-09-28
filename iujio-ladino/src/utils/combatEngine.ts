import {
  Artifact,
  Card,
  CombatEffectLog,
  EngasteNumber,
  UniversalAbility,
  UniversalAbilityType,
} from '../types/game';

export const UNIVERSAL_ABILITIES: UniversalAbility[] = [
  {
    id: 'TRAP_CARD',
    name: 'Carta Armadilha',
    description: 'Avança ou recua o engaste da sua Carta Decisiva (±1 engaste no baralho).',
    shortDesc: 'Avança ou recua engaste (±1)',
    icon: '🪤',
  },
  {
    id: 'UNEXPECTED_PLAY',
    name: 'Jogada Inesperada',
    description: 'Revela uma nova Carta Decisiva do baralho e você escolhe se quer usá-la ou manter a atual.',
    shortDesc: 'Revela nova carta opcional',
    icon: '✨',
  },
  {
    id: 'CHEAT',
    name: 'Trapacear',
    description: 'Joga 1d4 (ou 1d6 se Tóxico) e subtrai do resultado provisório do oponente.',
    shortDesc: 'Reduz provisório inimigo com dado',
    icon: '🎭',
  },
];

// Roll a 12-sided die (1 - 12)
export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

// Roll a 6-sided die (1 - 6)
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Roll a 4-sided die (1 - 4)
export function rollD4(): number {
  return Math.floor(Math.random() * 4) + 1;
}

// Roll an 8-sided die (1 - 8)
export function rollD8(): number {
  return Math.floor(Math.random() * 8) + 1;
}

/**
 * Calculates Attack and Defense combat bonus:
 * dano = Math.max(0, effectiveAtk - effectiveDef) * multiplier
 */
export function calculateCombatDamage(
  attackerAtk: number,
  defenderDef: number,
  isPierce: boolean = false,
  multiplier: number = 1
): number {
  const effectiveDef = isPierce ? 0 : Math.max(0, defenderDef);
  const baseDamage = Math.max(0, attackerAtk - effectiveDef);
  return Math.floor(baseDamage * multiplier);
}

export interface DetailedCombatResult {
  playerCombatBonus: number;
  opponentCombatBonus: number;
  playerEffectBonus: number;
  opponentEffectBonus: number;
  effectLogs: CombatEffectLog[];
  playerProvisory: number;
  opponentProvisory: number;
  underdog: 'player' | 'opponent' | 'tie';
  shouldRechargePlayerAbility: boolean;
  shouldRechargeOpponentAbility: boolean;
  blocksPlayerAbilities: boolean;
  blocksOpponentAbilities: boolean;
  forceDraw: boolean;
  playerTiesIfLossByTwo: boolean;
  opponentTiesIfLossByTwo: boolean;
  playerWinsIfProvisoryTie: boolean;
  opponentWinsIfProvisoryTie: boolean;
}

/**
 * Faithful evaluation of cards based on the user's JSON card effects.
 */
export function calculateProvisory(
  playerDuelRoll: number,
  opponentDuelRoll: number,
  playerCard: Card,
  opponentCard: Card,
  playerHearts: number = 2,
  playerSocket?: EngasteNumber,
  opponentSocket?: EngasteNumber,
  playerArtifacts: Artifact[] = []
): DetailedCombatResult {
  const logs: CombatEffectLog[] = [];

  const pDesc = (playerCard.efeitoRaw || playerCard.effect.description || '').toLowerCase();
  const oDesc = (opponentCard.efeitoRaw || opponentCard.effect.description || '').toLowerCase();

  // Artifacts: permanent flat Duelo bonus (e.g. Manual do Iujio)
  const artifactDuelBonus = playerArtifacts.reduce(
    (sum, a) => (a.effect.type === 'DUEL_FLAT_BONUS' ? sum + (a.effect.duelBonus || 0) : sum),
    0
  );
  if (artifactDuelBonus !== 0) {
    playerDuelRoll += artifactDuelBonus;
  }

  const firstRevealer = playerDuelRoll > opponentDuelRoll ? 'player' : 'opponent';

  // 1. Check effect cancellation (e.g. Malvexo, Escudo Arcano, Cubo Gelatinoso, Olho da Negação)
  let pCancelled = false;
  let oCancelled = false;

  if (
    oDesc.includes('anula os efeitos') ||
    oDesc.includes('anula todos os efeitos') ||
    oDesc.includes('não pode receber bônus') ||
    oDesc.includes('perde seu efeito')
  ) {
    pCancelled = true;
    logs.push({
      source: 'opponent',
      cardName: opponentCard.name,
      description: `${opponentCard.name}: Anulou os efeitos da carta inimiga!`,
      bonusValue: 0,
    });
  }

  if (
    pDesc.includes('anula os efeitos') ||
    pDesc.includes('anula todos os efeitos') ||
    pDesc.includes('não pode receber bônus') ||
    pDesc.includes('perde seu efeito')
  ) {
    oCancelled = true;
    logs.push({
      source: 'player',
      cardName: playerCard.name,
      description: `${playerCard.name}: Anulou os efeitos da carta inimiga!`,
      bonusValue: 0,
    });
  }

  // 2. Base effective stats
  let pAtk = playerCard.atk;
  let pDef = playerCard.def;
  let oAtk = opponentCard.atk;
  let oDef = opponentCard.def;

  // Artifacts: archetype-wide buffs/debuffs (e.g. Orbe do Dragão)
  for (const artifact of playerArtifacts) {
    if (artifact.effect.type !== 'ARCHETYPE_BUFF' || !artifact.effect.archetype) continue;
    const arch = artifact.effect.archetype.toLowerCase();

    if (playerCard.arquetipo.toLowerCase().includes(arch)) {
      const atkDelta = artifact.effect.atkDelta || 0;
      const defDelta = artifact.effect.defDelta || 0;
      pAtk += atkDelta;
      pDef += defDelta;
      if (atkDelta !== 0 || defDelta !== 0) {
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `${artifact.icon} ${artifact.name}: ${playerCard.name} recebeu ${atkDelta >= 0 ? '+' : ''}${atkDelta}/${defDelta >= 0 ? '+' : ''}${defDelta}`,
          bonusValue: atkDelta + defDelta,
        });
      }
    }

    if (opponentCard.arquetipo.toLowerCase().includes(arch)) {
      const enemyAtkDelta = artifact.effect.enemyAtkDelta || 0;
      const enemyDefDelta = artifact.effect.enemyDefDelta || 0;
      oAtk += enemyAtkDelta;
      oDef += enemyDefDelta;
      if (enemyAtkDelta !== 0 || enemyDefDelta !== 0) {
        logs.push({
          source: 'player',
          cardName: artifact.name,
          description: `${artifact.icon} ${artifact.name}: ${opponentCard.name} (inimiga) sofreu ${enemyAtkDelta}/${enemyDefDelta}`,
          bonusValue: enemyAtkDelta + enemyDefDelta,
        });
      }
    }
  }

  let pPierce = false;
  let oPierce = false;
  let pMult = 1;
  let oMult = 1;

  let pEffectBonus = 0;
  let oEffectBonus = 0;

  let rechargePlayer = false;
  let rechargeOpponent = false;
  let blocksPlayerAbilities = false;
  let blocksOpponentAbilities = false;
  let forceDraw = false;
  let pTiesLossByTwo = false;
  let oTiesLossByTwo = false;
  let pWinsIfProvisoryTie = false;
  let oWinsIfProvisoryTie = false;

  // Force draw (Filho da Puta)
  if (pDesc.includes('sempre resulta em empate') || oDesc.includes('sempre resulta em empate')) {
    forceDraw = true;
    logs.push({
      source: pDesc.includes('sempre resulta em empate') ? 'player' : 'opponent',
      cardName: pDesc.includes('sempre resulta em empate') ? playerCard.name : opponentCard.name,
      description: 'Filho da Puta: Independente do que aconteça, a rodada sempre resulta em empate!',
      bonusValue: 0,
    });
  }

  // 3. Stat swaps & mutations before combat comparison
  if (!pCancelled) {
    // Mímico Voraz
    if (pDesc.includes('se torna igual ao ataque da carta inimiga + 2')) {
      pAtk = opponentCard.atk + 2;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Copiou ATK inimigo + 2 (ATK: ${pAtk})`,
        bonusValue: 0,
      });
    }
    // Porta Dimensional / Capitã Sereia / Truque Sujo
    else if (pDesc.includes('troque o ataque desta carta pelo ataque da carta inimiga')) {
      pAtk = opponentCard.atk;
      if (pDesc.includes('ignore a defesa')) pPierce = true;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Trocou seu ATK pelo ATK inimigo (${pAtk})`,
        bonusValue: 0,
      });
    }
    // Transmutação Caótica
    if (pDesc.includes('troque o ataque da carta inimiga com a defesa dela')) {
      const temp = oAtk;
      oAtk = oDef;
      oDef = temp;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Transmutou os atributos inimigos! (Novo ATK: ${oAtk}, DEF: ${oDef})`,
        bonusValue: 0,
      });
    }
    // Nótico Espreitador: if second to reveal -> copy DEF
    if (pDesc.includes('segundo a revelar') && pDesc.includes('copie a defesa inimiga') && firstRevealer === 'opponent') {
      pDef = opponentCard.def;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Copiou a Defesa inimiga (${pDef})`,
        bonusValue: 0,
      });
    }
    // Avatar do Dragão Celestial: if second to reveal -> add DEF to ATK
    if (pDesc.includes('segundo a revelar') && pDesc.includes('adicione sua defesa ao ataque') && firstRevealer === 'opponent') {
      pAtk += pDef;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Revelou por segundo! Somou DEF ao ATK (ATK: ${pAtk})`,
        bonusValue: 0,
      });
    }
    // Tiro de Canhão Duplo: odd socket -> +2 ATK
    if (pDesc.includes('engaste ímpar') && playerSocket && playerSocket % 2 !== 0) {
      pAtk += 2;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Engaste ímpar (#${playerSocket}) concedeu +2 de ATK`,
        bonusValue: 0,
      });
    }
    // Mão Rastejante: +2 ATK
    if (pDesc.includes('mão rastejante') || pDesc.includes('+2 de ataque adicional no cálculo')) {
      pAtk += 2;
    }
    // Recruta do Castelo: if first revealer -> +2 DEF
    if (pDesc.includes('primeiro a revelar') && pDesc.includes('+2 de defesa') && firstRevealer === 'player') {
      pDef += 2;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Revelou primeiro! Ganhou +2 de Defesa`,
        bonusValue: 0,
      });
    }
    // Lobo da Alcateia: if won duel -> +2 ATK
    if (pDesc.includes('vencer o duelo') && pDesc.includes('+2 de ataque') && firstRevealer === 'player') {
      pAtk += 2;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Venceu o duelo inicial! Ganhou +2 de Ataque`,
        bonusValue: 0,
      });
    }
    // Centelha Concentrada: ignore 2 enemy DEF
    if (pDesc.includes('ignore 2 pontos de defesa inimiga')) {
      oDef = Math.max(0, oDef - 2);
    }
  }

  // Same stat mutations for Opponent if not cancelled
  if (!oCancelled) {
    if (oDesc.includes('se torna igual ao ataque da carta inimiga + 2')) {
      oAtk = playerCard.atk + 2;
      logs.push({
        source: 'opponent',
        cardName: opponentCard.name,
        description: `${opponentCard.name}: Copiou ATK do jogador + 2 (ATK: ${oAtk})`,
        bonusValue: 0,
      });
    } else if (oDesc.includes('troque o ataque desta carta pelo ataque da carta inimiga')) {
      oAtk = playerCard.atk;
      if (oDesc.includes('ignore a defesa')) oPierce = true;
      logs.push({
        source: 'opponent',
        cardName: opponentCard.name,
        description: `${opponentCard.name}: Trocou seu ATK pelo ATK do jogador (${oAtk})`,
        bonusValue: 0,
      });
    }
    if (oDesc.includes('troque o ataque da carta inimiga com a defesa dela')) {
      const temp = pAtk;
      pAtk = pDef;
      pDef = temp;
      logs.push({
        source: 'opponent',
        cardName: opponentCard.name,
        description: `${opponentCard.name}: Transmutou os atributos do jogador! (Novo ATK: ${pAtk}, DEF: ${pDef})`,
        bonusValue: 0,
      });
    }
    if (oDesc.includes('segundo a revelar') && oDesc.includes('copie a defesa inimiga') && firstRevealer === 'player') {
      oDef = playerCard.def;
    }
    if (oDesc.includes('segundo a revelar') && oDesc.includes('adicione sua defesa ao ataque') && firstRevealer === 'player') {
      oAtk += oDef;
    }
    if (oDesc.includes('engaste ímpar') && opponentSocket && opponentSocket % 2 !== 0) {
      oAtk += 2;
    }
    if (oDesc.includes('mão rastejante') || oDesc.includes('+2 de ataque adicional no cálculo')) {
      oAtk += 2;
    }
    if (oDesc.includes('primeiro a revelar') && oDesc.includes('+2 de defesa') && firstRevealer === 'opponent') {
      oDef += 2;
    }
    if (oDesc.includes('vencer o duelo') && oDesc.includes('+2 de ataque') && firstRevealer === 'opponent') {
      oAtk += 2;
    }
  }

  // 4. Direct Reductions (e.g. Espectro -2 ATK, Ogro -3 DEF, Emboscada -3 ATK & DEF)
  if (!pCancelled) {
    if (pDesc.includes('reduza o ataque e a defesa da carta inimiga em 3')) {
      oAtk = Math.max(0, oAtk - 3);
      oDef = Math.max(0, oDef - 3);
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Reduziu ATK e DEF inimigos em 3!`, bonusValue: 0 });
    } else if (pDesc.includes('reduza o ataque e a defesa da carta inimiga em 2')) {
      oAtk = Math.max(0, oAtk - 2);
      oDef = Math.max(0, oDef - 2);
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Reduziu ATK e DEF inimigos em 2!`, bonusValue: 0 });
    } else if (pDesc.includes('reduza o ataque da carta inimiga em 4')) {
      oAtk = Math.max(0, oAtk - 4);
    } else if (pDesc.includes('reduza o ataque da carta inimiga em 3')) {
      oAtk = Math.max(0, oAtk - 3);
    } else if (pDesc.includes('reduza o ataque da carta inimiga em 2')) {
      oAtk = Math.max(0, oAtk - 2);
    }

    if (pDesc.includes('reduza a defesa da criatura inimiga em 3') || pDesc.includes('reduza a defesa inimiga em 3')) {
      oDef = Math.max(0, oDef - 3);
    } else if (pDesc.includes('reduza a defesa da criatura inimiga em 2') || pDesc.includes('carta inimiga recebe -2 de defesa')) {
      oDef = Math.max(0, oDef - 2);
    }
  }

  if (!oCancelled) {
    if (oDesc.includes('reduza o ataque e a defesa da carta inimiga em 3')) {
      pAtk = Math.max(0, pAtk - 3);
      pDef = Math.max(0, pDef - 3);
      logs.push({ source: 'opponent', cardName: opponentCard.name, description: `${opponentCard.name}: Reduziu seu ATK e DEF em 3!`, bonusValue: 0 });
    } else if (oDesc.includes('reduza o ataque e a defesa da carta inimiga em 2')) {
      pAtk = Math.max(0, pAtk - 2);
      pDef = Math.max(0, pDef - 2);
      logs.push({ source: 'opponent', cardName: opponentCard.name, description: `${opponentCard.name}: Reduziu seu ATK e DEF em 2!`, bonusValue: 0 });
    } else if (oDesc.includes('reduza o ataque da carta inimiga em 4')) {
      pAtk = Math.max(0, pAtk - 4);
    } else if (oDesc.includes('reduza o ataque da carta inimiga em 3')) {
      pAtk = Math.max(0, pAtk - 3);
    } else if (oDesc.includes('reduza o ataque da carta inimiga em 2')) {
      pAtk = Math.max(0, pAtk - 2);
    }

    if (oDesc.includes('reduza a defesa da criatura inimiga em 3') || oDesc.includes('reduza a defesa inimiga em 3')) {
      pDef = Math.max(0, pDef - 3);
    } else if (oDesc.includes('reduza a defesa da criatura inimiga em 2') || oDesc.includes('carta inimiga recebe -2 de defesa')) {
      pDef = Math.max(0, pDef - 2);
    }
  }

  // 5. Piercing Defense checks
  if (!pCancelled) {
    if (
      pDesc.includes('ignore a defesa') ||
      pDesc.includes('defesa da criatura inimiga é reduzida a 0') ||
      pDesc.includes('defesa inimiga é reduzida a 0') ||
      pDesc.includes('ignore-a')
    ) {
      pPierce = true;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `${playerCard.name}: Perfurou a Defesa inimiga (DEF ignorada)!`,
        bonusValue: 0,
      });
    }
  }

  if (!oCancelled) {
    if (
      oDesc.includes('ignore a defesa') ||
      oDesc.includes('defesa da criatura inimiga é reduzida a 0') ||
      oDesc.includes('defesa inimiga é reduzida a 0') ||
      oDesc.includes('ignore-a')
    ) {
      oPierce = true;
      logs.push({
        source: 'opponent',
        cardName: opponentCard.name,
        description: `${opponentCard.name}: Perfurou a sua Defesa (DEF ignorada)!`,
        bonusValue: 0,
      });
    }
  }

  // 6. Tiamat: Double combat damage
  if (!pCancelled && pDesc.includes('dobre o dano de ataque')) {
    pMult = 2;
    logs.push({ source: 'player', cardName: playerCard.name, description: 'Tiamat: Dano de Ataque DOBRADO nesta rodada!', bonusValue: 0 });
  }
  if (!oCancelled && oDesc.includes('dobre o dano de ataque')) {
    oMult = 2;
    logs.push({ source: 'opponent', cardName: opponentCard.name, description: 'Tiamat: Dano de Ataque do inimigo DOBRADO nesta rodada!', bonusValue: 0 });
  }

  // 7. Base Combat Damage
  let pCombatDamage = calculateCombatDamage(pAtk, oDef, pPierce, pMult);
  let oCombatDamage = calculateCombatDamage(oAtk, pDef, oPierce, oMult);

  // Cortina de Fumaças: negates enemy combat damage if revealed second
  if (!pCancelled && pDesc.includes('cortina de fumaça') && firstRevealer === 'opponent') {
    oCombatDamage = 0;
    pEffectBonus += 2;
    logs.push({
      source: 'player',
      cardName: playerCard.name,
      description: 'Cortina de Fumaça: Anulou o dano do ataque inimigo e concedeu +2!',
      bonusValue: 2,
    });
  }
  if (!oCancelled && oDesc.includes('cortina de fumaça') && firstRevealer === 'player') {
    pCombatDamage = 0;
    oEffectBonus += 2;
  }

  // 8. Player Card Conditional Effect Evaluation
  if (!pCancelled) {
    // def > enemy atk
    if (pDef > oAtk) {
      if (pDesc.includes('defesa desta carta for maior que o ataque da carta inimiga')) {
        const valMatch = pDesc.match(/\+(\d+)/);
        const val = valMatch ? parseInt(valMatch[1], 10) : 1;
        pEffectBonus += val;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `${playerCard.name}: DEF (${pDef}) > ATK inimigo (${oAtk}) (+${val})`,
          bonusValue: val,
        });
      }
      if (pDesc.includes('reduza o ataque da carta inimiga em 2')) {
        oAtk = Math.max(0, oAtk - 2);
      }
      if (pDesc.includes('adicione a diferença ao resultado provisório')) {
        const diff = pDef - oAtk;
        pEffectBonus += diff;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `${playerCard.name}: Dragão de Jade somou a diferença (${diff}) ao resultado!`,
          bonusValue: diff,
        });
      }
    }

    // atk > enemy atk
    if (pAtk > oAtk || (pAtk >= oAtk && pDesc.includes('igual ou maior'))) {
      const valMatch = pDesc.match(/receba \+(\d+)/i) || pDesc.match(/\+(\d+) no resultado/i);
      const val = valMatch ? parseInt(valMatch[1], 10) : 0;
      if (val > 0) {
        pEffectBonus += val;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `${playerCard.name}: ATK (${pAtk}) >= ATK inimigo (${oAtk}) (+${val})`,
          bonusValue: val,
        });
      }
      if (pDesc.includes('reduza em 2 o resultado final do oponente')) {
        oEffectBonus -= 2;
        logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Reduziu resultado do oponente em 2`, bonusValue: -2 });
      } else if (pDesc.includes('reduza em 3 o resultado final do oponente')) {
        oEffectBonus -= 3;
        logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Reduziu resultado do oponente em 3`, bonusValue: -3 });
      }
    }

    // atk < enemy atk
    if (pAtk < oAtk) {
      if (pDesc.includes('ataque desta carta for menor que o ataque da carta inimiga, receba +3')) {
        pEffectBonus += 3;
        logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Bugbear ativou fúria (+3)!`, bonusValue: 3 });
      }
    }

    // Goblin Fracote: if in socket 12, roll +1d8 in Duel! If atk < enemy atk, +1
    if (pDesc.includes('goblin fracote')) {
      if (playerSocket === 12) {
        const d8Roll = rollD8();
        pEffectBonus += d8Roll;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `Goblin Fracote: No Engaste 12! Ganhou habilidade de adicionar 1d8 (+${d8Roll}) no Duelo!`,
          bonusValue: d8Roll,
        });
      }
      if (pAtk < oAtk) {
        pEffectBonus += 1;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: 'Goblin Fracote: ATK menor que o inimigo (+1 no resultado)!',
          bonusValue: 1,
        });
      }
    }

    // Muralha Inquebrável: ATK enemy > 3 => +2
    if (pDesc.includes('muralha inquebrável') && oAtk > 3) {
      pEffectBonus += 2;
      logs.push({ source: 'player', cardName: playerCard.name, description: 'Muralha Inquebrável: ATK inimigo > 3 (+2)!', bonusValue: 2 });
    }

    // Adepto do Monastério da Neve
    if (pDesc.includes('monastério da neve')) {
      if (pAtk < oAtk) {
        oEffectBonus -= 2;
        logs.push({ source: 'player', cardName: playerCard.name, description: 'Adepto do Monastério: Reduziu oponente em 2!', bonusValue: -2 });
      }
      if (pDef > oDef) {
        pEffectBonus += 2;
        logs.push({ source: 'player', cardName: playerCard.name, description: 'Adepto do Monastério: Defesa superior (+2)!', bonusValue: 2 });
      }
    }

    // Singularidade Arcana: enemy is magia or habilidade -> absorbs ATK
    if (pDesc.includes('singularidade arcana') && (opponentCard.tipo === 'magia' || opponentCard.tipo === 'habilidade')) {
      pEffectBonus += opponentCard.atk;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: `Singularidade Arcana: Absorveu o ATK (${opponentCard.atk}) da magia/habilidade inimiga!`,
        bonusValue: opponentCard.atk,
      });
    }

    // Dançarina de Espadas: won duel -> ignores DEF
    if (pDesc.includes('dançarina de espadas') && firstRevealer === 'player') {
      pPierce = true;
      logs.push({
        source: 'player',
        cardName: playerCard.name,
        description: 'Dançarina de Espadas: Venceu o duelo e ignorou a Defesa inimiga!',
        bonusValue: 0,
      });
    }

    // def < enemy atk
    if (pDef < oAtk) {
      if (pDesc.includes('defesa de bambu') || pDesc.includes('defesa dessa carta for menor que o ataque inimigo, reduza em 2')) {
        oEffectBonus -= 2;
        logs.push({ source: 'player', cardName: playerCard.name, description: 'Defesa de Bambu: Reduziu o resultado do oponente em 2!', bonusValue: -2 });
      }
      if (pDesc.includes('necromante') && pDesc.includes('conceda +3 no duelo')) {
        pEffectBonus += 3;
        logs.push({ source: 'player', cardName: playerCard.name, description: 'Necromante Menor: Concedeu +3 no Duelo!', bonusValue: 3 });
      }
    }

    // Second revealer
    if (firstRevealer === 'opponent') {
      if (pDesc.includes('esta não for a primeira carta revelada') || pDesc.includes('segundo a revelar')) {
        const valMatch = pDesc.match(/\+(\d+)/);
        const val = valMatch ? parseInt(valMatch[1], 10) : 2;
        pEffectBonus += val;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: `${playerCard.name}: Revelou por segundo (+${val})!`,
          bonusValue: val,
        });
      }
      if (pDesc.includes('adaga envenenada')) {
        oEffectBonus -= 2;
        logs.push({ source: 'player', cardName: playerCard.name, description: 'Adaga Envenenada: Reduziu oponente em 2!', bonusValue: -2 });
      }
    }

    // Aleister, o Mago Louco
    if (pDesc.includes('aleister')) {
      if (pAtk > (oAtk + oDef)) {
        pPierce = true;
        pEffectBonus += 4;
        logs.push({
          source: 'player',
          cardName: playerCard.name,
          description: 'Aleister: Poder supremo superou ATK e DEF inimigos (+4 e ignora Defesa)!',
          bonusValue: 4,
        });
      }
    }

    // Wolfgang
    if (pDesc.includes('wolfgang')) {
      if (pDef > oDef) {
        pTiesLossByTwo = true; // Empata se fosse perder
      }
    }

    // Dice rolls on card reveal
    if (pDesc.includes('role 1d4')) {
      const r = rollD4();
      pEffectBonus += r;
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Rolou 1d4 (+${r})!`, bonusValue: r });
    } else if (pDesc.includes('role 1d6')) {
      const r = rollD6();
      pEffectBonus += r;
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Rolou 1d6 (+${r})!`, bonusValue: r });
    } else if (pDesc.includes('adicione 1d8 ao seu valor de duelo')) {
      const r = rollD8();
      pEffectBonus += r;
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Invocou 1d8 do Primeiro Discípulo (+${r})!`, bonusValue: r });
    }

    // Universal Ability recharge & blocks
    if (pDesc.includes('recarrega') && pDesc.includes('habilidade')) {
      rechargePlayer = true;
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Recarregou a Habilidade Universal!`, bonusValue: 0 });
    }
    if (pDesc.includes('não pode usar habilidades de iujio') || pDesc.includes('oponente não pode usar habilidades')) {
      blocksOpponentAbilities = true;
      logs.push({ source: 'player', cardName: playerCard.name, description: `${playerCard.name}: Bloqueou o uso de Habilidades pelo oponente!`, bonusValue: 0 });
    }

    // Tie if loss by 2 or less (Juramento da Guarda, Gota Restauradora)
    if (pDesc.includes('perder esta rodada por 2 ou menos, a rodada empata')) {
      pTiesLossByTwo = true;
    }
    // Mestre de Cerimônias: wins if provisory tie
    if (pDesc.includes('empate no provisório, você vence')) {
      pWinsIfProvisoryTie = true;
    }
  }

  // 9. Opponent Card Conditional Effect Evaluation
  if (!oCancelled) {
    if (oDef > pAtk) {
      if (oDesc.includes('defesa desta carta for maior que o ataque da carta inimiga')) {
        const valMatch = oDesc.match(/\+(\d+)/);
        const val = valMatch ? parseInt(valMatch[1], 10) : 1;
        oEffectBonus += val;
        logs.push({
          source: 'opponent',
          cardName: opponentCard.name,
          description: `${opponentCard.name}: DEF (${oDef}) > seu ATK (${pAtk}) (+${val})`,
          bonusValue: val,
        });
      }
      if (oDesc.includes('adicione a diferença ao resultado provisório')) {
        const diff = oDef - pAtk;
        oEffectBonus += diff;
      }
    }

    if (oAtk > pAtk || (oAtk >= pAtk && oDesc.includes('igual ou maior'))) {
      const valMatch = oDesc.match(/receba \+(\d+)/i) || oDesc.match(/\+(\d+) no resultado/i);
      const val = valMatch ? parseInt(valMatch[1], 10) : 0;
      if (val > 0) {
        oEffectBonus += val;
        logs.push({
          source: 'opponent',
          cardName: opponentCard.name,
          description: `${opponentCard.name}: ATK (${oAtk}) >= seu ATK (${pAtk}) (+${val})`,
          bonusValue: val,
        });
      }
      if (oDesc.includes('reduza em 2 o resultado final do oponente')) {
        pEffectBonus -= 2;
      } else if (oDesc.includes('reduza em 3 o resultado final do oponente')) {
        pEffectBonus -= 3;
      }
    }

    if (oAtk < pAtk) {
      if (oDesc.includes('ataque desta carta for menor que o ataque da carta inimiga, receba +3')) {
        oEffectBonus += 3;
      }
    }

    // Goblin Fracote: opponent side
    if (oDesc.includes('goblin fracote')) {
      if (opponentSocket === 12) {
        const d8Roll = rollD8();
        oEffectBonus += d8Roll;
        logs.push({
          source: 'opponent',
          cardName: opponentCard.name,
          description: `Goblin Fracote: Posicionado no Engaste 12! Adicionou 1d8 (+${d8Roll}) ao Duelo!`,
          bonusValue: d8Roll,
        });
      }
      if (oAtk < pAtk) {
        oEffectBonus += 1;
        logs.push({
          source: 'opponent',
          cardName: opponentCard.name,
          description: 'Goblin Fracote: ATK menor que o jogador (+1 no resultado)!',
          bonusValue: 1,
        });
      }
    }

    if (oDesc.includes('muralha inquebrável') && pAtk > 3) {
      oEffectBonus += 2;
    }

    if (oDesc.includes('monastério da neve')) {
      if (oAtk < pAtk) pEffectBonus -= 2;
      if (oDef > pDef) oEffectBonus += 2;
    }

    if (oDesc.includes('singularidade arcana') && (playerCard.tipo === 'magia' || playerCard.tipo === 'habilidade')) {
      oEffectBonus += playerCard.atk;
    }

    if (oDesc.includes('dançarina de espadas') && firstRevealer === 'opponent') {
      oPierce = true;
    }

    if (oDef < pAtk) {
      if (oDesc.includes('defesa de bambu') || oDesc.includes('defesa dessa carta for menor que o ataque inimigo, reduza em 2')) {
        pEffectBonus -= 2;
      }
      if (oDesc.includes('necromante') && oDesc.includes('conceda +3 no duelo')) {
        oEffectBonus += 3;
      }
    }

    if (firstRevealer === 'player') {
      if (oDesc.includes('esta não for a primeira carta revelada') || oDesc.includes('segundo a revelar')) {
        const valMatch = oDesc.match(/\+(\d+)/);
        const val = valMatch ? parseInt(valMatch[1], 10) : 2;
        oEffectBonus += val;
      }
      if (oDesc.includes('adaga envenenada')) {
        pEffectBonus -= 2;
      }
    }

    if (oDesc.includes('aleister') && oAtk > (pAtk + pDef)) {
      oPierce = true;
      oEffectBonus += 4;
    }

    if (oDesc.includes('wolfgang') && oDef > pDef) {
      oTiesLossByTwo = true;
    }

    if (oDesc.includes('role 1d4')) {
      const r = rollD4();
      oEffectBonus += r;
      logs.push({ source: 'opponent', cardName: opponentCard.name, description: `${opponentCard.name}: Rolou 1d4 (+${r})!`, bonusValue: r });
    } else if (oDesc.includes('role 1d6')) {
      const r = rollD6();
      oEffectBonus += r;
      logs.push({ source: 'opponent', cardName: opponentCard.name, description: `${opponentCard.name}: Rolou 1d6 (+${r})!`, bonusValue: r });
    } else if (oDesc.includes('adicione 1d8 ao seu valor de duelo')) {
      const r = rollD8();
      oEffectBonus += r;
    }

    if (oDesc.includes('recarrega') && oDesc.includes('habilidade')) {
      rechargeOpponent = true;
    }
    if (oDesc.includes('não pode usar habilidades de iujio') || oDesc.includes('oponente não pode usar habilidades')) {
      blocksPlayerAbilities = true;
      logs.push({ source: 'opponent', cardName: opponentCard.name, description: `${opponentCard.name}: Bloqueou o seu uso de Habilidades!`, bonusValue: 0 });
    }

    if (oDesc.includes('perder esta rodada por 2 ou menos, a rodada empata')) {
      oTiesLossByTwo = true;
    }
    if (oDesc.includes('empate no provisório, você vence')) {
      oWinsIfProvisoryTie = true;
    }
  }

  // 10. Final Provisory Calculations
  const playerProvisory = playerDuelRoll + pCombatDamage + pEffectBonus;
  const opponentProvisory = opponentDuelRoll + oCombatDamage + oEffectBonus;

  let underdog: 'player' | 'opponent' | 'tie' = 'tie';
  if (playerProvisory < opponentProvisory) {
    underdog = 'player';
  } else if (opponentProvisory < playerProvisory) {
    underdog = 'opponent';
  }

  return {
    playerCombatBonus: pCombatDamage,
    opponentCombatBonus: oCombatDamage,
    playerEffectBonus: pEffectBonus,
    opponentEffectBonus: oEffectBonus,
    effectLogs: logs,
    playerProvisory,
    opponentProvisory,
    underdog,
    shouldRechargePlayerAbility: rechargePlayer,
    shouldRechargeOpponentAbility: rechargeOpponent,
    blocksPlayerAbilities,
    blocksOpponentAbilities,
    forceDraw,
    playerTiesIfLossByTwo: pTiesLossByTwo,
    opponentTiesIfLossByTwo: oTiesLossByTwo,
    playerWinsIfProvisoryTie: pWinsIfProvisoryTie,
    opponentWinsIfProvisoryTie: oWinsIfProvisoryTie,
  };
}

/**
 * AI Opponent decision on whether to activate their Universal Ability.
 * Evaluates Carta Armadilha, Jogada Inesperada, or Trapacear.
 */
export function decideOpponentAbility(
  opponentProvisory: number,
  playerProvisory: number,
  opponentSocket: EngasteNumber,
  opponentDeck: Record<EngasteNumber, Card>,
  hasUsedAbility: boolean,
  matchWinsPlayer: number,
  matchWinsOpponent: number
): {
  ability: UniversalAbilityType;
  trapSocketChoice?: EngasteNumber;
} | null {
  if (hasUsedAbility) return null;

  const gap = playerProvisory - opponentProvisory;
  if (gap <= 0) return null; // Opponent is winning, saves ability

  const isHighStakes = matchWinsPlayer >= 1;

  // 1. Check if Carta Armadilha can immediately flip or improve score
  const candidateSockets: EngasteNumber[] = [];
  if (opponentSocket > 1) candidateSockets.push((opponentSocket - 1) as EngasteNumber);
  if (opponentSocket < 12) candidateSockets.push((opponentSocket + 1) as EngasteNumber);

  for (const s of candidateSockets) {
    const candidateCard = opponentDeck[s];
    if (candidateCard && candidateCard.atk > opponentDeck[opponentSocket].atk) {
      if (gap <= 3 || isHighStakes) {
        return {
          ability: 'TRAP_CARD',
          trapSocketChoice: s,
        };
      }
    }
  }

  // 2. Check Trapacear (rolls 1d4 reduction on player)
  if (gap <= 3 || (gap <= 4 && isHighStakes)) {
    return {
      ability: 'CHEAT',
    };
  }

  // 3. Fallback: Jogada Inesperada if high stakes and large gap
  if (gap > 3 && isHighStakes) {
    return {
      ability: 'UNEXPECTED_PLAY',
    };
  }

  return null;
}
