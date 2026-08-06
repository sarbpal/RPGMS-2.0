import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Button, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import type { Reservation } from '../domain/entities/Reservation';
import {
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
} from '../domain/rules/reservationRules';

interface ReservationActionsCardProps {
  reservation: Reservation;
  onEdit: () => void;
  onCancel: () => void;
  onConvert: () => void;
}

export const ReservationActionsCard: React.FC<ReservationActionsCardProps> = ({
  reservation,
  onEdit,
  onCancel,
  onConvert,
}) => {
  const editCheck = canEditReservation(reservation.status);
  const cancelCheck = canCancelReservation(reservation.status);
  const convertCheck = canConvertReservation(reservation.status);

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Reservation Actions
        </Typography>

        <Grid container spacing={2.5}>
          {/* Action 1: Edit Reservation */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: editCheck.allowed ? 'background.paper' : '#f8fafc',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <EditIcon color={editCheck.allowed ? 'primary' : 'disabled'} fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Edit Reservation
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Revise expected joining date, commercial terms, accommodation preferences, or remarks.
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<EditIcon />}
                  disabled={!editCheck.allowed}
                  onClick={onEdit}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Edit Reservation
                </Button>
                {!editCheck.allowed && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                    {editCheck.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Action 2: Convert to Admission */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: convertCheck.allowed ? 'background.paper' : '#f8fafc',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <HowToRegIcon color={convertCheck.allowed ? 'success' : 'disabled'} fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Convert to Admission
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Initiate resident admission workflow and transfer expected details into active residency.
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<HowToRegIcon />}
                  disabled={!convertCheck.allowed}
                  onClick={onConvert}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Convert to Admission
                </Button>
                {!convertCheck.allowed && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                    {convertCheck.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Action 3: Cancel Reservation */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: cancelCheck.allowed ? 'background.paper' : '#f8fafc',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <CancelIcon color={cancelCheck.allowed ? 'error' : 'disabled'} fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Cancel Reservation
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Conclude expected admission without proceeding. Marks reservation as permanently read-only.
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  disabled={!cancelCheck.allowed}
                  onClick={onCancel}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Cancel Reservation
                </Button>
                {!cancelCheck.allowed && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                    {cancelCheck.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
