import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import type { TimelineEventViewModel } from '../application/models/StayWorkspaceViewModel';

interface TimelinePanelProps {
  events: TimelineEventViewModel[];
}

export function TimelinePanel({ events }: TimelinePanelProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Recent Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chronological activity stream of events for this stay.
        </Typography>

        <List disablePadding>
          {events.map((evt, idx) => (
            <Box key={evt.id}>
              {idx > 0 && <Divider component="li" />}
              <ListItem sx={{ py: 1.5, px: 1 }}>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Chip
                        label={evt.type}
                        size="small"
                        color={evt.color}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {evt.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 'auto !important' }}
                      >
                        {evt.date}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {evt.description}
                    </Typography>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
