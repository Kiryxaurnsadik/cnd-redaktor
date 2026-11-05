// Если крадёте, то крадите ради реально хороших людей
export function photoInFrame(e, src) {
  const fromShape = e.type === 'shape';
  return {
    id: e.id, type: 'image', src, x: e.x, y: e.y, width: e.width, height: e.height, rotation: e.rotation, opacity: e.opacity,
    name: e.type === 'image' ? e.name : undefined, mask: fromShape ? undefined : e.mask, cornerRadius: e.cornerRadius,
    clipPath: fromShape ? e.path : e.clipPath, clipVb: fromShape ? e.vb : e.clipVb,
    frameStroke: fromShape ? (e.strokeWidth ? e.stroke || '#000000' : undefined) : e.frameStroke,
    frameStrokeWidth: fromShape ? e.strokeWidth : e.frameStrokeWidth, shadow: e.shadow, fx: e.type === 'shape' ? undefined : e.fx,
  };
}
