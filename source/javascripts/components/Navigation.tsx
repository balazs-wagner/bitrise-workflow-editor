import {
  BitkitPageSidebar,
  BitkitPageSidebarProps,
  IconArrowNortheast,
  IconBook,
  IconDoc,
  rem,
} from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';
import { useEffect, useRef } from 'react';

import FileTreeViewer from '@/components/FileTreeViewer/FileTreeViewer';
import SidebarInventory from '@/components/SidebarInventory/SidebarInventory';
import { segmentTrack } from '@/core/analytics/SegmentBaseTracking';
import { bitriseYmlStore, getYmlString, updateBitriseYmlDocumentByString } from '@/core/stores/BitriseYmlStore';
import { useCiConfigExpertStore } from '@/core/stores/CiConfigExpertStore';
import PageProps from '@/core/utils/PageProps';
import WindowUtils from '@/core/utils/WindowUtils';
import { useCiConfigSettings } from '@/hooks/useCiConfigSettings';
import useCurrentPage from '@/hooks/useCurrentPage';
import useParentMessageListener from '@/hooks/useParentMessageListener';

type Props = Omit<BitkitPageSidebarProps, 'children'> & {
  /** Collapses the inventory so only the module file tree is left (YAML view of a modular config). */
  hidePageNav?: boolean;
};

const Navigation = ({ hidePageNav = false, ...props }: Props) => {
  const currentPage = useCurrentPage();
  const isDefaultTabRef = useRef(true);
  const { data } = useCiConfigSettings();
  const yamlSelector = currentPage === 'workflows' || currentPage === 'pipelines' ? currentPage : undefined;

  useParentMessageListener<{
    bitriseYmlContents: string;
    conversationId: string | undefined;
    turnIndex: number | undefined;
    turnCount: number | undefined;
  }>('CI_CONFIG_RECEIVED', (payload) => {
    useCiConfigExpertStore.setState({
      conversationId: payload.conversationId,
      turnIndex: payload.turnIndex,
      turnCount: payload.turnCount,
    });
    updateBitriseYmlDocumentByString(payload.bitriseYmlContents);
  });

  useParentMessageListener('REQUEST_AI_DRAWER_OPEN', () => {
    WindowUtils.postMessageToParent('OPEN_CI_CONFIG_EXPERT', {
      bitriseYmlContents: getYmlString(),
      selectedPage: currentPage,
      yamlSelector,
    });
    useCiConfigExpertStore.setState({ isAIDrawerOpen: true });
  });

  useEffect(() => {
    segmentTrack('Workflow Editor Tab Displayed', {
      app_slug: PageProps.appSlug(),
      tab_name: currentPage,
      is_default_tab: isDefaultTabRef.current,
      yml_source: data?.usesRepositoryYml ? 'git' : 'bitrise',
      is_modular_config: Boolean(bitriseYmlStore.getState().tree),
    });
    isDefaultTabRef.current = false;
  }, [currentPage, data?.usesRepositoryYml]);

  return (
    // Every label, icon and link in the sidebar is the same for every user and account.
    <BitkitPageSidebar
      data-clarity-unmask="true"
      flexShrink={0}
      // The layout gives the sidebar the height of the row under the header, so the component's own
      // `100dvh` floor has to give way or it pushes past the bottom of the editor.
      minHeight="auto"
      // The width v1 had. There is no narrow icon-only mode in the design system, so the mobile rail
      // went with the migration.
      width={rem(256)}
      // The navigation and the file tree each scroll inside their own area, so the sidebar itself
      // must not grow or scroll.
      overflow="hidden"
      {...props}
    >
      {/* The inventory replaces the page navigation. With a module tree below it, the two share the
          height; without one, it fills the sidebar. In the YAML view of a modular config it collapses
          away (flex-grow 1 → 0, animated), so the module tree slides up rather than jumping. */}
      <Box
        flexGrow={hidePageNav ? 0 : 1}
        flexShrink={1}
        flexBasis="0"
        minHeight={0}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        // visibility interpolates, so the panel stays visible while it closes, then leaves the tab order.
        visibility={hidePageNav ? 'hidden' : 'visible'}
        transition="flex-grow 200ms ease-out, visibility 200ms"
      >
        <SidebarInventory />
      </Box>
      {/* Modular configs only: the module file tree, filling the space between the navigation and
          the footer. */}
      <FileTreeViewer showDivider={!hidePageNav} />
      {/* Pushed to the bottom when there's no file tree to fill the space above it. */}
      <BitkitPageSidebar.Footer marginBlockStart="auto">
        <BitkitPageSidebar.Item
          data-intercom-target="YAML Reference Navigation Item"
          href="https://docs.bitrise.io/en/bitrise-ci/references/configuration-yaml-reference.html"
          icon={IconBook}
          onClick={() => segmentTrack('Workflow Editor YAML Reference Button Clicked')}
          rel="noopener noreferrer"
          suffixIcon={IconArrowNortheast}
          target="_blank"
        >
          YAML Reference
        </BitkitPageSidebar.Item>
        <BitkitPageSidebar.Item
          data-intercom-target="Workflow Recipes Navigation Item"
          href="https://github.com/bitrise-io/workflow-recipes"
          icon={IconDoc}
          onClick={() => segmentTrack('Workflow Editor Workflow Recipes Button Clicked')}
          rel="noopener noreferrer"
          suffixIcon={IconArrowNortheast}
          target="_blank"
        >
          Workflow Recipes
        </BitkitPageSidebar.Item>
      </BitkitPageSidebar.Footer>
    </BitkitPageSidebar>
  );
};

export default Navigation;
