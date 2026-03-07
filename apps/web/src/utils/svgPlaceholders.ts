/**
 * SVG Placeholder Generator
 * Generates inline SVG data URIs for visual question types.
 * Will be replaced by real images later.
 */

const COLORS = {
  bg: '#2c2f35',
  fg: '#e5a63e',
  muted: '#6b6660',
  accent: '#e5a63e',
  surface: '#3a3d44',
  text: '#ede9e3',
};

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/** Simple icon placeholder with emoji-like symbol and label */
export function generatePlaceholder(label: string, emoji: string, seed = 0): string {
  const hue = (seed * 67 + 180) % 360;
  const bg = `hsl(${hue}, 15%, 18%)`;
  const accent = `hsl(${hue}, 50%, 55%)`;
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="16" fill="${bg}"/>
      <rect x="8" y="8" width="184" height="184" rx="12" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="8 4" opacity="0.4"/>
      <text x="100" y="95" text-anchor="middle" font-size="52">${emoji}</text>
      <text x="100" y="140" text-anchor="middle" font-family="sans-serif" font-size="13" fill="${COLORS.text}" opacity="0.7">${label}</text>
    </svg>
  `);
}

/** Rebus clue card */
export function generateRebusClue(emoji: string, label: string, index: number): string {
  const hues = [30, 200, 340, 120, 270];
  const hue = hues[index % hues.length]!;
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="12" fill="hsl(${hue}, 12%, 20%)"/>
      <text x="60" y="55" text-anchor="middle" font-size="40">${emoji}</text>
      <text x="60" y="90" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${COLORS.text}" opacity="0.6">${label}</text>
    </svg>
  `);
}

/** Four images grid item */
export function generateFourImageItem(emoji: string, label: string, index: number): string {
  const angles = [0, 90, 180, 270];
  const angle = angles[index % 4]!;
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <defs>
        <linearGradient id="g${index}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${angle}, 15%, 22%)"/>
          <stop offset="100%" stop-color="hsl(${(angle + 40) % 360}, 15%, 16%)"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="14" fill="url(#g${index})"/>
      <text x="80" y="75" text-anchor="middle" font-size="48">${emoji}</text>
      <text x="80" y="115" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${COLORS.text}" opacity="0.5">${label}</text>
    </svg>
  `);
}

/** Silhouette placeholder — dark shape on darker bg */
export function generateSilhouette(shape: string, label: string): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="16" fill="#141618"/>
      <text x="100" y="100" text-anchor="middle" font-size="72" opacity="0.85">${shape}</text>
      <text x="100" y="160" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${COLORS.muted}">${label}</text>
    </svg>
  `);
}

/** Blind test — blurred placeholder */
export function generateBlindTest(emoji: string, label: string): string {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
      </defs>
      <rect width="240" height="200" rx="16" fill="#1a1c20"/>
      <g filter="url(#blur)">
        <text x="120" y="100" text-anchor="middle" font-size="64">${emoji}</text>
      </g>
      <text x="120" y="170" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${COLORS.muted}">${label}</text>
    </svg>
  `);
}

/** Geo map — simplified region outline */
export function generateGeoMap(region: string): string {
  // Simplified outlines per region
  const paths: Record<string, string> = {
    europe: 'M80,40 L120,35 L150,50 L160,80 L140,120 L100,130 L70,110 L50,80 L60,50 Z',
    france: 'M80,30 L130,40 L140,80 L120,130 L80,140 L50,110 L40,70 L60,40 Z',
    world: 'M20,80 Q60,30 100,60 Q140,30 180,80 Q160,140 100,150 Q40,140 20,80 Z',
    africa: 'M80,20 L120,30 L140,80 L130,140 L100,170 L70,150 L60,100 L65,50 Z',
    asia: 'M60,30 L150,25 L170,80 L140,140 L80,150 L40,110 L50,60 Z',
  };
  const path = paths[region] ?? paths['world']!;
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" width="200" height="180">
      <rect width="200" height="180" rx="16" fill="#141820"/>
      <path d="${path}" fill="none" stroke="${COLORS.accent}" stroke-width="2" opacity="0.6"/>
      <circle cx="100" cy="90" r="4" fill="${COLORS.fg}"/>
      <text x="100" y="165" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${COLORS.muted}">📍 ${region}</text>
    </svg>
  `);
}

/** Intruder item card */
export function generateIntruderItem(emoji: string, label: string, index: number): string {
  return generateFourImageItem(emoji, label, index);
}
