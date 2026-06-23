/**
 * Slide theme definitions.
 * Each theme provides a complete color palette for canvas rendering and PPTX export.
 * Colors are hex strings WITHOUT the leading '#' (for pptxgenjs compatibility).
 */

export const THEMES = {
  midnight: {
    label: 'Midnight',
    bg: '0f0f0f',
    title: 'dffdee',
    body: 'c8cdc9',
    accent: 'eccb45',
    accent2: '58d68d',
    surface: '1a1a1a',
    border: '333333',
  },
  obsidian: {
    label: 'Obsidian',
    bg: '111119',
    title: 'eef0ff',
    body: 'b0b3c5',
    accent: '7c6aef',
    accent2: 'a78bfa',
    surface: '1c1c2e',
    border: '2e2e44',
  },
  arctic: {
    label: 'Arctic',
    bg: 'f8fafc',
    title: '0f172a',
    body: '334155',
    accent: '0ea5e9',
    accent2: '06b6d4',
    surface: 'ffffff',
    border: 'e2e8f0',
  },
  forest: {
    label: 'Forest',
    bg: '0a1a0f',
    title: 'e6f5ec',
    body: 'a3c4ae',
    accent: '22c55e',
    accent2: '16a34a',
    surface: '132218',
    border: '1f3a26',
  },
  sunset: {
    label: 'Sunset',
    bg: '1a0a10',
    title: 'fde8ef',
    body: 'd4a0b0',
    accent: 'f43f5e',
    accent2: 'fb923c',
    surface: '2a1219',
    border: '3d1f28',
  },
  corporate: {
    label: 'Corporate',
    bg: '1e293b',
    title: 'f1f5f9',
    body: 'cbd5e1',
    accent: '3b82f6',
    accent2: '60a5fa',
    surface: '2d3a4f',
    border: '3b4c63',
  },
  minimal: {
    label: 'Minimal',
    bg: 'ffffff',
    title: '111111',
    body: '444444',
    accent: '111111',
    accent2: '888888',
    surface: 'f5f5f5',
    border: 'e0e0e0',
  },
  ocean: {
    label: 'Ocean',
    bg: '0c1222',
    title: 'e0f2fe',
    body: '93c5fd',
    accent: '0284c7',
    accent2: '38bdf8',
    surface: '132035',
    border: '1e3a5f',
  },
}

export const DEFAULT_THEME = 'midnight'

/**
 * Returns a theme object. Falls back to midnight if key is unknown.
 */
export function getTheme(key) {
  return THEMES[key] || THEMES.midnight
}
