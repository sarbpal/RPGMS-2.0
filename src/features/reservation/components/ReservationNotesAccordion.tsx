import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Box,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import type { Reservation } from '../domain/entities/Reservation';

interface ReservationNotesAccordionProps {
  reservation: Reservation;
}

export const ReservationNotesAccordion: React.FC<ReservationNotesAccordionProps> = ({
  reservation,
}) => {
  const hasNotes = Boolean(reservation.notes && reservation.notes.trim().length > 0);

  return (
    <Accordion
      defaultExpanded={false}
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="reservation-notes-content"
        id="reservation-notes-header"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
          <NotesIcon color={hasNotes ? 'primary' : 'disabled'} fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Notes & Operator Remarks
          </Typography>
          <Chip
            label={hasNotes ? '1 entry' : 'None'}
            size="small"
            color={hasNotes ? 'primary' : 'default'}
            variant={hasNotes ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, ml: 'auto', mr: 1 }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 0.5 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            bgcolor: hasNotes ? '#f8fafc' : 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              color: hasNotes ? 'text.primary' : 'text.secondary',
              fontStyle: hasNotes ? 'normal' : 'italic',
              fontWeight: hasNotes ? 500 : 400,
            }}
          >
            {hasNotes ? reservation.notes : 'No operator remarks recorded.'}
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
