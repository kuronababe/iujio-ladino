export type EngasteNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type ElementType = 'Fogo' | 'Água' | 'Terra' | 'Ar' | 'Luz' | 'Trevas' | 'Caos' | 'Besta' | 'Arcano' | 'Mecânico';

export interface CardEffectTrigger {
  id: string;
  name: string;
  description: string;
  /**
   * Type of effect rule
   */
  type: 
    | 'ATK_LOWER_BONUS'       // If our atk < enemy atk -> +bonus
    | 'ATK_HIGHER_BONUS'      // If our atk > enemy atk -> +bonus
    | 'DEF_PIERCE'            // Ignores enemy defense
    | 'DUEL_EVEN_BONUS'       // If duel roll is even -> +bonus
    | 'DUEL_ODD_BONUS'        // If duel roll is odd -> +bonus
    | 'DUEL_WIN_BONUS'        // If won initial d12 roll -> +bonus
    | 'DUEL_LOSE_BONUS'       // If lost initial d12 roll (revealed second) -> +bonus
    | 'HIGH_ENEMY_ROLL_BONUS' // If enemy rolled >= 8 on d12 -> +bonus
    | 'ENEMY_DEF_PENALTY'     // Weakens enemy provisory
    | 'ELEMENTAL_BURST'       // Adds random 1d4 damage
    | 'RECHARGE_ABILITY'      // Recharges Universal Ability if used
    | 'FLIP_DEFENSE_TO_ATK'   // Adds DEF to ATK for calculation
    | 'SHADOW_LEECH'          // Steals 2 points from opponent's score
    | 'TITAN_RESILIENCE'      // If opponent dealt combat damage, gain +3
    | 'LAST_STAND_BONUS'      // If player is at 1 heart, +4 bonus
    | 'FLAT_BONUS';           // Always adds flat bonus
  value?: number;
}

export interface Card {
  id: string;
  name: string;
  sockets: EngasteNumber[];
  atk: number;
  def: number;
  tipo: 'criatura' | 'magia' | 'habilidade';
  arquetipo: string;
  element?: ElementType;
  quote?: string;
  effect: CardEffectTrigger;
  efeitoRaw?: string;
  imageUrl?: string;
  icon?: string;
}

export type UniversalAbilityType = 'TRAP_CARD' | 'UNEXPECTED_PLAY' | 'CHEAT';

export type TalentId = 'PERFECT_CURVE' | 'TOXIC' | 'COMBER' | 'HEART_OF_THE_CARDS';

export interface Talent {
  id: TalentId;
  name: string;
  description: string;
  icon: string;
}

export interface UniversalAbility {
  id: UniversalAbilityType;
  name: string;
  description: string;
  shortDesc: string;
  icon: string;
}

export type ArtifactRarity = 'incomum' | 'raro';

export type ArtifactEffectType = 'ARCHETYPE_BUFF' | 'DUEL_FLAT_BONUS';

export interface ArtifactEffect {
  type: ArtifactEffectType;
  /** Required for ARCHETYPE_BUFF: matched against Card.arquetipo (substring, case-insensitive) */
  archetype?: string;
  atkDelta?: number;
  defDelta?: number;
  enemyAtkDelta?: number;
  enemyDefDelta?: number;
  /** Required for DUEL_FLAT_BONUS */
  duelBonus?: number;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: ArtifactRarity;
  icon: string;
  effect: ArtifactEffect;
}

export type MapNodeType = 'COMBAT' | 'TREASURE' | 'HEART' | 'BOSS';

export interface MapNode {
  id: string;
  type: MapNodeType;
  floor: number;
  lane: number; // 0, 1 or 2 (horizontal position)
  opponentId?: string; // set for COMBAT and BOSS nodes
  connections: string[]; // ids of reachable nodes on the next floor
}

export interface RunMap {
  nodes: Record<string, MapNode>;
  nodesByFloor: string[][]; // node ids grouped by floor, in ascending floor order
}

export interface Opponent {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  tier: 1 | 2 | 3 | 4; // 4 is Boss Aleister
  isBoss?: boolean;
  archetype: string;
  signatureCardIds: string[];
  poolCardIds: string[];
}

export interface CombatEffectLog {
  source: 'player' | 'opponent';
  cardName: string;
  description: string;
  bonusValue: number;
}

export interface CombatRoundState {
  roundNumber: number;
  phase: 'ROLLING_DUEL' | 'WAITING_DRAW' | 'REVEALING_FIRST' | 'REVEALING_SECOND' | 'CALCULATING_PROVISORY' | 'CHOOSING_ABILITY' | 'FINAL_RESULT' | 'ROUND_OVER';
  playerDuelRoll: number;
  opponentDuelRoll: number;
  firstRevealer: 'player' | 'opponent' | null;
  playerCard: Card | null;
  opponentCard: Card | null;
  playerSocketDrawn: EngasteNumber | null;
  opponentSocketDrawn: EngasteNumber | null;
  playerCombatBonus: number; // Max(0, playerAtk - oppDef)
  opponentCombatBonus: number; // Max(0, oppAtk - playerDef)
  playerEffectBonus: number;
  opponentEffectBonus: number;
  effectLogs: CombatEffectLog[];
  playerProvisory: number;
  opponentProvisory: number;
  underdog: 'player' | 'opponent' | 'tie' | null;
  playerUsedAbility: UniversalAbilityType | null;
  opponentUsedAbility: UniversalAbilityType | null;
  playerAbilityBonus: number;
  opponentAbilityBonus: number;
  rerollsThisRound: number;
  playerFinalResult: number;
  opponentFinalResult: number;
  winner: 'player' | 'opponent' | 'draw' | null;
}

export interface MatchState {
  currentMatchIndex: number; // 0 to 9 (10 matches total)
  opponent: Opponent;
  selectedTalent: TalentId;
  playerWins: number;
  opponentWins: number;
  draws: number;
  currentRoundNumber: number;
  roundHistory: CombatRoundState[];
  currentRound: CombatRoundState | null;
  playerDeckRecord: Record<EngasteNumber, Card>;
  opponentDeckRecord: Record<EngasteNumber, Card>;
  playerDeckRemaining: { socket: EngasteNumber; card: Card }[];
  opponentDeckRemaining: { socket: EngasteNumber; card: Card }[];
  playerUniversalAbilityUsed: boolean;
  opponentUniversalAbilityUsed: boolean;
  playerUsedAbilityType: UniversalAbilityType | null;
  opponentUsedAbilityType: UniversalAbilityType | null;
  matchWinner: 'player' | 'opponent' | null;
}

export interface RunState {
  hearts: number; // Starts at 2
  maxHearts: number; // Starts at 2, can grow up to 3 via Heart nodes
  currentMatchIndex: number; // Combats WON so far, 0 to 9 (used for draft scaling & progress UI)
  deck: Record<EngasteNumber, Card>; // 12 sockets, cards mapped by socket 1..12
  collection: Card[]; // Extra cards drafted
  primaryArchetype: string | null; // e.g. "Ladino", "Cavaleiro"
  runSeed: number;
  map: RunMap;
  currentNodeId: string | null; // null = still at the entrance, hasn't picked floor 0 yet
  visitedNodeIds: string[];
  artifacts: Artifact[]; // Artifacts collected from Treasure nodes
  isCompleted: boolean;
  isDefeated: boolean;
  stats: {
    matchesWon: number;
    matchesLost: number;
    roundsWon: number;
    highestRoll: number;
    totalDamageDealt: number;
    clutchAbilitiesUsed: number;
  };
}
