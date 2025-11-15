import { Main, Box, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" as="h1">
          ¡Bienvenido al Plugin de Importación!
        </Typography>

        <Box marginTop={4}>
          <Typography variant="beta" as="h2">
            {formatMessage({ id: getTranslation('plugin.name') })}
          </Typography>
          <Typography variant="body" marginTop={3}>
            Este es un plugin para importar y exportar datos en Strapi.
          </Typography>
        </Box>

        <Box marginTop={6} padding={4} background="neutral0" borderColor="neutral200" hasRadius>
          <Typography variant="sigma" textColor="neutral600">
            Estado: Plugin Cargado Correctamente ✓
          </Typography>
        </Box>
      </Box>
    </Main>
  );
};

export { HomePage };
