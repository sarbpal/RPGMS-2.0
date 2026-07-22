import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

const placeholderDocuments = [
  { id: 'doc-1', type: 'Aadhaar Card', number: 'XXXX-XXXX-1234', status: 'Verified', color: 'success' as const },
  { id: 'doc-2', type: 'PAN Card', number: 'ABCDE1234F', status: 'Verified', color: 'success' as const },
  { id: 'doc-3', type: 'Rental Agreement', number: 'AGR-2026-089', status: 'Signed', color: 'primary' as const },
];

export function DocumentsCard() {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Identity & Legal Documents
        </Typography>

        <Stack spacing={1.5}>
          {placeholderDocuments.map((doc) => (
            <Box
              key={doc.id}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {doc.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No: {doc.number}
                </Typography>
              </Box>
              <Chip label={doc.status} color={doc.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
