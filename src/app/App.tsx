import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';

import { MainLayout } from '../components/layout/MainLayout';
import { APP } from '../constants/app';

function App() {
  return (
    <MainLayout>
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 64px)',
            pt: '64px',
          }}
        >
          <Card elevation={3} sx={{ width: '100%', maxWidth: 650 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h4" gutterBottom>
                {APP.name}
              </Typography>

              <Typography variant="h6" color="text.secondary">
                {APP.pgName}
              </Typography>

              <Typography sx={{ mt: 3 }}>
                Welcome to RPGMS 2.0
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4 }}
              >
                Version {APP.version}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </MainLayout>
  );
}

export default App;
