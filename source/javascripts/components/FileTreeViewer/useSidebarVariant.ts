// DESIGN EXPLORATION ONLY — see sidebarVariants.ts.
import { useSyncExternalStore } from 'react';

import { getSidebarVariant, sidebarVariantStore } from './sidebarVariants';

export function useSidebarVariant() {
  const id = useSyncExternalStore(sidebarVariantStore.subscribe, sidebarVariantStore.getSnapshot);
  return getSidebarVariant(id);
}
