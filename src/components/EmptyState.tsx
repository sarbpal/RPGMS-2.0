import type { ReactNode } from 'react';

import { Box, Stack, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 2,
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 400, alignItems: 'center' }}>
        {icon && (
          <Box
            sx={{
              color: 'text.secondary',
              display: 'flex',
              '& svg': { fontSize: 48 },
            }}
          >
            {icon}
          </Box>
        )}
        <Stack spacing={1}>
          <Typography variant="h6">{title}</Typography>
          {description && (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          )}
        </Stack>
        {action && <Box sx={{ pt: 1 }}>{action}</Box>}
      </Stack>
    </Box>
  );
}
