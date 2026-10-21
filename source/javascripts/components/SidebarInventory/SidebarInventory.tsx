import {
  BitkitControlButton,
  BitkitIconComponent,
  BitkitPageSidebar,
  BitkitSearchInput,
  BitkitTabs,
  createBitkitToast,
  IconChevronDown,
  IconChevronRight,
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

type GroupHeaderProps = {
  group: Group;
  /** Entities to count (already filtered by the search); `undefined` for plain page links. */
  items?: InventoryItem[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * A group's title row. It doubles as the link to its page, so an empty group can still be opened. Groups
 * that list entities get a tinted row and a chevron that opens / closes the list.
 */
const GroupHeader = ({ group, items, isOpen, onOpenChange }: GroupHeaderProps) => {
  const [hashPath] = useHashLocation();
  const navigate = useGuardedNavigate();
  const isOnPage = hashPath.startsWith(group.path);

  return (
    <Box display="flex" alignItems="center" flexShrink={0} background={items ? 'background/secondary' : undefined}>
      <BitkitPageSidebar.Item
        data-intercom-target={group.intercomTarget}
        // The row carries the tint; the title's own hover fill goes one step darker.
        flex="1"
        minWidth={0}
        paddingInlineEnd={items ? '8' : undefined}
        background={items ? 'transparent' : undefined}
        _hover={items ? { background: 'background/tertiary' } : undefined}
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
        onClick={() => {
          if (items) {
            onOpenChange(true);
          }
          navigate(withParams(group.path, getSearchParamsFromLocationHash()));
        }}
      >
        {group.title}
      </BitkitPageSidebar.Item>
      {items && (
        // Its own control, next to the title row rather than inside it (the row is a button).
        <Box paddingInlineEnd="8" flexShrink={0}>
          <BitkitControlButton
            icon={isOpen ? IconChevronDown : IconChevronRight}
            size="xs"
            label={isOpen ? `Collapse ${group.title}` : `Expand ${group.title}`}
            aria-expanded={isOpen}
            onClick={() => onOpenChange(!isOpen)}
          />
        </Box>
      )}
    </Box>
  );
};

/** The open group's entities, scrolling inside the space the closed headers leave. */
const GroupList = ({ group, items, query }: { group: Group; items: InventoryItem[]; query: string }) => {
  const [hashPath] = useHashLocation();
  const [searchParams] = useSearchParams();
  const navigate = useGuardedNavigate();
  const isOnPage = hashPath.startsWith(group.path);

  if (items.length === 0) {
    return (
      <Text
        paddingInlineStart="52"
        paddingInlineEnd="16"
        paddingBlock="8"
        textStyle="body/md/regular"
        color="text/tertiary"
      >
        {query ? 'No matches' : `No ${group.title.toLowerCase()} defined here`}
      </Text>
    );
  }

  return (
    <Box flex="1" minHeight={0} overflowY="auto" paddingBlock="4">
      {items.map((item) => {
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

const PAGE_OF_PATH = (path: string) => path.split('/').pop();

/** The group a page belongs to in a tab, if it lists entities there. */
const listGroupOfPage = (tabId: TabId, page?: string) =>
  TABS.find((t) => t.id === tabId)?.groups.find((g) => g.items && PAGE_OF_PATH(g.path) === page)?.path;

const firstListGroup = (tabId: TabId) => TABS.find((t) => t.id === tabId)?.groups.find((g) => g.items)?.path ?? null;

/**
 * Replaces the page navigation: two tabs, each listing what the active document (the selected module,
 * the merged config, or a single-file config) defines, grouped by kind. One group is open at a time; it
 * fills the panel under the search field, and the closed group headers stack at the bottom.
 */
const SidebarInventory = () => {
  const currentPage = useCurrentPage();
  const inventory = useInventory();
  const [tab, setTab] = useState<TabId>(() => tabOfPage(currentPage));
  const isWebsiteMode = RuntimeUtils.isWebsiteMode();
  const [query, setQuery] = useState('');
  // The open group per tab, by page path (`null`: all closed). Starts on the current page's group.
  const [openByTab, setOpenByTab] = useState<Record<TabId, string | null>>(() => ({
    buildingBlocks: listGroupOfPage('buildingBlocks', currentPage) ?? firstListGroup('buildingBlocks'),
    config: listGroupOfPage('config', currentPage) ?? firstListGroup('config'),
  }));

  // Follow the page: landing on a page shows its tab and opens its group. Adjusted during render (not
  // in an effect) when the page changes; tab and open group stay the user's choice otherwise.
  const [tabPage, setTabPage] = useState(currentPage);
  if (currentPage !== tabPage) {
    setTabPage(currentPage);
    if (currentPage && currentPage !== 'yml') {
      const pageTab = tabOfPage(currentPage);
      setTab(pageTab);
      const pageGroup = listGroupOfPage(pageTab, currentPage);
      if (pageGroup) {
        setOpenByTab((prev) => ({ ...prev, [pageTab]: pageGroup }));
      }
    }
  }

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const groups = activeTab.groups.filter((group) => isWebsiteMode || !group.websiteModeOnly);

  const needle = query.trim().toLowerCase();
  const itemsOf = (group: Group) => {
    if (!group.items) {
      return undefined;
    }
    const all = inventory[group.items];
    return needle ? all.filter((item) => item.label.toLowerCase().includes(needle)) : all;
  };

  // While searching, if the open group has no matches, show the first group that has some instead.
  let openPath = openByTab[tab];
  if (needle && openPath) {
    const open = groups.find((g) => g.path === openPath);
    if (open && (itemsOf(open)?.length ?? 0) === 0) {
      openPath = groups.find((g) => (itemsOf(g)?.length ?? 0) > 0)?.path ?? openPath;
    }
  }
  const openGroup = groups.find((g) => g.path === openPath);
  const closedGroups = groups.filter((g) => g !== openGroup);
  const setOpen = (path: string, isOpen: boolean) => setOpenByTab((prev) => ({ ...prev, [tab]: isOpen ? path : null }));

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
      {/* Searches every list in the tab; the query is shared by both tabs. */}
      <Box flexShrink={0} paddingInline="16" paddingBlockStart="12" paddingBlockEnd="8">
        <BitkitSearchInput
          size="md"
          placeholder={tab === 'buildingBlocks' ? 'Search building blocks' : 'Search config'}
          value={query}
          onChange={setQuery}
        />
      </Box>
      {/* The open group, filling the space above the closed headers. */}
      <Box flex="1" minHeight={0} display="flex" flexDirection="column">
        {openGroup && (
          <>
            <GroupHeader
              group={openGroup}
              items={itemsOf(openGroup)}
              isOpen
              onOpenChange={(isOpen) => setOpen(openGroup.path, isOpen)}
            />
            <GroupList group={openGroup} items={itemsOf(openGroup) ?? []} query={needle} />
          </>
        )}
      </Box>
      {/* Closed group headers (and plain page links) stack at the bottom, in their usual order. */}
      <Box flexShrink={0} display="flex" flexDirection="column" gap="4" paddingBlock="8">
        {closedGroups.map((group) => (
          <GroupHeader
            key={group.path}
            group={group}
            items={itemsOf(group)}
            isOpen={false}
            onOpenChange={(isOpen) => setOpen(group.path, isOpen)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SidebarInventory;
