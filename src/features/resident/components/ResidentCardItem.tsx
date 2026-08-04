import { Avatar, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Person, Phone } from '@mui/icons-material';
import type { ResidentCardViewModel } from '../application/models/ResidentsListViewModel';

interface ResidentCardItemProps {
  resident: ResidentCardViewModel;
  onClick: () => void;
}

export function ResidentCardItem({ resident, onClick }: ResidentCardItemProps) {
  const getChipColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_NOTICE':
        return 'warning';
      case 'CHECKED_OUT':
      case 'ALUMNI':
        return 'default';
      default:
        return 'primary';
    }
  };

  const formattedFlat = resident.flat ? resident.flat.replace(/^Flat\s*/i, '') : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 3,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 0.5 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            {/* Top Row: Avatar, Name & Status Badge */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', width: 42, height: 42 }}>
                  <Person />
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {resident.fullName}
                </Typography>
              </Stack>
              <Chip
                label={resident.statusLabel}
                color={getChipColor(resident.status)}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            </Stack>

            {/* Resident Code */}
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              Code: {resident.residentCode}
            </Typography>

            {/* Primary Mobile */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Phone fontSize="small" color="action" sx={{ fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {resident.mobileNumber}
              </Typography>
            </Stack>

            {/* Current Stay Information Section (Flat, Bed, Door ID grouped together) */}
            <Stack
              direction="row"
              spacing={2}
              sx={{
                pt: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {formattedFlat && resident.bed ? (
                <>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Flat :
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {formattedFlat}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Bed :
                    </Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {resident.bed}
                    </Typography>
                  </Stack>
                  {resident.doorId && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Door :
                      </Typography>
                      <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                        {resident.doorId}
                      </Typography>
                    </Stack>
                  )}
                </>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                  No Active Stay
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
