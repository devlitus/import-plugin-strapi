import { Main, Box, Typography, Button, Grid, Flex, Divider } from '@strapi/design-system';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, ArrowRight, File, CheckCircle } from '@strapi/icons';
import styled from 'styled-components';

const Header = styled(Box)`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary100} 0%, ${({ theme }) => theme.colors.neutral0} 100%);
  border-radius: ${({ theme }) => theme.borderRadius};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: ${({ theme }) => theme.colors.primary200};
    border-radius: 50%;
    opacity: 0.3;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -5%;
    width: 200px;
    height: 200px;
    background: ${({ theme }) => theme.colors.primary200};
    border-radius: 50%;
    opacity: 0.2;
  }
`;

const ActionCard = styled(Box)`
  position: relative;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid ${({ theme }) => theme.colors.neutral200};

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary600};

    .icon-container {
      transform: scale(1.1);
      background: ${({ theme }) => theme.colors.primary600};

      svg {
        fill: ${({ theme }) => theme.colors.neutral0};
      }
    }

    .arrow-icon {
      transform: translateX(4px);
      opacity: 1;
    }
  }
`;

const IconContainer = styled(Box)`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const FeatureItem = styled(Flex)`
  align-items: center;
  gap: ${({ theme }) => theme.spaces[2]};
  padding: ${({ theme }) => theme.spaces[2]} 0;
`;

const ArrowIcon = styled(ArrowRight)`
  transition: all 0.3s ease;
  opacity: 0.7;
`;

const ContentContainer = styled(Box)`
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    { label: 'CSV file format support', icon: File },
    { label: 'Bulk content operations', icon: CheckCircle },
    { label: 'Easy data migration', icon: CheckCircle },
  ];

  return (
    <Main>
      <Box padding={8}>
        <ContentContainer>
        <Header padding={8} marginBottom={6} style={{ position: 'relative', zIndex: 1 }}>
          <Box style={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="alpha" as="h1" marginBottom={2} textColor="primary700">
              Import/Export Plugin
            </Typography>
            <Typography variant="epsilon" textColor="primary600" marginBottom={4}>
              Seamlessly manage your Strapi content with powerful CSV import and export capabilities
            </Typography>

            <Divider background="primary200" marginTop={4} marginBottom={4} />

            <Grid.Root gap={3}>
              {features.map((feature, index) => (
                <Grid.Item key={index} col={4} xs={12}>
                  <FeatureItem>
                    <feature.icon width="16px" height="16px" fill="primary600" />
                    <Typography variant="pi" textColor="primary700" fontWeight="semiBold">
                      {feature.label}
                    </Typography>
                  </FeatureItem>
                </Grid.Item>
              ))}
            </Grid.Root>
          </Box>
        </Header>

        <Grid.Root gap={6} cols={12}>
          <Grid.Item col={6} xs={12}>
            <ActionCard
              padding={8}
              background="neutral0"
              hasRadius
              shadow="filterShadow"
              onClick={() => navigate('export')}
            >
              <Flex direction="column" alignItems="flex-start" gap={4} style={{ height: '100%' }}>
                <IconContainer
                  className="icon-container"
                  background="success100"
                >
                  <Download width="40px" height="40px" fill="success600" />
                </IconContainer>

                <Box>
                  <Typography variant="beta" as="h2" marginBottom={2} textColor="neutral800">
                    Export Data
                  </Typography>
                  <Typography variant="omega" textColor="neutral600" marginBottom={3}>
                    Download your content collections as CSV files for backup, analysis, or migration purposes
                  </Typography>

                  <Box paddingTop={2}>
                    <Typography variant="pi" textColor="neutral500" marginBottom={1}>
                      Perfect for:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Creating data backups
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Content analysis & reporting
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Migrating to external systems
                    </Typography>
                  </Box>
                </Box>

                <Box marginTop="auto" width="100%">
                  <Divider background="neutral200" marginBottom={4} />
                  <Flex justifyContent="space-between" alignItems="center">
                    <Button variant="secondary" size="L">
                      Start Export
                    </Button>
                    <ArrowIcon className="arrow-icon" width="20px" height="20px" fill="primary600" />
                  </Flex>
                </Box>
              </Flex>
            </ActionCard>
          </Grid.Item>

          <Grid.Item col={6} xs={12}>
            <ActionCard
              padding={8}
              background="neutral0"
              hasRadius
              shadow="filterShadow"
              onClick={() => navigate('import')}
            >
              <Flex direction="column" alignItems="flex-start" gap={4} style={{ height: '100%' }}>
                <IconContainer
                  className="icon-container"
                  background="primary100"
                >
                  <Upload width="40px" height="40px" fill="primary600" />
                </IconContainer>

                <Box>
                  <Typography variant="beta" as="h2" marginBottom={2} textColor="neutral800">
                    Import Data
                  </Typography>
                  <Typography variant="omega" textColor="neutral600" marginBottom={3}>
                    Upload CSV files to efficiently create or update content in bulk with built-in validation
                  </Typography>

                  <Box paddingTop={2}>
                    <Typography variant="pi" textColor="neutral500" marginBottom={1}>
                      Perfect for:
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Bulk content creation
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Updating existing entries
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      • Data migration from other platforms
                    </Typography>
                  </Box>
                </Box>

                <Box marginTop="auto" width="100%">
                  <Divider background="neutral200" marginBottom={4} />
                  <Flex justifyContent="space-between" alignItems="center">
                    <Button size="L">
                      Start Import
                    </Button>
                    <ArrowIcon className="arrow-icon" width="20px" height="20px" fill="primary600" />
                  </Flex>
                </Box>
              </Flex>
            </ActionCard>
          </Grid.Item>
        </Grid.Root>

        <Box marginTop={8} padding={6} background="neutral100" hasRadius>
          <Flex alignItems="center" gap={3}>
            <Box
              padding={3}
              background="neutral0"
              hasRadius
            >
              <File width="24px" height="24px" fill="neutral600" />
            </Box>
            <Box>
              <Typography variant="delta" textColor="neutral700" marginBottom={1}>
                Getting Started
              </Typography>
              <Typography variant="omega" textColor="neutral600">
                Choose an action above to begin managing your content. All operations support CSV format with automatic field mapping.
              </Typography>
            </Box>
          </Flex>
        </Box>
        </ContentContainer>
      </Box>
    </Main>
  );
};

export { HomePage };
