import type { ReactNode } from 'react';

import { Box } from '@mui/material';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <Sidebar />

      <Box component="main" sx={{ ml: { xs: 0, md: '240px' } }}>
        {children}
      </Box>
    </>
  );
}
