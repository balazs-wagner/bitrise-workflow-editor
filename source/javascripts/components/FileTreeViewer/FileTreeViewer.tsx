import { BitkitPageSidebar } from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';

import { trackWorkflowEditorYmlModuleOpened } from '@/core/analytics/ConfigManagementAnalytics';
import { bitriseYmlStore } from '@/core/stores/BitriseYmlStore';
import { useFileTabs } from '@/hooks/useFileTabs';
import { useSelectedNodeId, useTree } from '@/hooks/useTree';

import FileTreeView from './FileTreeView';

/**
 * The module file tree, rendered as a section of the page sidebar under the navigation items.
 * Only a modular config (one with `include:`) has a tree, so a single-file config renders nothing.
 */
const FileTreeViewer = () => {
  const tree = useTree();
  const selectedNodeId = useSelectedNodeId();
  const { openFile } = useFileTabs();

  if (!tree) {
    return null;
  }

  return (
    <>
      {/* Full-bleed, unlike the sidebar's default inset divider. */}
      <BitkitPageSidebar.Divider marginInline="0" marginBlockEnd="0" flexShrink={0} />
      {/* Takes whatever height the nav items and footer leave, and scrolls on both axes inside it
          rather than growing the sidebar. Labels never wrap — deep paths scroll sideways instead. */}
      <Box
        flex="1"
        minHeight={0}
        overflow="auto"
        paddingBlockStart="16"
        paddingBlockEnd="8"
        css={{ '& *': { whiteSpace: 'nowrap' } }}
      >
        {/* 24px inline padding lines the group headers up with the nav items; the tree's own 8px inset
            indents the file rows under them. max-content lets the tree be wider than the sidebar. */}
        <Box width="max-content" minWidth="full" paddingInline="24">
          <FileTreeView
            rootNode={tree}
            selectedNodeId={selectedNodeId}
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
