import { useMemo } from 'react';

import { BitriseYml } from '@/core/models/BitriseYml';
import { Trigger, TYPE_MAP } from '@/core/models/Trigger';
import TriggerService from '@/core/services/TriggerService';
import useBitriseYmlStore from '@/hooks/useBitriseYmlStore';

export type InventoryItem = { id: string; label: string };

export type Inventory = {
  pipelines: InventoryItem[];
  workflows: InventoryItem[];
  stepBundles: InventoryItem[];
  envVars: InventoryItem[];
  triggers: InventoryItem[];
  containers: InventoryItem[];
};

const byId = (ids: string[]): InventoryItem[] => ids.map((id) => ({ id, label: id }));

function triggerLabel(trigger: Trigger<string>): string {
  const [, targetId] = trigger.source.split('#');
  const condition = trigger.conditions.find((c) => c.value && c.value !== '*')?.value;
  return [TYPE_MAP[trigger.triggerType], condition, targetId ? `→ ${targetId}` : undefined].filter(Boolean).join(' ');
}

function triggersOf(yml: BitriseYml): InventoryItem[] {
  const triggers: Trigger<string>[] = [];
  (['pipelines', 'workflows'] as const).forEach((source) => {
    Object.entries(yml[source] ?? {}).forEach(([sourceId, entity]) => {
      const byType = TriggerService.toTargetBasedTriggers(source, sourceId, entity?.triggers);
      triggers.push(...byType.push, ...byType.pull_request, ...byType.tag);
    });
  });
  // The legacy trigger map has the same shape once converted, so both kinds share one list.
  const legacy = TriggerService.toLegacyTriggers(yml.trigger_map);
  triggers.push(...legacy.push, ...legacy.pull_request, ...legacy.tag);

  return triggers.map((trigger, index) => ({ id: `${index}`, label: triggerLabel(trigger) }));
}

function envVarsOf(yml: BitriseYml): InventoryItem[] {
  return (yml.app?.envs ?? []).flatMap((env, index) => {
    const key = Object.keys(env ?? {}).find((k) => k !== 'opts');
    return key ? [{ id: `${index}:${key}`, label: key }] : [];
  });
}

/**
 * What the active document defines: the selected module's own entities, the merged config's when the
 * merged tab is selected, or the whole config when it isn't modular.
 */
export function useInventory(): Inventory {
  const yml = useBitriseYmlStore((s) => s.yml);

  return useMemo(
    () => ({
      pipelines: byId(Object.keys(yml.pipelines ?? {})),
      workflows: byId(Object.keys(yml.workflows ?? {})),
      stepBundles: byId(Object.keys(yml.step_bundles ?? {})),
      envVars: envVarsOf(yml),
      triggers: triggersOf(yml),
      containers: byId([...Object.keys(yml.containers ?? {}), ...Object.keys(yml.services ?? {})]),
    }),
    [yml],
  );
}
