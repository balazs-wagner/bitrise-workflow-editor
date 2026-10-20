import { BitkitPageSidebar } from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';
import { Text } from '@chakra-ui/react/text';

import { trackWorkflowEditorYmlModuleOpened } from '@/core/analytics/ConfigManagementAnalytics';
import { bitriseYmlStore } from '@/core/stores/BitriseYmlStore';
import { useFileTabs } from '@/hooks/useFileTabs';
import PageProps from '@/core/utils/PageProps';
import { useSelectedNodeId, useTree } from '@/hooks/useTree';

import FileTreeView from './FileTreeView';
import SidebarVariantSwitcher from './SidebarVariantSwitcher';
import { useSidebarVariant } from './useSidebarVariant';

/**
 * The module file tree, rendered in the page sidebar between the navigation and the footer links.
 * Only a modular config (one with `include:`) has a tree, so a single-file config renders nothing.
 */
const FileTreeViewer = () => {
  const tree = useTree();
  const selectedNodeId = useSelectedNodeId();
  const { openFile } = useFileTabs();
  // DESIGN EXPLORATION: layout variants, switched from the floating picker (SidebarVariantSwitcher).
  const variant = useSidebarVariant();
  const repoLabel = PageProps.app()?.gitRepoSlug || PageProps.app()?.name || 'This repository';

  if (!tree) {
    return null;
  }

  return (
    <>
      {/* Separates the tree from the nav items above it. Full-bleed, unlike the sidebar's default
          inset divider. */}
      <BitkitPageSidebar.Divider marginInline="0" marginBlockStart="0" marginBlockEnd="0" flexShrink={0} />
      {/* The section title: a Bitkit H4, outside the scroll area so it stays put while the tree
          scrolls. 24px inline padding lines it up with the nav items' left edge. */}
      <Box flexShrink={0} paddingInline="24" paddingBlockStart="16" paddingBlockEnd="8">
        <Text as="h4" textStyle="heading/h4" color="text/primary">
          Configuration modules
        </Text>
        {/* Variant 5: the repository moves here, replacing the tree's own group header. */}
        {variant.repoInTitle && (
          <Text textStyle="body/sm/regular" color="text/secondary">
            {repoLabel}
          </Text>
        )}
      </Box>
      {/* Fills the space between the title and the footer. Scrolls on both axes inside it rather than
          growing the sidebar. Labels never wrap — deep paths scroll sideways instead. Variant 2 sets
          it in an inset panel with its own surface. */}
      <Box
        flex="1 1 0"
        minHeight={0}
        overflow="auto"
        {...(variant.panel && {
          marginInline: '8',
          marginBlockEnd: '8',
          borderRadius: '8',
          background: 'background/secondary',
          paddingBlockStart: '8',
        })}
        css={{
          '& *': { whiteSpace: 'nowrap' },
          // Variant 4: 12px instead of 16px indent step per tree level (each level also shifts by half an
          // icon, 8px, so a level goes from 24px to 20px).
          ...(variant.tightIndent && {
            // The tree view sets the variable on several of its parts, so override it on all of them.
            '& [data-scope=tree-view]': { '--tree-indentation': '0.75rem !important' },
          }),
          // Variant 3: keeps the group header's text on the 24px edge while the rows hang left of it.
          '& [data-file-tree-group-header]': {
            paddingInlineStart: variant.headerOffset,
          },
        }}
      >
        {/* Inline padding comes from the active variant (Bitkit spacing tokens, in rem). max-content
            lets the tree be wider than the sidebar. */}
        <Box
          width="max-content"
          minWidth="full"
          paddingInlineStart={variant.treePaddingStart}
          paddingInlineEnd={variant.treePaddingEnd}
          paddingBlockEnd="8"
        >
          <FileTreeView
            rootNode={tree}
            selectedNodeId={selectedNodeId}
            hideSingleGroupHeader={variant.repoInTitle}
            onSelect={(nodeId) => {
              // Only a not-yet-open tab counts as opening a module (re-selecting an open tab doesn't).
              const alreadyOpen = bitriseYmlStore.getState().openTabs.some((tab) => tab.nodeId === nodeId);
              if (!alreadyOpen) {
                trackWorkflowEditorYmlModuleOpened({
                  openMethod: 'file_explorer',
                });
              }
              openFile(nodeId);
            }}
          />
        </Box>
      </Box>
      <SidebarVariantSwitcher />
    </>
  );
};

export default FileTreeViewer;
