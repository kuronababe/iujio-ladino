import React from 'react';
import { sounds } from '../utils/audio';

interface RulebookModalProps {
  onClose: () => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Manual do Duelista
            </div>
            <h2 className="text-2xl font-cinzel font-bold text-slate-100">
              Regras de Iujio: Arena Roguelike
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Sections */}
        <div className="flex flex-col gap-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-cinzel font-bold text-amber-300 text-base mb-1">
              1. A Jornada pelo Mapa de Maer
            </h3>
            <p>
              Os calabouços formam um <strong>mapa ramificado</strong> de 3 caminhos que se cruzam e convergem no <strong>Chefe Final</strong>. A cada andar você escolhe um nó acessível: <strong>⚔️ Combate</strong> (vencer dá uma carta nova), <strong>💰 Baú de Tesouro</strong> (escolha 1 Artefato mágico) ou <strong>❤️ Coração</strong> (recupera 1 Vida ou, com a vida cheia, aumenta a vida máxima em 1, até 3). Você começa com <strong>2 Vidas</strong>; cada derrota custa 1 e você tenta o nó de novo. Sem Vidas, a tentativa se encerra.
            </p>
            <p className="mt-2">
              <strong>Artefatos</strong> são bônus permanentes da tentativa. <em>Incomuns</em> são pequenos ou de nicho; <em>Raros</em> são amplos ou fortes (ex.: bônus fixo no Duelo, ou +1/+1 para um arquétipo e -1/-1 para o mesmo arquétipo inimigo).
            </p>
          </div>

          {/* Section 2: Talentos de Iujio */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-cinzel font-bold text-amber-300 text-base mb-1">
              2. Talentos de Iujio (Escolha antes de cada partida)
            </h3>
            <p className="mb-2 text-slate-400">
              Antes de iniciar cada partida, você pode escolher um dos 4 Talentos para potencializar sua estratégia:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>
                <strong>📈 A Curva Perfeita:</strong> Ganha um bônus acumulativo de +1 no Duelo para cada rodada jogada nessa partida (Rodada 2: +1, Rodada 3: +2...).
              </li>
              <li>
                <strong>🧪 Tóxico:</strong> Sempre que usar a habilidade <em>Trapacear</em>, o dado rolado passa a ser 1d6 (em vez de 1d4).
              </li>
              <li>
                <strong>🔄 Combeiro:</strong> Ganha +1 no Resultado Final da rodada para cada carta que você re-rolar nessa rodada.
              </li>
              <li>
                <strong>🃏 Coração das Cartas:</strong> Se você revelar a carta que está no Engaste 1 do seu deck, você pode escolher descartá-la e puxar outra carta do seu baralho.
              </li>
            </ul>
          </div>

          {/* Section 3: Engastes */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-cinzel font-bold text-amber-300 text-base mb-1">
              3. Os 12 Engastes e o Baralho
            </h3>
            <p className="mb-2">
              Seu baralho possui exatamente <strong>12 Engastes</strong> numerados de 1 a 12. Cada carta só cabe nos engastes compatíveis:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
              <li>Exemplo: <em>Goblin Fracote</em> cabe nos engastes [1, 2, 3].</li>
              <li>Exemplo: <em>Dragão de Safira</em> cabe nos engastes [10, 11].</li>
              <li><strong>Cartas Únicas:</strong> Apenas uma cópia de cada carta no deck. Modifique seu deck livremente entre as lutas!</li>
            </ul>
          </div>

          {/* Section 4: Combate & Carta Decisiva */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-cinzel font-bold text-amber-300 text-base mb-1">
              4. O Combate em Turnos (Melhor de 3)
            </h3>
            <p className="mb-2">
              Uma partida é vencida por quem ganhar <strong>2 de 3 rodadas</strong> (empates geram rodada extra). Em cada rodada:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400 text-xs">
              <li>
                <strong>Duelo de d12:</strong> Ambos rolam 1d12. Quem tirar o número maior revela sua carta primeiro.
              </li>
              <li>
                <strong>Puxar Carta Decisiva:</strong> Aperte o botão para puxar a Carta Decisiva do baralho (revelada na ordem definida pelo Duelo).
              </li>
              <li>
                <strong>Cálculo de Combate (Atk vs Def):</strong> <code className="text-amber-300 font-mono">Dano = Max(0, Atk - Def)</code>, somado ao d12.
              </li>
              <li>
                <strong>Efeitos de Carta:</strong> Efeitos especiais das cartas decisivas são somados ao duelo.
              </li>
              <li>
                <strong>Resultado Provisório:</strong> <code className="text-amber-300 font-mono">Duelo + Dano Líquido + Efeitos</code>.
              </li>
              <li>
                <strong>Habilidades Universais (Oportunidade para Ambos):</strong>
                <div className="mt-1 text-slate-300 space-y-1">
                  <div>
                    Quem estiver com o <strong>menor resultado provisório</strong> decide primeiro se usa sua habilidade universal (1 uso por partida). Em seguida, o oponente <strong>também tem a oportunidade de responder usando sua habilidade</strong>!
                  </div>
                  <div className="pl-2 space-y-0.5 mt-1">
                    <div>🪤 <strong>Carta Armadilha:</strong> Avança ou Recua o engaste da Carta Decisiva (±1 engaste no baralho).</div>
                    <div>✨ <strong>Jogada Inesperada:</strong> Revela uma nova Carta Decisiva e você escolhe se adota a nova opção ou mantém a atual.</div>
                    <div>🎭 <strong>Trapacear:</strong> Rola 1d4 (ou 1d6 se tiver o talento <em>Tóxico</em>) e subtrai do resultado provisório do oponente!</div>
                  </div>
                </div>
              </li>
              <li>
                <strong>Resultado Final:</strong> Maior pontuação final vence a rodada!
              </li>
            </ol>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-3.5 rounded-xl font-cinzel font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer"
        >
          Entendido, Voltar à Batalha!
        </button>
      </div>
    </div>
  );
};
