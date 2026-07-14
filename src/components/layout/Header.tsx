import { AppBar, Avatar, Box, Toolbar, Typography } from '@mui/material';

export function Header() {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="transparent"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          minHeight: '64px !important',
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box>
          <Avatar variant="rounded" color="primary">
            R
          </Avatar>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          RPGMS 2.0
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Avatar>U</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
