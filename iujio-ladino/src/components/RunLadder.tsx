import React from 'react';
import { MapNode, RunState, TalentId } from '../types/game';
import { IUJIO_TALENTS } from '../data/talents';
import { MAER_OPPONENTS_POOL } from '../data/opponents';
import { sounds } from '../utils/audio';

interface RunLadderProps {
  run: RunState;
  selectedTalent: TalentId;
  onOpenTalentSelector: () => void;
  onSelectNode: (nodeId: string) => void;
  onOpenDeckBuilder: () => void;
  onOpenRulebook: () => void;
}

const LANE_X = [18, 50, 82]; // % horizontal position per lane
const FLOOR_HEIGHT = 128; // px vertical spacing per floor
const NODE_STYLES: Record<MapNode['type'], { icon: string; label: string }> = {
  COMBAT: { icon: '⚔️', label: 'Combate' },
  TREASURE: { icon: '💰', label: 'Baú de Tesouro' },
  HEART: { icon: '❤️', label: 'Fonte de Cura' },
  BOSS: { icon: '👑', label: 'Chefe Final' },
};

function getOpponentName(opponentId?: string): string {
  if (!opponentId) return '';
  return MAER_OPPONENTS_POOL.find((o) => o.id === opponentId)?.name.split(',')[0] || '';
}

export const RunLadder: React.FC<RunLadderProps> = ({
  run,
  selectedTalent,
  onOpenTalentSelector,
  onSelectNode,
  onOpenDeckBuilder,
  onOpenRulebook,
}) => {
  const talent = IUJIO_TALENTS.find((t) => t.id === selectedTalent) || IUJIO_TALENTS[0];
  const { map, currentNodeId, visitedNodeIds } = run;
  const currentNode = currentNodeId ? map.nodes[currentNodeId] : null;

  const selectableIds = new Set<string>(currentNode ? currentNode.connections : map.nodesByFloor[0]);
  const visitedSet = new Set(visitedNodeIds);

  const allNodes = Object.values(map.nodes) as MapNode[];
  const numFloors = map.nodesByFloor.length;
  const totalHeight = numFloors * FLOOR_HEIGHT + 60;

  // Precompute pixel positions for every node, plus the virtual "entrance" position
  const nodePos: Record<string, { x: number; y: number }> = {};
  map.nodesByFloor.forEach((ids, floorIdx) => {
    ids.forEach((id) => {
      const node = map.nodes[id];
      nodePos[id] = { x: LANE_X[node.lane], y: floorIdx * FLOOR_HEIGHT + 60 };
    });
  });
  const entrancePos = { x: 50, y: 12 };

  // Build the list of line segments to draw (entrance -> floor0, and floor f -> floor f+1)
  const lines: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
  map.nodesByFloor[0]?.forEach((id) => {
    lines.push({
      x1: entrancePos.x,
      y1: entrancePos.y,
      x2: nodePos[id].x,
      y2: nodePos[id].y,
      active: visitedSet.has(id) || currentNodeId === null,
    });
  });
  allNodes.forEach((node) => {
    node.connections.forEach((toId) => {
      lines.push({
        x1: nodePos[node.id].x,
        y1: nodePos[node.id].y,
        x2: nodePos[toId].x,
        y2: nodePos[toId].y,
        active: visitedSet.has(node.id) && (visitedSet.has(toId) || node.id === currentNodeId),
      });
    });
  });

  const handleNodeClick = (node: MapNode) => {
    if (!selectableIds.has(node.id)) return;
    onSelectNode(node.id);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 py-6 gap-6">
      {/* Top Banner / Run Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            <span>Arena Roguelike</span>
            <span>·</span>
            <span>Objetivo: Vencer o Chefe Final</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-slate-100">
            Salões Ramificados de Maer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Escolha seu caminho pelos calabouços. Cada derrota custa 1 Vida — vença o Chefe Final para se libertar!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenDeckBuilder();
            }}
            className="px-4 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            🎒 Baralho (12)
          </button>
          <div
            onClick={() => {
              sounds.playClick();
              onOpenTalentSelector();
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 hover:border-amber-400 transition-colors cursor-pointer group"
          >
            <span className="text-base">{talent.icon}</span>
            <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-200">
              {talent.name}
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenRulebook();
            }}
            className="px-3 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 transition-all cursor-pointer"
            title="Regras do Jogo"
          >
            📖 Regras
          </button>
        </div>
      </div>

      {/* Branching Dungeon Map */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-hidden">
        <h3 className="font-cinzel font-bold text-sm text-slate-300 mb-2">
          Mapa da Masmorra · 3 Caminhos até Aleister
        </h3>
        <p className="text-[11px] text-slate-500 mb-4">
          Nós dourados são acessíveis agora. ⚔️ Combate · 💰 Tesouro (Artefato) · ❤️ Fonte de Cura · 👑 Chefe Final
        </p>

        <div className="relative w-full" style={{ height: totalHeight }}>
          {/* Connector lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 100 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            {lines.map((l, i) => (
              <line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={l.active ? '#f59e0b' : '#334155'}
                strokeWidth={l.active ? 1.4 : 1}
                strokeOpacity={l.active ? 0.85 : 0.4}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Entrance marker */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${entrancePos.x}%`, top: entrancePos.y, transform: 'translate(-50%,-50%)' }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                currentNodeId === null ? 'border-amber-400 bg-amber-950/60 shadow-lg shadow-amber-500/30' : 'border-emerald-500/50 bg-emerald-950/30'
              }`}
            >
              🚪
            </div>
          </div>

          {/* Nodes */}
          {allNodes.map((node) => {
            const isVisited = visitedSet.has(node.id);
            const isCurrent = node.id === currentNodeId;
            const isSelectable = selectableIds.has(node.id) && !isVisited;
            const style = NODE_STYLES[node.type];
            const pos = nodePos[node.id];
            const opponentName = node.type !== 'HEART' && node.type !== 'TREASURE' ? getOpponentName(node.opponentId) : '';

            return (
              <div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{ left: `${pos.x}%`, top: pos.y, transform: 'translate(-50%,-50%)', width: 84 }}
              >
                <button
                  onClick={() => handleNodeClick(node)}
                  disabled={!isSelectable}
                  title={opponentName || style.label}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 transition-all shrink-0
                    ${
                      isCurrent
                        ? 'border-amber-300 bg-amber-500/20 shadow-lg shadow-amber-500/40 scale-110'
                        : isVisited
                        ? 'border-emerald-500/50 bg-emerald-950/30 opacity-70'
                        : isSelectable
                        ? 'border-amber-400 bg-amber-950/50 shadow-lg shadow-amber-500/30 hover:scale-110 active:scale-95 cursor-pointer animate-pulse'
                        : 'border-slate-700 bg-slate-900/50 opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  {isVisited && !isCurrent ? '✓' : style.icon}
                </button>
                <span
                  className={`mt-1 text-[9px] sm:text-[10px] text-center leading-tight font-medium ${
                    isSelectable || isCurrent ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {opponentName || style.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
