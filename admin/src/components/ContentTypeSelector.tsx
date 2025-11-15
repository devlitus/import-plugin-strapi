import { useState, useEffect } from 'react';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

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

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        const response = await fetch('/api/import-plugin/content-types');
        const result = await response.json();
        console.log('Fetched content types:', result);
        setContentTypes(result.data || []);
      } catch (error) {
        console.error('Error fetching content types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, []);

  return (
    <SingleSelect
      label="Content Type"
      placeholder="Select a content type"
      value={value}
      onChange={onChange}
      loading={loading}
    >
      {contentTypes.map((ct) => (
        <SingleSelectOption key={ct.uid} value={ct.uid}>
          {ct.info.displayName}
        </SingleSelectOption>
      ))}
    </SingleSelect>
  );
};
