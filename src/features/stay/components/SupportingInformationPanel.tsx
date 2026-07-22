import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import type { SupportingInformationViewModel } from '../application/models/StayWorkspaceViewModel';

interface SupportingInformationPanelProps {
  data: SupportingInformationViewModel;
}

export function SupportingInformationPanel({ data }: SupportingInformationPanelProps) {
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
                {data.documents.map((doc) => (
                  <Stack key={doc.name} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {doc.name}
                    </Typography>
                    <Chip label={doc.status} color={doc.statusColor} size="small" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Emergency Contact
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.emergencyContact.name} ({data.emergencyContact.relationship})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {data.emergencyContact.phone}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Stay Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.notes}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
