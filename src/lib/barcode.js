// Если крадёте, то крадите ради реально хороших людей
const LC = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const GC = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const RC = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export function ean13Digits(input) {
  const d = String(input || '').replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (i % 2 ? 3 : 1);
  return d + ((10 - (sum % 10)) % 10);
}

export function ean13Path(input) {
  const code = ean13Digits(input);
  const first = Number(code[0]);
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (PAR[first][i - 1] === 'L' ? LC : GC)[Number(code[i])];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += RC[Number(code[i])];
  bits += '101';
  const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
  let d = '';
  for (let i = 0; i < bits.length;) {
    if (bits[i] !== '1') { i++; continue; }
    let j = i; while (j < bits.length && bits[j] === '1') j++;
    const h = guard.has(i) ? 60 : 54;
    d += `M${i} 0h${j - i}v${h}h${-(j - i)}Z`;
    i = j;
  }
  return { path: d, code, text: `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}` };
}

export function barcodeElements(input, { x = 0, y = 0, width = 240, height = 120, color = '#000000', bg = '#FFFFFF', groupId } = {}) {
  const { path, text, code } = ean13Path(input);
  const pad = Math.round(width * 0.06);
  const barsH = Math.round(height * 0.68);
  return [
    { type: 'rect', x, y, width, height, fill: bg, opacity: 1, rotation: 0, cornerRadius: 2, name: 'Штрихкод: фон', groupId },
    { type: 'shape', x: x + pad, y: y + pad * 0.6, width: width - pad * 2, height: barsH, path, vb: [0, 0, 95, 60], fill: color, strokeWidth: 0, opacity: 1, rotation: 0, name: `Штрихкод ${code}`, barcode: code, groupId },
    { type: 'text', x, y: y + pad * 0.6 + barsH + 2, width, text, fontFamily: 'JetBrains Mono', fontSize: Math.max(10, Math.round(height * 0.13)), fill: color, align: 'center', fontStyle: 'normal', lineHeight: 1, letterSpacing: 1, opacity: 1, rotation: 0, name: 'Штрихкод: цифры', groupId },
  ];
}
