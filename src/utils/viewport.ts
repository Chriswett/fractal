import { Viewport } from "../state/types";

export function screenToWorld(
  viewport: Viewport,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const dx = x - width / 2;
  const dy = height / 2 - y;
  const rotation = viewport.rotation ?? 0;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rotatedX = dx * cosR - dy * sinR;
  const rotatedY = dx * sinR + dy * cosR;
  return {
    x: viewport.centerX + rotatedX * viewport.scale,
    y: viewport.centerY + rotatedY * viewport.scale
  };
}

export function panViewport(viewport: Viewport, dx: number, dy: number): Viewport {
  const rotation = viewport.rotation ?? 0;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const flippedY = -dy;
  const rotatedX = dx * cosR - flippedY * sinR;
  const rotatedY = dx * sinR + flippedY * cosR;
  return {
    ...viewport,
    centerX: viewport.centerX - rotatedX * viewport.scale,
    centerY: viewport.centerY - rotatedY * viewport.scale
  };
}

export function zoomViewport(
  viewport: Viewport,
  zoomFactor: number,
  originX: number,
  originY: number,
  width: number,
  height: number
): Viewport {
  const before = screenToWorld(viewport, originX, originY, width, height);
  const newScale = viewport.scale * zoomFactor;
  const after = screenToWorld({ ...viewport, scale: newScale }, originX, originY, width, height);
  return {
    ...viewport,
    scale: newScale,
    centerX: viewport.centerX + (before.x - after.x),
    centerY: viewport.centerY + (before.y - after.y)
  };
}

export function interpolateViewport(a: Viewport, b: Viewport, t: number): Viewport {
  const clamped = Math.min(1, Math.max(0, t));
  const logScaleA = Math.log(a.scale);
  const logScaleB = Math.log(b.scale);
  const scale = Math.exp(logScaleA + (logScaleB - logScaleA) * clamped);
  const rotationA = a.rotation ?? 0;
  const rotationB = b.rotation ?? 0;
  return {
    centerX: a.centerX + (b.centerX - a.centerX) * clamped,
    centerY: a.centerY + (b.centerY - a.centerY) * clamped,
    scale,
    rotation: rotationA + (rotationB - rotationA) * clamped
  };
}
