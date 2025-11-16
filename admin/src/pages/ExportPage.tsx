import { useState } from 'react';
import { Main, Box, Typography, Button } from '@strapi/design-system';
import { Download } from '@strapi/icons';
import { ContentTypeSelector } from '../components/ContentTypeSelector';
import { getTranslation } from '../utils/getTranslation';
import { PLUGIN_ID } from '../pluginId';

export const ExportPage = () => {
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedContentType) {
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch(`/api/${PLUGIN_ID}/export/${selectedContentType}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedContentType}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" as="h1" marginBottom={4}>
          Export Data
        </Typography>

        <Box marginTop={4} maxWidth="500px">
          <ContentTypeSelector value={selectedContentType} onChange={setSelectedContentType} />
        </Box>

        <Box marginTop={6}>
          <Button
            onClick={handleExport}
            disabled={!selectedContentType || isExporting}
            startIcon={<Download />}
            loading={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Download CSV'}
          </Button>
        </Box>
      </Box>
    </Main>
  );
};
