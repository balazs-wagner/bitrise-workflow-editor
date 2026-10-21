import { Box } from '@chakra-ui/react/box';
import { useEffect } from 'react';
import { Redirect, Router, Switch } from 'wouter';

import Header from '@/components/Header';
import LazyRoute from '@/components/LazyRoute';
import LoadingState from '@/components/LoadingState';
import Navigation from '@/components/Navigation';
import {
  toggleYamlTreeCollapsed,
  useYamlSidebarVariant,
  useYamlTreeCollapsed,
} from '@/components/YamlSidebarVariants/yamlSidebarVariants';
import YamlSidebarVariantSwitcher from '@/components/YamlSidebarVariants/YamlSidebarVariantSwitcher';
import RuntimeUtils from '@/core/utils/RuntimeUtils';
import useHashLocation from '@/hooks/useHashLocation';
import useHashSearch from '@/hooks/useHashSearch';
import useMergedConfigSync from '@/hooks/useMergedConfigSync';
import useTrackYamlAliases from '@/hooks/useTrackYamlAliases';
import { useTree } from '@/hooks/useTree';
import { useIsConfigLoading } from '@/layouts/ConfigLoading.context';
import VisualEditorDisabledRedirect from '@/layouts/VisualEditorDisabledRedirect';
import OpenFileTabs from '@/pages/YmlPage/components/OpenFileTabs/OpenFileTabs';
import { paths, routes } from '@/routes';

const MainLayout = () => {
  const [currentPath] = useHashLocation();
  const isYmlPage = currentPath.startsWith(paths.yml);
  const isWebsiteMode = RuntimeUtils.isWebsiteMode();

  // Modular configs get a global file-tab strip directly under the header.
  const isModular = Boolean(useTree());
  // In website mode that strip spans the full width under the header (above the
  // nav + content row); in CLI mode the tabs live inside the content column instead.
  const tabsUnderHeader = isModular && isWebsiteMode;

  // The header + navigation stay visible during the initial config load; only the content area
  // shows the loading state (settings check + tree/legacy fetch).
  const isConfigLoading = useIsConfigLoading();

  // DESIGN EXPLORATION: how the sidebar behaves in the YAML view (see yamlSidebarVariants.ts).
  // A single-file config has no module tree, so its YAML view keeps the full-width editor in every variant.
  const yamlSidebarVariant = useYamlSidebarVariant();
  const isYamlTreeCollapsed = useYamlTreeCollapsed();
  const isCollapsibleVariant = isModular && yamlSidebarVariant === 'collapsible';
  const showSidebar =
    !isYmlPage ||
    (isModular &&
      (yamlSidebarVariant === 'treeOnly' ||
        yamlSidebarVariant === 'full' ||
        (yamlSidebarVariant === 'collapsible' && !isYamlTreeCollapsed)));
  const hidePageNav =
    isYmlPage && isModular && (yamlSidebarVariant === 'treeOnly' || yamlSidebarVariant === 'collapsible');

  // Variant 3: ⌘B / Ctrl+B toggles the tree in the YAML view, as in VS Code. Captured before Monaco sees it.
  useEffect(() => {
    if (!isYmlPage || !isCollapsibleVariant) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        event.stopPropagation();
        toggleYamlTreeCollapsed();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isYmlPage, isCollapsibleVariant]);

  useMergedConfigSync();
  useTrackYamlAliases();

  return (
    <Box height="100dvh" display="flex" flexDirection="column">
      <Header />
      {tabsUnderHeader && <OpenFileTabs />}
      <Box display="flex" flex="1" minHeight={0}>
        {/* style instead of conditional unmount — keeps CI_CONFIG_RECEIVED / REQUEST_AI_DRAWER_OPEN listeners alive on the YAML page. */}
        <Navigation style={{ display: showSidebar ? undefined : 'none' }} hidePageNav={hidePageNav} />
        <Box display="flex" flexDirection="column" flex="1" minWidth={0} minHeight={0}>
          {isModular && !tabsUnderHeader && <OpenFileTabs />}
          <Box flex="1" overflowX="hidden" overflowY="auto">
            {isConfigLoading ? (
              <LoadingState />
            ) : (
              <Router hook={useHashLocation} searchHook={useHashSearch}>
                <VisualEditorDisabledRedirect>
                  <Switch>
                    {routes.map(({ path, component }) => (
                      <LazyRoute key={path} path={new RegExp(`^\\${path}`)} component={component} />
                    ))}
                    <Redirect to={paths.workflows} replace />
                  </Switch>
                </VisualEditorDisabledRedirect>
              </Router>
            )}
          </Box>
        </Box>
      </Box>
      <YamlSidebarVariantSwitcher />
    </Box>
  );
};

export default MainLayout;
