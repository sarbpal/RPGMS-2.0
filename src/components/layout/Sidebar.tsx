import {
  AccountBalanceWallet,
  Apartment,
  Assessment,
  Bolt,
  Build,
  Dashboard,
  People,
  Settings,
} from '@mui/icons-material';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

const sidebarWidth = 240;

const menuItems = [
  { label: 'Dashboard', icon: <Dashboard /> },
  { label: 'Accommodation', icon: <Apartment /> },
  { label: 'Residents', icon: <People /> },
  { label: 'Finance', icon: <AccountBalanceWallet /> },
  { label: 'Electricity', icon: <Bolt /> },
  { label: 'Maintenance', icon: <Build /> },
  { label: 'Reports', icon: <Assessment /> },
  { label: 'Settings', icon: <Settings /> },
];

export function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: sidebarWidth,
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          top: '64px',
          width: sidebarWidth,
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map(({ label, icon }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton sx={{ borderRadius: 1.5, px: 1.5, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
