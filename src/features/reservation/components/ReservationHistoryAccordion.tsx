import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import type { Reservation } from '../domain/entities/Reservation';

interface ReservationHistoryAccordionProps {
  reservation: Reservation;
}

export const ReservationHistoryAccordion: React.FC<ReservationHistoryAccordionProps> = ({
  reservation,
}) => {
  const auditEntries = reservation.auditLog || [];
  const entryCount = auditEntries.length;

  const formatTimestamp = (timestampStr: string) => {
    if (!timestampStr) return 'N/A';
    try {
      const date = new Date(timestampStr);
      if (isNaN(date.getTime())) return timestampStr;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestampStr;
    }
  };

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
        aria-controls="reservation-history-content"
        id="reservation-history-header"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
          <HistoryIcon color={entryCount > 0 ? 'primary' : 'disabled'} fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Reservation History
          </Typography>
          <Chip
            label={entryCount > 0 ? `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}` : 'None'}
            size="small"
            color={entryCount > 0 ? 'primary' : 'default'}
            variant={entryCount > 0 ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, ml: 'auto', mr: 1 }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 0.5 }}>
        {entryCount === 0 ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No audit history recorded.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {auditEntries.map((entry, index) => (
              <Box key={index} sx={{ py: 0.5 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 0.5,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      label={entry.action}
                      size="small"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                    {entry.performedBy && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        by {entry.performedBy}
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    {formatTimestamp(entry.timestamp)}
                  </Typography>
                </Stack>
                {entry.details && (
                  <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5, pl: 0.5 }}>
                    {entry.details}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
