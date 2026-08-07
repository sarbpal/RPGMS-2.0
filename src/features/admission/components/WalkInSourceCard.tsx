import React from 'react';
import { Card, CardContent, Divider, Grid, Stack, Typography, Chip, Box } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const WalkInSourceCard: React.FC = () => {
  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PersonAddIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Admission Source Information
            </Typography>
          </Stack>
          <Chip label="Direct Walk-in" color="info" size="small" sx={{ fontWeight: 700 }} />
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Entry Source Type
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                Walk-in Prospect
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Entry Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {todayStr}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <InfoOutlinedIcon fontSize="small" sx={{ color: 'primary.main', mt: 0.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                Direct Walk-in Admission bypasses prior reservation setup. Enter prospect details, agreed commercial terms, and select an available flat and vacant bed to complete admission.
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
