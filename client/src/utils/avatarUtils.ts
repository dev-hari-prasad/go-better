export type AvatarStyleId =
  | 'gradient-smooth'
  | 'pixel-grid'
  | 'retro-rings'
  | 'mesh-aura'
  | 'geometric-cross'
  | 'glass-prism';

export interface AvatarStyleDef {
  id: AvatarStyleId;
  name: string;
  description: string;
}

export const AVATAR_STYLES: AvatarStyleDef[] = [
  {
    id: 'gradient-smooth',
    name: 'Aurora Gradient',
    description: 'Vibrant smooth gradient blending primary and accent tones',
  },
  {
    id: 'pixel-grid',
    name: 'Dither Matrix',
    description: 'Halftone dithered pixel matrix with glowing backdrop',
  },
  {
    id: 'retro-rings',
    name: 'Concentric Radar',
    description: 'Concentric orbital rings and radar tech rings',
  },
  {
    id: 'mesh-aura',
    name: 'Radial Mesh',
    description: 'Multi-node glowing aura mesh with soft illumination',
  },
  {
    id: 'geometric-cross',
    name: 'Digital Grid',
    description: 'Micro cross-grid matrix pattern for crypto & cyber aesthetic',
  },
  {
    id: 'glass-prism',
    name: 'Prism Refraction',
    description: 'Angular refractive glass highlight and split gradient',
  },
];

export interface ColorPalette {
  name: string;
  from: string;
  to: string;
  accent: string;
  patternFill: string;
  textColor: string;
  ringColor: string;
}

/**
 * Deterministically get avatar initials from a full name:
 * - If 2+ words: First letter of word 1 + first letter of word 2
 * - If 1 word: First letter of word
 */
export function getAvatarInitials(name: string): string {
  if (!name || !name.trim()) return 'GB';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 1).toUpperCase();
}

/**
 * Deterministically pick a curated color palette based on first letter range:
 * - A - D: Aurora Volt (Indigo -> Volt Green)
 * - E - H: Electric Cyan (Ocean -> Neon Cyan)
 * - I - L: Cyber Sunset (Fuchsia -> Amber Gold)
 * - M - P: Hyper Coral (Crimson -> Tangerine)
 * - Q - T: Emerald Mint (Forest -> Lime Mint)
 * - U - W: Cosmic Violet (Royal Violet -> Sky Blue)
 * - X - Z: Titanium Prism (Slate -> Silver Platinum)
 */
export function getAvatarPalette(name: string): ColorPalette {
  const initial = (name.trim()[0] || 'A').toUpperCase();
  const code = initial.charCodeAt(0);

  // A - D (65 - 68)
  if (code >= 65 && code <= 68) {
    return {
      name: 'Aurora Volt',
      from: '#4338ca',
      to: '#c0f200',
      accent: '#a3e635',
      patternFill: 'rgba(255, 255, 255, 0.45)',
      textColor: '#000000',
      ringColor: '#c0f200',
    };
  }

  // E - H (69 - 72)
  if (code >= 69 && code <= 72) {
    return {
      name: 'Electric Cyan',
      from: '#0369a1',
      to: '#38bdf8',
      accent: '#7dd3fc',
      patternFill: 'rgba(255, 255, 255, 0.5)',
      textColor: '#000000',
      ringColor: '#38bdf8',
    };
  }

  // I - L (73 - 76)
  if (code >= 73 && code <= 76) {
    return {
      name: 'Cyber Sunset',
      from: '#c026d3',
      to: '#fbbf24',
      accent: '#f472b6',
      patternFill: 'rgba(255, 255, 255, 0.45)',
      textColor: '#000000',
      ringColor: '#fbbf24',
    };
  }

  // M - P (77 - 80)
  if (code >= 77 && code <= 80) {
    return {
      name: 'Hyper Coral',
      from: '#e11d48',
      to: '#fb923c',
      accent: '#fda4af',
      patternFill: 'rgba(255, 255, 255, 0.45)',
      textColor: '#000000',
      ringColor: '#fb923c',
    };
  }

  // Q - T (81 - 84)
  if (code >= 81 && code <= 84) {
    return {
      name: 'Emerald Mint',
      from: '#047857',
      to: '#4ade80',
      accent: '#86efac',
      patternFill: 'rgba(255, 255, 255, 0.5)',
      textColor: '#000000',
      ringColor: '#4ade80',
    };
  }

  // U - W (85 - 87)
  if (code >= 85 && code <= 87) {
    return {
      name: 'Cosmic Violet',
      from: '#6d28d9',
      to: '#818cf8',
      accent: '#c084fc',
      patternFill: 'rgba(255, 255, 255, 0.4)',
      textColor: '#ffffff',
      ringColor: '#c084fc',
    };
  }

  // X - Z and others
  return {
    name: 'Titanium Prism',
    from: '#0f172a',
    to: '#94a3b8',
    accent: '#c0f200',
    patternFill: 'rgba(192, 242, 0, 0.45)',
    textColor: '#ffffff',
    ringColor: '#c0f200',
  };
}
