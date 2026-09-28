import { Card, EngasteNumber } from '../types/game';

export interface RawCardInput {
  id: string;
  name: string;
  tipo: 'criatura' | 'magia' | 'habilidade';
  arquetipo: string;
  ataque: number;
  defesa: number;
  efeito: string;
  engaste: number[];
  img?: string;
}

export function inferCardIcon(name: string, tipo: string, arquetipo: string): string {
  const n = name.toLowerCase();
  const a = arquetipo.toLowerCase();
  
  if (n.includes('dragão') || n.includes('wyvern') || n.includes('tiamat') || a.includes('dragão')) return '🐉';
  if (n.includes('goblin') || n.includes('hobgoblin') || n.includes('bugbear')) return '👺';
  if (n.includes('lobo') || n.includes('fenrir')) return '🐺';
  if (n.includes('urso')) return '🐻';
  if (n.includes('águia')) return '🦅';
  if (n.includes('serpente') || n.includes('víbora')) return '🐍';
  if (n.includes('esqueleto') || n.includes('zumbi') || n.includes('lich') || n.includes('larloch') || a.includes('morto-vivo')) return '💀';
  if (n.includes('espectro') || n.includes('fantasma')) return '👻';
  if (n.includes('pirata') || n.includes('corsária') || n.includes('grumete') || a.includes('pirata')) return '🏴‍☠️';
  if (n.includes('canhão')) return '💣';
  if (n.includes('pistola')) return '🔫';
  if (n.includes('anão') || n.includes('mineiro') || n.includes('ferreiro') || a.includes('anão')) return '⛏️';
  if (n.includes('machado')) return '🪓';
  if (n.includes('cavaleiro') || n.includes('escudeiro') || n.includes('paladino') || a.includes('cavaleiro')) return '🛡️';
  if (n.includes('espada') || n.includes('espadachim')) return '🗡️';
  if (n.includes('lança')) return '🔱';
  if (n.includes('arqueir') || n.includes('estilingue')) return '🏹';
  if (n.includes('monge') || n.includes('aprendiz') || a.includes('monge')) return '🥋';
  if (n.includes('soco') || n.includes('punho') || n.includes('palma')) return '👊';
  if (n.includes('chute')) return '🦵';
  if (n.includes('ladino') || n.includes('batedor') || n.includes('assassino') || a.includes('ladino')) return '🗝️';
  if (n.includes('adaga')) return '🗡️';
  if (n.includes('fumaça') || n.includes('sombra')) return '🌫️';
  if (n.includes('aleister') || n.includes('mago') || n.includes('arcanista') || a.includes('arcano')) return '🧙‍♂️';
  if (n.includes('fogo') || n.includes('labareda') || n.includes('chamas')) return '🔥';
  if (n.includes('gelo') || n.includes('neve')) return '❄️';
  if (n.includes('vento') || n.includes('ciclone') || n.includes('brisa')) return '🌪️';
  if (n.includes('pedra') || n.includes('rocha') || n.includes('granito') || n.includes('terra')) return '🪨';
  if (n.includes('água') || n.includes('onda') || n.includes('maré') || n.includes('tsunami')) return '🌊';
  if (n.includes('bardo') || n.includes('menestrel') || n.includes('ludovico') || a.includes('bardo')) return '🪕';
  if (n.includes('canção') || n.includes('hino') || n.includes('música') || n.includes('balada')) return '🎵';
  if (n.includes('alaúde')) return '🎻';
  if (n.includes('bomba') || n.includes('dinamite') || n.includes('foguete')) return '🧨';
  if (n.includes('druida') || n.includes('bosque') || n.includes('floresta') || a.includes('druida')) return '🌲';
  if (n.includes('gosma') || n.includes('cubo gelatinoso')) return '🧪';
  if (n.includes('olho') || n.includes('tiran') || n.includes('nótico') || a.includes('aberrante')) return '👁️';
  if (n.includes('tarrasque') || n.includes('mamute') || n.includes('quimera') || a.includes('monstruosidade')) return '🦖';
  if (n.includes('filho da puta')) return '🃏';
  if (tipo === 'magia') return '📜';
  if (tipo === 'habilidade') return '⚡';
  return '⚔️';
}

// Convert user raw json into typed Card objects with automated combat triggers
function parseCard(input: RawCardInput): Card {
  const sockets = input.engaste as EngasteNumber[];
  const desc = input.efeito;
  const descLower = desc.toLowerCase();

  // Determine effect trigger logic
  let type: Card['effect']['type'] = 'FLAT_BONUS';
  let value: number | undefined = 2;

  if (descLower.includes('independente do que aconteça') || descLower.includes('sempre resulta em empate')) {
    type = 'FLAT_BONUS';
    value = 0;
  } else if (descLower.includes('ignore a defesa') || descLower.includes('defesa da criatura inimiga é reduzida a 0') || descLower.includes('ignore-a')) {
    type = 'DEF_PIERCE';
    value = 0;
  } else if (descLower.includes('ataque desta carta for maior') || descLower.includes('ataque desta carta for igual ou maior')) {
    type = 'ATK_HIGHER_BONUS';
    const matchVal = desc.match(/\+(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('defesa desta carta for maior') || descLower.includes('defesa dessa carta for maior')) {
    type = 'TITAN_RESILIENCE';
    const matchVal = desc.match(/\+(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('ataque desta carta for menor') || descLower.includes('defesa dessa carta for menor')) {
    type = 'ATK_LOWER_BONUS';
    const matchVal = desc.match(/\+(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('venceu a rolagem de duelo') || descLower.includes('vencer o duelo')) {
    type = 'DUEL_WIN_BONUS';
    const matchVal = desc.match(/\+(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('perder a rolagem de duelo') || descLower.includes('perder o duelo') || descLower.includes('segundo a revelar')) {
    type = 'DUEL_LOSE_BONUS';
    const matchVal = desc.match(/\+(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('reduza em') || descLower.includes('reduza o ataque') || descLower.includes('reduza a defesa')) {
    type = 'ENEMY_DEF_PENALTY';
    const matchVal = desc.match(/reduza.*?(\d+)/i) || desc.match(/-(\d+)/);
    value = matchVal ? parseInt(matchVal[1], 10) : 2;
  } else if (descLower.includes('1d4') || descLower.includes('1d6') || descLower.includes('1d8')) {
    type = 'ELEMENTAL_BURST';
    value = 4;
  } else if (descLower.includes('habilidade de iujio') || descLower.includes('recarrega')) {
    type = 'RECHARGE_ABILITY';
    value = 0;
  } else if (descLower.includes('troque o ataque')) {
    type = 'FLIP_DEFENSE_TO_ATK';
    value = input.ataque;
  } else {
    type = 'FLAT_BONUS';
    value = 1;
  }

  const icon = inferCardIcon(input.name, input.tipo, input.arquetipo);

  return {
    id: input.id,
    name: input.name,
    sockets,
    atk: input.ataque,
    def: input.defesa,
    tipo: input.tipo,
    arquetipo: input.arquetipo,
    efeitoRaw: input.efeito,
    icon,
    effect: {
      id: `eff_${input.id}`,
      name: input.name,
      description: input.efeito,
      type,
      value,
    },
    imageUrl: input.img,
  };
}

export const RAW_CARDS_DATA: RawCardInput[] = [
  // --- CAVALEIRO ---
  { id: "mxhNSSmuT4k3vCZa", name: "Escudeiro de Bronze", tipo: "criatura", arquetipo: "Cavaleiro", ataque: 2, defesa: 5, efeito: "Se a Defesa desta carta for maior que o Ataque da carta inimiga, receba +1 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "y7uw5hpFF8ggXD9P", name: "Arqueira da Bastilha", tipo: "criatura", arquetipo: "Cavaleiro / Arqueiro", ataque: 4, defesa: 4, efeito: "Se o Ataque desta carta for maior que o Ataque da carta inimiga, receba +1 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "L3kKcgQQuz1nla8N", name: "Lança da Justiça", tipo: "habilidade", arquetipo: "Cavaleiro / Sagrado", ataque: 7, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque da carta inimiga, receba +2 no resultado da rodada.", engaste: [3, 4, 5] },
  { id: "usmTTdrhpCVBFpuW", name: "Sentinela da Muralha", tipo: "criatura", arquetipo: "Cavaleiro", ataque: 3, defesa: 7, efeito: "Se a Defesa desta carta for maior que o Ataque da carta inimiga, reduza em 1 qualquer bônus que ela receberia.", engaste: [3, 4, 5] },
  { id: "6HDVbN2ZzmIwdNiP", name: "Juramento da Guarda", tipo: "magia", arquetipo: "Cavaleiro / Sagrado", ataque: 4, defesa: 4, efeito: "Se você perder esta rodada por 2 ou menos, a rodada empata.", engaste: [1, 2, 3, 4, 5] },
  { id: "BcMAgq4mZub7Fr1H", name: "Cavaleira Errante", tipo: "criatura", arquetipo: "Cavaleiro", ataque: 5, defesa: 5, efeito: "Se você perder esta rodada, pode revelar outra carta. Você deve usar a nova carta.", engaste: [4, 5, 6] },
  { id: "6k1izRaZVk3OeYl8", name: "Muralha Inquebrável", tipo: "habilidade", arquetipo: "Cavaleiro", ataque: 0, defesa: 6, efeito: "Se o Ataque da carta inimiga for maior que 3, você recebe +2 no resultado da rodada.", engaste: [6, 7, 8] },
  { id: "h1hL0XqD3KAeVXLG", name: "Paladino da Aurora", tipo: "criatura", arquetipo: "Cavaleiro / Sagrado", ataque: 6, defesa: 6, efeito: "Se o Ataque desta carta for maior que o Ataque da carta inimiga, receba +2 no resultado da rodada.", engaste: [7, 8, 9] },
  { id: "PPT57pC9uhgpGjts", name: "Estandarte do Reino Caído", tipo: "habilidade", arquetipo: "Cavaleiro / Morto-Vivo", ataque: 1, defesa: 5, efeito: "Se a Defesa dessa carta for maior que o Ataque inimigo, receba +3 no resultado da rodada.", engaste: [7, 8, 9] },
  { id: "POkAjqFWOSrJy3Xo", name: "Guardião do Trono", tipo: "criatura", arquetipo: "Cavaleiro", ataque: 5, defesa: 8, efeito: "Se a Defesa desta carta for maior que o Ataque inimigo, reduza o Ataque da carta inimiga em 2.", engaste: [8, 9, 10] },
  { id: "IwwSf4FUqKROb5tt", name: "Espada da Última Vigília", tipo: "habilidade", arquetipo: "Cavaleiro / Sagrado", ataque: 8, defesa: 0, efeito: "Se o Ataque desta carta for igual ou maior que o Ataque inimigo, receba +3 no resultado da rodada.", engaste: [10, 11, 12] },
  { id: "0fFPm1w51RJGpXu5", name: "Wolfgang, o Matador de Dragões", tipo: "criatura", arquetipo: "Cavaleiro / Lendário", ataque: 8, defesa: 6, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +4 no resultado da rodada. Se sua Defesa for maior, empata se fosse perder.", engaste: [11, 12] },
  { id: "cav01RecrutCast1", name: "Recruta do Castelo", tipo: "criatura", arquetipo: "Cavaleiro", ataque: 2, defesa: 4, efeito: "Se você for o primeiro a revelar a carta na rodada, ganhe +2 de Defesa nesta rodada.", engaste: [1, 2, 3] },
  { id: "cav02FormacFalan2", name: "Formação de Falange", tipo: "habilidade", arquetipo: "Cavaleiro", ataque: 3, defesa: 6, efeito: "Se o seu baralho contiver 4 ou mais Criaturas Cavaleiro, receba +2 no resultado da rodada.", engaste: [4, 5, 6] },
  { id: "cav03CargaPesad03", name: "Carga Pesada", tipo: "habilidade", arquetipo: "Cavaleiro / Guerreiro", ataque: 7, defesa: 2, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado final da rodada.", engaste: [7, 8, 9] },
  { id: "cav04ComandAlvor4", name: "Comandante da Alvorada", tipo: "criatura", arquetipo: "Cavaleiro / Sagrado", ataque: 6, defesa: 8, efeito: "Se você estiver perdendo a rodada antes de Habilidades, adicione metade da Defesa desta carta ao Resultado Provisório.", engaste: [10, 11] },

  // --- MONGE ---
  { id: "AUPZTfI6zyvguOD5", name: "Aprendiz Determinado", tipo: "criatura", arquetipo: "Monge", ataque: 4, defesa: 3, efeito: "Se a Defesa desta carta for maior que o Ataque inimigo, receba +1 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "BgPyqI5jFleXCb0e", name: "Soco do Vento", tipo: "habilidade", arquetipo: "Monge / Elemental", ataque: 6, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +1 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "Ku0qZklxp8YxD2k1", name: "Monge Viajante", tipo: "criatura", arquetipo: "Monge", ataque: 5, defesa: 4, efeito: "Se o Ataque desta carta for menor que o Ataque inimigo, revele outra carta e escolha qual usar.", engaste: [2, 3, 4] },
  { id: "hEYvRS5Ucauwk59O", name: "Defesa de Bambu", tipo: "habilidade", arquetipo: "Monge", ataque: 4, defesa: 2, efeito: "Se a Defesa dessa carta for menor que o Ataque inimigo, reduza em 2 o resultado final do oponente.", engaste: [3, 4, 5] },
  { id: "9JUi5vASOIldXQgT", name: "Chute Giratório", tipo: "habilidade", arquetipo: "Monge", ataque: 7, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, revele outra carta e aplique apenas o efeito dela.", engaste: [4, 5, 6] },
  { id: "TowFDJXDQ7GbyVJb", name: "Mestre do Ki", tipo: "criatura", arquetipo: "Monge", ataque: 6, defesa: 5, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +3 no resultado da rodada.", engaste: [5, 6, 7] },
  { id: "3mdH1yx8EVQfCRus", name: "Palma do Vácuo", tipo: "habilidade", arquetipo: "Monge", ataque: 8, defesa: 0, efeito: "Ignore a Defesa da criatura inimiga nesta rodada.", engaste: [7, 8, 9] },
  { id: "GPB7B7krkcWj8v5x", name: "Adepto do Monastério da Neve", tipo: "criatura", arquetipo: "Monge / Elemental", ataque: 7, defesa: 4, efeito: "Se Ataque for menor, reduza em 2 o oponente. Se Defesa for maior, adicione 2 ao seu resultado.", engaste: [7, 8, 9] },
  { id: "5bdkLfsNSbrtWFSy", name: "Onda Interna", tipo: "habilidade", arquetipo: "Monge", ataque: 6, defesa: 0, efeito: "Se o Ataque for maior que o inimigo, receba +3 e reduza o Ataque inimigo em 3.", engaste: [7, 8, 9] },
  { id: "nCxlIpgXcikMcRr8", name: "Punho do Dragão", tipo: "habilidade", arquetipo: "Monge / Dragão", ataque: 9, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [9, 10, 11] },
  { id: "27lu7JXtijoPsFZs", name: "Ki Ascendente", tipo: "habilidade", arquetipo: "Monge", ataque: 5, defesa: 0, efeito: "Se esta for sua segunda carta revelada na rodada, receba +4 no resultado final.", engaste: [10, 11] },
  { id: "zi3VSkUkhNow3nbR", name: "Máscara de Mithril", tipo: "criatura", arquetipo: "Monge / Lendário", ataque: 8, defesa: 7, efeito: "Se Ataque >= inimigo, receba +4. Se Defesa >= inimigo, ignore redução e receba +2.", engaste: [11, 12] },
  { id: "mon01PostuGarc001", name: "Postura da Garça", tipo: "habilidade", arquetipo: "Monge", ataque: 4, defesa: 2, efeito: "Se o Ataque inimigo for maior que o seu Ataque, receba +1 de Defesa e +1 no resultado final.", engaste: [1, 2, 3] },
  { id: "mon02PalmReativ02", name: "Palma Reativa", tipo: "habilidade", arquetipo: "Monge", ataque: 4, defesa: 4, efeito: "Se a carta inimiga tentar reduzir seus atributos ou resultado, reverta a mesma redução contra o oponente.", engaste: [4, 5, 6] },
  { id: "mon03MongAsceta03", name: "Monge Ascético", tipo: "criatura", arquetipo: "Monge", ataque: 6, defesa: 3, efeito: "Se você ainda não tiver usado sua habilidade, ganhe +3 no resultado da rodada.", engaste: [6, 7, 8] },
  { id: "mon04AvatDragCel4", name: "Avatar do Dragão Celestial", tipo: "criatura", arquetipo: "Monge / Dragão", ataque: 8, defesa: 6, efeito: "Se for o segundo a revelar, adicione sua Defesa ao Ataque nesta rodada.", engaste: [10, 11, 12] },

  // --- LADINO (Protagonista em Maer) ---
  { id: "QWHKfudZUGtw3cOD", name: "Batedor de Bolsos", tipo: "criatura", arquetipo: "Ladino", ataque: 4, defesa: 2, efeito: "Se esta não for a primeira carta revelada nesta rodada, receba +2 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "exrQHnpyKsNuGeGw", name: "Adaga Envenenada", tipo: "habilidade", arquetipo: "Ladino / Veneno", ataque: 7, defesa: 0, efeito: "Se esta não for sua primeira carta revelada nesta rodada, reduza em 2 o resultado final do oponente.", engaste: [1, 2, 3, 4] },
  { id: "BoLRr90inmeJ5Xkn", name: "Vigia dos Telhados", tipo: "habilidade", arquetipo: "Ladino", ataque: 5, defesa: 2, efeito: "Se a Defesa desta carta for igual ou menor que o Ataque inimigo, receba +2 no Duelo.", engaste: [2, 3, 4] },
  { id: "zfElo2rfpA0PMRJ4", name: "Cortina de Fumaças", tipo: "habilidade", arquetipo: "Ladino", ataque: 1, defesa: 3, efeito: "Se revelar por segundo, anula o bônus de dano inimigo e concede +2 no resultado.", engaste: [3, 4, 5] },
  { id: "2FBUuQKdz26PQLQb", name: "Espadachim de Viela", tipo: "criatura", arquetipo: "Ladino / Cavaleiro", ataque: 6, defesa: 4, efeito: "Se essa não for a primeira carta puxada nessa rodada, receba +3 no resultado da rodada.", engaste: [3, 4, 5] },
  { id: "mZKAes8h97cTF4Lv", name: "Passos Silenciosos", tipo: "magia", arquetipo: "Ladino / Patrulheiro", ataque: 5, defesa: 0, efeito: "Se o Ataque for menor ou igual o inimigo, receba +3 no Resultado Provisório.", engaste: [4, 5, 6] },
  { id: "WCYaZupSnFJmBJXG", name: "Assassino de Aluguel", tipo: "criatura", arquetipo: "Ladino", ataque: 7, defesa: 2, efeito: "Se esta for a segunda carta que você revelou nesta rodada, receba +3 no resultado da rodada.", engaste: [7, 8, 9] },
  { id: "6wtOxmZSM3xCOTAS", name: "Golpe nas Costas", tipo: "habilidade", arquetipo: "Ladino", ataque: 8, defesa: 0, efeito: "Se o Ataque for maior que o Ataque inimigo, receba +4 no resultado da rodada.", engaste: [8, 9, 10] },
  { id: "62F03uR3I1T7oXJW", name: "Informante de Mil Faces", tipo: "criatura", arquetipo: "Ladino / Aberrante", ataque: 5, defesa: 4, efeito: "Reduza o Ataque inimigo em 3 e receba +2 no Resultado Final.", engaste: [8, 9, 10] },
  { id: "FDhTWlqIUAiR1qIh", name: "Emboscada Perfeita", tipo: "habilidade", arquetipo: "Ladino", ataque: 9, defesa: 0, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 3 nesta rodada.", engaste: [8, 9, 10] },
  { id: "kvZgLHqkoj0M1Ky3", name: "Fuga pelo Telhado", tipo: "habilidade", arquetipo: "Ladino", ataque: 0, defesa: 7, efeito: "Anula o ataque inimigo e soma sua Defesa ao Resultado Provisório.", engaste: [9, 10, 11] },
  { id: "sKc0Pl28n4DIXlab", name: "Fenrir, o Pele de Lobo", tipo: "criatura", arquetipo: "Ladino / Lendário", ataque: 7, defesa: 7, efeito: "Reduza o Ataque e Defesa da carta inimiga em 3 e receba +4 no resultado da rodada.", engaste: [11, 12] },
  { id: "lad01DistrBarat1", name: "Distração Barata", tipo: "habilidade", arquetipo: "Ladino", ataque: 3, defesa: 1, efeito: "Se esta não for a primeira carta revelada por você nesta rodada, reduza o resultado de Duelo do oponente em 2.", engaste: [1, 2] },
  { id: "lad02TruqMaos002", name: "Prestidigitação", tipo: "habilidade", arquetipo: "Ladino", ataque: 5, defesa: 2, efeito: "Se você estiver perdendo a rodada, ignore a Defesa da carta inimiga.", engaste: [4, 5, 6] },
  { id: "lad03DancSombra3", name: "Dançarino das Sombras", tipo: "criatura", arquetipo: "Ladino", ataque: 6, defesa: 3, efeito: "Receba +4 no resultado da rodada e ignore a Defesa inimiga.", engaste: [7, 8] },
  { id: "lad04MestrAssas4", name: "Mestre dos Mantis", tipo: "criatura", arquetipo: "Ladino / Lendário", ataque: 8, defesa: 4, efeito: "Ignora o bônus de Duelo do oponente e aplica +3 ao seu resultado final.", engaste: [10, 11] },

  // --- ARCANO / MAGOS DE MAER ---
  { id: "nsDh8RqV0IeJGKps", name: "Aprendiz de Runas", tipo: "criatura", arquetipo: "Conjurador / Arcano", ataque: 4, defesa: 1, efeito: "Se no final da rodada você estiver perdendo por 4 ou menos, ganhe +3 no Duelo.", engaste: [1, 2, 3] },
  { id: "j8GBegyDw7F6CS7s", name: "Rajada Mística", tipo: "magia", arquetipo: "Arcano", ataque: 6, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [2, 3, 4] },
  { id: "3vvSKcxsrIqEfjNE", name: "Mísseis Mágicos", tipo: "magia", arquetipo: "Arcano", ataque: 5, defesa: 0, efeito: "Ignore a Defesa inimiga. Se a carta inimiga tem 0 de Defesa, receba +2.", engaste: [1, 2, 3, 4] },
  { id: "dZKvvWHjtAM4WTtS", name: "Ilusionista Menor", tipo: "criatura", arquetipo: "Conjurador / Arcano", ataque: 3, defesa: 2, efeito: "Se o ataque da carta inimiga for maior que 5, reduza o ataque dela em 3.", engaste: [1, 2, 3, 4] },
  { id: "nz8YpSWaMINes2Bt", name: "Escudo Arcano", tipo: "magia", arquetipo: "Arcano", ataque: 0, defesa: 6, efeito: "Se a Defesa for maior que o Ataque inimigo, anula os efeitos da carta inimiga.", engaste: [4, 5, 6] },
  { id: "HeGXFACRsZGk0dvq", name: "Bola de Fogo", tipo: "magia", arquetipo: "Arcano / Elemental", ataque: 7, defesa: 0, efeito: "Se a Defesa da carta inimiga for 4 ou menor, ignore-a totalmente.", engaste: [5, 6, 7] },
  { id: "RB0cuyCFZo3DHgYp", name: "Malvexo", tipo: "magia", arquetipo: "Arcano / Maldição", ataque: 5, defesa: 0, efeito: "A carta inimiga não pode receber bônus nesta rodada.", engaste: [5, 6, 7] },
  { id: "dh45Oe0CxRkQcYQO", name: "Adepto Arcanista", tipo: "criatura", arquetipo: "Conjurador / Arcano", ataque: 6, defesa: 6, efeito: "Se você empatar esta rodada no provisório, receba +3 no Resultado Final.", engaste: [6, 7, 8] },
  { id: "siMUqAiA3l1SCGbj", name: "Porta Dimensional", tipo: "magia", arquetipo: "Arcano", ataque: 2, defesa: 4, efeito: "Troque o Ataque desta carta pelo Ataque da carta inimiga nesta rodada.", engaste: [8, 9] },
  { id: "5DCBskTfpyi6ACla", name: "Tempestade de Éter", tipo: "magia", arquetipo: "Arcano", ataque: 6, defesa: 2, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 3 nesta rodada.", engaste: [9, 10] },
  { id: "XnSwJoNv9xSql1fF", name: "Desintegrar", tipo: "magia", arquetipo: "Arcano", ataque: 7, defesa: 0, efeito: "Ignore a Defesa inimiga. Se Ataque for maior, o inimigo recebe -2 no resultado.", engaste: [10, 11] },
  { id: "UQBhquK1sM2wS5EZ", name: "Aleister, o Mago Louco", tipo: "magia", arquetipo: "Arcano / Lendário", ataque: 10, defesa: 3, efeito: "Se o Ataque desta carta for maior que o Ataque e Defesa combinada do inimigo, ignore Defesa e receba +4 no resultado!", engaste: [11, 12] },
  { id: "arc01CentelConc1", name: "Centelha Concentrada", tipo: "magia", arquetipo: "Arcano / Elemental", ataque: 5, defesa: 0, efeito: "Se o oponente tiver Defesa maior que 0, ignore 2 pontos de Defesa inimiga.", engaste: [1, 2] },
  { id: "arc02TransmCaot2", name: "Transmutação Caótica", tipo: "magia", arquetipo: "Arcano", ataque: 4, defesa: 3, efeito: "Troque o Ataque da carta inimiga com a Defesa dela nesta rodada.", engaste: [4, 5, 6] },
  { id: "arc03BarreRunic3", name: "Barreira Rúnica Maior", tipo: "magia", arquetipo: "Arcano / Anão", ataque: 0, defesa: 7, efeito: "Anule qualquer efeito de redução que lhe afetaria nessa rodada.", engaste: [7, 8, 9] },
  { id: "arc04SingulArca4", name: "Singularidade Arcana", tipo: "magia", arquetipo: "Arcano / Lendário", ataque: 9, defesa: 0, efeito: "Se a carta inimiga for Magia ou Habilidade, some o Ataque dela ao seu resultado final.", engaste: [11, 12] },

  // --- PIRATA ---
  { id: "iqQn7KRhBNV8jc5K", name: "Grumete Desastrado", tipo: "criatura", arquetipo: "Pirata", ataque: 2, defesa: 3, efeito: "Se a carta inimiga receber um bônus nesta rodada, receba +2 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "Ok0ddotcf3N0yM3Z", name: "Faca de Convés", tipo: "habilidade", arquetipo: "Pirata / Ladino", ataque: 4, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +1 e reduza em 1 o oponente.", engaste: [1, 2, 3, 4] },
  { id: "9YyjXNcZoIKmidc0", name: "Corsária do Abismo", tipo: "criatura", arquetipo: "Pirata / Demônio", ataque: 5, defesa: 3, efeito: "Reduza em 2 pontos o resultado de Duelo da carta inimiga.", engaste: [1, 2, 3, 4] },
  { id: "pj5kgG0Gyp3nbiCd", name: "Bandeira da Maré-Dura", tipo: "habilidade", arquetipo: "Pirata", ataque: 4, defesa: 0, efeito: "A Defesa da criatura inimiga é reduzida a 0 nesta rodada.", engaste: [1, 2, 3, 4, 5] },
  { id: "x6MfRfAXuIFaYE7n", name: "Ogro Pirata", tipo: "criatura", arquetipo: "Pirata / Gigante", ataque: 6, defesa: 3, efeito: "Reduza a Defesa inimiga em 3 nesta rodada.", engaste: [2, 3, 4, 5] },
  { id: "Nazv9Zlfq151jybD", name: "Tiro de Pistola", tipo: "habilidade", arquetipo: "Pirata / Ladino", ataque: 5, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, reduza em 2 o resultado final do oponente.", engaste: [4, 5, 6, 7] },
  { id: "Mmk75OngcKRTn0WW", name: "Pirata Sortudo", tipo: "criatura", arquetipo: "Pirata", ataque: 5, defesa: 2, efeito: "Se você perder a rodada no provisório, role 1d4 e adicione ao seu placar.", engaste: [5, 6, 7, 8] },
  { id: "4OhYOhMvO95Dd2Pj", name: "Abordagem!", tipo: "habilidade", arquetipo: "Pirata", ataque: 6, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +3 no resultado.", engaste: [5, 6, 7, 8] },
  { id: "rLUE6Mke9zDNCLMT", name: "Capitã Sereia", tipo: "criatura", arquetipo: "Pirata / Elemental", ataque: 2, defesa: 4, efeito: "Troque o Ataque desta carta pelo Ataque da carta inimiga nesta rodada.", engaste: [7, 8, 9, 10] },
  { id: "NJW73kdeya5XcaIA", name: "Confusão de Pirata", tipo: "habilidade", arquetipo: "Pirata", ataque: 7, defesa: 0, efeito: "Reduza o Ataque inimigo em 2 e conceda +2 ao seu resultado.", engaste: [8, 9, 10, 11] },
  { id: "ZqxJHQnPzNh6inGh", name: "Canhão do Saqueador", tipo: "habilidade", arquetipo: "Pirata", ataque: 8, defesa: 0, efeito: "Se o Ataque for maior que o inimigo, reduza em 3 o resultado final do oponente.", engaste: [9, 10, 11, 12] },
  { id: "WrmD5vmG5CoHAHdt", name: "Rei da Maré", tipo: "criatura", arquetipo: "Pirata / Lendário", ataque: 8, defesa: 4, efeito: "Reduza o Ataque inimigo em 2. Se seu Ataque for maior, receba +3 no resultado da rodada.", engaste: [11, 12] },
  { id: "pir01LadrBotes001", name: "Ladrão de Botas", tipo: "criatura", arquetipo: "Homúnculo / Pirata", ataque: 3, defesa: 3, efeito: "A carta inimiga recebe -2 de Defesa nesta rodada.", engaste: [1, 2, 3] },
  { id: "pir02TirCanhDupl2", name: "Tiro de Canhão Duplo", tipo: "habilidade", arquetipo: "Pirata", ataque: 6, defesa: 0, efeito: "Se esta carta estiver em um engaste ímpar, ela ganha +2 de Ataque nesta rodada.", engaste: [4, 5, 6, 7] },
  { id: "pir03ContrAstut3", name: "Contrabandista Astuto", tipo: "criatura", arquetipo: "Pirata", ataque: 5, defesa: 4, efeito: "Se o oponente já usou uma habilidade nessa partida, reduza em 3 o resultado dele.", engaste: [6, 7, 8, 9] },
  { id: "pir04GaleoFant004", name: "Galeão Fantasma", tipo: "criatura", arquetipo: "Pirata / Morto-Vivo", ataque: 7, defesa: 6, efeito: "Ignore a Defesa inimiga e adicione +2 ao seu resultado final.", engaste: [10, 11, 12] },

  // --- MORTO-VIVO ---
  { id: "cWAqhnpIOwt8Jgzi", name: "Espectro Sussurrante", tipo: "criatura", arquetipo: "Morto-Vivo", ataque: 3, defesa: 1, efeito: "Reduza o Ataque da carta inimiga em 2 nesta rodada.", engaste: [1, 2, 3] },
  { id: "unGgJCjeT3GeCjV1", name: "Toque da Cova", tipo: "magia", arquetipo: "Morto-Vivo", ataque: 4, defesa: 0, efeito: "Se o Ataque for menor que o inimigo, reduza em 1 o oponente. Se resultado dele for ímpar, ganhe +2.", engaste: [1, 2, 3] },
  { id: "pt2amFJXaw6CgtPg", name: "Zumbi Faminto", tipo: "criatura", arquetipo: "Morto-Vivo", ataque: 5, defesa: 1, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [2, 3] },
  { id: "rlN2QzS8yF6AKhNW", name: "Esqueleto Guerreiro", tipo: "criatura", arquetipo: "Morto-Vivo / Guerreiro", ataque: 4, defesa: 2, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [3, 4] },
  { id: "lWEUx0rbZqFPY1Xa", name: "Drenar Vitalidade", tipo: "magia", arquetipo: "Morto-Vivo", ataque: 5, defesa: 0, efeito: "Reduza a Defesa da criatura inimiga em 3 nesta rodada.", engaste: [4, 5] },
  { id: "QafLnxsj8Uq8d1Xe", name: "Cavaleiro da Sepultura", tipo: "criatura", arquetipo: "Morto-Vivo / Cavaleiro", ataque: 6, defesa: 2, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, reduza em 2 o resultado final do oponente.", engaste: [6, 7, 8] },
  { id: "aTSbc4lYAVLRDIx1", name: "Maldição do Luto", tipo: "magia", arquetipo: "Morto-Vivo / Maldição", ataque: 5, defesa: 0, efeito: "A carta inimiga não pode receber bônus nesta rodada.", engaste: [7, 8] },
  { id: "oOdKUWz7cYwh2c04", name: "Necromante Menor", tipo: "criatura", arquetipo: "Conjurador / Morto-Vivo", ataque: 6, defesa: 2, efeito: "Se a defesa dessa carta for menor que o Ataque inimigo, conceda +3 no Duelo.", engaste: [7, 8] },
  { id: "gT72ZMcKPcmcV4ek", name: "Correntes da Cripta", tipo: "habilidade", arquetipo: "Morto-Vivo", ataque: 7, defesa: 0, efeito: "Reduza o Ataque da carta inimiga em 3 nesta rodada.", engaste: [8, 9, 10] },
  { id: "w6klged5lhKcmHf6", name: "Abominação Ressuscitada", tipo: "criatura", arquetipo: "Morto-Vivo", ataque: 7, defesa: 2, efeito: "Se você estiver perdendo a rodada, some +3 de Ataque ao seu cálculo.", engaste: [9, 10] },
  { id: "EfXkXBAdk4lyff88", name: "Febre da Decomposição", tipo: "magia", arquetipo: "Morto-Vivo", ataque: 8, defesa: 0, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 2 nesta rodada.", engaste: [10, 11] },
  { id: "leVhDos3iJRE1O5L", name: "Larloch, o Imperador Lich", tipo: "criatura", arquetipo: "Morto-Vivo / Lendário", ataque: 8, defesa: 5, efeito: "Reduza o Ataque e Defesa inimiga em 3. Se Ataque for maior, o oponente não pode usar efeito.", engaste: [11, 12] },
  { id: "mor01MaoRastej001", name: "Mão Rastejante", tipo: "criatura", arquetipo: "Morto-Vivo", ataque: 3, defesa: 1, efeito: "Ganha +2 de Ataque adicional no cálculo de combate.", engaste: [1, 2] },
  { id: "mor02PesteNegr002", name: "Peste Anímica", tipo: "magia", arquetipo: "Morto-Vivo", ataque: 6, defesa: 0, efeito: "A carta inimiga perde 2 de Ataque e 2 de Defesa nesta rodada.", engaste: [4, 5, 6] },
  { id: "mor03CavTumbAnt3", name: "Cavaleiro da Tumba Antiga", tipo: "criatura", arquetipo: "Morto-Vivo / Cavaleiro", ataque: 6, defesa: 5, efeito: "Se você estiver empatando ou perdendo por 1 ponto no Provisório, receba +3 no resultado final.", engaste: [7, 8, 9] },
  { id: "mor04CeifMeiaNo4", name: "Volgor, a Mão Sombria", tipo: "criatura", arquetipo: "Morto-Vivo / Lendário", ataque: 8, defesa: 6, efeito: "Ganhe +4 de Ataque e ignore a Defesa da carta inimiga.", engaste: [11, 12] },

  // --- ANÃO ---
  { id: "4E6bKBVxnesRTj3I", name: "Mineiro das Profundezas", tipo: "criatura", arquetipo: "Anão", ataque: 3, defesa: 4, efeito: "Se a Defesa desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [1, 2, 3] },
  { id: "SkVRS6pZ4SUvgFkt", name: "Runa de Proteção", tipo: "magia", arquetipo: "Arcano / Anão", ataque: 0, defesa: 6, efeito: "Se a Defesa for maior que o Ataque inimigo, anula o efeito da carta inimiga.", engaste: [1, 2, 3] },
  { id: "e24icgnr7CYQGR7R", name: "Guerreiro do Machado", tipo: "criatura", arquetipo: "Anão / Guerreiro", ataque: 5, defesa: 2, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [1, 2, 3, 4] },
  { id: "ofZBdJNN4zbQl9JQ", name: "Guarda do Salão de Pedra", tipo: "criatura", arquetipo: "Anão / Cavaleiro", ataque: 2, defesa: 5, efeito: "Se a Defesa inimiga for 5 ou maior, essa carta tem +5 de Ataque.", engaste: [4, 5] },
  { id: "U1agzhyjERy9f42O", name: "Muralha da Montanha", tipo: "magia", arquetipo: "Elemental / Anão", ataque: 2, defesa: 7, efeito: "Reduza o Ataque da carta inimiga em 2 nesta rodada.", engaste: [4, 5, 6] },
  { id: "oASO3Aa5eIfDlK1G", name: "Ferreiro de Guerra", tipo: "criatura", arquetipo: "Anão / Artífice", ataque: 6, defesa: 3, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, reduza em 2 a Defesa da carta inimiga.", engaste: [5, 6, 7] },
  { id: "4p9wLmYmYpqwUzsj", name: "Desmoronamento", tipo: "habilidade", arquetipo: "Elemental", ataque: 7, defesa: 1, efeito: "Reduza a Defesa da carta inimiga em 3 nesta rodada.", engaste: [5, 6, 7] },
  { id: "NpS1gTl7FXoyX0Gn", name: "Prospector Rúnico", tipo: "criatura", arquetipo: "Anão", ataque: 4, defesa: 4, efeito: "Adicione +2 de Ataque e +2 de Defesa ao cálculo de combate.", engaste: [7, 8, 9] },
  { id: "ZojTCAxD9yWtqO3B", name: "Runa de Ferro", tipo: "magia", arquetipo: "Anão / Arcano", ataque: 5, defesa: 5, efeito: "A carta inimiga não pode receber bônus nesta rodada.", engaste: [9, 10, 11] },
  { id: "gcFEZkM14FB6SiEN", name: "Sentinela de Granito", tipo: "criatura", arquetipo: "Elemental / Construto", ataque: 7, defesa: 6, efeito: "Se perder esta rodada, conceda +3 no Duelo da próxima.", engaste: [10, 11] },
  { id: "8APkTse9ZL48FCn2", name: "Ira da Montanha", tipo: "habilidade", arquetipo: "Monge / Elemental", ataque: 8, defesa: 2, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 2 nesta rodada.", engaste: [11, 12] },
  { id: "TuytCzsVr8oL5BFx", name: "Andorhal, o Devora-Troll", tipo: "criatura", arquetipo: "Anão / Lendário", ataque: 7, defesa: 9, efeito: "Ignora reduções. Se Defesa > Ataque inimigo, reduza a Defesa inimiga em 3 e receba +3 no resultado.", engaste: [11, 12] },
  { id: "ana01GuardTunel01", name: "Guarda de Túnel", tipo: "criatura", arquetipo: "Anão", ataque: 3, defesa: 5, efeito: "Se o Ataque da carta inimiga for menor que a Defesa desta carta, receba +1 no resultado da rodada.", engaste: [2, 3] },
  { id: "ana02ForjaRunic02", name: "Forja Rúnica", tipo: "habilidade", arquetipo: "Anão / Artífice", ataque: 4, defesa: 5, efeito: "Concede bônus fixo de +3 no Resultado Provisório.", engaste: [4, 5, 6] },
  { id: "ana03BaluarPicos3", name: "Baluarte dos Picos", tipo: "habilidade", arquetipo: "Anão", ataque: 2, defesa: 8, efeito: "Reduza em 4 qualquer bônus numérico extra que o oponente somaria ao Provisório dele.", engaste: [7, 8, 9] },
  { id: "ana04MaqCercAco04", name: "Máquina de Cerco Duergar", tipo: "criatura", arquetipo: "Construto / Anão", ataque: 8, defesa: 5, efeito: "Se a carta do oponente tiver 0 de Defesa, some a Defesa desta carta ao Ataque.", engaste: [11, 12] },

  // --- GOBLIN ---
  { id: "JrQar1cw0FQ8AqDJ", name: "Goblin Fracote", tipo: "criatura", arquetipo: "Goblin", ataque: 3, defesa: 2, efeito: "Se o Ataque for menor que o inimigo, receba +1 no resultado. Se estiver no Engaste 12, ganha habilidade de adicionar 1d8 no Duelo!", engaste: [1, 2, 3, 12] },
  { id: "KCQrGBtClUMJ8GXZ", name: "Bomba Improvisada", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 8, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, cause 4 de dano explosivo.", engaste: [2, 3, 4] },
  { id: "Nmn4lFQG49oGue9c", name: "Batedor Goblin", tipo: "criatura", arquetipo: "Goblin / Arqueiro", ataque: 5, defesa: 1, efeito: "Ignore a Defesa inimiga se o seu d12 for ímpar.", engaste: [1, 2, 3, 4] },
  { id: "B37rABCrNA8hDUMC", name: "Soldado Hobgoblin", tipo: "criatura", arquetipo: "Goblin / Guerreiro", ataque: 5, defesa: 3, efeito: "A carta inimiga não pode receber bônus nesta rodada.", engaste: [3, 4, 5] },
  { id: "Isdbd9gxwXpShObl", name: "Armadilha Mal Montada", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 3, defesa: 0, efeito: "Reduza o Ataque da carta inimiga em 4 nesta rodada.", engaste: [4, 5, 6] },
  { id: "gPfkc3hGf4IO4z4S", name: "Bando de Goblins", tipo: "criatura", arquetipo: "Goblin", ataque: 8, defesa: 4, efeito: "Pura força bruta numérica concede +2 ao combate.", engaste: [5, 6, 7, 8] },
  { id: "lQq8AXgC9RgKYiH5", name: "Pórva Goblin", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 7, defesa: 0, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 2 nesta rodada.", engaste: [6, 7, 8] },
  { id: "ZFQQLg5IeYcGvVUq", name: "Atirador de Estilingue", tipo: "criatura", arquetipo: "Goblin", ataque: 4, defesa: 2, efeito: "Reduza o resultado da carta inimiga em 2.", engaste: [5, 6, 7, 8] },
  { id: "q3zd9W1D0J6tUmJV", name: "Bugbear Berserker", tipo: "criatura", arquetipo: "Goblin / Bárbaro", ataque: 8, defesa: 2, efeito: "Se o Ataque desta carta for menor que o Ataque inimigo, receba +3 no resultado da rodada.", engaste: [7, 8, 9] },
  { id: "zTDS6Yy1isWrVMPT", name: "Truque Sujo", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 1, defesa: 0, efeito: "Troque o Ataque desta carta pelo Ataque da carta inimiga nesta rodada e ignore a Defesa.", engaste: [9, 10] },
  { id: "pKKzvozt8mxlADJ0", name: "Capitão Hobgoblin", tipo: "criatura", arquetipo: "Goblin / Cavaleiro", ataque: 7, defesa: 4, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, ignore a Defesa inimiga.", engaste: [8, 9, 10, 11] },
  { id: "e2LNBHdIR6sx4mxA", name: "Urugg, o Senhor dos Goblins", tipo: "criatura", arquetipo: "Goblin / Lendário", ataque: 11, defesa: 5, efeito: "Se a carta inimiga for uma Criatura, ignore a Defesa inimiga e ganhe +3 no resultado!", engaste: [11, 12] },
  { id: "gob01LancFoguet01", name: "Lança-Foguetes Defeituoso", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 5, defesa: 0, efeito: "Role 1d4: ganhe +2 de dano explosivo.", engaste: [1, 2, 3] },
  { id: "gob02SabotSorr002", name: "Sabotador Sorrateiro", tipo: "criatura", arquetipo: "Goblin", ataque: 4, defesa: 3, efeito: "Reduz o resultado final do oponente em 3.", engaste: [4, 5, 6] },
  { id: "gob03PilhDinam003", name: "Pilha de Dinamites", tipo: "habilidade", arquetipo: "Goblin / Artífice", ataque: 7, defesa: 0, efeito: "Aplica explosão de dano que reduz a defesa inimiga.", engaste: [7, 8, 9] },
  { id: "gob04MecaSucat004", name: "Meca-Sucata Desgovernado", tipo: "criatura", arquetipo: "Construto / Goblin / Lendário", ataque: 9, defesa: 2, efeito: "Se você vencer o Duelo, ignore a Defesa inimiga e receba +3.", engaste: [10, 11, 12] },

  // --- BARDO ---
  { id: "brd01MnsNovat001", name: "Menestrel Novato", tipo: "criatura", arquetipo: "Bardo", ataque: 3, defesa: 2, efeito: "Se você perder a rolagem de Duelo, receba +2 no Resultado Provisório.", engaste: [1, 2, 3] },
  { id: "brd02CncBravur002", name: "Canção da Bravura", tipo: "magia", arquetipo: "Bardo / Melodia", ataque: 2, defesa: 2, efeito: "Receba +2 no resultado desta rodada.", engaste: [1, 2, 3, 4] },
  { id: "brd03AludEncant03", name: "Alaúde Encantado", tipo: "habilidade", arquetipo: "Bardo / Arcano", ataque: 4, defesa: 1, efeito: "Some +2 de harmonia ao seu resultado final desta rodada.", engaste: [2, 3, 4] },
  { id: "brd04CavInspir004", name: "Cavaleiro Inspirado", tipo: "criatura", arquetipo: "Cavaleiro / Bardo", ataque: 3, defesa: 3, efeito: "Recebe +2 de Ataque e +2 de Defesa.", engaste: [3, 4, 5] },
  { id: "brd05HinoResili05", name: "Hino da Resiliência", tipo: "magia", arquetipo: "Bardo / Melodia", ataque: 1, defesa: 5, efeito: "Se perder por 3 ou menos, concede +3 no Resultado Provisório.", engaste: [4, 5, 6] },
  { id: "brd06DancEspad006", name: "Dançarina de Espadas", tipo: "criatura", arquetipo: "Bardo / Ladino", ataque: 6, defesa: 3, efeito: "Se você venceu o Duelo nesta rodada, esta carta ignora a Defesa inimiga.", engaste: [5, 6, 7] },
  { id: "brd07DuetHipnot07", name: "Dueto Hipnótico", tipo: "habilidade", arquetipo: "Bardo", ataque: 4, defesa: 2, efeito: "O oponente não pode usar Habilidades de Iujio nesta rodada.", engaste: [5, 6, 7, 8] },
  { id: "brd08MestCerim008", name: "Mestre de Cerimônias", tipo: "criatura", arquetipo: "Bardo", ataque: 5, defesa: 4, efeito: "Se terminar em empate no Provisório, você vence a rodada.", engaste: [6, 7, 8] },
  { id: "brd09BldHerois009", name: "Balada dos Heróis Caídos", tipo: "magia", arquetipo: "Bardo / Sagrado", ataque: 5, defesa: 0, efeito: "Receba +4 no resultado desta rodada se estiver perdendo a partida.", engaste: [7, 8, 9] },
  { id: "brd10ReqEnsurd010", name: "Réquiem Ensurdecedor", tipo: "magia", arquetipo: "Bardo / Arcano", ataque: 7, defesa: 0, efeito: "Reduza o resultado de Duelo do oponente pela metade nesta rodada.", engaste: [8, 9, 10] },
  { id: "brd11SolistVirt011", name: "Solista Virtuoso", tipo: "criatura", arquetipo: "Bardo", ataque: 7, defesa: 5, efeito: "Receba +3 no resultado final da rodada.", engaste: [9, 10, 11] },
  { id: "brd12OrfeuMaest012", name: "Ludovico, Músico Experimental", tipo: "criatura", arquetipo: "Bardo / Lendário", ataque: 6, defesa: 7, efeito: "Recarrega sua Habilidade Universal e concede +3 no resultado final.", engaste: [11, 12] },
  { id: "RtE7xWJ1O1063SqF", name: "Improviso", tipo: "habilidade", arquetipo: "Bardo", ataque: 7, defesa: 1, efeito: "Recarrega a Habilidade Universal de Iujio para uso nesta rodada.", engaste: [6, 7, 8, 9] },

  // --- ABERRANTE / MONSTRUOSIDADE ---
  { id: "abr01NoticEsprei1", name: "Nótico Espreitador", tipo: "criatura", arquetipo: "Aberrante", ataque: 3, defesa: 2, efeito: "Se você for o segundo a revelar a carta nesta rodada, copie a Defesa inimiga.", engaste: [1, 2, 3] },
  { id: "abr02GosmAcre0002", name: "Gosma Ocre", tipo: "criatura", arquetipo: "Monstruosidade", ataque: 2, defesa: 5, efeito: "A carta inimiga perde 2 de Ataque e 2 de Defesa nesta rodada.", engaste: [1, 2, 3, 4] },
  { id: "abr03RaioDesint03", name: "Raio Desintegrador Menor", tipo: "magia", arquetipo: "Aberrante / Arcano", ataque: 6, defesa: 0, efeito: "Ignore a Defesa inimiga e reduza o Ataque inimigo em 2.", engaste: [2, 3, 4] },
  { id: "abr04CuboGelat004", name: "Cubo Gelatinoso", tipo: "criatura", arquetipo: "Monstruosidade / Gosma", ataque: 1, defesa: 7, efeito: "A carta inimiga perde seu efeito e o Ataque dela é reduzido em 2.", engaste: [3, 4, 5] },
  { id: "abr05BasiliscPet5", name: "Basilisco Verdejante", tipo: "criatura", arquetipo: "Monstruosidade", ataque: 5, defesa: 4, efeito: "A Defesa inimiga é reduzida a 0 nesta rodada.", engaste: [4, 5, 6] },
  { id: "abr06DevorMentes6", name: "Devorador de Mentes", tipo: "criatura", arquetipo: "Aberrante", ataque: 6, defesa: 3, efeito: "Reduza a Defesa da carta inimiga a 0 e cause dano psíquico.", engaste: [5, 6, 7] },
  { id: "abr07UrsoCoruja07", name: "Urso-Coruja Encouraçado", tipo: "criatura", arquetipo: "Monstruosidade", ataque: 7, defesa: 3, efeito: "Se o Ataque inimigo for maior que sua Defesa, ganhe +3 de Ataque antes de calcular.", engaste: [5, 6, 7, 8] },
  { id: "abr08MimicVoraz08", name: "Mímico Voraz", tipo: "criatura", arquetipo: "Monstruosidade", ataque: 0, defesa: 5, efeito: "O Ataque desta carta se torna igual ao Ataque da carta inimiga + 2.", engaste: [7, 8, 9] },
  { id: "abr09HidraSete009", name: "Peco-Peco Psicopata", tipo: "criatura", arquetipo: "Monstruosidade", ataque: 5, defesa: 5, efeito: "Se puxada com Ataque menor que o inimigo, concede +4 de combate.", engaste: [9, 10] },
  { id: "abr10OlhoNegac010", name: "Olho da Negação", tipo: "magia", arquetipo: "Aberrante", ataque: 5, defesa: 5, efeito: "Anule os efeitos da carta inimiga e reduza o Ataque dela em 2.", engaste: [9, 10, 11] },
  { id: "abr11QuimerTrip11", name: "Quimera Experimental", tipo: "criatura", arquetipo: "Monstruosidade / Dragão", ataque: 7, defesa: 4, efeito: "Ignore a Defesa inimiga e ganhe +3 de Defesa.", engaste: [10, 11, 12] },
  { id: "abr12TiranOcul012", name: "Nihiloom, Arauto da Segunda Vida", tipo: "criatura", arquetipo: "Aberrante / Lendário", ataque: 8, defesa: 6, efeito: "Anule todos os efeitos da carta inimiga e role 1d6 extra somado ao resultado!", engaste: [11, 12] },
  { id: "9Q35oOf1JYerjbBm", name: "Tarrasque", tipo: "criatura", arquetipo: "Monstruosidade / Lendário", ataque: 9, defesa: 9, efeito: "Ataque e Defesa não podem ser alterados. Imune a efeitos negativos.", engaste: [12] },
  { id: "j5KhsbzXVwBa7ryS", name: "Filho da Puta", tipo: "criatura", arquetipo: "Corno / Caos", ataque: 1, defesa: 1, efeito: "Independente do que aconteça, a rodada sempre resulta em empate!", engaste: [1] },

  // --- DRAGÃO ---
  { id: "drg01KoboldDev001", name: "Kobold Devoto", tipo: "criatura", arquetipo: "Dragão / Ladino", ataque: 2, defesa: 2, efeito: "Receba +2 no resultado da rodada se seu baralho contiver dragões.", engaste: [1, 2, 3] },
  { id: "drg02GarrDracon02", name: "Garras Dracônicas", tipo: "habilidade", arquetipo: "Dragão", ataque: 5, defesa: 1, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado final.", engaste: [2, 3, 4] },
  { id: "drg03WyrmlBronz03", name: "Draconito de Ambar", tipo: "criatura", arquetipo: "Dragão / Elemental", ataque: 5, defesa: 3, efeito: "Se for o primeiro a revelar a carta na rodada, reduza o Ataque inimigo em 2.", engaste: [3, 4, 5] },
  { id: "drg04EscamImpen04", name: "Escamas Impenetráveis", tipo: "magia", arquetipo: "Dragão / Defensivo", ataque: 0, defesa: 7, efeito: "Ignore reduções de Defesa. Anula dano de habilidades inimigas.", engaste: [4, 5, 6] },
  { id: "drg05Wyverncacad5", name: "Wyvern Caçador", tipo: "criatura", arquetipo: "Dragão / Monstruosidade", ataque: 6, defesa: 2, efeito: "Se Ataque for maior que o inimigo, reduza a Defesa inimiga a 0.", engaste: [5, 6, 7] },
  { id: "drg06PrescAterr06", name: "Terror Dracônico", tipo: "habilidade", arquetipo: "Cavaleiro / Dragão / Aura", ataque: 4, defesa: 4, efeito: "Reduza o Duelo inimigo em 3 e ganhe +2 de Defesa.", engaste: [6, 7, 8] },
  { id: "drg07DragCripta07", name: "Dragão da Cripta", tipo: "criatura", arquetipo: "Dragão / Morto-Vivo", ataque: 8, defesa: 4, efeito: "Ganha +3 de Ataque adicional em combate.", engaste: [7, 8, 9] },
  { id: "drg08SoprChamas08", name: "Sopro de Chamas", tipo: "magia", arquetipo: "Dragão / Elemental", ataque: 6, defesa: 0, efeito: "Ignore a Defesa inimiga. Se Ataque for menor que 5, reduza o resultado dele em 3.", engaste: [8, 9, 10] },
  { id: "drg09DragJade009", name: "Dragão de Jade Protetor", tipo: "criatura", arquetipo: "Dragão / Sagrado", ataque: 6, defesa: 8, efeito: "Se a Defesa for maior que o Ataque inimigo, adicione a diferença ao Resultado Provisório.", engaste: [9, 10, 11] },
  { id: "drg10CobicDrag010", name: "Cobiça do Dragão", tipo: "habilidade", arquetipo: "Dragão", ataque: 8, defesa: 2, efeito: "Adiciona +3 de ouro e poder direto ao cálculo de combate.", engaste: [9, 10, 11, 12] },
  { id: "drg11DragVermAn11", name: "Dragão Vermelho Ancião", tipo: "criatura", arquetipo: "Dragão", ataque: 9, defesa: 5, efeito: "Ignore a Defesa inimiga. Anula efeitos se o inimigo tiver Ataque menor que 5.", engaste: [10, 11, 12] },
  { id: "drg12TiamatRainh12", name: "Tiamat, Rainha Dracônica", tipo: "criatura", arquetipo: "Dragão / Lendário", ataque: 10, defesa: 7, efeito: "Dobre o dano de Ataque causado por esta carta nesta rodada!", engaste: [12] },

  // --- ELEMENTAL ---
  { id: "ele01FagulhViv001", name: "Fagulha Viva", tipo: "criatura", arquetipo: "Elemental / Fogo", ataque: 4, defesa: 0, efeito: "Se o Ataque desta carta for maior que o Ataque inimigo, receba +2 no resultado da rodada.", engaste: [1, 2, 3] },
  { id: "ele02BrisProte002", name: "Brisa Protetora", tipo: "magia", arquetipo: "Elemental / Ar", ataque: 2, defesa: 4, efeito: "Se o Ataque inimigo for 6 ou maior, reduza o Ataque inimigo em 3 nesta rodada.", engaste: [1, 2, 3, 4] },
  { id: "ele03GotRestaur03", name: "Gota Restauradora", tipo: "magia", arquetipo: "Elemental / Água", ataque: 1, defesa: 5, efeito: "Se você perder esta rodada por 2 ou menos, a rodada empata.", engaste: [2, 3, 4] },
  { id: "ele04ElemTerrMen4", name: "Elemental da Terra Menor", tipo: "criatura", arquetipo: "Elemental / Terra", ataque: 3, defesa: 6, efeito: "Esta carta não pode ter sua Defesa reduzida por efeitos inimigos.", engaste: [3, 4, 5] },
  { id: "ele05LancGelo0005", name: "Lança de Gelo", tipo: "magia", arquetipo: "Elemental / Água", ataque: 6, defesa: 2, efeito: "Se a Defesa inimiga for 4 ou menor, reduza o Ataque da carta inimiga em 2.", engaste: [4, 5, 6] },
  { id: "ele06VortPoeira06", name: "Vórtice de Poeira", tipo: "habilidade", arquetipo: "Elemental / Ar", ataque: 5, defesa: 3, efeito: "Adiciona +2 de Ataque e gera cegueira no oponente.", engaste: [5, 6, 7] },
  { id: "ele07LabarDevor07", name: "Labareda Devoradora", tipo: "magia", arquetipo: "Elemental / Fogo", ataque: 8, defesa: 0, efeito: "Causa dano colossal de fogo contra qualquer defesa.", engaste: [5, 6, 7] },
  { id: "ele08GolemMama008", name: "Golem de Magma", tipo: "criatura", arquetipo: "Elemental / Fogo / Terra", ataque: 7, defesa: 5, efeito: "Se o Ataque for maior que o inimigo, reduza a Defesa inimiga em 2.", engaste: [7, 8, 9] },
  { id: "ele09TsunamDev009", name: "Tsunami Devastador", tipo: "magia", arquetipo: "Elemental / Água", ataque: 6, defesa: 4, efeito: "Anula todos os bônus numéricos positivos da carta inimiga.", engaste: [8, 9, 10] },
  { id: "ele10FuriCiclon10", name: "Fúria dos Ciclones", tipo: "habilidade", arquetipo: "Elemental / Ar", ataque: 7, defesa: 2, efeito: "Ignore a Defesa inimiga e ganhe +3 no resultado da rodada.", engaste: [9, 10, 11] },
  { id: "ele11TitaGranit11", name: "Titã de Granito", tipo: "criatura", arquetipo: "Elemental / Terra", ataque: 5, defesa: 10, efeito: "Defesa inalterável. Nunca perde seu efeito.", engaste: [10, 11, 12] },
  { id: "ele12ConfluPrim12", name: "Confluência Primordial", tipo: "habilidade", arquetipo: "Elemental / Lendário", ataque: 7, defesa: 6, efeito: "Ignore a Defesa inimiga e anule o efeito da carta inimiga!", engaste: [10, 11, 12] },

  // --- DRUIDA & FERA ---
  { id: "dru01LobAlcate001", name: "Lobo da Alcateia", tipo: "criatura", arquetipo: "Fera", ataque: 4, defesa: 2, efeito: "Se você vencer o Duelo, receba +2 de Ataque adicional.", engaste: [1, 2, 3] },
  { id: "dru02EmranhRaiz02", name: "Emaranhado de Raízes", tipo: "magia", arquetipo: "Druida / Natureza", ataque: 2, defesa: 5, efeito: "Reduza o Ataque da carta inimiga em 2. Ela não pode receber bônus de Ataque.", engaste: [1, 2, 3, 4] },
  { id: "dru03IniciadBosq03", name: "Iniciado do Bosque", tipo: "criatura", arquetipo: "Druida", ataque: 3, defesa: 3, efeito: "Se você perder esta rodada, conceda +2 de Defesa.", engaste: [2, 3, 4] },
  { id: "dru04FormSelvUrs4", name: "Forma Selvagem: Urso Cinzento", tipo: "habilidade", arquetipo: "Druida / Fera", ataque: 5, defesa: 5, efeito: "Se for o primeiro a revelar, ganhe +2 de Defesa. Se segundo, ganhe +2 de Ataque.", engaste: [3, 4, 5] },
  { id: "dru05BencCarval05", name: "Bênção do Carvalho", tipo: "magia", arquetipo: "Druida / Natureza", ataque: 1, defesa: 6, efeito: "Se perder por 3 ou menos, ganhe +2 no próximo Duelo.", engaste: [4, 5, 6] },
  { id: "dru06PanterNotur6", name: "Pantera Noturna", tipo: "criatura", arquetipo: "Fera / Ladino", ataque: 6, defesa: 2, efeito: "Ignore a Defesa inimiga se ela tiver 4 ou menos de Defesa.", engaste: [5, 6, 7] },
  { id: "dru07MuralhEspin7", name: "Muralha de Espinhos", tipo: "magia", arquetipo: "Natureza", ataque: 4, defesa: 6, efeito: "Reflete dano de combate direto contra o resultado do inimigo.", engaste: [5, 6, 7, 8] },
  { id: "dru08DruidaLua008", name: "Druida da Lua", tipo: "criatura", arquetipo: "Druida", ataque: 6, defesa: 4, efeito: "Ao revelar: adicione +2 ao Ataque ou +3 à sua Defesa.", engaste: [6, 7, 8] },
  { id: "dru09FormSelvAgu9", name: "Forma Selvagem: Águia Gigante", tipo: "habilidade", arquetipo: "Druida / Fera", ataque: 7, defesa: 2, efeito: "Se perdeu o Duelo, receba +3 no Resultado Provisório.", engaste: [7, 8, 9] },
  { id: "dru10IraFloresta10", name: "Ira da Floresta", tipo: "magia", arquetipo: "Druida / Elemental", ataque: 8, defesa: 1, efeito: "Reduza o Ataque e a Defesa da carta inimiga em 3 nesta rodada.", engaste: [8, 9, 10] },
  { id: "dru11TreantAnces11", name: "Treant Ancestral", tipo: "criatura", arquetipo: "Natureza / Construto", ataque: 5, defesa: 9, efeito: "Ignora reduções. Se Defesa > Ataque inimigo, receba +3 no resultado.", engaste: [9, 10, 11] },
  { id: "dru12SilvanGuar12", name: "O Primeiro Discípulo", tipo: "criatura", arquetipo: "Druida / Lendário", ataque: 8, defesa: 8, efeito: "Ao revelar essa carta: adicione 1d8 ao seu valor de Duelo!", engaste: [11, 12] },
  { id: "dru13ViborEspor13", name: "Víbora de Esporos", tipo: "criatura", arquetipo: "Fera / Veneno", ataque: 3, defesa: 1, efeito: "Reduza o Ataque da carta inimiga em 2 nesta rodada.", engaste: [1, 2, 3] },
  { id: "dru14ChamadMatil14", name: "Chamado da Matilha", tipo: "habilidade", arquetipo: "Druida / Fera", ataque: 5, defesa: 3, efeito: "Receba +3 no resultado final desta rodada.", engaste: [4, 5, 6] },
  { id: "dru15TempestDru15", name: "Tempestade Druídica", tipo: "magia", arquetipo: "Druida / Elemental", ataque: 7, defesa: 3, efeito: "O oponente não pode usar Habilidades e perde 2 de Ataque.", engaste: [7, 8, 9] },
  { id: "dru16MamutGlaci16", name: "Mamute Glacial Ancestral", tipo: "criatura", arquetipo: "Fera / Lendário", ataque: 10, defesa: 6, efeito: "Se Ataque for maior, ignore Defesa inimiga e adicione +3 diretamente ao Provisório!", engaste: [10, 11, 12] },
];

export const ALL_CARDS: Card[] = RAW_CARDS_DATA.map(parseCard);

export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

// Starter fallback collection (if ever needed)
export function getStarterCollection(): Card[] {
  return [
    getCardById("mxhNSSmuT4k3vCZa")!,
    getCardById("QWHKfudZUGtw3cOD")!,
    getCardById("AUPZTfI6zyvguOD5")!,
    getCardById("nsDh8RqV0IeJGKps")!,
  ].filter(Boolean);
}

// Fallback deck (in case of skip, though Initial Draft builds it)
export function getStarterDeck(): Record<EngasteNumber, Card> {
  const get = (id: string) => getCardById(id)!;
  return {
    1: get("QWHKfudZUGtw3cOD"), // Batedor de Bolsos [1-4]
    2: get("exrQHnpyKsNuGeGw"), // Adaga Envenenada [1-4]
    3: get("BoLRr90inmeJ5Xkn"), // Vigia dos Telhados [2-4]
    4: get("zfElo2rfpA0PMRJ4"), // Cortina de Fumaças [3-5]
    5: get("2FBUuQKdz26PQLQb"), // Espadachim de Viela [3-5]
    6: get("mZKAes8h97cTF4Lv"), // Passos Silenciosos [4-6]
    7: get("WCYaZupSnFJmBJXG"), // Assassino de Aluguel [7-9]
    8: get("6wtOxmZSM3xCOTAS"), // Golpe nas Costas [8-10]
    9: get("62F03uR3I1T7oXJW"), // Informante de Mil Faces [8-10]
    10: get("kvZgLHqkoj0M1Ky3"), // Fuga pelo Telhado [9-11]
    11: get("sKc0Pl28n4DIXlab"), // Fenrir, o Pele de Lobo [11-12]
    12: get("0fFPm1w51RJGpXu5"), // Wolfgang [11-12]
  };
}
