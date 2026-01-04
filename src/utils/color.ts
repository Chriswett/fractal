import { ColorProfile, GradientStop, RGBA } from "../state/types";

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function sampleGradient(stops: GradientStop[], t: number): RGBA {
  if (stops.length === 0) {
    return { r: t, g: t, b: t, a: 1 };
  }

  const sorted = [...stops].sort((a, b) => a.t - b.t);
  const clampedT = clamp(t, 0, 1);

  if (clampedT <= sorted[0].t) {
    return sorted[0].color;
  }
  if (clampedT >= sorted[sorted.length - 1].t) {
    return sorted[sorted.length - 1].color;
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (clampedT >= left.t && clampedT <= right.t) {
      const localT = (clampedT - left.t) / (right.t - left.t || 1);
      return {
        r: lerp(left.color.r, right.color.r, localT),
        g: lerp(left.color.g, right.color.g, localT),
        b: lerp(left.color.b, right.color.b, localT),
        a: lerp(left.color.a, right.color.a, localT)
      };
    }
  }

  return sorted[sorted.length - 1].color;
}

export function applyColorProfile(color: RGBA, profile: ColorProfile): RGBA {
  let { r, g, b } = color;

  const exposure = profile.exposure ?? 0;
  const exposureScale = Math.pow(2, exposure);
  r *= exposureScale;
  g *= exposureScale;
  b *= exposureScale;

  const white = Math.max(profile.levels.white, 0.0001);
  const black = profile.levels.black;
  r = clamp((r - black) / (white - black));
  g = clamp((g - black) / (white - black));
  b = clamp((b - black) / (white - black));

  const gamma = Math.max(profile.gamma, 0.01);
  r = Math.pow(r, 1 / gamma);
  g = Math.pow(g, 1 / gamma);
  b = Math.pow(b, 1 / gamma);

  const saturation = profile.saturation;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  r = luma + (r - luma) * saturation;
  g = luma + (g - luma) * saturation;
  b = luma + (b - luma) * saturation;

  const [h, s, l] = rgbToHsl(clamp(r), clamp(g), clamp(b));
  const shifted = hslToRgb((h + profile.hueShift / 360) % 1, clamp(s), clamp(l));

  return { r: shifted[0], g: shifted[1], b: shifted[2], a: color.a };
}

export function rgbaToCss(color: RGBA) {
  const r = Math.round(clamp(color.r) * 255);
  const g = Math.round(clamp(color.g) * 255);
  const b = Math.round(clamp(color.b) * 255);
  return `rgba(${r}, ${g}, ${b}, ${clamp(color.a)})`;
}

export function rgbaToHex(color: RGBA) {
  const r = Math.round(clamp(color.r) * 255).toString(16).padStart(2, "0");
  const g = Math.round(clamp(color.g) * 255).toString(16).padStart(2, "0");
  const b = Math.round(clamp(color.b) * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function hexToRgba(hex: string): RGBA {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b, a: 1 };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }

  h /= 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    return [l, l, l];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    hueToRgb(p, q, h + 1 / 3),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1 / 3)
  ];
}

function hueToRgb(p: number, q: number, t: number) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}
