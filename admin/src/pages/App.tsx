import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@strapi/design-system';

import { HomePage } from './HomePage';
import { ExportPage } from './ExportPage';
import { ImportPage } from './ImportPage';

const NotFound = () => (
  <Box padding={8}>
    <Typography variant="alpha" as="h1">
      404 - Página no encontrada
    </Typography>
  </Box>
);

const App = () => {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="export" element={<ExportPage />} />
      <Route path="import" element={<ImportPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export { App };
