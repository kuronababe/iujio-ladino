import { Talent } from '../types/game';

export const IUJIO_TALENTS: Talent[] = [
  {
    id: 'PERFECT_CURVE',
    name: 'A Curva Perfeita',
    description: 'Ganha um bônus acumulativo de +1 no Duelo para cada rodada jogada nessa partida (Rodada 2: +1, Rodada 3: +2...).',
    icon: '📈',
  },
  {
    id: 'TOXIC',
    name: 'Tóxico',
    description: 'Sempre que usar a habilidade Trapacear, o dado rolado passa a ser 1d6 (em vez de 1d4).',
    icon: '🧪',
  },
  {
    id: 'COMBER',
    name: 'Combeiro',
    description: 'Ganha +1 no Resultado Final da rodada para cada carta que você re-rolar nessa rodada.',
    icon: '🔄',
  },
  {
    id: 'HEART_OF_THE_CARDS',
    name: 'Coração das Cartas',
    description: 'Se você revelar a carta que está no Engaste 1 do seu deck, pode escolher revelar outra carta e utilizar o novo resultado.',
    icon: '🃏',
  },
];
