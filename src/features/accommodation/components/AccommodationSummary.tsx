import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';

export interface AccommodationStats {
  totalFlats: number;
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  onNoticeBeds: number;
}

interface AccommodationSummaryProps {
  stats?: AccommodationStats;
  activeFilter?: string;
  onCardClick?: (key: string) => void;
}

export function AccommodationSummary({ stats, activeFilter = 'ALL', onCardClick }: AccommodationSummaryProps) {
  const cards = [
    {
      key: 'TOTAL_FLATS',
      filter: 'ALL',
      label: 'Total Flats',
      value: stats ? stats.totalFlats.toString() : '0',
      color: 'primary.main',
    },
    {
      key: 'TOTAL_BEDS',
      filter: 'ALL_BEDS',
      label: 'Total Beds',
      value: stats ? stats.totalBeds.toString() : '0',
      color: 'primary.main',
    },
    {
      key: 'VACANT',
      filter: 'VACANT',
      label: 'Vacant Beds',
      value: stats ? stats.vacantBeds.toString() : '0',
      color: 'success.main',
    },
    {
      key: 'OCCUPIED',
      filter: 'OCCUPIED',
      label: 'Occupied Beds',
      value: stats ? stats.occupiedBeds.toString() : '0',
      color: 'primary.main',
    },
    {
      key: 'ON_NOTICE',
      filter: 'ON_NOTICE',
      label: 'On Notice',
      value: stats ? stats.onNoticeBeds.toString() : '0',
      color: 'warning.main',
    },
  ];

  const handleCardClick = (key: string) => {
    if (onCardClick) {
      onCardClick(key);
    }
  };

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {cards.map((card) => {
        const isSelected =
          card.key === 'TOTAL_FLATS'
            ? activeFilter === 'ALL'
            : activeFilter === card.filter;

        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={card.key}>
            <Card
              variant={isSelected ? 'elevation' : 'outlined'}
              elevation={isSelected ? 3 : 0}
              sx={{
                borderRadius: 2.5,
                position: 'relative',
                overflow: 'hidden',
                borderColor: isSelected ? card.color : 'divider',
                borderWidth: isSelected ? 2 : 1,
                borderStyle: 'solid',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease-in-out',
                '&::before': isSelected
                  ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      bgcolor: card.color,
                    }
                  : {},
                '&:hover': {
                  borderColor: card.color,
                  boxShadow: 2,
                },
              }}
            >
              <CardActionArea onClick={() => handleCardClick(card.key)} sx={{ height: '100%' }}>
                <CardContent sx={{ py: 2, px: 2.5 }}>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="body2"
                      color={isSelected ? 'text.primary' : 'text.secondary'}
                      sx={{ fontWeight: isSelected ? 700 : 600 }}
                    >
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: card.color,
                        fontWeight: 800,
                        fontSize: isSelected ? '2.1rem' : '1.9rem',
                        transition: 'font-size 0.2s ease',
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
