// VOLTA / cartazes 2D por pessoa.
// Cada integrante tem uma cena plana, com objetos reconhecíveis dos seus interesses,
// na sua própria paleta. As cores e os movimentos vêm de classes em studio.css
// (a CSP não permite estilo inline). Convenção: todo grupo animado é desenhado em torno
// da sua origem local (0,0), que é o pivô de rotação e escala.
// Nada aqui usa id, gradiente ou personagem de franquia.
(function () {
  'use strict';
  const profiles = {
    'jose-isaias': 'Rede neural, terminal, sol e mandacaru.', 'clara-prado': 'Balança, microfone e carro de corrida.',
    amanda: 'Gráfico de velas, moedas e balões de conversa.', 'julia-alves': 'Gráfico em alta, lâmpada, foguete e broto.',
    igor: 'Bola, claquete, casa e maleta.', guilherme: 'Bola de vôlei sobre a rede, pi, somatório e gráfico.',
    'jose-roberto': 'Luvas de boxe, fliperama, corações de pixel e chip.', volta: 'Ciclo de materiais: garrafa, lata, pote e folha.'
  };
  const P = (d, c, x = '') => `<path class="${c}" d="${d}" ${x}/>`;
  const C = (cx, cy, r, c, x = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" class="${c}" ${x}/>`;
  const E = (cx, cy, rx, ry, c, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${c}" ${x}/>`;
  const R = (x, y, w, h, c, rx = 0, e = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${c}" ${e}/>`;
  const L = (d, c, w = 4, x = '') => `<path class="n ${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" d="${d}" ${x}/>`;
  const at = (x, y, body, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${body}</g>`;
  const an = (cls, body) => `<g class="${cls}">${body}</g>`;
  // item: posição fixa > entrada (pop) > movimento contínuo.
  const item = (x, y, i, cls, body, s = 1, r = 0) => at(x, y, an('pop d' + i, an(cls, body)), s, r);
  const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
  const spark = (x, y, i, s = 1) => at(x, y, P('M0 -16Q2 -2 16 0Q2 2 0 16Q-2 2 -16 0Q-2 -2 0 -16Z', 'c a-twinkle l' + i % 4), s);
  const burst = (n, outer, inner, c) => `<polygon class="${c}" points="${repeat(n * 2, i => { const t = i / (n * 2) * Math.PI * 2, r = i % 2 ? inner : outer; return (Math.cos(t) * r).toFixed(1) + ',' + (Math.sin(t) * r).toFixed(1) + ' '; })}"/>`;
  const pixels = (rows, cell, c) => { const w = rows[0].length * cell, h = rows.length * cell; return rows.map((row, y) => [...row].map((v, x) => v === 'X' ? R(x * cell - w / 2, y * cell - h / 2, cell + .4, cell + .4, c) : '').join('')).join(''); };
  const backdrop = () => C(300, 232, 205, 'd');

  // Objetos
  const volleyball = () => C(0, 0, 40, 'c') + L('M-40 0C-18 -12 8 -8 28 -29M0 40C-8 16 6 -8 40 -4M-20 -35C-2 -18 -4 12 -29 28', 'sk', 3.5);
  const football = () => C(0, 0, 38, 'c') + P('M0 -15L14 -5L9 12H-9L-14 -5Z', 'k') + L('M0 -15V-38M14 -5L36 -12M9 12L22 31M-9 12L-22 31M-14 -5L-36 -12', 'sk', 3.5);
  const coinStack = (n = 3) => repeat(n, j => E(0, -j * 13, 36, 13, 'p sk', 'stroke-width="3"'));
  const coin = () => C(0, 0, 27, 'p sk', 'stroke-width="3"') + L('M9 -10Q0 -17 -8 -10Q-12 -1 0 0Q12 2 8 11Q0 17 -9 10M0 -19V19', 'sk', 3);
  const bottle = () => P('M-10 -58H10V-44Q24 -34 24 -14V46Q24 56 14 56H-14Q-24 56 -24 46V-14Q-24 -34 -10 -44Z', 'c') + R(-24, -6, 48, 26, 'p') + R(-11, -68, 22, 11, 'q', 3);
  const can = () => R(-24, -40, 48, 84, 'q', 8) + E(0, -40, 24, 8, 'c') + R(-24, -10, 48, 22, 'c') + L('M-6 -41H8', 'sk', 3);
  const jar = () => R(-24, -28, 48, 72, 'c', 12) + R(-18, -44, 36, 16, 'p', 4) + L('M-10 -8V26', 'sd', 4);
  const leaf = () => P('M0 46C-44 14 -34 -40 0 -54C34 -40 44 14 0 46Z', 'p') + L('M0 40V-36M0 8L-16 -8M0 -8L14 -22', 'sd', 3.5);
  const rocket = () => P('M0 -54C24 -30 22 10 14 34H-14C-22 10 -24 -30 0 -54Z', 'c') + C(0, -12, 9, 'b') + P('M-14 12L-32 42L-14 34ZM14 12L32 42L14 34Z', 'p') + at(0, 34, an('a-flame', P('M-10 0Q0 46 10 0Z', 'q')));
  const stripes = (x0, y) => repeat(4, i => P(`M${x0 + 12 + i * 28} ${y}h13l-9 20h-13Z`, 'k'));
  const glove = () => P('M-34 -6Q-34 -42 0 -42Q36 -42 36 -6Q36 20 14 24H-20Q-34 20 -34 -6Z', 'q') + E(-31, 4, 11, 18, 'q sk', 'stroke-width="3"') + R(-22, 24, 38, 18, 'c', 4) + L('M-8 -26Q4 -32 16 -24', 'sc', 3);
  const heartPixels = c => pixels(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], 6, c);

  const scenes = {
    guilherme: () => backdrop()
      + at(300, 232, repeat(9, i => `<g transform="rotate(${196 + i * 13})">${L('M214 0H' + (250 + i % 3 * 22), 'sc a-streak l' + i % 4, 4)}</g>`))
      + item(322, 128, 1, 'a-pulse', burst(11, 76, 42, 'q'))
      + L('M130 340Q300 -70 470 340', 'sc', 3, 'stroke-dasharray="1 13" opacity=".7"')
      + L('M70 402H530', 'sp', 6)
      + at(300, 346, R(-106, -60, 9, 116, 'k', 3) + R(97, -60, 9, 116, 'k', 3) + R(-97, -54, 194, 11, 'c') + L('M-97 -32H97M-97 -14H97M-97 4H97' + repeat(7, i => `M${-72 + i * 24} -43V4`), 'sc', 2.2))
      + an('pop d2', an('a-ball', an('a-spin', volleyball())))
      + item(92, 214, 3, 'a-float', L('M-40 -30H40M-18 -30V34M18 -30V22Q18 36 32 34', 'sp', 14))
      + item(500, 84, 4, 'a-float l2', L('M30 -36H-26L8 0L-26 36H30', 'sp', 12), .85)
      + item(524, 196, 5, 'a-float l1', R(-62, -46, 124, 92, 'c', 10) + L('M-46 30V-32M-46 30H48', 'sk', 3) + `<path class="n sb a-draw" pathLength="1" stroke-width="5" stroke-linecap="round" d="M-46 10C-30 -40 -14 -40 0 0S30 40 46 -20"/>`)
      + spark(64, 70, 0) + spark(548, 208, 1, .8) + spark(430, 52, 2, .7) + spark(84, 300, 3, .7),

    'clara-prado': () => backdrop()
      + item(190, 150, 1, '', R(-5, 0, 10, 126, 'c', 3) + R(-48, 122, 96, 13, 'c', 6)
        + an('a-tilt', R(-92, -4, 184, 8, 'c', 4)
          + at(-86, 0, an('a-tilt-rev', L('M0 0L-26 56M0 0L26 56', 'sc', 2.5) + P('M-34 56H34Q30 80 0 80Q-30 80 -34 56Z', 'p')))
          + at(86, 0, an('a-tilt-rev', L('M0 0L-26 56M0 0L26 56', 'sc', 2.5) + P('M-34 56H34Q30 80 0 80Q-30 80 -34 56Z', 'q'))))
        + C(0, 0, 11, 'p'))
      + item(420, 168, 2, 'a-float', R(-18, -50, 36, 62, 'c', 18) + L('M-18 -30H18M-18 -16H18', 'sk', 2.5) + L('M-30 -6Q-30 30 0 30Q30 30 30 -6M0 30V56M-22 56H22', 'sc', 5)
        + L('M44 -44Q62 -20 44 4', 'sp a-ring l0', 5) + L('M60 -58Q88 -20 60 18', 'sp a-ring l1', 5) + L('M78 -72Q116 -20 78 32', 'sp a-ring l2', 5))
      + L('M-20 404H620', 'sc a-road', 4, 'stroke-dasharray="26 18"')
      + at(300, 362, an('pop d3', an('a-drive', L('M-150 -4H-96M-170 12H-108', 'sc', 4, 'opacity=".7"')
        + R(-80, -28, 10, 36, 'k', 2) + R(-90, -34, 30, 9, 'k', 3) + P('M-70 8L-58 -8H-20L-8 -24H20L32 -8L78 2V16H-70Z', 'p') + R(66, 8, 22, 7, 'k', 2) + C(6, -22, 10, 'c')
        + at(-44, 16, an('a-spin-fast', C(0, 0, 17, 'k') + C(0, 0, 7, 'c') + C(0, -11, 2.5, 'c'))) + at(44, 16, an('a-spin-fast', C(0, 0, 17, 'k') + C(0, 0, 7, 'c') + C(0, -11, 2.5, 'c'))))), 1.45)
      + item(520, 330, 4, '', L('M0 44V-70', 'sc', 5) + at(0, -70, an('a-wave', repeat(12, i => R(i % 4 * 15, Math.floor(i / 4) * 15, 15.4, 15.4, (i % 4 + Math.floor(i / 4)) % 2 ? 'k' : 'c')))))
      + spark(70, 86, 0) + spark(540, 80, 1, .8) + spark(300, 60, 2, .7),

    amanda: () => backdrop()
      + item(210, 190, 1, 'a-float', R(-96, -76, 192, 152, 'c', 16) + L('M-78 58H78', 'sk', 3)
        + repeat(5, i => { const h = [40, 64, 50, 86, 104][i]; return at(-60 + i * 30, 54, an('a-grow l' + i % 4, L('M0 0V' + -(h + 12), 'sk', 2.5) + R(-9, -h, 18, h * .72, i % 2 ? 'k' : 'b', 3))); }))
      + item(440, 128, 2, 'a-float l1', P('M-74 -42H74Q88 -42 88 -28V20Q88 34 74 34H-18L-46 60V34H-74Q-88 34 -88 20V-28Q-88 -42 -74 -42Z', 'c')
        + C(-30, -4, 9, 'b a-dot l0') + C(0, -4, 9, 'b a-dot l1') + C(30, -4, 9, 'b a-dot l2'))
      + item(452, 262, 3, 'a-float l3', P('M-70 -36H70Q82 -36 82 -24V16Q82 28 70 28H40V52L14 28H-70Q-82 28 -82 16V-24Q-82 -36 -70 -36Z', 'q') + L('M-52 -12H52M-52 8H10', 'sk', 5))
      + item(150, 372, 4, '', coinStack(4)) + item(150, 300, 5, 'a-flip', coin())
      + item(330, 360, 6, 'a-pulse', C(0, 0, 30, 'p') + L('M0 -14V4', 'sk', 7) + C(0, 16, 4.5, 'k'))
      + spark(68, 96, 0) + spark(540, 360, 1, .8) + spark(336, 56, 2, .7) + spark(560, 196, 3, .6),

    'julia-alves': () => backdrop()
      + item(214, 236, 1, '', L('M-110 82V-92M-110 82H124', 'sc', 5) + repeat(4, i => L(`M-110 ${40 - i * 40}H-98`, 'sc', 3))
        + `<path class="n sp a-draw" pathLength="1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" d="M-90 52L-44 12L-8 32L46 -30L98 -64"/>` + at(104, -70, an('a-pulse', P('M10 -14L-22 -10L4 18Z', 'p'))))
      + item(452, 124, 2, 'a-float', an('a-glow', L('M0 -64V-80M46 -46L58 -58M-46 -46L-58 -58M64 -10H80M-64 -10H-80', 'sq', 6)) + C(0, -10, 36, 'q') + L('M-11 0L-4 -13L4 0L11 -13', 'sk', 3) + R(-15, 24, 30, 11, 'c', 3) + R(-11, 37, 22, 9, 'c', 3))
      + item(456, 300, 3, 'a-rocket', rocket(), 1, 32)
      + item(120, 386, 4, '', coinStack(3) + at(0, -30, an('a-sway', L('M0 0V-44', 'sp', 5) + P('M0 -40C-26 -44 -36 -66 -32 -74C-12 -74 0 -60 0 -40ZM0 -46C22 -46 36 -64 34 -78C16 -78 2 -66 0 -46Z', 'p'))))
      + item(320, 392, 5, 'a-flip', coin(), .8)
      + spark(66, 84, 0) + spark(546, 214, 1, .8) + spark(322, 58, 2, .7) + spark(560, 392, 3, .6),

    igor: () => backdrop()
      + L('M60 404H540', 'sc', 5)
      + at(150, 396, E(0, 0, 34, 7, 'd a-squish')) + at(150, 362, an('pop d1', an('a-bounce', an('a-spin', football()))))
      + item(300, 188, 2, 'a-float', R(-66, -18, 132, 84, 'k', 8) + L('M-48 14H48M-48 36H12', 'sc', 4) + R(-66, -40, 132, 22, 'c', 4) + stripes(-66, -39)
        + at(-66, -42, an('a-clap', R(0, -22, 132, 22, 'c', 4) + stripes(0, -21))))
      + item(476, 300, 3, '', P('M-58 0L0 -52L58 0V60H-58Z', 'c') + P('M-72 6L0 -62L72 6L60 18L0 -38L-60 18Z', 'p') + R(26, -56, 14, 30, 'p') + at(0, 28, an('a-beat', P('M0 18C-28 -2 -20 -24 -7 -24C-2 -24 0 -20 0 -17C0 -20 2 -24 7 -24C20 -24 28 -2 0 18Z', 'q'))))
      + item(470, 122, 4, 'a-float l2', R(-52, -30, 104, 68, 'q', 10) + L('M-18 -30V-46H18V-30', 'sc', 6) + R(-52, -4, 104, 9, 'k') + R(-9, -11, 18, 20, 'c', 3))
      + item(116, 150, 5, 'a-float l1', R(-34, -44, 68, 88, 'c', 6) + repeat(4, i => R(-26, -36 + i * 20, 10, 12, 'k', 2) + R(16, -36 + i * 20, 10, 12, 'k', 2)) + R(-10, -34, 20, 68, 'p', 2))
      + spark(64, 300, 0) + spark(548, 216, 1, .8) + spark(380, 62, 2, .7),

    'jose-isaias': () => backdrop()
      + L('M40 410H560', 'sp', 6)
      + item(470, 110, 1, '', an('a-spin-slow', repeat(12, i => `<rect x="-5" y="-74" width="10" height="20" rx="5" class="p" transform="rotate(${i * 30})"/>`)) + C(0, 0, 44, 'p'))
      + item(520, 340, 2, 'a-sway', L('M0 62V-56M0 14H-32V-22M0 -6H32V-40', 'sq', 20) + L('M0 50V-50', 'sc', 2, 'stroke-dasharray="1 10" opacity=".6"'))
      + item(196, 180, 3, '', (() => { const layers = [[-90, [-52, 0, 52]], [0, [-76, -26, 26, 76]], [90, [-30, 30]]]; let edges = '', nodes = '', n = 0;
        for (let l = 0; l < 2; l++) for (const a of layers[l][1]) for (const b of layers[l + 1][1]) edges += L(`M${layers[l][0]} ${a}L${layers[l + 1][0]} ${b}`, (n++ % 3 ? 'sc' : 'sp a-flow'), n % 3 ? 2 : 3.5, n % 3 ? 'opacity=".45"' : 'stroke-dasharray="5 9"');
        layers.forEach(([x, ys], l) => ys.forEach((y, i) => { nodes += at(x, y, C(0, 0, 13, (l === 1 ? 'p' : 'c') + ' a-pulse l' + (i + l) % 4)); }));
        return edges + nodes; })())
      + item(250, 356, 4, 'a-float l1', R(-78, -52, 156, 104, 'k', 12) + C(-60, -36, 5, 'p') + C(-44, -36, 5, 'c') + L('M-52 -6L-32 10L-52 26', 'sp', 7) + R(-18, 18, 30, 8, 'c a-blink'))
      + spark(64, 76, 0) + spark(352, 70, 1, .8) + spark(404, 262, 2, .7) + spark(96, 330, 3, .7),

    'jose-roberto': () => backdrop()
      + item(178, 300, 1, '', P('M-56 -100H56L68 -46L56 -34V100H-56V-34L-68 -46Z', 'k') + R(-50, -94, 100, 20, 'q', 3) + R(-44, -66, 88, 60, 'b', 4)
        + at(0, -36, an('a-hop', pixels(['.XXXXXX.', 'XXXXXXXX', 'X.XXXX.X', 'XXXXXXXX', 'XX.XX.XX', 'X..XX..X'], 7, 'p')))
        + P('M-62 4H62L56 26H-56Z', 'c') + L('M-24 6V-8', 'sk', 4) + C(-24, -10, 7, 'q') + C(14, 14, 6, 'q') + C(32, 14, 6, 'p') + R(-9, 54, 18, 24, 'c', 3))
      + item(360, 150, 2, 'a-jab', glove(), 1, 90) + item(360, 236, 3, 'a-jab l2', glove(), 1, 90)
      + item(498, 192, 4, 'a-impact', burst(9, 46, 24, 'p'))
      + item(430, 62, 5, '', at(-44, 0, heartPixels('q')) + at(0, 0, heartPixels('q')) + at(44, 0, an('a-blink', heartPixels('q'))))
      + item(470, 344, 6, 'a-float', L('M-52 -18H52M-52 0H52M-52 18H52M-18 -52V52M0 -52V52M18 -52V52', 'sc', 5) + R(-36, -36, 72, 72, 'c', 8) + R(-19, -19, 38, 38, 'b a-glow', 4))
      + spark(60, 90, 0) + spark(548, 80, 1, .8) + spark(330, 398, 2, .7),

    volta: () => backdrop()
      + L('M112 124Q300 10 492 128T488 340Q300 470 108 336T112 124', 'sc a-flow', 3, 'stroke-dasharray="2 12" opacity=".5"')
      + at(300, 232, an('pop d1', an('a-spin-slow', repeat(3, k => `<g transform="rotate(${k * 120})"><circle r="112" class="n ${['sp', 'sq', 'sc'][k]}" stroke-width="36" stroke-dasharray="176 528"/><g transform="rotate(90) translate(112 0)">${P('M-32 -6L32 -6L0 30Z', ['p', 'q', 'c'][k])}</g></g>`))) + an('pop d2', L('M-34 -24L0 32L34 -24', 'sc', 15)))
      + item(110, 124, 3, 'a-float', bottle(), 1, -14) + item(492, 128, 4, 'a-float l1', can(), 1, 12)
      + item(488, 340, 5, 'a-sway', leaf(), 1.05) + item(108, 336, 6, 'a-float l2', jar(), 1, 8)
      + spark(300, 44, 0) + spark(556, 232, 1, .8) + spark(46, 232, 2, .8) + spark(300, 424, 3, .7)
  };
  function render(id, compact) {
    const key = scenes[id] ? id : 'volta';
    return `<svg class="personal-art volta-scene ${compact ? 'is-compact' : 'is-live'}" data-person="${key}" data-art-description="${profiles[key]}" viewBox="0 0 600 460" preserveAspectRatio="xMidYMid ${compact ? 'slice' : 'meet'}" aria-hidden="true" focusable="false">${compact ? R(0, 0, 600, 460, 'b') : ''}${scenes[key]()}</svg>`;
  }
  window.VoltaArt = { render, profiles };
})();
