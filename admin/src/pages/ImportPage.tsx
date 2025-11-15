import { useState } from 'react';
import { Main, Box, Typography, Button } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import { ContentTypeSelector } from '../components/ContentTypeSelector';
import { FileUploader } from '../components/FileUploader';
import { ImportResults } from '../components/ImportResults';

export const ImportPage = () => {
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleImport = async () => {
    if (!selectedContentType || !selectedFile) {
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/import-plugin/import/${selectedContentType}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      setImportResult(result.data);
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'Error importing data',
        created: 0,
        updated: 0,
        errors: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" as="h1" marginBottom={4}>
          Import Data
        </Typography>

        <Box marginTop={4} maxWidth="500px">
          <ContentTypeSelector value={selectedContentType} onChange={setSelectedContentType} />
        </Box>

        <Box marginTop={4}>
          <FileUploader onFileSelect={setSelectedFile} />
        </Box>

        <Box marginTop={6}>
          <Button
            onClick={handleImport}
            disabled={!selectedContentType || !selectedFile || isImporting}
            startIcon={<Upload />}
            loading={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
        </Box>

        <ImportResults result={importResult} />
      </Box>
    </Main>
  );
};
