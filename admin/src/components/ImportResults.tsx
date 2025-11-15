import { Box, Typography, Alert } from '@strapi/design-system';

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

interface ImportResultsProps {
  result: ImportResult | null;
}

export const ImportResults = ({ result }: ImportResultsProps) => {
  if (!result) {
    return null;
  }

  return (
    <Box marginTop={4}>
      {result.success ? (
        <Alert variant="success" title="Import Successful">
          <Typography>
            Created: {result.created} | Updated: {result.updated}
          </Typography>
        </Alert>
      ) : (
        <Box>
          <Alert variant="danger" title="Import Failed">
            <Typography>{result.message}</Typography>
          </Alert>

          {result.errors && result.errors.length > 0 && (
            <Box marginTop={4}>
              <Typography variant="sigma" marginBottom={2}>
                Errors:
              </Typography>
              {result.errors.map((error, index) => (
                <Box key={index} marginBottom={2}>
                  <Typography variant="omega">
                    Row {error.row}: {error.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
