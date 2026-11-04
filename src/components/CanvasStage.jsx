// Если крадёте, то крадите ради реально хороших людей
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KImage, Ellipse, Line, Group, Transformer, Path, Wedge, Arc, Circle } from 'react-konva';
import { cssFilter, gradientProps, scalePath, shadowProps } from '../lib/pathscale.js';
import { maskPath } from '../lib/elements.js';

function useImg(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) return;
    const i = new window.Image();
    if (/^https?:/.test(src)) i.crossOrigin = 'anonymous';
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);
  return img;
}

function framePath(el) {
  if (el.clipPath) return scalePath(el.clipPath, el.clipVb, el.width, el.height);
  const d = maskPath(el.mask);
  return d ? scalePath(d, [0, 0, 100, 100], el.width, el.height) : null;
}

function clipFor(el) {
  const d = framePath(el);
  if (!d) return undefined;
  return () => [new Path2D(d), 'evenodd'];
}

function frameRadius(el) {
  return el.mask === 'round' ? Math.min(el.width, el.height) * 0.12 : (el.cornerRadius || 0);
}

function FrameBorder({ el }) {
  if (!el.frameStroke || !el.frameStrokeWidth) return null;
  const d = framePath(el);
  return d
    ? <Path data={d} stroke={el.frameStroke} strokeWidth={el.frameStrokeWidth} listening={false} lineJoin="round" />
    : <Rect width={el.width} height={el.height} cornerRadius={frameRadius(el)} stroke={el.frameStroke} strokeWidth={el.frameStrokeWidth} listening={false} />;
}

function ImageEl({ el, common }) {
  const img = useImg(el.src);
  const ref = useRef(null);
  const filter = cssFilter(el.fx);
  useEffect(() => {
    const n = ref.current; if (!n || !img) return;
    if (filter) {
      const ratio = Math.max(1, Math.min(3, img.width / Math.max(1, el.width)));
      n.cache({ pixelRatio: ratio }); n.filters([filter]);
    } else { n.filters([]); n.clearCache(); }
    n.getLayer()?.batchDraw();
  }, [img, filter, el.width, el.height, el.flipX, el.flipY, el.cornerRadius]);
  const radius = frameRadius(el);
  const framed = !!clipFor(el);
  return (
    <Group {...common} {...(el.blend ? { globalCompositeOperation: el.blend } : {})}>
      <Group clipFunc={clipFor(el)}>
        <KImage ref={ref} image={img} width={el.width} height={el.height} cornerRadius={framed ? 0 : radius}
          scaleX={el.flipX ? -1 : 1} scaleY={el.flipY ? -1 : 1} x={el.flipX ? el.width : 0} y={el.flipY ? el.height : 0}
          stroke={el.strokeWidth ? el.stroke : undefined} strokeWidth={el.strokeWidth || 0} {...(framed ? {} : shadowProps(el.shadow))} />
      </Group>
      <FrameBorder el={el} />
    </Group>
  );
}

const fmt = (v) => (Math.round(v * 100) / 100).toLocaleString('ru-RU');

function ChartEl({ el, common }) {
  const W = el.width, H = el.height; const fs = el.fontSize || 22; const tc = el.textColor || '#111';
  const data = (el.data || []).filter((d) => Number.isFinite(Number(d.value)));
  const colors = el.colors?.length ? el.colors : ['#0B7CFC'];
  const col = (i) => colors[i % colors.length];
  const font = { fontFamily: el.fontFamily || 'Inter', fontSize: fs, fill: tc };
  const kids = [<Rect key="hit" width={W} height={H} fill={el.background || 'rgba(0,0,0,0)'} cornerRadius={el.background ? 16 : 0} />];
  const max = Math.max(1, ...data.map((d) => Number(d.value)));
  if (el.kind === 'pie' || el.kind === 'donut') {
    const legendH = el.showLabels ? data.length * fs * 1.5 + 10 : 0;
    const R = Math.max(10, Math.min(W, H - legendH) / 2 - 4);
    const cx = W / 2, cy = R + 4; const total = data.reduce((s, d) => s + Number(d.value), 0) || 1;
    let a0 = -90;
    data.forEach((d, i) => {
      const ang = (Number(d.value) / total) * 360;
      kids.push(el.kind === 'donut'
        ? <Arc key={`s${i}`} x={cx} y={cy} innerRadius={R * 0.58} outerRadius={R} angle={ang} rotation={a0} fill={col(i)} />
        : <Wedge key={`s${i}`} x={cx} y={cy} radius={R} angle={ang} rotation={a0} fill={col(i)} stroke={el.background || '#fff'} strokeWidth={2} />);
      if (el.showValues && ang > 14) {
        const mid = ((a0 + ang / 2) * Math.PI) / 180; const rr = el.kind === 'donut' ? R * 0.79 : R * 0.62;
        kids.push(<Text key={`v${i}`} x={cx + Math.cos(mid) * rr - 60} y={cy + Math.sin(mid) * rr - fs / 2} width={120} align="center"
          text={`${Math.round((Number(d.value) / total) * 100)}%`} {...font} fill="#fff" fontStyle="bold" />);
      }
      a0 += ang;
    });
    if (el.showLabels) data.forEach((d, i) => {
      const y = cy + R + 14 + i * fs * 1.5;
      kids.push(<Rect key={`lc${i}`} x={W * 0.18} y={y + fs * 0.15} width={fs * 0.8} height={fs * 0.8} cornerRadius={3} fill={col(i)} />);
      kids.push(<Text key={`lt${i}`} x={W * 0.18 + fs * 1.2} y={y} width={W * 0.7} text={`${d.label} — ${fmt(Number(d.value))}`} {...font} />);
    });
  } else if (el.kind === 'progress') {
    const v = Math.max(0, Math.min(100, Number(data[0]?.value) || 0)); const th = Math.max(12, H * 0.42);
    const ty = el.showLabels ? H - th : (H - th) / 2;
    if (el.showLabels) kids.push(<Text key="l" x={0} y={0} width={W * 0.7} text={data[0]?.label || ''} {...font} />);
    if (el.showValues) kids.push(<Text key="v" x={W * 0.3} y={0} width={W * 0.7} align="right" text={`${fmt(v)}%`} {...font} fontStyle="bold" />);
    kids.push(<Rect key="t" y={ty} width={W} height={th} cornerRadius={th / 2} fill={el.gridColor || '#D8DEE8'} />);
    kids.push(<Rect key="f" y={ty} width={Math.max(th, (W * v) / 100)} height={th} cornerRadius={th / 2} fill={col(0)} />);
  } else if (el.kind === 'bar') {
    const labW = el.showLabels ? W * 0.36 : 0; const valW = el.showValues ? fs * 3 : 0;
    const slot = H / Math.max(1, data.length); const bh = slot * 0.64;
    data.forEach((d, i) => {
      const y = i * slot + (slot - bh) / 2; const bw = ((W - labW - valW) * Number(d.value)) / max;
      if (el.showLabels) kids.push(<Text key={`l${i}`} x={0} y={y} width={labW - 10} height={bh} verticalAlign="middle" align="right" text={d.label} {...font} />);
      kids.push(<Rect key={`b${i}`} x={labW} y={y} width={Math.max(2, bw)} height={bh} cornerRadius={Math.min(8, bh / 4)} fill={col(i)} />);
      if (el.showValues) kids.push(<Text key={`v${i}`} x={labW + bw + 8} y={y} height={bh} verticalAlign="middle" text={fmt(Number(d.value))} {...font} fontStyle="bold" />);
    });
  } else {
    const labH = el.showLabels ? fs * 1.7 : 0; const top = el.showValues ? fs * 1.5 : 4;
    const ph = H - labH - top; const slot = W / Math.max(1, data.length);
    for (let g = 0; g <= 4; g++) {
      const y = top + ph - (ph * g) / 4;
      kids.push(<Line key={`g${g}`} points={[0, y, W, y]} stroke={el.gridColor || '#D8DEE8'} strokeWidth={g === 0 ? 2 : 1} />);
    }
    const vals = data.map((d) => Number(d.value)); const mn = Math.min(...vals);
    const lo = (el.kind === 'line' || el.kind === 'area') && mn > 0 ? Math.max(0, mn - (max - mn) * 0.6) : 0;
    const pts = data.map((d, i) => [i * slot + slot / 2, top + ph - (ph * (Number(d.value) - lo)) / Math.max(1e-9, max - lo)]);
    if (el.kind === 'line' || el.kind === 'area') {
      if (el.kind === 'area' && pts.length) kids.push(<Line key="area" points={[pts[0][0], top + ph, ...pts.flat(), pts[pts.length - 1][0], top + ph]} closed fill={col(0)} opacity={0.25} />);
      kids.push(<Line key="ln" points={pts.flat()} stroke={col(0)} strokeWidth={Math.max(3, fs / 5)} lineJoin="round" lineCap="round" tension={0.25} />);
      pts.forEach(([x, y], i) => kids.push(<Circle key={`p${i}`} x={x} y={y} radius={Math.max(5, fs / 3.5)} fill="#fff" stroke={col(0)} strokeWidth={3} />));
    } else {
      const bw = slot * 0.62;
      pts.forEach(([x, y], i) => kids.push(<Rect key={`b${i}`} x={x - bw / 2} y={y} width={bw} height={top + ph - y} cornerRadius={[Math.min(8, bw / 4), Math.min(8, bw / 4), 0, 0]} fill={col(i)} />));
    }
    data.forEach((d, i) => {
      const [x, y] = pts[i];
      if (el.showValues) kids.push(<Text key={`v${i}`} x={x - slot / 2} y={y - fs * 1.35} width={slot} align="center" text={fmt(Number(d.value))} {...font} fontStyle="bold" />);
      if (el.showLabels) kids.push(<Text key={`l${i}`} x={x - slot / 2} y={top + ph + fs * 0.4} width={slot} align="center" text={d.label} {...font} />);
    });
  }
  return <Group {...common}>{kids}</Group>;
}

function TableEl({ el, common }) {
  const rows = el.cells || [[]]; const R = rows.length; const C = Math.max(1, ...rows.map((r) => r.length));
  const cw = el.width / C, rh = el.height / Math.max(1, R); const fs = el.fontSize || 24;
  const kids = [];
  rows.forEach((row, r) => {
    const head = el.header && r === 0;
    for (let c = 0; c < C; c++) {
      const fill = head ? el.head : r % 2 ? el.row : el.alt;
      kids.push(<Rect key={`r${r}-${c}`} x={c * cw} y={r * rh} width={cw} height={rh} fill={fill} stroke={el.line} strokeWidth={1.5} />);
      kids.push(<Text key={`t${r}-${c}`} x={c * cw + 12} y={r * rh} width={cw - 24} height={rh} verticalAlign="middle"
        align={c === 0 ? 'left' : el.align || 'center'} text={String(row[c] ?? '')} fontFamily={el.fontFamily || 'Inter'} fontSize={fs}
        fontStyle={head ? 'bold' : 'normal'} fill={head ? el.headText : el.text} wrap="word" ellipsis />);
    }
  });
  return <Group {...common}>{kids}</Group>;
}

const SNAP = 8;

const CanvasStage = forwardRef(function CanvasStage(
  { doc, scale, selectedId, onSelect, onChange, onEditText, editingId, fontTick }, ref,
) {
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const uiRef = useRef(null);
  const [guides, setGuides] = useState([]);

  useImperativeHandle(ref, () => ({
    stage: () => stageRef.current,
    toCanvas(mult = 1) {
      const ui = uiRef.current; ui.hide();
      const hints = stageRef.current.find('.ph-ui'); hints.forEach((n) => n.hide());
      const c = stageRef.current.toCanvas({ pixelRatio: mult / scale });
      hints.forEach((n) => n.show()); ui.show();
      return c;
    },
    toThumb(maxSide = 360) {
      const ui = uiRef.current; ui.hide();
      const k = maxSide / (Math.max(doc.width, doc.height) * scale);
      const url = stageRef.current.toDataURL({ pixelRatio: k, mimeType: 'image/jpeg', quality: 0.7 });
      ui.show();
      return url;
    },
    elementAt(clientX, clientY) {
      const st = stageRef.current; const box = st.container().getBoundingClientRect();
      const shape = st.getIntersection({ x: clientX - box.left, y: clientY - box.top });
      if (!shape) return null;
      let n = shape; while (n && !n.id()) n = n.getParent();
      return n?.id() || null;
    },
  }));

  useEffect(() => {
    const tr = trRef.current; if (!tr) return;
    const el = doc.elements.find((e) => e.id === selectedId);
    const node = selectedId && !el?.locked && editingId !== selectedId ? stageRef.current.findOne(`#${selectedId}`) : null;
    tr.nodes(node ? [node] : []);
    if (el?.type === 'text') tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']);
    else if (el?.type === 'line') tr.enabledAnchors(['middle-left', 'middle-right']);
    else tr.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']);
    tr.keepRatio(el?.type === 'image' || (el?.type === 'shape' && el?.keepRatio));
    tr.getLayer().batchDraw();
  }, [selectedId, doc, editingId, scale]);

  useEffect(() => { stageRef.current?.find('Text').forEach((t) => t._setTextData?.()); stageRef.current?.batchDraw(); }, [fontTick]);

  const snapDrag = (e) => {
    const node = e.target; const box = node.getClientRect({ relativeTo: node.getLayer() });
    const W = doc.width, H = doc.height, t = SNAP / scale;
    const lines = [];
    const vx = [0, W / 2, W]; const hy = [0, H / 2, H];
    const edgesX = [box.x, box.x + box.width / 2, box.x + box.width];
    const edgesY = [box.y, box.y + box.height / 2, box.y + box.height];
    let dx = 0, dy = 0;
    vx.forEach((g) => edgesX.forEach((ex) => { if (!dx && Math.abs(ex - g) < t) { dx = g - ex; lines.push({ v: true, p: g }); } }));
    hy.forEach((g) => edgesY.forEach((ey) => { if (!dy && Math.abs(ey - g) < t) { dy = g - ey; lines.push({ v: false, p: g }); } }));
    node.x(node.x() + dx); node.y(node.y() + dy);
    setGuides(lines);
  };

  const render = (el) => {
    if (el.visible === false) return null;
    const common = {
      id: el.id, key: el.id, x: el.x, y: el.y, rotation: el.rotation || 0, opacity: el.opacity ?? 1,
      ...(el.blend && el.type !== 'image' ? { globalCompositeOperation: el.blend } : {}),
      draggable: !el.locked,
      onMouseDown: () => onSelect(el.id), onTap: () => onSelect(el.id),
      onDragMove: snapDrag,
      onDragEnd: (e) => { setGuides([]); onChange(el.id, { x: e.target.x(), y: e.target.y() }); },
      onTransformEnd: (e) => {
        const n = e.target; const sx = n.scaleX(), sy = n.scaleY();
        n.scaleX(1); n.scaleY(1);
        const patch = { x: n.x(), y: n.y(), rotation: n.rotation() };
        if (el.type === 'text') {
          const corner = Math.abs(sx - sy) < 0.001;
          patch.width = Math.max(20, el.width * sx);
          if (corner) patch.fontSize = Math.max(6, Math.round(el.fontSize * sy * 10) / 10);
        } else if (el.type === 'line') {
          patch.points = [0, 0, Math.max(10, el.points[2] * sx), 0];
        } else if (el.type === 'table' && Math.abs(sx - sy) < 0.001) {
          patch.width = Math.max(40, el.width * sx); patch.height = Math.max(20, el.height * sy);
          patch.fontSize = Math.max(8, Math.round((el.fontSize || 24) * sy));
        } else {
          patch.width = Math.max(4, el.width * sx); patch.height = Math.max(4, el.height * sy);
        }
        onChange(el.id, patch);
      },
    };
    const sh = shadowProps(el.shadow);
    switch (el.type) {
      case 'text':
        return <Text {...common} text={el.text} width={el.width} fontSize={el.fontSize} fontFamily={el.fontFamily}
          fontStyle={el.fontStyle || 'normal'} fill={el.fill} align={el.align} lineHeight={el.lineHeight || 1.2}
          letterSpacing={el.letterSpacing || 0} textDecoration={el.textDecoration || ''} wrap="word"
          stroke={el.textStroke || undefined} strokeWidth={el.textStroke ? el.textStrokeWidth || 2 : 0} fillAfterStrokeEnabled
          visible={editingId !== el.id} onDblClick={() => onEditText(el.id)} onDblTap={() => onEditText(el.id)} {...sh} />;
      case 'rect':
        return <Rect {...common} width={el.width} height={el.height} fill={el.fill} cornerRadius={el.cornerRadius || 0}
          stroke={el.stroke} strokeWidth={el.strokeWidth || 0} {...gradientProps(el.gradient, el.width, el.height)} {...sh} />;
      case 'ellipse':
        return <Ellipse {...common} radiusX={el.width / 2} radiusY={el.height / 2} offsetX={-el.width / 2} offsetY={-el.height / 2}
          fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} {...gradientProps(el.gradient, el.width, el.height, true)} {...sh} />;
      case 'shape': {
        const data = scalePath(el.path, el.vb, el.width, el.height, el.flipX, el.flipY);
        return el.outline
          ? <Path {...common} data={data} stroke={el.fill} strokeWidth={el.strokeWidth || 4} lineCap="round" lineJoin="round" hitStrokeWidth={Math.max(16, el.strokeWidth || 4)} {...sh} />
          : <Path {...common} data={data} fill={el.fill} fillRule="evenodd" stroke={el.strokeWidth ? el.stroke || '#000000' : undefined} strokeWidth={el.strokeWidth || 0}
            {...gradientProps(el.gradient, el.width, el.height)} {...sh} />;
      }
      case 'chart':
        return <ChartEl key={el.id} el={el} common={common} />;
      case 'table':
        return <TableEl key={el.id} el={el} common={common} />;
      case 'line':
        return <Line {...common} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} hitStrokeWidth={20} lineCap="round" dash={el.dash ? [el.strokeWidth * 3, el.strokeWidth * 2] : undefined} {...sh} />;
      case 'image':
        return <ImageEl key={el.id} el={el} common={common} />;
      case 'placeholder':
        return (
          <Group {...common}>
            <Group clipFunc={clipFor(el)}>
              <Rect width={el.width} height={el.height} fill={el.fill} cornerRadius={frameRadius(el)} />
              <Rect name="ph-ui" width={el.width} height={el.height} stroke="#ffffff" strokeWidth={2 / scale} dash={[10 / scale, 8 / scale]} opacity={0.7} listening={false} />
              <Text name="ph-ui" width={el.width} height={el.height} text={`🖼  ${el.label || 'Перетащите фото'}`} align="center" verticalAlign="middle"
                fontSize={Math.max(14, Math.min(el.width, el.height) / 14)} fill="#ffffff" opacity={0.9} fontFamily="Inter" listening={false} />
            </Group>
            <FrameBorder el={el} />
          </Group>

        );
      default:
        return null;
    }
  };

  return (
    <Stage ref={stageRef} width={doc.width * scale} height={doc.height * scale} scaleX={scale} scaleY={scale}
      onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'page-bg') onSelect(null); }}
      onTouchStart={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'page-bg') onSelect(null); }}>
      <Layer>
        <Rect name="page-bg" x={0} y={0} width={doc.width} height={doc.height} fill={doc.background || '#fff'} />
        {doc.elements.map(render)}
      </Layer>
      <Layer ref={uiRef}>
        {guides.map((g, i) => (
          <Line key={i} points={g.v ? [g.p, 0, g.p, doc.height] : [0, g.p, doc.width, g.p]} stroke="#ff2d87" strokeWidth={1 / scale} dash={[4 / scale, 4 / scale]} listening={false} />
        ))}
        <Transformer ref={trRef} rotateEnabled anchorSize={10} borderStroke="#0B7CFC" anchorStroke="#0B7CFC" anchorCornerRadius={5}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)} />
      </Layer>
    </Stage>
  );
});

export default CanvasStage;
