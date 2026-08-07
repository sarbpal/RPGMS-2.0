import { Box, Chip, Paper, Typography, Button } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';

interface ReservationsToolbarProps {
  totalCount: number;
  activeCount: number;
}

export function ReservationsToolbar({
  totalCount,
  activeCount,
}: ReservationsToolbarProps) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EventAvailableIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Reservation Portfolio
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip
          label={`Total: ${totalCount}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Active: ${activeCount}`}
          color="success"
          size="small"
          variant="outlined"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/admission/walk-in')}
          sx={{ fontWeight: 700, textTransform: 'none', ml: 1 }}
        >
          Walk-in Admission
        </Button>
      </Box>
    </Paper>
  );
}
