/**
 * Image Library — Centralized mapping of image keys to URLs.
 *
 * HOW TO EDIT:
 * 1. Find the key you want to change (e.g. 'flame', 'cat', 'eiffel_tower')
 * 2. Replace the `url` with your own image URL
 * 3. Optionally update `credit` for attribution
 *
 * All question JSON files reference images by key (e.g. "svg": "flame").
 * This library resolves those keys to actual image URLs.
 *
 * Recommended image sources:
 * - Unsplash: https://unsplash.com (use ?w=400 for thumbnails)
 * - Wikimedia Commons: https://commons.wikimedia.org
 * - Pixabay: https://pixabay.com
 * - Pexels: https://www.pexels.com
 */

export interface ImageEntry {
  url: string;
  credit?: string;
}

// ─── FOUR IMAGES ────────────────────────────────────────────────────────────
// Used by: FourImagesRenderer, questions_four_images.json

const fourImages: Record<string, ImageEntry> = {
  // Feu
  flame: {
    url: 'https://images.unsplash.com/photo-1487260211189-670c54da558d?w=400',
    credit: 'Unsplash',
  },
  firefighter: {
    url: 'https://images.unsplash.com/photo-1586191582117-69c4de58a031?w=400',
    credit: 'Unsplash',
  },
  fireplace: {
    url: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=400',
    credit: 'Unsplash',
  },
  dragon: {
    url: 'https://images.unsplash.com/photo-1577401239170-897c8507c280?w=400',
    credit: 'Unsplash',
  },

  // Couronne
  king: {
    url: 'https://images.unsplash.com/photo-1589634749000-1e72e4022e1d?w=400',
    credit: 'Unsplash',
  },
  tooth: {
    url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400',
    credit: 'Unsplash',
  },
  flower: {
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400',
    credit: 'Unsplash',
  },
  ring: {
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
    credit: 'Unsplash',
  },

  // Étoile
  night_sky: {
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    credit: 'Unsplash',
  },
  starfish: {
    url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400',
    credit: 'Unsplash',
  },
  sheriff: {
    url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400',
    credit: 'Unsplash',
  },
  christmas_tree: {
    url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400',
    credit: 'Unsplash',
  },

  // Pied
  table: {
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    credit: 'Unsplash',
  },
  vine: {
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400',
    credit: 'Unsplash',
  },
  kick: {
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    credit: 'Unsplash',
  },
  house: {
    url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400',
    credit: 'Unsplash',
  },

  // Glace
  mirror: {
    url: 'https://images.unsplash.com/photo-1582993728648-74ab95be1150?w=400',
    credit: 'Unsplash',
  },
  ice_cream: {
    url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400',
    credit: 'Unsplash',
  },
  iceberg: {
    url: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400',
    credit: 'Unsplash',
  },
  skating: {
    url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
    credit: 'Unsplash',
  },
};

// ─── REBUS ──────────────────────────────────────────────────────────────────
// Used by: RebusRenderer, questions_rebus.json

const rebus: Record<string, ImageEntry> = {
  tower: {
    url: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300',
    credit: 'Unsplash',
  },
  nose: {
    url: 'https://images.unsplash.com/photo-1609208567937-38e7909ad0e9?w=300',
    credit: 'Unsplash',
  },
  ground: {
    url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=300',
    credit: 'Unsplash',
  },
  cat: {
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300',
    credit: 'Unsplash',
  },
  pot: {
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300',
    credit: 'Unsplash',
  },
  father: {
    url: 'https://images.unsplash.com/photo-1602224929029-e5ef82a38fe8?w=300',
    credit: 'Unsplash',
  },
  rat: {
    url: 'https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=300',
    credit: 'Unsplash',
  },
  pond: {
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=300',
    credit: 'Unsplash',
  },
  mouth: {
    url: 'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=300',
    credit: 'Unsplash',
  },
  ritual: {
    url: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=300',
    credit: 'Unsplash',
  },
  eye: {
    url: 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=300',
    credit: 'Unsplash',
  },
};

// ─── BLIND TEST ─────────────────────────────────────────────────────────────
// Used by: BlindTestRenderer, questions_blind_test.json
// These images start fully blurred and progressively reveal

const blindTest: Record<string, ImageEntry> = {
  eiffel_tower: {
    url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=500',
    credit: 'Unsplash',
  },
  dna: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/DNA_orbit_animated.gif/220px-DNA_orbit_animated.gif',
    credit: 'Wikimedia',
  },
  thinker: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Mus%C3%A9e_Rodin_1.jpg/300px-Mus%C3%A9e_Rodin_1.jpg',
    credit: 'Wikimedia',
  },
  saturn: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/450px-Saturn_during_Equinox.jpg',
    credit: 'NASA/Wikimedia',
  },
};

// ─── SILHOUETTE ─────────────────────────────────────────────────────────────
// Used by: SilhouetteRenderer, questions_silhouette.json
// Displayed as dark silhouettes — ideally use images with clear outlines

const silhouette: Record<string, ImageEntry> = {
  eiffel_silhouette: {
    url: 'https://images.unsplash.com/photo-1500313830540-7b6650a74eb0?w=400',
    credit: 'Unsplash',
  },
  elephant_silhouette: {
    url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400',
    credit: 'Unsplash',
  },
  saxophone_silhouette: {
    url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    credit: 'Unsplash',
  },
  liberty_silhouette: {
    url: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f04?w=400',
    credit: 'Unsplash',
  },
  kangaroo_silhouette: {
    url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400',
    credit: 'Unsplash',
  },
};

// ─── INTRUDER ───────────────────────────────────────────────────────────────
// Used by: IntruderRenderer, questions_intruder.json

const intruder: Record<string, ImageEntry> = {
  // Éléments chimiques
  oxygen: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Oxygen_specridge.jpg/220px-Oxygen_specridge.jpg',
    credit: 'Wikimedia',
  },
  nitrogen: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Liquidnitrogen.jpg/170px-Liquidnitrogen.jpg',
    credit: 'Wikimedia',
  },
  helium: {
    url: 'https://images.unsplash.com/photo-1527168027773-0cc890c4f42e?w=300',
    credit: 'Unsplash',
  },
  mercury: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Pouring_liquid_mercury_bionerd.jpg/220px-Pouring_liquid_mercury_bionerd.jpg',
    credit: 'Wikimedia',
  },

  // Capitales
  paris: {
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300',
    credit: 'Unsplash',
  },
  tokyo: {
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300',
    credit: 'Unsplash',
  },
  sydney: {
    url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=300',
    credit: 'Unsplash',
  },
  berlin: {
    url: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=300',
    credit: 'Unsplash',
  },

  // Instruments
  violin: {
    url: 'https://images.unsplash.com/photo-1612225330812-01a9c73cb510?w=300',
    credit: 'Unsplash',
  },
  guitar: {
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300',
    credit: 'Unsplash',
  },
  harp: {
    url: 'https://images.unsplash.com/photo-1551887373-6edba6dacbb1?w=300',
    credit: 'Unsplash',
  },
  drums: {
    url: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300',
    credit: 'Unsplash',
  },

  // Scientifiques
  einstein: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/220px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg',
    credit: 'Wikimedia',
  },
  curie: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/220px-Marie_Curie_c._1920s.jpg',
    credit: 'Wikimedia',
  },
  mozart: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Croce-Mozart-Detail.jpg/220px-Croce-Mozart-Detail.jpg',
    credit: 'Wikimedia',
  },
  newton: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Portrait_of_Sir_Isaac_Newton%2C_1689.jpg/220px-Portrait_of_Sir_Isaac_Newton%2C_1689.jpg',
    credit: 'Wikimedia',
  },
};

// ─── UNIFIED REGISTRY ───────────────────────────────────────────────────────

const allImages: Record<string, ImageEntry> = {
  ...fourImages,
  ...rebus,
  ...blindTest,
  ...silhouette,
  ...intruder,
};

/** Fallback placeholder for missing images */
const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" rx="14" fill="#2c2f35"/>
      <text x="100" y="105" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#6b6660">Image manquante</text>
    </svg>`,
  );

/**
 * Get the image URL for a given key.
 * Returns a placeholder SVG if the key is not found.
 */
export function getImageUrl(key: string): string {
  return allImages[key]?.url ?? PLACEHOLDER;
}

/**
 * Get the full image entry (URL + credit) for a given key.
 */
export function getImageEntry(key: string): ImageEntry | null {
  return allImages[key] ?? null;
}

/**
 * Check if an image key exists in the library.
 */
export function hasImage(key: string): boolean {
  return key in allImages;
}

/**
 * Get all available image keys (useful for debugging/admin).
 */
export function listImageKeys(): string[] {
  return Object.keys(allImages);
}

// Export sub-registries for type-specific access
export const imageLibrary = {
  fourImages,
  rebus,
  blindTest,
  silhouette,
  intruder,
  all: allImages,
  get: getImageUrl,
  getEntry: getImageEntry,
  has: hasImage,
  keys: listImageKeys,
};
