import { useState, useRef, DragEvent } from 'react';
import { Box, Typography, Button, Flex } from '@strapi/design-system';
import { Upload, CheckCircle } from '@strapi/icons';
import styled from 'styled-components';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

const DropZone = styled(Box)<{ $isDragging: boolean; $hasFile: boolean }>`
  border: 2px dashed ${({ theme, $isDragging, $hasFile }) =>
    $hasFile ? theme.colors.success600 :
    $isDragging ? theme.colors.primary600 : theme.colors.neutral300};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: ${({ theme }) => theme.spaces[6]};
  background-color: ${({ theme, $isDragging, $hasFile }) =>
    $hasFile ? theme.colors.success100 :
    $isDragging ? theme.colors.primary100 : theme.colors.neutral0};
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme, $hasFile }) =>
      $hasFile ? theme.colors.success600 : theme.colors.primary600};
    background-color: ${({ theme, $hasFile }) =>
      $hasFile ? theme.colors.success100 : theme.colors.primary100};
  }
`;

export const FileUploader = ({
  onFileSelect,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024
}: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.includes(fileExtension) && !acceptedTypes.includes('*')) {
      return `File type not accepted. Please upload: ${accept}`;
    }

    if (file.size > maxSize) {
      return `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)} MB`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <DropZone
        $isDragging={isDragging}
        $hasFile={!!selectedFile}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Flex direction="column" alignItems="center" gap={3}>
          {selectedFile ? (
            <>
              <CheckCircle width="48px" height="48px" fill="success600" />
              <Typography variant="delta" textColor="success600">
                {selectedFile.name}
              </Typography>
              <Typography variant="omega" textColor="neutral600">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
              <Typography variant="pi" textColor="neutral500">
                Click or drop a new file to replace
              </Typography>
            </>
          ) : (
            <>
              <Upload width="48px" height="48px" fill={isDragging ? "primary600" : "neutral500"} />
              <Typography variant="delta" textColor={isDragging ? "primary600" : "neutral800"}>
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </Typography>
              <Typography variant="omega" textColor="neutral600">
                or
              </Typography>
              <Button variant="secondary" startIcon={<Upload />}>
                Browse Files
              </Button>
              <Typography variant="pi" textColor="neutral500">
                Accepted: {accept} (Max: {(maxSize / 1024 / 1024).toFixed(0)} MB)
              </Typography>
            </>
          )}
        </Flex>
      </DropZone>

      {error && (
        <Box marginTop={2} padding={3} background="danger100" borderColor="danger600" hasRadius>
          <Typography variant="omega" textColor="danger700">
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
