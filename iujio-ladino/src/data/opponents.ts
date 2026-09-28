import { Card, EngasteNumber, Opponent } from '../types/game';
import { ALL_CARDS, getCardById } from './cards';

const CHAOS_ARCHMAGE_IMG = '/src/assets/images/boss_chaos_archmage_1790525257483.jpg';
const SAPPHIRE_DRAGON_IMG = '/src/assets/images/boss_sapphire_dragon_1790525247202.jpg';

export const MAER_OPPONENTS_POOL: Opponent[] = [
  // --- NÍVEL 1-3 (Os Primeiros Níveis do Calabouço de Maer) ---
  {
    id: 'opp_pip_maer',
    name: 'Pip, o Prisioneiro Goblin',
    title: 'Nível 1 · Celas de Pedra de Maer',
    description: 'Um larápio goblin preso nas celas superiores de Maer. Sobrevive roubando sobras e preparando armadilhas improvisadas.',
    avatar: '👺',
    tier: 1,
    archetype: 'Goblin',
    signatureCardIds: ['JrQar1cw0FQ8AqDJ', 'KCQrGBtClUMJ8GXZ', 'Nmn4lFQG49oGue9c'],
    poolCardIds: ['Isdbd9gxwXpShObl', 'B37rABCrNA8hDUMC', 'gob01LancFoguet01'],
  },
  {
    id: 'opp_esgoto_maer',
    name: 'Grumete Afogado',
    title: 'Nível 2 · Esgotos Subterrâneos',
    description: 'Um pirata desertor que caiu nas valas profundas do calabouço e vive de contrabandos úmidos e facas enferrujadas.',
    avatar: '🏴‍☠️',
    tier: 1,
    archetype: 'Pirata',
    signatureCardIds: ['iqQn7KRhBNV8jc5K', 'Ok0ddotcf3N0yM3Z', '9YyjXNcZoIKmidc0'],
    poolCardIds: ['pj5kgG0Gyp3nbiCd', 'x6MfRfAXuIFaYE7n', 'Nazv9Zlfq151jybD'],
  },
  {
    id: 'opp_silas_maer',
    name: 'Silas, o Acólito das Sombras',
    title: 'Nível 3 · Catacumbas Esquecidas',
    description: 'Um conjurador servo de Aleister enviado para vigiar as tumbas dos ladinos que falharam antes de você.',
    avatar: '💀',
    tier: 1,
    archetype: 'Morto-Vivo',
    signatureCardIds: ['cWAqhnpIOwt8Jgzi', 'unGgJCjeT3GeCjV1', 'pt2amFJXaw6CgtPg'],
    poolCardIds: ['rlN2QzS8yF6AKhNW', 'lWEUx0rbZqFPY1Xa', 'mor01MaoRastej001'],
  },

  // --- NÍVEL 4-6 (As Profundezas Fortificadas) ---
  {
    id: 'opp_gareth_maer',
    name: 'Sir Gareth, o Carcereiro de Ferro',
    title: 'Nível 4 · Posto da Guarda de Maer',
    description: 'O leal capitão encarregado de impedir qualquer fuga das celas centrais com escudos pesados e falanges.',
    avatar: '🛡️',
    tier: 2,
    archetype: 'Cavaleiro',
    signatureCardIds: ['mxhNSSmuT4k3vCZa', 'y7uw5hpFF8ggXD9P', 'usmTTdrhpCVBFpuW'],
    poolCardIds: ['6HDVbN2ZzmIwdNiP', 'BcMAgq4mZub7Fr1H', 'cav01RecrutCast1', 'cav02FormacFalan2'],
  },
  {
    id: 'opp_duergar_maer',
    name: 'Krag, o Mineiro Enlouquecido',
    title: 'Nível 5 · Forjas Negras de Maer',
    description: 'Um anão ferreiro amaldiçoado pela magia de Aleister, forjando armas rúnicas nas entranhas da montanha.',
    avatar: '⛏️',
    tier: 2,
    archetype: 'Anão',
    signatureCardIds: ['4E6bKBVxnesRTj3I', 'e24icgnr7CYQGR7R', 'ofZBdJNN4zbQl9JQ'],
    poolCardIds: ['U1agzhyjERy9f42O', 'oASO3Aa5eIfDlK1G', 'ana01GuardTunel01'],
  },
  {
    id: 'opp_monk_maer',
    name: 'Mestre Jin, o Renegado do Ki',
    title: 'Nível 6 · Sala da Penitência',
    description: 'Um monge guerreiro aprisionado que perdeu a sanidade e agora testa o reflexo e a agilidade de qualquer invasor.',
    avatar: '🥋',
    tier: 2,
    archetype: 'Monge',
    signatureCardIds: ['AUPZTfI6zyvguOD5', 'BgPyqI5jFleXCb0e', 'Ku0qZklxp8YxD2k1'],
    poolCardIds: ['TowFDJXDQ7GbyVJb', '3mdH1yx8EVQfCRus', 'mon01PostuGarc001'],
  },

  // --- NÍVEL 7-9 (Os Salões das Aberrações e Dragões) ---
  {
    id: 'opp_aberracao_maer',
    name: 'O Colecionador de Mentes',
    title: 'Nível 7 · Salão das Aberrações',
    description: 'Criaturas moldadas por experimentos alquímicos proibidos nos laboratórios escuros de Maer.',
    avatar: '👁️',
    tier: 3,
    archetype: 'Aberrante',
    signatureCardIds: ['abr01NoticEsprei1', 'abr02GosmAcre0002', 'abr06DevorMentes6'],
    poolCardIds: ['abr04CuboGelat004', 'abr07UrsoCoruja07', 'abr08MimicVoraz08'],
  },
  {
    id: 'opp_elemental_maer',
    name: 'Kallista, Tecelã dos Vórtices',
    title: 'Nível 8 · Fornalha Primordial',
    description: 'Comanda labaredas, maremotos e tempestades arcanas canalizadas direto do núcleo de Maer.',
    avatar: '🔥',
    tier: 3,
    archetype: 'Elemental',
    signatureCardIds: ['ele01FagulhViv001', 'ele05LancGelo0005', 'ele07LabarDevor07'],
    poolCardIds: ['ele08GolemMama008', 'ele09TsunamDev009', 'ele10FuriCiclon10'],
  },
  {
    id: 'opp_dragao_maer',
    name: 'General Ignis, o Carrasco Dracônico',
    title: 'Nível 9 · Portão das Presas',
    description: 'O mais temido tenente de Aleister, cavaleiro montado em wyverns ancestrais que guarda o santuário final.',
    avatar: '🐉',
    tier: 3,
    archetype: 'Dragão',
    signatureCardIds: ['drg05Wyverncacad5', 'drg07DragCripta07', 'drg08SoprChamas08'],
    poolCardIds: ['drg09DragJade009', 'drg10CobicDrag010', 'drg11DragVermAn11'],
  },

  // --- NÍVEL 10 (CHEFE SUPREMO DE MAER) ---
  {
    id: 'boss_aleister',
    name: 'Aleister, o Mago Louco',
    title: 'Nível 10 · O Trono do Vórtice de Maer',
    description: 'O próprio arquimago louco que o capturou e arquiteta os perigos de Maer. Derrote Aleister para conquistar sua liberdade!',
    avatar: CHAOS_ARCHMAGE_IMG,
    tier: 4,
    isBoss: true,
    archetype: 'Arcano / Lendário',
    signatureCardIds: ['UQBhquK1sM2wS5EZ', 'XnSwJoNv9xSql1fF', '5DCBskTfpyi6ACla', 'HeGXFACRsZGk0dvq'],
    poolCardIds: ['arc04SingulArca4', 'nz8YpSWaMINes2Bt', 'dh45Oe0CxRkQcYQO', 'siMUqAiA3l1SCGbj'],
  },
];

// Generates the 10-battle gauntlet through Maer
export function generateRunLadder(): Opponent[] {
  // Returns all 10 battles in narrative progression:
  // 1 to 3: Upper Dungeons
  // 4 to 6: Fortified Depths
  // 7 to 9: Abyssal Vaults
  // 10: Aleister, o Mago Louco!
  return [...MAER_OPPONENTS_POOL];
}

// Builds an opponent deck strictly respecting the 12 engastes with their thematic pool
export function generateOpponentDeck(opponent: Opponent): Record<EngasteNumber, Card> {
  const deck: Partial<Record<EngasteNumber, Card>> = {};
  const usedCardIds = new Set<string>();

  const priorityCards = [
    ...opponent.signatureCardIds.map((id) => getCardById(id)).filter((c): c is Card => !!c),
    ...opponent.poolCardIds.map((id) => getCardById(id)).filter((c): c is Card => !!c),
  ];

  const sockets: EngasteNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const s of sockets) {
    let candidate = priorityCards.find((c) => c.sockets.includes(s) && !usedCardIds.has(c.id));

    if (!candidate) {
      // Find a card of matching archetype if possible
      const archCards = ALL_CARDS.filter(
        (c) => c.sockets.includes(s) && !usedCardIds.has(c.id) && c.arquetipo.includes(opponent.archetype)
      );
      if (archCards.length > 0) {
        candidate = archCards[Math.floor(Math.random() * archCards.length)];
      }
    }

    if (!candidate) {
      const validGeneral = ALL_CARDS.filter((c) => c.sockets.includes(s) && !usedCardIds.has(c.id));
      if (validGeneral.length > 0) {
        candidate = validGeneral[Math.floor(Math.random() * validGeneral.length)];
      }
    }

    if (!candidate) {
      candidate = ALL_CARDS.find((c) => c.sockets.includes(s))!;
    }

    deck[s] = candidate;
    usedCardIds.add(candidate.id);
  }

  return deck as Record<EngasteNumber, Card>;
}
