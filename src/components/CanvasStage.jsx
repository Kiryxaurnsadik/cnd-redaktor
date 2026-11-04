import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KImage, Ellipse, Line, Group, Transformer } from 'react-konva';

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

function ImageEl({ el, common }) {
  const img = useImg(el.src);
  return <KImage {...common} image={img} width={el.width} height={el.height} />;
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
    // Снимок холста в реальном размере без рамки выделения
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
    tr.keepRatio(el?.type === 'image');
    tr.getLayer().batchDraw();
  }, [selectedId, doc, editingId, scale]);

  // Перерисовка, когда догрузились шрифты
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
        } else {
          patch.width = Math.max(4, el.width * sx); patch.height = Math.max(4, el.height * sy);
        }
        onChange(el.id, patch);
      },
    };
    switch (el.type) {
      case 'text':
        return <Text {...common} text={el.text} width={el.width} fontSize={el.fontSize} fontFamily={el.fontFamily}
          fontStyle={el.fontStyle || 'normal'} fill={el.fill} align={el.align} lineHeight={el.lineHeight || 1.2}
          letterSpacing={el.letterSpacing || 0} textDecoration={el.textDecoration || ''} wrap="word"
          visible={editingId !== el.id} onDblClick={() => onEditText(el.id)} onDblTap={() => onEditText(el.id)}
          shadowColor={el.shadow ? '#000' : undefined} shadowBlur={el.shadow ? 12 : 0} shadowOpacity={el.shadow ? 0.6 : 0} />;
      case 'rect':
        return <Rect {...common} width={el.width} height={el.height} fill={el.fill} cornerRadius={el.cornerRadius || 0}
          stroke={el.stroke} strokeWidth={el.strokeWidth || 0} />;
      case 'ellipse':
        return <Ellipse {...common} radiusX={el.width / 2} radiusY={el.height / 2} offsetX={-el.width / 2} offsetY={-el.height / 2}
          fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} />;
      case 'line':
        return <Line {...common} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} hitStrokeWidth={20} lineCap="round" dash={el.dash ? [el.strokeWidth * 3, el.strokeWidth * 2] : undefined} />;
      case 'image':
        return <ImageEl key={el.id} el={el} common={common} />;
      case 'placeholder':
        return (
          <Group {...common}>
            <Rect width={el.width} height={el.height} fill={el.fill} cornerRadius={el.cornerRadius || 0} />
            <Rect name="ph-ui" width={el.width} height={el.height} stroke="#ffffff" strokeWidth={2 / scale} dash={[10 / scale, 8 / scale]} opacity={0.7} listening={false} />
            <Text name="ph-ui" width={el.width} height={el.height} text={`🖼  ${el.label || 'Перетащите фото'}`} align="center" verticalAlign="middle"
              fontSize={Math.max(14, Math.min(el.width, el.height) / 14)} fill="#ffffff" opacity={0.9} fontFamily="Inter" listening={false} />
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
