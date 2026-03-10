/**
 * Dynamic theming based on mesocycle week position.
 * Returns CSS custom property overrides that shift the color palette
 * from cool/calm (early weeks) → intense/warm (peak) → soft/recovery (deload).
 */

export interface MesoThemeVars {
  '--primary': string;
  '--accent': string;
  '--ring': string;
  '--chart-1': string;
  '--background': string;
  '--card': string;
  '--secondary': string;
  '--muted': string;
  '--border': string;
  '--input': string;
}

interface WeekInfo {
  weekNumber: number;
  totalWeeks: number;
  isDeload: boolean;
  isInMeso: boolean;
}

// Color stops across mesocycle (HSL hue values)
// Week 1: Teal/Cyan (180°) — fresh start
// Mid: Green (142°) — building
// Peak: Amber/Orange (30°) — max intensity  
// Deload: Lavender (260°) — recovery

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getMesoTheme(weekInfo: WeekInfo | null): Record<string, string> | null {
  if (!weekInfo || !weekInfo.isInMeso) return null;

  const { weekNumber, totalWeeks, isDeload } = weekInfo;

  if (isDeload) {
    // Recovery: soft lavender/purple tones
    return {
      '--primary': '260 45% 55%',
      '--accent': '260 45% 55%',
      '--ring': '260 45% 55%',
      '--chart-1': '260 45% 55%',
      '--background': '260 20% 7%',
      '--card': '260 18% 10%',
      '--secondary': '260 16% 16%',
      '--muted': '260 14% 14%',
      '--border': '260 14% 18%',
      '--input': '260 14% 18%',
      '--sidebar-background': '260 18% 10%',
      '--sidebar-primary': '260 45% 55%',
      '--sidebar-accent': '260 16% 16%',
      '--sidebar-border': '260 14% 18%',
      '--sidebar-ring': '260 45% 55%',
    };
  }

  // Training weeks: progress from 0 (week 1) to 1 (peak week = totalWeeks - 1)
  const trainingWeeks = totalWeeks - 1; // last week is deload
  const t = trainingWeeks > 1 ? (weekNumber - 1) / (trainingWeeks - 1) : 0;

  // Hue: 180 (teal) → 142 (green) → 30 (amber)
  let hue: number;
  if (t < 0.5) {
    // First half: teal → green
    hue = lerp(180, 142, t * 2);
  } else {
    // Second half: green → amber
    hue = lerp(142, 30, (t - 0.5) * 2);
  }

  // Saturation increases with intensity
  const sat = lerp(50, 80, t);
  // Lightness stays roughly constant
  const light = lerp(45, 50, t);

  // Background gets subtly warmer
  const bgHue = lerp(220, Math.round(hue * 0.3 + 220 * 0.7), t);

  const primaryHsl = `${Math.round(hue)} ${Math.round(sat)}% ${Math.round(light)}%`;
  const bgHsl = `${Math.round(bgHue)} 20% 7%`;
  const cardHsl = `${Math.round(bgHue)} 18% 10%`;
  const secHsl = `${Math.round(bgHue)} 16% 16%`;
  const mutHsl = `${Math.round(bgHue)} 14% 14%`;
  const bordHsl = `${Math.round(bgHue)} 14% 18%`;

  return {
    '--primary': primaryHsl,
    '--accent': primaryHsl,
    '--ring': primaryHsl,
    '--chart-1': primaryHsl,
    '--background': bgHsl,
    '--card': cardHsl,
    '--secondary': secHsl,
    '--muted': mutHsl,
    '--border': bordHsl,
    '--input': bordHsl,
    '--sidebar-background': cardHsl,
    '--sidebar-primary': primaryHsl,
    '--sidebar-accent': secHsl,
    '--sidebar-border': bordHsl,
    '--sidebar-ring': primaryHsl,
  };
}
