import { BitkitPageSidebar } from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';
import { useMemo } from 'react';

import { trackWorkflowEditorYmlModuleOpened } from '@/core/analytics/ConfigManagementAnalytics';
import { bitriseYmlStore } from '@/core/stores/BitriseYmlStore';
import { useFileTabs } from '@/hooks/useFileTabs';
import { useSelectedNodeId, useTree } from '@/hooks/useTree';

import FileTreeView from './FileTreeView';

/**
 * The module file tree, rendered in the page sidebar between the navigation and the footer links.
 * Only a modular config (one with `include:`) has a tree, so a single-file config renders nothing.
 */
const FileTreeViewer = () => {
  const tree = useTree();
  const selectedNodeId = useSelectedNodeId();
  const { fileTabs, openFile } = useFileTabs();
  const openNodeIds = useMemo(() => new Set(fileTabs.map((tab) => tab.nodeId)), [fileTabs]);

  if (!tree) {
    return null;
  }

  return (
    <>
      {/* Separates the tree from the nav items above it. Full-bleed, unlike the sidebar's default
          inset divider. */}
      <BitkitPageSidebar.Divider marginInline="0" marginBlockStart="0" marginBlockEnd="0" flexShrink={0} />
      {/* The section title sits outside the scroll area, so it stays put while the tree scrolls. */}
      <BitkitPageSidebar.GroupHeading label="Config modules" flexShrink={0} />
      {/* Fills the space between the title and the footer. Scrolls on both axes inside it rather than
          growing the sidebar. Labels never wrap — deep paths scroll sideways instead. */}
      <Box
        flex="1 1 0"
        minHeight={0}
        overflow="auto"
        css={{
          '& *': { whiteSpace: 'nowrap' },
          // Modules open as tabs: the file icon takes the interactive colour and the name goes
          // semibold, so they stand out from the rest of the tree without competing with the
          // selected (active) row's background.
          '& [data-part=item][data-open] [data-part=item-text]': { fontWeight: 'semibold' },
        }}
      >
        {/* 24px inline padding lines the group headers up with the nav items; the tree's own 8px inset
            indents the file rows under them. max-content lets the tree be wider than the sidebar. */}
        <Box width="max-content" minWidth="full" paddingInline="24" paddingBlockEnd="8">
          <FileTreeView
            rootNode={tree}
            selectedNodeId={selectedNodeId}
            openNodeIds={openNodeIds}
            onSelect={(nodeId) => {
              // Only a not-yet-open tab counts as opening a module (re-selecting an open tab doesn't).
              const alreadyOpen = bitriseYmlStore.getState().openTabs.some((tab) => tab.nodeId === nodeId);
              if (!alreadyOpen) {
                trackWorkflowEditorYmlModuleOpened({ openMethod: 'file_explorer' });
              }
              openFile(nodeId);
            }}
          />
        </Box>
      </Box>
    </>
  );
};

export default FileTreeViewer;
