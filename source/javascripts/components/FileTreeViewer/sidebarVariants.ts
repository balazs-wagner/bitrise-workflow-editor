// DESIGN EXPLORATION ONLY — layout variants for the sidebar file tree, switchable in the browser.
// Pick one and delete this file (and the switcher) before anything ships.

export type SidebarVariantId =
  | 'current'
  | 'left24'
  | 'panel'
  | 'hang'
  | 'tightIndent'
  | 'repoInTitle'
  | 'wider'
  | 'combo'
  | 'hangTight'
  | 'hangTightWide';

export type SidebarVariant = {
  id: SidebarVariantId;
  label: string;
  /** Inline padding of the tree area, as Bitkit spacing tokens. */
  treePaddingStart: string;
  treePaddingEnd: string;
  /** Tree sits in its own inset panel with a different surface. */
  panel: boolean;
  /** Indent step per tree level: 16px default, 12px when tightened. */
  tightIndent: boolean;
  /** Repository name moves under the title; the single group header is hidden. */
  repoInTitle: boolean;
  /** Extra start padding on the group header, to keep its text on the 24px edge. */
  headerOffset: string;
  sidebarWidth: number;
};

const base: Omit<SidebarVariant, 'id' | 'label'> = {
  treePaddingStart: '8',
  treePaddingEnd: '8',
  panel: false,
  tightIndent: false,
  repoInTitle: false,
  headerOffset: '0',
  sidebarWidth: 256,
};

export const SIDEBAR_VARIANTS: SidebarVariant[] = [
  { ...base, id: 'current', label: '0 · Current (8 / 8)' },
  {
    ...base,
    id: 'left24',
    label: '1 · Left 24, right 8',
    treePaddingStart: '24',
  },
  { ...base, id: 'panel', label: '2 · Tree in its own panel', panel: true },
  {
    ...base,
    id: 'hang',
    label: '3 · Hang from the icon column',
    treePaddingStart: '16',
    headerOffset: '8',
  },
  {
    ...base,
    id: 'tightIndent',
    label: '4 · Tighter indent (12)',
    treePaddingStart: '24',
    tightIndent: true,
  },
  {
    ...base,
    id: 'repoInTitle',
    label: '5 · Repo in the title',
    treePaddingStart: '24',
    repoInTitle: true,
  },
  {
    ...base,
    id: 'wider',
    label: '6 · Wider sidebar (320)',
    treePaddingStart: '24',
    treePaddingEnd: '24',
    sidebarWidth: 320,
  },
  {
    ...base,
    id: 'combo',
    label: '1 + 5 · Recommended',
    treePaddingStart: '24',
    repoInTitle: true,
  },
  {
    ...base,
    id: 'hangTight',
    label: '3 + 4 · Hang + tighter indent',
    treePaddingStart: '16',
    headerOffset: '8',
    tightIndent: true,
  },
  {
    ...base,
    id: 'hangTightWide',
    label: '3 + 4 + 6 · Hang + tighter indent + wider',
    treePaddingStart: '16',
    headerOffset: '8',
    tightIndent: true,
    sidebarWidth: 320,
  },
];

const STORAGE_KEY = 'dsg.sidebarVariant';
const listeners = new Set<() => void>();

function read(): SidebarVariantId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (SIDEBAR_VARIANTS.some((v) => v.id === stored)) {
      return stored as SidebarVariantId;
    }
  } catch {
    // Storage unavailable: fall back to the default.
  }
  return 'current';
}

let currentId: SidebarVariantId = typeof window === 'undefined' ? 'current' : read();

export const sidebarVariantStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => currentId,
  set(id: SidebarVariantId) {
    currentId = id;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore: the choice just won't survive a reload.
    }
    listeners.forEach((listener) => listener());
  },
};

export function getSidebarVariant(id: SidebarVariantId): SidebarVariant {
  return SIDEBAR_VARIANTS.find((v) => v.id === id) ?? SIDEBAR_VARIANTS[0];
}
