import React from 'react';
import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import type { Reservation } from '../domain/entities/Reservation';

interface ReservationNotesCardProps {
  reservation: Reservation;
}

export const ReservationNotesCard: React.FC<ReservationNotesCardProps> = ({ reservation }) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <NotesIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notes & Operator Remarks
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: reservation.notes ? '#f8fafc' : 'action.hover',
            border: '1px solid #e2e8f0',
            minHeight: 80,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: reservation.notes ? 500 : 400,
              color: reservation.notes ? 'text.primary' : 'text.secondary',
              fontStyle: reservation.notes ? 'normal' : 'italic',
              whiteSpace: 'pre-wrap',
            }}
          >
            {reservation.notes || 'No operator remarks recorded.'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
