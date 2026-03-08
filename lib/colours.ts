const DEFAULT_COLOUR_HEX: Record<string, string> = {
  orange: '#f97316',
  pink: '#ec4899',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  teal: '#14b8a6',
  grey: '#6b7280',
  gray: '#6b7280',
};

export function normaliseColourLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function colourLabelToHex(label: string): string {
  const normalised = normaliseColourLabel(label);
  return DEFAULT_COLOUR_HEX[normalised] ?? '#6b7280';
}

export const DEFAULT_TARGET_RUNS = [
  { colour_label: 'Orange', display_name: 'Orange run', colour_hex: colourLabelToHex('orange') },
  { colour_label: 'Pink', display_name: 'Pink run', colour_hex: colourLabelToHex('pink') },
];
