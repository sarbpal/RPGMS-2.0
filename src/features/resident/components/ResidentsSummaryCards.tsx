import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import type { ResidentListFilter, ResidentSummaryStatsViewModel } from '../application/models/ResidentsListViewModel';

interface ResidentsSummaryCardsProps {
  summary: ResidentSummaryStatsViewModel;
  activeFilter: ResidentListFilter;
  onFilterChange: (filter: ResidentListFilter) => void;
}

export function ResidentsSummaryCards({
  summary,
  activeFilter,
  onFilterChange,
}: ResidentsSummaryCardsProps) {
  const cards: { label: string; count: number; filter: ResidentListFilter; color: string }[] = [
    {
      label: 'Total Residents',
      count: summary.totalCount,
      filter: 'ALL',
      color: 'primary.main',
    },
    {
      label: 'Active',
      count: summary.activeCount,
      filter: 'ACTIVE',
      color: 'success.main',
    },
    {
      label: 'On Notice',
      count: summary.onNoticeCount,
      filter: 'ON_NOTICE',
      color: 'warning.main',
    },
    {
      label: 'Alumni',
      count: summary.alumniCount,
      filter: 'ALUMNI',
      color: 'text.secondary',
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => {
        const isSelected = activeFilter === card.filter;
        return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.filter}>
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
              <CardActionArea onClick={() => onFilterChange(card.filter)}>
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
                      {card.count}
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
