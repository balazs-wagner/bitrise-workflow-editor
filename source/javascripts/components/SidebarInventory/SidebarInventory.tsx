import {
  BitkitIconComponent,
  BitkitPageSidebar,
  BitkitTabs,
  createBitkitToast,
  IconContainer,
  IconDollar,
  IconKey,
  IconLock,
  IconStack,
  IconStep,
  IconTrigger,
  IconWorkflow,
  IconWorkflowFlow,
} from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';
import { Text } from '@chakra-ui/react/text';
import { omit } from 'es-toolkit';
import { useCallback, useState } from 'react';

import RuntimeUtils from '@/core/utils/RuntimeUtils';
import useCurrentPage from '@/hooks/useCurrentPage';
import useHashLocation from '@/hooks/useHashLocation';
import useSearchParams, { getSearchParamsFromLocationHash } from '@/hooks/useSearchParams';
import useVisualEditorNotice from '@/hooks/useVisualEditorNotice';
import { paths } from '@/routes';

import { Inventory, InventoryItem, useInventory } from './useInventory';

type TabId = 'buildingBlocks' | 'config';

type Group = {
  title: string;
  path: string;
  icon: BitkitIconComponent;
  intercomTarget: string;
  /** Entities to list under the title. Omitted for pages that aren't lists of YAML entities. */
  items?: keyof Inventory;
  /** Search param that selects one entity on the page. Kinds without one open the page only. */
  param?: string;
  websiteModeOnly?: boolean;
};

const ENTITY_PARAMS = ['workflow_id', 'pipeline', 'step_bundle_id'];

const TABS: { id: TabId; label: string; groups: Group[] }[] = [
  {
    id: 'buildingBlocks',
    label: 'Building blocks',
    groups: [
      {
        title: 'Pipelines',
        path: paths.pipelines,
        icon: IconWorkflowFlow,
        intercomTarget: 'Pipelines Page Navigation Item',
        items: 'pipelines',
        param: 'pipeline',
      },
      {
        title: 'Workflows',
        path: paths.workflows,
        icon: IconWorkflow,
        intercomTarget: 'Workflows Page Navigation Item',
        items: 'workflows',
        param: 'workflow_id',
      },
      {
        title: 'Step bundles',
        path: paths.stepBundles,
        icon: IconStep,
        intercomTarget: 'Step Bundles Page Navigation Item',
        items: 'stepBundles',
        param: 'step_bundle_id',
      },
    ],
  },
  {
    id: 'config',
    label: 'Config',
    groups: [
      {
        title: 'Env Vars',
        path: paths.envVars,
        icon: IconDollar,
        intercomTarget: 'Env Vars Page Navigation Item',
        items: 'envVars',
      },
      {
        title: 'Triggers',
        path: paths.triggers,
        icon: IconTrigger,
        intercomTarget: 'Triggers Page Navigation Item',
        items: 'triggers',
      },
      {
        title: 'Containers',
        path: paths.containers,
        icon: IconContainer,
        intercomTarget: 'Containers Page Navigation Item',
        items: 'containers',
      },
      // Not lists of YAML entities: left as plain page links for now.
      { title: 'Secrets', path: paths.secrets, icon: IconLock, intercomTarget: 'Secrets Page Navigation Item' },
      {
        title: 'Stacks & Machines',
        path: paths.stacksAndMachines,
        icon: IconStack,
        intercomTarget: 'Stacks & Machines Page Navigation Item',
        websiteModeOnly: true,
      },
      {
        title: 'Licenses',
        path: paths.licenses,
        icon: IconKey,
        intercomTarget: 'Licenses Page Navigation Item',
        websiteModeOnly: true,
      },
    ],
  },
];

const BUILDING_BLOCK_PAGES = ['workflows', 'pipelines', 'step_bundles'];
const tabOfPage = (page?: string): TabId =>
  page && !BUILDING_BLOCK_PAGES.includes(page) ? 'config' : 'buildingBlocks';

/** Navigates like the old page navigation: blocked (with a toast) while the visual editor is disabled. */
function useGuardedNavigate() {
  const [, navigate] = useHashLocation();
  const visualEditorNotice = useVisualEditorNotice();

  return useCallback(
    (to: string) => {
      if (visualEditorNotice?.disabled) {
        createBitkitToast({
          variant: visualEditorNotice.severity,
          titleText: visualEditorNotice.title,
          messageText: visualEditorNotice.description,
        });
        return;
      }
      navigate(to);
    },
    [visualEditorNotice, navigate],
  );
}

const withParams = (path: string, params: Record<string, string>) => {
  const search = new URLSearchParams(params).toString();
  return search ? `${path}?${search}` : path;
};

const InventoryGroup = ({ group, items }: { group: Group; items?: InventoryItem[] }) => {
  const [hashPath] = useHashLocation();
  const [searchParams] = useSearchParams();
  const navigate = useGuardedNavigate();
  const isOnPage = hashPath.startsWith(group.path);

  return (
    <Box display="flex" flexDirection="column">
      {/* The group title doubles as the link to its page, so an empty group can still be opened. */}
      <BitkitPageSidebar.Item
        data-intercom-target={group.intercomTarget}
        icon={group.icon}
        // Kinds whose entities can't be selected one by one mark the page itself.
        selected={isOnPage && !group.param}
        badge={
          items ? (
            <Text as="span" textStyle="body/sm/regular" color="text/tertiary">
              {items.length}
            </Text>
          ) : undefined
        }
        onClick={() => navigate(withParams(group.path, getSearchParamsFromLocationHash()))}
      >
        {group.title}
      </BitkitPageSidebar.Item>
      {items?.map((item) => {
        const isSelected = Boolean(group.param) && isOnPage && searchParams[group.param as string] === item.id;
        return (
          <BitkitPageSidebar.Item
            key={item.id}
            // Labels start under the title's label: 24 edge + 16 icon + 12 gap.
            paddingInlineStart="52"
            paddingBlock="4"
            selected={isSelected}
            onClick={() => {
              if (group.param) {
                const params = omit(getSearchParamsFromLocationHash(), ENTITY_PARAMS);
                navigate(withParams(group.path, { ...params, [group.param]: item.id }));
              } else {
                navigate(withParams(group.path, getSearchParamsFromLocationHash()));
              }
            }}
          >
            {item.label}
          </BitkitPageSidebar.Item>
        );
      })}
    </Box>
  );
};

/**
 * Replaces the page navigation: two tabs, each listing what the active document (the selected module,
 * the merged config, or a single-file config) defines, grouped by kind under a title that opens the page.
 */
const SidebarInventory = () => {
  const currentPage = useCurrentPage();
  const inventory = useInventory();
  const [tab, setTab] = useState<TabId>(() => tabOfPage(currentPage));
  const isWebsiteMode = RuntimeUtils.isWebsiteMode();

  // Follow the page: landing on a config page shows the Config tab, and vice versa. Adjusted during
  // render (not in an effect) when the page changes; the tab stays the user's choice otherwise.
  const [tabPage, setTabPage] = useState(currentPage);
  if (currentPage !== tabPage) {
    setTabPage(currentPage);
    if (currentPage && currentPage !== 'yml') {
      setTab(tabOfPage(currentPage));
    }
  }

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <Box display="flex" flexDirection="column" minHeight={0} flex="1">
      <BitkitTabs.Root variant="line" size="md" value={tab} onValueChange={({ value }) => setTab(value as TabId)}>
        {/* 8 + the list's 4 + the tab's 12 puts the tab labels on the sidebar's 24px edge. */}
        <Box paddingInline="8" flexShrink={0}>
          <BitkitTabs.List>
            {TABS.map((t) => (
              <BitkitTabs.Trigger key={t.id} value={t.id}>
                {t.label}
              </BitkitTabs.Trigger>
            ))}
          </BitkitTabs.List>
        </Box>
      </BitkitTabs.Root>
      <Box flex="1" minHeight={0} overflowY="auto" paddingBlock="8" display="flex" flexDirection="column" gap="8">
        {activeTab.groups
          .filter((group) => isWebsiteMode || !group.websiteModeOnly)
          .map((group) => (
            <InventoryGroup key={group.path} group={group} items={group.items ? inventory[group.items] : undefined} />
          ))}
      </Box>
    </Box>
  );
};

export default SidebarInventory;
