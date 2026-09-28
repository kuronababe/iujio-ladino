import { Artifact } from '../types/game';

/**
 * Starter artifact pool, found in Baús de Tesouro pelos Salões de Maer.
 * Incomuns: bônus nichados/pequenos. Raros: bônus amplos/grandes.
 * Curta lista de exemplo — o autor pretende expandir com uma lista bespoke depois.
 */
export const ARTIFACT_POOL: Artifact[] = [
  {
    id: 'art_orbe_dragao',
    name: 'Orbe do Dragão',
    description: 'Suas cartas do arquétipo Dragão recebem +1/+1. Cartas Dragão inimigas recebem -1/-1.',
    rarity: 'raro',
    icon: '🐉',
    effect: {
      type: 'ARCHETYPE_BUFF',
      archetype: 'Dragão',
      atkDelta: 1,
      defDelta: 1,
      enemyAtkDelta: -1,
      enemyDefDelta: -1,
    },
  },
  {
    id: 'art_orbe_mortovivo',
    name: 'Orbe da Ossada',
    description: 'Suas cartas do arquétipo Morto-Vivo recebem +1/+1. Cartas Morto-Vivo inimigas recebem -1/-1.',
    rarity: 'raro',
    icon: '💀',
    effect: {
      type: 'ARCHETYPE_BUFF',
      archetype: 'Morto-Vivo',
      atkDelta: 1,
      defDelta: 1,
      enemyAtkDelta: -1,
      enemyDefDelta: -1,
    },
  },
  {
    id: 'art_orbe_elemental',
    name: 'Orbe Elemental',
    description: 'Suas cartas do arquétipo Elemental recebem +1/+1. Cartas Elementais inimigas recebem -1/-1.',
    rarity: 'raro',
    icon: '🔥',
    effect: {
      type: 'ARCHETYPE_BUFF',
      archetype: 'Elemental',
      atkDelta: 1,
      defDelta: 1,
      enemyAtkDelta: -1,
      enemyDefDelta: -1,
    },
  },
  {
    id: 'art_orbe_cavaleiro',
    name: 'Orbe do Cavaleiro',
    description: 'Suas cartas do arquétipo Cavaleiro recebem +1/+1. Cartas Cavaleiro inimigas recebem -1/-1.',
    rarity: 'raro',
    icon: '🛡️',
    effect: {
      type: 'ARCHETYPE_BUFF',
      archetype: 'Cavaleiro',
      atkDelta: 1,
      defDelta: 1,
      enemyAtkDelta: -1,
      enemyDefDelta: -1,
    },
  },
  {
    id: 'art_manual_iujio',
    name: 'Manual do Iujio',
    description: 'Você é proficiente nesse jogo. Bônus permanente de +2 no Duelo.',
    rarity: 'raro',
    icon: '📖',
    effect: { type: 'DUEL_FLAT_BONUS', duelBonus: 2 },
  },
  {
    id: 'art_dedal_ladino',
    name: 'Dedal do Ladino',
    description: 'Suas cartas do arquétipo Goblin recebem +1/+1.',
    rarity: 'incomum',
    icon: '🗝️',
    effect: { type: 'ARCHETYPE_BUFF', archetype: 'Goblin', atkDelta: 1, defDelta: 1 },
  },
  {
    id: 'art_amuleto_pirata',
    name: 'Amuleto do Afogado',
    description: 'Suas cartas do arquétipo Pirata recebem +1/+1.',
    rarity: 'incomum',
    icon: '🏴‍☠️',
    effect: { type: 'ARCHETYPE_BUFF', archetype: 'Pirata', atkDelta: 1, defDelta: 1 },
  },
  {
    id: 'art_moeda_sorte',
    name: 'Moeda da Sorte',
    description: 'Bônus permanente de +1 no Duelo.',
    rarity: 'incomum',
    icon: '🪙',
    effect: { type: 'DUEL_FLAT_BONUS', duelBonus: 1 },
  },
];

/**
 * Picks up to `count` distinct artifacts not already owned, for a Treasure node draft.
 * Falls back to allowing repeats of the pool if the player already owns almost everything.
 */
export function getArtifactDraftChoices(ownedIds: string[], count: number = 3): Artifact[] {
  const owned = new Set(ownedIds);
  const available = ARTIFACT_POOL.filter((a) => !owned.has(a.id));
  const source = available.length > 0 ? available : ARTIFACT_POOL;

  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
