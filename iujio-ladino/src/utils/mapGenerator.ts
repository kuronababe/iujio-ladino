import { MapNode, MapNodeType, RunMap } from '../types/game';
import { MAER_OPPONENTS_POOL } from '../data/opponents';

/**
 * Quantidade de nós (caminhos disponíveis) por andar, antes do Chefe Final.
 * Alterna entre 3, 2 e às vezes 1 (gargalo, força a convergência dos 3 caminhos).
 * 9 andares = 3 tiers de 3 oponentes cada (igual à MAER_OPPONENTS_POOL sem o chefe).
 */
const FLOOR_LANE_COUNTS = [2, 3, 2, 1, 3, 2, 3, 1, 2];

function pickLanes(count: number): number[] {
  if (count >= 3) return [0, 1, 2];
  if (count <= 1) return [1]; // gargalo central
  const pairs = [
    [0, 1],
    [1, 2],
    [0, 2],
  ];
  return pairs[Math.floor(Math.random() * pairs.length)];
}

function rollNonCombatType(): MapNodeType {
  return Math.random() < 0.55 ? 'TREASURE' : 'HEART';
}

/**
 * Gera um mapa ramificado estilo Slay the Spire: 3 caminhos que se cruzam e
 * eventualmente convergem no nó do Chefe Final. Cada andar tem entre 1 e 3
 * nós disponíveis (COMBATE, BAÚ DE TESOURO ou CORAÇÃO), com pelo menos um
 * nó de COMBATE garantido por andar.
 */
export function generateDungeonMap(): RunMap {
  const nodes: Record<string, MapNode> = {};
  const nodesByFloor: string[][] = [];

  const regularOpponents = MAER_OPPONENTS_POOL.filter((o) => !o.isBoss);
  const bossOpponent = MAER_OPPONENTS_POOL.find((o) => o.isBoss)!;

  FLOOR_LANE_COUNTS.forEach((count, floor) => {
    const lanes = pickLanes(count);
    const floorOpponent = regularOpponents[floor % regularOpponents.length];
    const combatLaneIdx = Math.floor(Math.random() * lanes.length);
    const ids: string[] = [];

    lanes.forEach((lane, i) => {
      const type: MapNodeType =
        lanes.length === 1 || i === combatLaneIdx
          ? 'COMBAT'
          : Math.random() < 0.5
          ? 'COMBAT'
          : rollNonCombatType();

      const id = `f${floor}_l${lane}`;
      nodes[id] = {
        id,
        type,
        floor,
        lane,
        opponentId: type === 'COMBAT' ? floorOpponent.id : undefined,
        connections: [],
      };
      ids.push(id);
    });

    nodesByFloor.push(ids);
  });

  // Andar do Chefe Final: nó único no centro, onde todos os caminhos convergem
  const bossFloor = FLOOR_LANE_COUNTS.length;
  const bossId = `f${bossFloor}_boss`;
  nodes[bossId] = {
    id: bossId,
    type: 'BOSS',
    floor: bossFloor,
    lane: 1,
    opponentId: bossOpponent.id,
    connections: [],
  };
  nodesByFloor.push([bossId]);

  // Conecta cada andar ao próximo, priorizando lanes adjacentes (±1)
  for (let f = 0; f < nodesByFloor.length - 1; f++) {
    const currentIds = nodesByFloor[f];
    const nextIds = nodesByFloor[f + 1];

    currentIds.forEach((id) => {
      const node = nodes[id];
      const reachable = nextIds.filter((nid) => Math.abs(nodes[nid].lane - node.lane) <= 1);
      node.connections = reachable.length > 0 ? reachable : [...nextIds];
    });

    // Reparo: garante que todo nó do próximo andar tenha ao menos 1 entrada
    nextIds.forEach((nid) => {
      const hasIncoming = currentIds.some((id) => nodes[id].connections.includes(nid));
      if (!hasIncoming) {
        const closestId = currentIds.reduce((best, id) =>
          Math.abs(nodes[id].lane - nodes[nid].lane) < Math.abs(nodes[best].lane - nodes[nid].lane) ? id : best
        );
        nodes[closestId].connections.push(nid);
      }
    });
  }

  return { nodes, nodesByFloor };
}
