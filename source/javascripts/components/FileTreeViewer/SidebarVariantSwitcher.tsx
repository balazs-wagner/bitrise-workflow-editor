// DESIGN EXPLORATION ONLY — floating picker for the sidebar layout variants. See sidebarVariants.ts.
import { Box } from '@chakra-ui/react/box';

import { SIDEBAR_VARIANTS, SidebarVariantId, sidebarVariantStore } from './sidebarVariants';
import { useSidebarVariant } from './useSidebarVariant';

const SidebarVariantSwitcher = () => {
  const variant = useSidebarVariant();

  return (
    <Box
      position="fixed"
      insetBlockEnd="16"
      insetInlineEnd="16"
      zIndex={2000}
      display="flex"
      alignItems="center"
      gap="8"
      paddingInline="12"
      paddingBlock="8"
      borderRadius="8"
      background="background/primary"
      border="1px solid"
      borderColor="border/strong"
      boxShadow="large"
      textStyle="body/sm/regular"
    >
      <label htmlFor="dsg-sidebar-variant">Sidebar variant</label>
      <select
        id="dsg-sidebar-variant"
        value={variant.id}
        onChange={(event) => sidebarVariantStore.set(event.target.value as SidebarVariantId)}
      >
        {SIDEBAR_VARIANTS.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </Box>
  );
};

export default SidebarVariantSwitcher;
