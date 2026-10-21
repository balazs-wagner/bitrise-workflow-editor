import { BitkitControlButton, BitkitTabs, IconFolder, IconGroup } from '@bitrise/bitkit-v2';
import { Box } from '@chakra-ui/react/box';
import { useState } from 'react';

import {
  toggleYamlTreeCollapsed,
  useYamlSidebarVariant,
  useYamlTreeCollapsed,
} from '@/components/YamlSidebarVariants/yamlSidebarVariants';
import useCurrentPage from '@/hooks/useCurrentPage';
import { FileTabInfo, useFileTabs } from '@/hooks/useFileTabs';

import DiscardFileTabDialog from './DiscardFileTabDialog';

const OpenFileTabs = () => {
  const { fileTabs, activeTab, mergedConfigNodeId, selectTab, selectMergedConfig, closeTab, discardFile } =
    useFileTabs();
  const [discardNodeId, setDiscardNodeId] = useState<string | null>(null);

  // DESIGN EXPLORATION, variant 3: a toggle at the start of the tab bar shows / hides the module tree
  // in the YAML view.
  const currentPage = useCurrentPage();
  const yamlSidebarVariant = useYamlSidebarVariant();
  const isTreeCollapsed = useYamlTreeCollapsed();
  const showTreeToggle = currentPage === 'yml' && yamlSidebarVariant === 'collapsible';

  const discardTab = fileTabs.find((tab) => tab.nodeId === discardNodeId);

  // A purple dot marks an unsaved file; a saved (unchanged) file has no dot.
  const tabStatusColor = (tab: FileTabInfo) => (tab.isDirty ? 'purple' : undefined);

  // Closing a tab with unsaved edits prompts first; a clean tab closes immediately.
  const handleClose = (tab: FileTabInfo) => {
    if (tab.isDirty) {
      setDiscardNodeId(tab.nodeId);
    } else {
      closeTab(tab.nodeId);
    }
  };

  return (
    <BitkitTabs.Root
      variant="canvas"
      value={activeTab ?? mergedConfigNodeId}
      onValueChange={({ value }) => {
        if (value === mergedConfigNodeId) {
          selectMergedConfig();
        } else {
          selectTab(value);
        }
      }}
    >
      {/* The list only renders tabs (and its add button), so the toggle sits next to it, in a cell that
          continues the tab bar's background and bottom border. */}
      <Box display="flex" alignItems="stretch" background="background/primary">
        {showTreeToggle && (
          <Box
            display="flex"
            alignItems="center"
            flexShrink={0}
            paddingInlineStart="12"
            borderBlockEnd="1px solid"
            borderColor="border/regular"
          >
            <BitkitControlButton
              icon={IconFolder}
              size="xs"
              label={isTreeCollapsed ? 'Show configuration modules (⌘B)' : 'Hide configuration modules (⌘B)'}
              aria-pressed={!isTreeCollapsed}
              onClick={toggleYamlTreeCollapsed}
            />
          </Box>
        )}
        <BitkitTabs.List background="background/primary" flex="1" minWidth={0}>
          <BitkitTabs.Trigger value={mergedConfigNodeId} icon={IconGroup}>
            Merged config
          </BitkitTabs.Trigger>
          {fileTabs.map((tab) => (
            <BitkitTabs.Trigger
              key={tab.nodeId}
              value={tab.nodeId}
              onClose={() => handleClose(tab)}
              statusColor={tabStatusColor(tab)}
              title={tab.editable ? undefined : `Read-only${tab.refLabel ? ` — included from ${tab.refLabel}` : ''}`}
            >
              {tab.name}
            </BitkitTabs.Trigger>
          ))}
        </BitkitTabs.List>
      </Box>

      <DiscardFileTabDialog
        isOpen={Boolean(discardTab)}
        fileName={discardTab?.name ?? ''}
        onKeepEditing={() => setDiscardNodeId(null)}
        onDiscard={() => {
          if (discardNodeId) {
            discardFile(discardNodeId);
          }
          setDiscardNodeId(null);
        }}
      />
    </BitkitTabs.Root>
  );
};

export default OpenFileTabs;
