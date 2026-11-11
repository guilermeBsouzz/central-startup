(function () {
  'use strict';
  const paper = '#f3efd9', ink = '#073e32', lime = '#d4f444';
  const profiles = {
    'jose-isaias': { label: 'José Isaías', description: 'Circuitos que criam raízes no Nordeste.', motifs: ['Computação', 'Redes neurais', 'Cordel', 'Empreendedorismo'] },
    'clara-prado': { label: 'Clara Prado', description: 'Equilíbrio, voz e velocidade.', motifs: ['Direito', 'Oratória', 'Fórmula 1'] },
    amanda: { label: 'Amanda', description: 'Capital e conversas em recortes magenta.', motifs: ['Finanças', 'Mercado', 'Fofocas'] },
    'julia-alves': { label: 'Júlia Alves', description: 'Ideias que atravessam pontes e germinam.', motifs: ['Finanças', 'Mercado', 'Empreendedorismo'] },
    igor: { label: 'Igor', description: 'Movimento, construção e encontros em película.', motifs: ['Esportes', 'Trabalho', 'Família', 'Filmes'] },
    guilherme: { label: 'Guilherme', description: 'Energia desenhada entre parábolas e retículas.', motifs: ['Anime', 'Vôlei', 'Matemática', 'Op art'] },
    'jose-roberto': { label: 'José Roberto', description: 'Ritmo de ringue, pixels e circuitos.', motifs: ['Luta', 'Jogos antigos', 'Computação'] }
  };
  let counter = 0;
  const instance = 'volta-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
  const path = (d, fill = ink, stroke = 'none', width = 2, extra = '') => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const circle = (x, y, r, fill, stroke = 'none', width = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const group = (transform, body) => `<g transform="${transform}">${body}</g>`;
  const line = (d, color = ink, width = 2, extra = '') => path(d, 'none', color, width, extra);
  const scenes = {
    'jose-isaias': u => {
      const orange = '#ee7540';
      return path('M0 0H242L206 320H0Z', orange) + path('M365 0H640V320H498L451 175Z', ink)
        + circle(135, 108, 65, paper) + circle(135, 108, 48, u('hatch'))
        + repeat(18, i => group(`rotate(${i * 20} 135 108)`, line('M135 31V18', ink, 3)))
        + path('M0 261L53 227L88 244L131 206L192 246L232 230V320H0Z', paper) + path('M0 278L63 251L99 267L140 239L215 281V320H0Z', u('hatch'))
        + path('M229 38L403 25L430 220L251 239Z', paper) + path('M243 49L391 40L411 204L261 221Z', u('dots'))
        + line('M252 69H289V113H329V154H387M263 199H293V163H329M359 56V91H392M329 113V76H314', ink, 4)
        + [[289,69],[329,113],[329,154],[387,154],[263,199],[359,56],[392,91],[314,76]].map(([x,y]) => circle(x,y,7,lime,ink,2)).join('')
        + line('M439 66L488 101L543 54L579 125L488 101L458 173L523 204L579 125M439 66L458 173M488 101L523 204L598 231M543 54L614 70L579 125', paper, 2)
        + [[439,66],[488,101],[543,54],[579,125],[458,173],[523,204],[598,231],[614,70]].map(([x,y],i) => circle(x,y,i%3===0?11:7,i%2?orange:lime)).join('')
        + line('M313 326C310 271 355 270 365 235M313 310C267 285 245 294 222 270M321 286C374 294 415 272 441 245', ink, 10)
        + path('M365 239Q333 213 354 192Q380 206 365 239M441 248Q432 211 466 206Q476 236 441 248M225 273Q190 282 183 251Q215 245 225 273', lime, ink, 2);
    },
    'clara-prado': u => {
      const red = '#ed593e';
      return path('M0 0H640V113L0 226Z', red) + path('M409 0H640V320H371L431 204Z', ink)
        + group('rotate(-12 481 183)', rect(407,25,159,282,paper,'rx="77"') + rect(425,43,123,246,ink,'rx="59"') + rect(443,61,87,210,paper,'rx="42"') + rect(458,77,57,178,red,'rx="28"') + rect(407,142,159,29,u('checks')))
        + path('M38 51L261 31L285 230L51 245Z', paper) + path('M53 63L94 59L110 227L68 231Z', u('hatch'))
        + line('M164 72V207M103 101L229 80M114 99L94 158H142ZM218 83L193 146H242Z', ink, 4)
        + path('M88 158Q116 193 147 158ZM188 146Q216 181 248 146Z', red) + circle(164,90,9,lime,ink,3)
        + path('M136 208H195L208 222H121Z', ink) + path('M259 320L272 224L352 213L377 320Z', ink)
        + path('M257 223L348 206L365 222L274 242Z', lime) + line('M308 215V180Q310 168 319 167', paper, 4) + circle(322,166,6,ink)
        + repeat(4,i => line(`M${334+i*15} ${149-i*13}Q${361+i*23} 169 ${340+i*15} ${190+i*11}`, i%2?ink:paper, 4))
        + path('M30 278L139 259L153 271L44 291ZM53 300L189 276L196 288L60 312Z', red) + circle(579,51,18,lime);
    },
    amanda: u => {
      const pink = '#d72478', pale = '#f5b9d5', gold = '#edb74c';
      return rect(0,0,640,320,pink) + path('M0 0H270L213 320H0Z', ink) + circle(566,282,143,pale)
        + group('rotate(-11 186 159)', rect(53,48,231,231,paper) + rect(66,61,205,204,u('dots'))
          + path('M88 224V129L119 111V205ZM137 231V88L172 112V210ZM192 231V149L233 122V205Z',pink) + path('M88 129L119 111L134 125L104 143ZM137 88L172 112L185 98L151 74ZM192 149L233 122L248 136L207 162Z',ink))
        + group('rotate(13 427 102)', path('M299 33H564V149H397L352 185L360 149H299Z',paper,ink,3)
          + path('M515 33V77H564Z',pale) + path('M515 33L564 77H515Z',gold) + rect(322,57,155,12,ink) + rect(322,81,111,7,pink) + rect(322,101,173,7,pink) + rect(322,121,70,7,ink))
        + path('M350 178L578 163L590 253L549 256L555 285L510 259L358 270Z',pink,ink,3)
        + path('M550 165L578 163L581 194Z',paper) + repeat(3,i => circle(402+i*49,220,10,paper))
        + repeat(3,i => group(`translate(${92+i*52} ${259-i*14})`, circle(0,0,32,gold,ink,3) + circle(0,0,23,'none',ink,2) + path('M-10 0L0-13L10 0L0 13Z',paper)))
        + path('M278 19L289 44L316 40L298 60L308 87L282 74L262 92L265 65L241 52L268 46Z',lime);
    },
    'julia-alves': u => {
      const teal = '#155769', gold = '#dfb54f';
      return rect(0,0,640,320,teal) + circle(494,77,110,gold) + circle(494,77,88,u('hatch')) + path('M0 0H192L268 320H0Z',paper)
        + group('rotate(-9 173 159)', path('M57 267V122L99 99V244ZM117 267V60L161 83V244ZM180 267V151L225 130V244Z',teal)
          + path('M57 122L99 99L114 111L73 134ZM117 60L161 83L178 70L135 47ZM180 151L225 130L242 143L197 164Z',gold) + line('M81 150V225M140 108V225M204 174V225',paper,2))
        + path('M195 257Q331 99 500 235L500 277Q330 149 195 292Z',paper) + line('M208 260Q334 124 487 244',gold,5)
        + line('M232 239V299M278 204V291M329 195V282M380 202V282M430 222V295M479 249V308',paper,7)
        + path('M337 154L369 61L408 148L374 131Z',lime,ink,3) + path('M369 61L374 131L337 154Z',paper,ink,2) + line('M371 159L352 189M385 160L374 189',gold,4)
        + path('M505 320Q514 258 553 222M528 266Q499 262 496 234Q530 228 528 266M542 242Q540 207 571 207Q578 233 542 242',lime,ink,2)
        + group('rotate(32 578 139)', path('M578 112Q608 140 578 166Q548 140 578 112Z',paper) + line('M578 119V159',teal,2)) + rect(281,33,43,10,gold);
    },
    igor: u => {
      const blue = '#112e4a', green = '#2b966c';
      return rect(0,0,640,320,blue) + path('M0 0H374L279 320H0Z',green)
        + group('rotate(-16 159 144)', rect(40,51,237,170,'none',`stroke="${paper}" stroke-width="3"`) + line('M158 51V221M40 89H86V183H40M277 89H232V183H277',paper,3) + circle(158,136,34,'none',paper,3))
        + group('rotate(10 492 120)', rect(368,-27,230,288,paper) + rect(382,-27,202,288,blue)
          + repeat(7,i => rect(370,i*44-20,8,18,blue)+rect(588,i*44-20,8,18,blue)) + rect(398,21,170,91,green) + path('M398 112L452 50L482 89L515 61L568 112Z',lime) + rect(398,129,170,93,paper) + circle(479,175,34,green) + path('M448 196L477 148L514 196Z',blue))
        + path('M20 273L116 222L212 256L119 310Z',paper) + path('M20 273V309L119 344V310ZM119 310L212 256V290L119 344Z',ink)
        + group('rotate(-20 125 261)', path('M67 253H145L158 235L185 240L171 257L183 272L157 277L143 266H67Z',blue) + circle(77,260,4,paper))
        + path('M227 246Q242 163 308 184Q375 160 395 245Q352 303 305 291Q261 301 227 246Z',ink)
        + circle(267,216,20,paper) + circle(347,213,23,lime) + circle(307,249,16,green)
        + line('M245 247Q253 286 301 276M369 246Q358 285 316 277M280 240Q307 221 330 239',paper,9,'stroke-linecap="round"')
        + circle(63,53,22,lime) + line('M43 46Q64 50 74 72M51 34Q51 56 82 57',blue,2) + rect(540,278,76,14,lime);
    },
    guilherme: u => {
      const cobalt = '#254de3';
      return rect(0,0,640,320,cobalt) + path('M0 0H234L366 159L174 320H0Z',paper) + path('M0 0H234L366 159L174 320H0Z',u('dots'))
        + repeat(14,i => line(`M${-25+i*20} 0L${249+i*5} ${114+i*3}`,ink,i%3===0?4:1))
        + path('M145 163L248 149L220 111L306 141L326 74L347 139L425 106L389 160L469 176L386 192L418 244L352 217L321 284L301 212L224 251L255 196Z',lime,ink,3)
        + path('M257 163L310 169L295 144L337 164L358 143L350 178L384 190L338 195L320 226L313 194L280 210Z',paper)
        + group('translate(502 83)', repeat(11,i => `<ellipse rx="${13+i*8}" ry="${8+i*5}" fill="none" stroke="${i%2?paper:lime}" stroke-width="3" transform="rotate(${i*9})"/>`))
        + path('M368 274L514 206L631 245L493 316Z',ink) + line('M368 274L514 206L631 245L493 316ZM432 244L557 283M434 293L573 225',paper,2)
        + line('M458 282V220L583 258V301M458 224L583 262M458 236L583 274M458 248L583 286',lime,2)
        + repeat(7,i => line(`M${470+i*16} ${224+i*4.85}V${252+i*4.85}`,paper,1))
        + line('M109 275Q266 -22 493 213',paper,3,'stroke-dasharray="7 8"')
        + circle(216,130,36,paper,ink,3) + path('M188 108Q218 113 246 109M182 132Q207 125 231 162M209 95Q206 125 182 143M246 109Q222 124 231 162', 'none',cobalt,4)
        + line('M36 292L130 211L171 293ZM78 256L149 253M130 211L120 292',ink,2) + circle(120,267,26,'none',ink,2);
    },
    'jose-roberto': u => {
      const purple = '#7045ba', dark = '#30204e';
      return rect(0,0,640,320,purple) + path('M0 0H217L269 320H0Z',dark) + rect(430,0,210,320,u('grid'))
        + path('M32 195L167 117L308 176L168 264Z',paper) + path('M32 195V219L168 292V264ZM168 264L308 176V201L168 292Z',ink)
        + line('M32 195V105M167 117V47M308 176V91M168 264V170',lime,7)
        + repeat(3,i => line(`M32 ${112+i*22}L167 ${54+i*22}L308 ${98+i*22}L168 ${178+i*22}Z`,paper,3))
        + group('rotate(-24 195 99)', path('M154 80L183 61L225 99L204 122Z',lime) + repeat(4,i => line(`M${161+i*9} ${77-i*4}L${206+i*5} ${116-i*7}`,dark,2)) + path('M154 80L139 98L169 128L182 106Z',paper))
        + group('rotate(12 443 98)', path('M374 34H505V157H364V49Z',paper,ink,3) + rect(386,50,105,64,dark) + rect(385,125,91,21,purple) + repeat(6,i => rect(392+i*13,127,5,17,lime))
          + path('M403 91V65H416V78H429V65H442V91H455V78H468V104H442V91H429V104H416V91Z',lime))
        + group('rotate(-10 441 235)', path('M348 205Q353 185 382 187L489 187Q515 185 524 208L541 255Q547 281 523 283L482 258H391L354 281Q328 286 334 259Z',lime,ink,4)
          + path('M370 209H384V222H397V236H384V249H370V236H357V222H370Z',dark) + circle(492,218,10,purple,ink,2) + circle(513,241,10,paper,ink,2) + rect(421,226,26,7,dark))
        + rect(253,242,57,57,dark,`stroke="${paper}" stroke-width="3"`) + rect(267,256,29,29,lime)
        + repeat(4,i => line(`M${260+i*13} 233V242M${260+i*13} 299V308M244 ${249+i*13}H253M310 ${249+i*13}H319`,paper,3))
        + repeat(5,i => rect(554+(i%2)*18,42+i*24,15,15,i%2?paper:lime));
    }
  };
  function render(id, compact = false) {
    if (!Object.prototype.hasOwnProperty.call(scenes, id)) return '';
    const prefix = instance + '-' + (++counter) + '-', u = name => `url(#${prefix}${name})`;
    const defs = `<defs><pattern id="${prefix}hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">${line('M2 0V9',ink,2)}</pattern><pattern id="${prefix}dots" width="10" height="10" patternUnits="userSpaceOnUse">${circle(3,3,1.3,ink)}</pattern><pattern id="${prefix}checks" width="24" height="24" patternUnits="userSpaceOnUse">${rect(0,0,24,24,paper)+rect(0,0,12,12,ink)+rect(12,12,12,12,ink)}</pattern><pattern id="${prefix}grid" width="24" height="24" patternUnits="userSpaceOnUse">${path('M24 0H0V24','none',paper,0.7,'opacity=".3"')}</pattern><clipPath id="${prefix}crop">${rect(0,0,640,320,'white')}</clipPath></defs>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="personal-art${compact?' personal-art--compact':''}" viewBox="0 0 640 320" width="640" height="320" preserveAspectRatio="xMidYMid ${compact?'slice':'meet'}" aria-hidden="true" focusable="false">${defs}<g clip-path="${u('crop')}" stroke-linejoin="round">${rect(0,0,640,320,paper)}${scenes[id](u)}</g></svg>`;
  }
  window.VoltaArt = { render, profiles };
}());
