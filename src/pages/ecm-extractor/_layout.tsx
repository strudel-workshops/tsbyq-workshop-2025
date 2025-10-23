import { Box } from '@mui/material';
import { EcmExtractorProvider } from './-context/ContextProvider';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/ecm-extractor/_layout')({
  component: EcmExtractorLayout,
});

/**
 * Top-level wrapper for the ECM Extractor Task Flow.
 * Inner pages are rendered inside the `<Outlet />` component
 */
function EcmExtractorLayout() {
  return (
    <Box>
      <EcmExtractorProvider>
        <Outlet />
      </EcmExtractorProvider>
    </Box>
  );
}

export default EcmExtractorLayout;
