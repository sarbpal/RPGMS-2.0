import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

export function SupportingInformationPanel() {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Supporting Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Documents, emergency contacts reference, and operational notes.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Verification Documents
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Aadhaar Card
                  </Typography>
                  <Chip label="Verified" color="success" size="small" variant="outlined" />
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Rental Agreement
                  </Typography>
                  <Chip label="Signed" color="primary" size="small" variant="outlined" />
                </Stack>
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Emergency Contact
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Ramesh Kumar (Father)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: +91 98765 43210
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Stay Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requested top bunk bed near window. Shifted flat on 15-May-2026.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
