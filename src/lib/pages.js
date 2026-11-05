// Если крадёте, то крадите ради реально хороших людей
import { uid } from './util.js';

export const pageCount = (d) => Math.max(1, d?.pages?.length || 1);
export const pageIndex = (d) => Math.min(pageCount(d) - 1, Math.max(0, d?.page || 0));

const strip = (p) => ({ id: p.id || uid(), name: p.name, background: p.background, gradient: p.gradient, elements: p.elements || [] });

export function allPages(d) {
  const cur = { id: d.pageId, name: d.pageName, background: d.background, gradient: d.gradient, elements: d.elements };
  if (!d.pages?.length) return [strip(cur)];
  const out = d.pages.map(strip);
  const i = pageIndex(d);
  out[i] = strip({ ...out[i], background: d.background, gradient: d.gradient, elements: d.elements });
  return out;
}

export function withPages(d, pages, i) {
  const k = Math.min(pages.length - 1, Math.max(0, i));
  const pg = pages[k];
  const next = { ...d, background: pg.background, gradient: pg.gradient, elements: pg.elements, pageId: pg.id, pageName: pg.name };
  if (pages.length > 1) { next.pages = pages; next.page = k; } else { delete next.pages; delete next.page; }
  return next;
}

export function pageDoc(d, i) {
  const pages = allPages(d);
  const p = pages[i] || pages[0];
  return { width: d.width, height: d.height, background: p.background, gradient: p.gradient, elements: p.elements, pageNo: i + 1, pageTotal: pages.length };
}

const cloneEls = (els) => {
  const map = {};
  return els.map((e) => {
    const c = { ...structuredClone(e), id: uid() };
    if (e.groupId) { map[e.groupId] ||= uid(); c.groupId = map[e.groupId]; }
    return c;
  });
};

export const goPage = (d, i) => withPages(d, allPages(d), i);

export function addPage(d, after = pageIndex(d), copy = false) {
  const pages = allPages(d);
  const src = pages[after];
  const page = copy
    ? { id: uid(), name: src.name, background: src.background, gradient: src.gradient ? { ...src.gradient } : undefined, elements: cloneEls(src.elements) }
    : { id: uid(), background: src.background || '#FFFFFF', gradient: undefined, elements: cloneEls(src.elements.filter((e) => e.keep)) };
  pages.splice(after + 1, 0, page);
  return withPages(d, pages, after + 1);
}

export function removePage(d, i = pageIndex(d)) {
  const pages = allPages(d);
  if (pages.length < 2) return d;
  pages.splice(i, 1);
  return withPages(d, pages, Math.min(i, pages.length - 1));
}

export function movePage(d, from, to) {
  const pages = allPages(d);
  if (to < 0 || to >= pages.length) return d;
  const [p] = pages.splice(from, 1);
  pages.splice(to, 0, p);
  const cur = pageIndex(d);
  const curId = allPages(d)[cur].id;
  return withPages(d, pages, pages.findIndex((x) => x.id === curId));
}

export function applyToAllPages(d, fn) {
  const pages = allPages(d).map((p, i) => fn(p, i));
  return withPages(d, pages, pageIndex(d));
}

const pad2 = (n) => String(n).padStart(2, '0');
export function resolveText(el, pageNo = 1, pageTotal = 1) {
  if (!el.auto) return el.text;
  return String(el.text || '{nn}').replace(/\{nn\}/gi, pad2(pageNo)).replace(/\{n\}/gi, String(pageNo)).replace(/\{total\}/gi, String(pageTotal));
}

export function docWithIds(doc) {
  const pages = allPages(doc).map((p) => ({ ...p, id: uid(), elements: p.elements.map((e) => ({ ...e, id: uid() })) }));
  return withPages({ ...doc }, pages, 0);
}
