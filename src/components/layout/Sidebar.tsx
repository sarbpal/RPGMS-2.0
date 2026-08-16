import {
  AccountBalanceWallet,
  Apartment,
  Assessment,
  Bolt,
  Build,
  Dashboard,
  People,
  Settings,
  EventAvailable,
  Hotel,
  ReceiptLong,
} from '@mui/icons-material';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { NavLink } from 'react-router-dom';

const sidebarWidth = 240;

const menuItems = [
  { label: 'Dashboard', icon: <Dashboard />, to: '/' },
  { label: 'Accommodation', icon: <Apartment />, to: '/accommodation' },
  { label: 'Reservations', icon: <EventAvailable />, to: '/reservations' },
  { label: 'Residents', icon: <People />, to: '/residents' },
  { label: 'Stays', icon: <Hotel />, to: '/stays' },
  { label: 'Billing', icon: <ReceiptLong />, to: '/billing' },
  { label: 'Finance', icon: <AccountBalanceWallet />, to: '/finance' },
  { label: 'Electricity', icon: <Bolt />, to: '/electricity' },
  { label: 'Maintenance', icon: <Build />, to: '/maintenance' },
  { label: 'Reports', icon: <Assessment />, to: '/reports' },
  { label: 'Settings', icon: <Settings />, to: '/settings' },
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
        {menuItems.map(({ label, icon, to }) => (
          <ListItem key={label} disablePadding>
            <ListItemButton
              component={NavLink}
              end={to === '/'}
              sx={{
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
                '&.active': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
              to={to}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
