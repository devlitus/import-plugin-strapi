import { useState, useEffect } from 'react';
import { SingleSelect, SingleSelectOption, Alert, Typography, Box } from '@strapi/design-system';
import { PLUGIN_ID } from '../pluginId';

interface ContentType {
  uid: string;
  info: {
    displayName: string;
  };
}

interface ContentTypeSelectorProps {
  value?: string;
  onChange: (uid: string) => void;
}

export const ContentTypeSelector = ({ value, onChange }: ContentTypeSelectorProps) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        setError(null);
        const paths = [
          `/api/plugins/${PLUGIN_ID}/content-types`,
          `/api/${PLUGIN_ID}/content-types`,
          `/api/strapi-import-tools/content-types`,
          `/api/plugins/strapi-import-tools/content-types`,
        ];

        let response: Response | null = null;

        for (const path of paths) {
          try {
            response = await fetch(path);
            if (response.ok) break;
          } catch (err) {
            console.log(`Path ${path} failed, trying next...`);
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Failed to load content types (${response?.status || 'unknown'})`);
        }

        const result = await response.json();
        console.log('Fetched content types:', result);
        setContentTypes(result.data || []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching content types:', err);
        setError(msg);
        setContentTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, []);

  if (error) {
    return (
      <Box marginBottom={4}>
        <Alert variant="warning" title="Content Types Error">
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <SingleSelect
      label="Content Type"
      placeholder={loading ? 'Loading...' : 'Select a content type'}
      value={value}
      onChange={onChange}
      loading={loading}
      disabled={contentTypes.length === 0}
    >
      {contentTypes.map((ct) => (
        <SingleSelectOption key={ct.uid} value={ct.uid}>
          {ct.info.displayName}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  );
};
