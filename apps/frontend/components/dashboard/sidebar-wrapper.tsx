'use client';

import { AppSidebar } from '@/components/app-sidebar';

interface SidebarWrapperProps {
  user: { name: string; email: string; avatar: string };
  userRole: 'admin' | 'maintainer' | null;
}

export function SidebarWrapper({ user, userRole }: SidebarWrapperProps) {
  return <AppSidebar user={user} userRole={userRole} />;
}
