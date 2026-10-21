// DESIGN EXPLORATION ONLY — floating picker for the YAML view sidebar variants. See yamlSidebarVariants.ts.
import { Box } from '@chakra-ui/react/box';

import {
  useYamlSidebarVariant,
  YAML_SIDEBAR_VARIANTS,
  YamlSidebarVariantId,
  yamlSidebarVariantStore,
} from './yamlSidebarVariants';

const YamlSidebarVariantSwitcher = () => {
  const variant = useYamlSidebarVariant();

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
      <label htmlFor="dsg-yaml-sidebar-variant">YAML view sidebar</label>
      <select
        id="dsg-yaml-sidebar-variant"
        value={variant}
        onChange={(event) => yamlSidebarVariantStore.set(event.target.value as YamlSidebarVariantId)}
      >
        {YAML_SIDEBAR_VARIANTS.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </Box>
  );
};

export default YamlSidebarVariantSwitcher;
