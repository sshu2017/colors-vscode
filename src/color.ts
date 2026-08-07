export interface WindowPalette {
  activityBar: string;
  titleBar: string;
  titleForeground: string;
}

export type Theme = 'dark' | 'light';

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number): string =>
    Math.round((v + m) * 255).toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function paletteFor(hue: number, theme: Theme): WindowPalette {
  if (theme === 'light') {
    return {
      activityBar: hslToHex(hue, 0.5, 0.8),
      titleBar: hslToHex(hue, 0.5, 0.72),
      titleForeground: '#1f1f1f',
    };
  }
  return {
    activityBar: hslToHex(hue, 0.55, 0.33),
    titleBar: hslToHex(hue, 0.55, 0.42),
    titleForeground: '#f3f3f3',
  };
}

export function randomHue(): number {
  return Math.floor(Math.random() * 360);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

function rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

// Extract the hue from an existing color so a folder keeps its color family
// when the dark/light theme changes.
export function hueFromHex(hex: string): number | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb).h : null;
}
