import React from 'react';
import { Card, EngasteNumber } from '../types/game';

interface CardViewProps {
  card: Card;
  activeSocket?: EngasteNumber; // If socketed in a specific slot
  isDragging?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  showSocketsHighlight?: EngasteNumber; // Highlight if compatible with this socket
  dimmed?: boolean;
  className?: string;
}

// Visual theme borders & badges by primary archetype
const ARCHETYPE_THEMES: Record<
  string,
  { bg: string; border: string; accent: string; glow: string; badge: string }
> = {
  Ladino: {
    bg: 'from-slate-900 via-stone-900 to-black',
    border: 'border-amber-500/60',
    accent: 'text-amber-300',
    glow: 'rgba(245, 158, 11, 0.25)',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
  Cavaleiro: {
    bg: 'from-slate-900 via-sky-950/70 to-slate-950',
    border: 'border-sky-500/60',
    accent: 'text-sky-300',
    glow: 'rgba(56, 189, 248, 0.25)',
    badge: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
  },
  Monge: {
    bg: 'from-stone-900 via-orange-950/60 to-black',
    border: 'border-orange-500/60',
    accent: 'text-orange-300',
    glow: 'rgba(249, 115, 22, 0.25)',
    badge: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
  },
  Arcano: {
    bg: 'from-purple-950/90 via-indigo-950/80 to-black',
    border: 'border-purple-500/60',
    accent: 'text-purple-300',
    glow: 'rgba(168, 85, 247, 0.3)',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
  },
  Pirata: {
    bg: 'from-teal-950/90 via-slate-900 to-black',
    border: 'border-teal-500/60',
    accent: 'text-teal-300',
    glow: 'rgba(20, 184, 166, 0.25)',
    badge: 'bg-teal-950/80 text-teal-300 border-teal-500/50',
  },
  'Morto-Vivo': {
    bg: 'from-emerald-950/90 via-slate-950 to-black',
    border: 'border-emerald-600/60',
    accent: 'text-emerald-300',
    glow: 'rgba(16, 185, 129, 0.25)',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  },
  Anão: {
    bg: 'from-stone-900 via-yellow-950/80 to-black',
    border: 'border-amber-700/60',
    accent: 'text-amber-200',
    glow: 'rgba(217, 119, 6, 0.25)',
    badge: 'bg-stone-900 text-amber-300 border-amber-600/50',
  },
  Goblin: {
    bg: 'from-lime-950/90 via-stone-900 to-black',
    border: 'border-lime-500/60',
    accent: 'text-lime-300',
    glow: 'rgba(132, 204, 22, 0.25)',
    badge: 'bg-lime-950/80 text-lime-300 border-lime-500/50',
  },
  Bardo: {
    bg: 'from-rose-950/90 via-violet-950/80 to-black',
    border: 'border-rose-400/60',
    accent: 'text-rose-300',
    glow: 'rgba(251, 113, 133, 0.25)',
    badge: 'bg-rose-950/80 text-rose-300 border-rose-400/50',
  },
  Aberrante: {
    bg: 'from-fuchsia-950/90 via-slate-950 to-black',
    border: 'border-fuchsia-500/60',
    accent: 'text-fuchsia-300',
    glow: 'rgba(217, 70, 239, 0.3)',
    badge: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50',
  },
  Dragão: {
    bg: 'from-red-950/95 via-amber-950/80 to-black',
    border: 'border-red-500/70',
    accent: 'text-red-300',
    glow: 'rgba(239, 68, 68, 0.35)',
    badge: 'bg-red-950/90 text-red-300 border-red-500/60',
  },
  Elemental: {
    bg: 'from-cyan-950/90 via-blue-950/80 to-black',
    border: 'border-cyan-500/60',
    accent: 'text-cyan-300',
    glow: 'rgba(6, 182, 212, 0.25)',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
  },
  Druida: {
    bg: 'from-emerald-950/90 via-stone-900 to-black',
    border: 'border-emerald-500/60',
    accent: 'text-emerald-300',
    glow: 'rgba(16, 185, 129, 0.25)',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  },
  Fera: {
    bg: 'from-amber-950/90 via-stone-900 to-black',
    border: 'border-amber-600/60',
    accent: 'text-amber-300',
    glow: 'rgba(245, 158, 11, 0.25)',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  activeSocket,
  isDragging,
  isSelected,
  onClick,
  onDragStart,
  size = 'md',
  showSocketsHighlight,
  dimmed,
  className = '',
}) => {
  const primaryArch = card.arquetipo.split('/')[0].trim();
  const isLegendary = card.arquetipo.toLowerCase().includes('lendário');
  const theme = ARCHETYPE_THEMES[primaryArch] || ARCHETYPE_THEMES.Ladino;
  const isCompatibleWithHighlight = showSocketsHighlight
    ? card.sockets.includes(showSocketsHighlight)
    : true;

  // Real vertical playing card aspect ratio (~1:1.45 to 1:1.5)
  // Generous widths so card names are NEVER truncated or cut off
  const sizeConfig = {
    sm: {
      box: 'w-44 min-h-[260px] p-2.5',
      title: 'text-[11px] leading-tight',
      sub: 'text-[8.5px]',
      portraitH: 'h-14',
      iconSize: 'text-2xl',
      effectText: 'text-[9.5px] leading-tight line-clamp-3',
      statNum: 'text-sm',
    },
    md: {
      box: 'w-56 min-h-[350px] p-3.5',
      title: 'text-xs sm:text-sm leading-snug',
      sub: 'text-[9.5px]',
      portraitH: 'h-22',
      iconSize: 'text-4xl',
      effectText: 'text-[11px] leading-relaxed line-clamp-4',
      statNum: 'text-base sm:text-lg',
    },
    lg: {
      box: 'w-68 min-h-[420px] p-4.5',
      title: 'text-sm sm:text-base leading-snug',
      sub: 'text-[10px]',
      portraitH: 'h-28',
      iconSize: 'text-5xl',
      effectText: 'text-xs sm:text-sm leading-relaxed line-clamp-5',
      statNum: 'text-xl sm:text-2xl',
    },
  }[size];

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      className={`
        relative select-none flex flex-col justify-between rounded-2xl border-2 transition-all duration-200 cursor-pointer
        bg-gradient-to-b ${theme.bg} ${isLegendary ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : theme.border} shadow-xl
        ${sizeConfig.box}
        ${isSelected ? 'ring-3 ring-amber-400 scale-[1.03] z-20 shadow-amber-500/50' : 'hover:scale-[1.02]'}
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${dimmed || (showSocketsHighlight && !isCompatibleWithHighlight) ? 'opacity-30 grayscale-[70%]' : ''}
        ${className}
      `}
      style={{
        boxShadow: isSelected
          ? `0 0 25px ${theme.glow}, 0 10px 25px rgba(0,0,0,0.8)`
          : `0 4px 20px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Legendary Ribbon Tag */}
      {isLegendary && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-cinzel font-black text-[9px] tracking-wider uppercase shadow-md border border-amber-200">
          👑 Lendário
        </div>
      )}

      {/* 1. Header: Full readable Card Name & Engaste indicator */}
      <div className="flex items-start justify-between gap-1.5 pb-1 border-b border-white/10">
        <div className="flex-1 min-w-0 pr-1">
          {/* Card Name: break-words, never cut off! */}
          <div
            className={`font-cinzel font-bold text-slate-100 ${sizeConfig.title} break-words drop-shadow-sm`}
            title={card.name}
          >
            {card.name}
          </div>
          <div
            className={`${sizeConfig.sub} uppercase font-bold text-slate-400 tracking-wider truncate mt-0.5`}
          >
            {card.tipo} · {primaryArch}
          </div>
        </div>

        {/* Socket Badge: Active slot or compatible range */}
        {activeSocket ? (
          <div className="shrink-0 flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-mono-num font-black text-xs shadow-md border border-amber-300 ring-2 ring-amber-500/40">
            <span className="text-[7px] leading-none uppercase font-bold">SLOT</span>
            <span className="text-xs leading-none">{activeSocket}</span>
          </div>
        ) : (
          <div className="shrink-0 flex items-center font-mono-num">
            {card.sockets.length <= 4 ? (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-500/40 shadow-sm">
                E: {card.sockets.join(',')}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-500/40 shadow-sm">
                E: {card.sockets[0]}–{card.sockets[card.sockets.length - 1]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Visual Portrait Frame (Emoji / Creative Commons placeholder artwork) */}
      <div
        className={`relative my-1 w-full ${sizeConfig.portraitH} rounded-xl overflow-hidden border border-white/15 bg-gradient-to-b from-black/80 via-slate-900/90 to-black/80 flex items-center justify-center shadow-inner group`}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Ambient Background Aura */}
            <div
              className="absolute inset-0 opacity-40 blur-md"
              style={{
                background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
              }}
            />
            {/* Thematic Icon / Emoji */}
            <span
              className={`${sizeConfig.iconSize} drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transform group-hover:scale-110 transition-transform duration-300 select-none`}
            >
              {card.icon || '⚔️'}
            </span>

            {/* Subtle archetype badge overlay */}
            <div className="absolute bottom-1 right-1.5 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-xs text-[8px] text-slate-300 font-mono-num border border-white/10 uppercase tracking-widest">
              {card.tipo === 'criatura' ? 'Criatura' : card.tipo === 'magia' ? 'Magia' : 'Habilidade'}
            </div>
          </div>
        )}
      </div>

      {/* 3. Effect Text Box (Crisp parchment style, highly readable) */}
      <div className="my-1 flex-1 flex flex-col justify-between rounded-xl bg-black/80 border border-white/15 p-2 overflow-hidden shadow-inner">
        <p className={`${sizeConfig.effectText} text-slate-200 font-sans tracking-normal`}>
          {card.efeitoRaw || card.effect.description}
        </p>

        {/* Valid Engastes row indicator at the bottom of effect box */}
        <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[8.5px] text-slate-400">
          <span className="uppercase tracking-wider font-semibold">Engastes:</span>
          <div className="flex items-center gap-0.5 font-mono-num font-bold">
            {card.sockets.map((s) => {
              const isMatch = s === activeSocket || s === showSocketsHighlight;
              return (
                <span
                  key={s}
                  className={`px-1 py-0.2 rounded text-[8.5px] ${
                    isMatch
                      ? 'bg-amber-400 text-slate-950 font-black ring-1 ring-amber-300'
                      : 'bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Footer: Obvious, Large ATK (Ataque) and DEF (Defesa) */}
      <div className="pt-1.5 border-t border-white/15 flex items-center justify-between gap-2">
        {/* ATK Crest */}
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-950 via-red-950 to-rose-950 border border-rose-500/70 px-2 py-1 rounded-xl text-rose-200 shadow-md">
          <span className="text-xs">⚔️</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7.5px] uppercase font-bold tracking-wider text-rose-300/80">
              ATK
            </span>
            <span className={`font-mono-num font-black ${sizeConfig.statNum} text-rose-100`}>
              {card.atk}
            </span>
          </div>
        </div>

        {/* DEF Crest */}
        <div className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-950 via-sky-950 to-cyan-950 border border-cyan-500/70 px-2 py-1 rounded-xl text-cyan-200 shadow-md">
          <span className="text-xs">🛡️</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7.5px] uppercase font-bold tracking-wider text-cyan-300/80">
              DEF
            </span>
            <span className={`font-mono-num font-black ${sizeConfig.statNum} text-cyan-100`}>
              {card.def}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
