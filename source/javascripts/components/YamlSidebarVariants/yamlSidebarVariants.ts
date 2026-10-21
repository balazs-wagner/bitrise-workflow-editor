// DESIGN EXPLORATION ONLY — how the sidebar behaves in the YAML view, switchable in the browser.
// Pick one and delete this folder (and the switcher in MainLayout) before anything ships.
import { useSyncExternalStore } from 'react';

export type YamlSidebarVariantId = 'hidden' | 'treeOnly' | 'full';

export const YAML_SIDEBAR_VARIANTS: {
  id: YamlSidebarVariantId;
  label: string;
}[] = [
  { id: 'hidden', label: '0 · Hidden (current)' },
  { id: 'treeOnly', label: '1 · Tree only' },
  { id: 'full', label: '2 · Full sidebar' },
];

/** A value kept in localStorage that components can subscribe to. Storage failures fall back to the default. */
function createStoredValue<T extends string>(key: string, fallback: T, isValid: (value: string | null) => boolean) {
  const listeners = new Set<() => void>();
  let current: T = fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (isValid(stored)) {
      current = stored as T;
    }
  } catch {
    // Storage unavailable: keep the default.
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => current,
    set(value: T) {
      current = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore: the choice just won't survive a reload.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

export const yamlSidebarVariantStore = createStoredValue<YamlSidebarVariantId>(
  'dsg.yamlSidebarVariant',
  'treeOnly',
  (v) => YAML_SIDEBAR_VARIANTS.some((variant) => variant.id === v),
);

export function useYamlSidebarVariant() {
  return useSyncExternalStore(yamlSidebarVariantStore.subscribe, yamlSidebarVariantStore.getSnapshot);
}
