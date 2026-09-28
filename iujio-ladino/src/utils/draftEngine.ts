import { ALL_CARDS } from '../data/cards';
import { Card, EngasteNumber } from '../types/game';

/**
 * Returns primary archetype (first token before slash)
 */
export function getPrimaryArchetype(card: Card): string {
  return card.arquetipo.split('/')[0].trim();
}

/**
 * Generates 3 card choices for the Opening Draft of a new run.
 * pickIndex goes from 0 to 11 (12 picks total).
 */
export function generateOpeningDraftChoices(
  pickIndex: number,
  draftedCards: Card[],
  chosenArchetype: string | null
): { choices: Card[]; targetSocket: EngasteNumber } {
  const chosenIds = new Set(draftedCards.map((c) => c.id));

  // Determine target socket distribution for balanced curve:
  // Picks 0..2 -> Sockets 1, 2, 3
  // Picks 3..5 -> Sockets 4, 5, 6
  // Picks 6..8 -> Sockets 7, 8, 9
  // Picks 9..11 -> Sockets 10, 11, 12
  const targetSocket: EngasteNumber = (pickIndex + 1) as EngasteNumber;

  const alreadyHasLegendary = draftedCards.some((c) =>
    c.arquetipo.toLowerCase().includes('lendário')
  );

  // Filter cards compatible with target socket
  // If player already drafted a Legendary card, exclude all Legendary cards
  let pool = ALL_CARDS.filter((c) => {
    if (chosenIds.has(c.id)) return false;
    if (!c.sockets.includes(targetSocket)) return false;
    if (alreadyHasLegendary && c.arquetipo.toLowerCase().includes('lendário')) return false;
    return true;
  });

  if (pool.length < 3) {
    // Expand to adjacent sockets if needed
    pool = ALL_CARDS.filter((c) => {
      if (chosenIds.has(c.id)) return false;
      if (!c.sockets.some((s) => Math.abs(s - targetSocket) <= 1)) return false;
      if (alreadyHasLegendary && c.arquetipo.toLowerCase().includes('lendário')) return false;
      return true;
    });
  }

  // Shuffle pool with ~30% archetype weight bonus if player has a chosen archetype
  const weightedPool = pool.map((c) => {
    const isPreferred = chosenArchetype && c.arquetipo.toLowerCase().includes(chosenArchetype.toLowerCase());
    const weight = isPreferred ? 1.3 : 1.0;
    return { card: c, sortKey: Math.random() * weight };
  });

  weightedPool.sort((a, b) => b.sortKey - a.sortKey);

  // Pick 3 distinct cards, ensuring at most 1 Legendary card can appear in the 3 choices
  const choices: Card[] = [];
  let legendaryIncluded = false;

  for (const item of weightedPool) {
    if (choices.length >= 3) break;
    const isLeg = item.card.arquetipo.toLowerCase().includes('lendário');
    if (isLeg && (legendaryIncluded || alreadyHasLegendary)) {
      continue; // Skip, only 1 legendary allowed
    }
    choices.push(item.card);
    if (isLeg) legendaryIncluded = true;
  }

  // Fallback if less than 3
  if (choices.length < 3) {
    const remain = ALL_CARDS.filter((c) => {
      if (choices.some((ch) => ch.id === c.id)) return false;
      const isLeg = c.arquetipo.toLowerCase().includes('lendário');
      if (isLeg && (legendaryIncluded || alreadyHasLegendary)) return false;
      return true;
    });
    for (const c of remain) {
      if (choices.length >= 3) break;
      choices.push(c);
      if (c.arquetipo.toLowerCase().includes('lendário')) legendaryIncluded = true;
    }
  }

  return { choices, targetSocket };
}

/**
 * Automatically slots 12 drafted cards into sockets 1 to 12.
 * Uses backtracking to guarantee a 100% valid assignment.
 */
export function autoSlotDraftedDeck(draftedCards: Card[]): Record<EngasteNumber, Card> {
  const deck: Partial<Record<EngasteNumber, Card>> = {};
  const sockets: EngasteNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const used = new Set<string>();

  function solve(socketIdx: number): boolean {
    if (socketIdx >= sockets.length) return true;
    const s = sockets[socketIdx];

    // Find available cards that fit this socket
    const candidates = draftedCards.filter((c) => !used.has(c.id) && c.sockets.includes(s));
    // Sort by smallest number of total sockets first (most restrictive cards placed first)
    candidates.sort((a, b) => a.sockets.length - b.sockets.length);

    for (const card of candidates) {
      deck[s] = card;
      used.add(card.id);
      if (solve(socketIdx + 1)) return true;
      delete deck[s];
      used.delete(card.id);
    }

    return false;
  }

  const success = solve(0);
  if (!success) {
    // If not all drafted cards match 1..12 directly, fill any gap from ALL_CARDS
    for (const s of sockets) {
      if (!deck[s]) {
        const fallback = ALL_CARDS.find((c) => c.sockets.includes(s) && !used.has(c.id));
        if (fallback) {
          deck[s] = fallback;
          used.add(fallback.id);
        }
      }
    }
  }

  return deck as Record<EngasteNumber, Card>;
}

/**
 * Generates 3 card draft choices for the reward screen after winning a match in Maer.
 * Weaker cards appear with higher probability, powerful/high-engaste cards are rarer.
 * ~30% bias towards player's chosen primary archetype.
 */
export function generateDraftChoices(
  currentMatchIndex: number,
  playerDeck: Record<EngasteNumber, Card>,
  playerCollection: Card[],
  chosenArchetype: string | null = null
): Card[] {
  const ownedIds = new Set<string>();
  Object.values(playerDeck).forEach((c) => ownedIds.add(c.id));
  playerCollection.forEach((c) => ownedIds.add(c.id));

  const available = ALL_CARDS.filter((c) => !ownedIds.has(c.id));
  const pool = available.length >= 3 ? available : ALL_CARDS;

  const lowPool = pool.filter((c) => Math.min(...c.sockets) <= 4);
  const midPool = pool.filter((c) => Math.min(...c.sockets) >= 5 && Math.min(...c.sockets) <= 8);
  const highPool = pool.filter((c) => Math.min(...c.sockets) >= 9);

  const progressRatio = Math.min(1, currentMatchIndex / 9);
  const lowWeight = 0.60 - progressRatio * 0.25;
  const highWeight = 0.10 + progressRatio * 0.18;

  const pickedCards: Card[] = [];
  const chosenIds = new Set<string>();
  let hasLegendary = false;

  for (let i = 0; i < 3; i++) {
    const r = Math.random();
    let selectedPool: Card[];

    const filterValid = (list: Card[]) =>
      list.filter((c) => {
        if (chosenIds.has(c.id)) return false;
        if (hasLegendary && c.arquetipo.toLowerCase().includes('lendário')) return false;
        return true;
      });

    if (r < lowWeight && filterValid(lowPool).length > 0) {
      selectedPool = filterValid(lowPool);
    } else if (r < lowWeight + highWeight && filterValid(highPool).length > 0) {
      selectedPool = filterValid(highPool);
    } else {
      selectedPool = filterValid(midPool);
      if (selectedPool.length === 0) {
        selectedPool = filterValid(pool);
      }
    }

    if (selectedPool.length > 0) {
      // Apply 30% archetype weight bonus
      const weighted = selectedPool.map((c) => {
        const isPref = chosenArchetype && c.arquetipo.toLowerCase().includes(chosenArchetype.toLowerCase());
        return { card: c, key: Math.random() * (isPref ? 1.3 : 1.0) };
      });
      weighted.sort((a, b) => b.key - a.key);

      const chosen = weighted[0].card;
      pickedCards.push(chosen);
      chosenIds.add(chosen.id);
      if (chosen.arquetipo.toLowerCase().includes('lendário')) {
        hasLegendary = true;
      }
    }
  }

  while (pickedCards.length < 3) {
    const remain = ALL_CARDS.filter((c) => {
      if (chosenIds.has(c.id)) return false;
      if (hasLegendary && c.arquetipo.toLowerCase().includes('lendário')) return false;
      return true;
    });
    if (remain.length === 0) break;
    const fallback = remain[Math.floor(Math.random() * remain.length)];
    pickedCards.push(fallback);
    chosenIds.add(fallback.id);
    if (fallback.arquetipo.toLowerCase().includes('lendário')) {
      hasLegendary = true;
    }
  }

  return pickedCards;
}
