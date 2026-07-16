import { Box, Card, CardContent, Typography } from '@mui/material';

export interface AccommodationStats {
  totalFlats: number;
  totalBeds: number;
  vacantBeds: number;
  occupiedBeds: number;
  onNoticeBeds: number;
}

interface AccommodationSummaryProps {
  stats?: AccommodationStats;
  onCardClick?: (key: string) => void;
}

export function AccommodationSummary({ stats, onCardClick }: AccommodationSummaryProps) {
  const cards = [
    {
      key: 'TOTAL_FLATS',
      label: 'Total Flats',
      value: stats ? stats.totalFlats.toString() : '0',
    },
    {
      key: 'TOTAL_BEDS',
      label: 'Total Beds',
      value: stats ? stats.totalBeds.toString() : '0',
    },
    {
      key: 'VACANT',
      label: 'Vacant Beds',
      value: stats ? stats.vacantBeds.toString() : '0',
      color: 'success.main',
    },
    {
      key: 'OCCUPIED',
      label: 'Occupied Beds',
      value: stats ? stats.occupiedBeds.toString() : '0',
      color: 'primary.main',
    },
    {
      key: 'ON_NOTICE',
      label: 'On Notice',
      value: stats ? stats.onNoticeBeds.toString() : '0',
      color: 'warning.main',
    },
  ];

  const handleCardClick = (key: string) => {
    console.log(key);
    if (onCardClick) {
      onCardClick(key);
    }
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.label}
          elevation={0}
          onClick={() => handleCardClick(card.key)}
          sx={{
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            },
          }}
        >
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography color="text.secondary" variant="body2">
              {card.label}
            </Typography>
            <Typography
              sx={{ mt: 1, fontWeight: 700, color: card.color || 'text.primary' }}
              variant="h4"
            >
              {card.value}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
