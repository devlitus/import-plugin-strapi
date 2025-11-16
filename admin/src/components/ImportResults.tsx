import { Box, Typography, Alert, Button, Divider } from '@strapi/design-system';
import styled from 'styled-components';
import { useState } from 'react';

interface ErrorDetail {
  row: number;
  message: string;
  fieldName?: string;
  data?: Record<string, any>;
}

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: ErrorDetail[];
}

interface ImportResultsProps {
  result: ImportResult | null;
}

const JsonBox = styled(Box)`
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #444;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #2d2d2d;
  }

  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
`;

const CopyButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
`;

const StatBox = styled(Box)`
  background-color: #f0f0f0;
  border-left: 4px solid #007bff;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

export const ImportResults = ({ result }: ImportResultsProps) => {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return null;
  }

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderJson = (obj: any, level = 0) => {
    if (obj === null) return <span style={{ color: '#ce9178' }}>null</span>;
    if (typeof obj === 'boolean') return <span style={{ color: '#569cd6' }}>{String(obj)}</span>;
    if (typeof obj === 'number') return <span style={{ color: '#b5cea8' }}>{obj}</span>;
    if (typeof obj === 'string') return <span style={{ color: '#ce9178' }}>"{obj}"</span>;

    if (Array.isArray(obj)) {
      return (
        <>
          <span style={{ color: '#d4d4d4' }}>[</span>
          {obj.length > 0 && (
            <div style={{ paddingLeft: `${(level + 1) * 2}ch` }}>
              {obj.map((item, idx) => (
                <div key={idx}>
                  {renderJson(item, level + 1)}
                  {idx < obj.length - 1 && <span style={{ color: '#d4d4d4' }}>,</span>}
                </div>
              ))}
            </div>
          )}
          <span style={{ color: '#d4d4d4' }}>]</span>
        </>
      );
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      return (
        <>
          <span style={{ color: '#d4d4d4' }}>{'{'}</span>
          {keys.length > 0 && (
            <div style={{ paddingLeft: `${(level + 1) * 2}ch` }}>
              {keys.map((key, idx) => (
                <div key={key}>
                  <span style={{ color: '#9cdcfe' }}>"{key}"</span>
                  <span style={{ color: '#d4d4d4' }}>: </span>
                  {renderJson(obj[key], level + 1)}
                  {idx < keys.length - 1 && <span style={{ color: '#d4d4d4' }}>,</span>}
                </div>
              ))}
            </div>
          )}
          <span style={{ color: '#d4d4d4' }}>{'}'}</span>
        </>
      );
    }

    return <span>{String(obj)}</span>;
  };

  return (
    <Box marginTop={4}>
      {/* Summary Statistics */}
      <Box display="grid" gridCols={3} gap={2} marginBottom={4}>
        <StatBox>
          <Typography variant="sigma" style={{ color: '#666' }}>
            Created
          </Typography>
          <Typography variant="delta" style={{ color: '#28a745', marginTop: '8px' }}>
            {result.created}
          </Typography>
        </StatBox>
        <StatBox>
          <Typography variant="sigma" style={{ color: '#666' }}>
            Updated
          </Typography>
          <Typography variant="delta" style={{ color: '#17a2b8', marginTop: '8px' }}>
            {result.updated}
          </Typography>
        </StatBox>
        <StatBox>
          <Typography variant="sigma" style={{ color: '#666' }}>
            Errors
          </Typography>
          <Typography
            variant="delta"
            style={{ color: result.errors.length > 0 ? '#dc3545' : '#28a745', marginTop: '8px' }}
          >
            {result.errors.length}
          </Typography>
        </StatBox>
      </Box>

      {/* Status Alert */}
      {result.success ? (
        <Alert variant="success" title="Import Completed Successfully" marginBottom={4}>
          <Typography>All records were imported without errors.</Typography>
        </Alert>
      ) : (
        <Alert variant="danger" title="Import Completed with Errors" marginBottom={4}>
          <Typography>{result.message}</Typography>
        </Alert>
      )}

      {/* Full JSON Output */}
      <Box marginBottom={2}>
        <Typography variant="sigma" marginBottom={2}>
          Complete Import Details (JSON):
        </Typography>
      </Box>

      <Box position="relative" marginBottom={4}>
        <CopyButton
          variant="tertiary"
          size="S"
          onClick={handleCopyJson}
          title={copied ? 'Copied!' : 'Copy JSON'}
        >
          {copied ? '✓ Copied' : 'Copy JSON'}
        </CopyButton>

        <JsonBox padding={3}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {renderJson(result)}
          </pre>
        </JsonBox>
      </Box>

      {/* Detailed Error List */}
      {result.errors.length > 0 && (
        <Box>
          <Divider marginBottom={3} marginTop={3} />
          <Typography variant="sigma" marginBottom={3}>
            Detailed Error Information ({result.errors.length} errors):
          </Typography>

          {result.errors.map((error, index) => (
            <Box key={index} marginBottom={3} padding={3} hasRadius background="neutral100">
              <Box display="flex" justifyContent="space-between" marginBottom={2}>
                <Typography variant="omega" weight="bold" style={{ color: '#dc3545' }}>
                  Row {error.row}
                </Typography>
                {error.fieldName && (
                  <Typography variant="omega" style={{ color: '#666' }}>
                    Field: <strong>{error.fieldName}</strong>
                  </Typography>
                )}
              </Box>

              <Typography variant="omega" marginBottom={2}>
                <strong>Error Message:</strong>
              </Typography>
              <Box paddingLeft={2} marginBottom={2}>
                <Typography variant="omega" style={{ color: '#666' }}>
                  {error.message}
                </Typography>
              </Box>

              {error.data && Object.keys(error.data).length > 0 && (
                <>
                  <Typography variant="omega" marginBottom={2}>
                    <strong>Row Data:</strong>
                  </Typography>
                  <JsonBox padding={2} marginLeft={2}>
                    <pre style={{ margin: 0, fontSize: '11px' }}>
                      {JSON.stringify(error.data, null, 2)}
                    </pre>
                  </JsonBox>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
