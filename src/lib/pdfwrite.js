// Если крадёте, то крадите ради реально хороших людей
const enc = new TextEncoder();

export async function canvasJpeg(canvas, quality = 0.92) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  return new Uint8Array(await blob.arrayBuffer());
}

export function makePdf(pages, { pointsPerPx = 0.42, title = 'CND' } = {}) {
  const chunks = []; let size = 0; const offsets = [];
  const push = (part) => { const b = typeof part === 'string' ? enc.encode(part) : part; chunks.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; push(`${n} 0 obj\n`); body.forEach(push); push('\nendobj\n'); };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = pages.length;
  const pageObj = (i) => 3 + i * 3;
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, [`<< /Type /Pages /Count ${n} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`]);
  pages.forEach((p, i) => {
    const w = +(p.width * pointsPerPx).toFixed(2), h = +(p.height * pointsPerPx).toFixed(2);
    const po = pageObj(i), io = po + 1, co = po + 2;
    obj(po, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${io} 0 R >> >> /Contents ${co} 0 R >>`]);
    obj(io, [`<< /Type /XObject /Subtype /Image /Width ${p.pxW} /Height ${p.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`, p.jpeg, '\nendstream']);
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`;
    obj(co, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  });
  const infoN = 3 + n * 3;
  const safe = title.replace(/[()\\]/g, '');
  obj(infoN, [`<< /Producer (CND Editor) /Title <FEFF${[...safe].map((ch) => ch.charCodeAt(0).toString(16).padStart(4, '0')).join('')}> >>`]);
  const xref = size;
  let x = `xref\n0 ${infoN + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= infoN; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  push(x);
  push(`trailer\n<< /Size ${infoN + 1} /Root 1 0 R /Info ${infoN} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: 'application/pdf' });
}
