
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserPlus, Users, CalendarCheck, BookUser } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/scanner', label: 'Add New Student', icon: UserPlus },
  { href: '/known-faces', label: 'Known Faces', icon: Users },
  { href: '/attendance', label: 'Take Attendance', icon: CalendarCheck },
  { href: '/attendance-history', label: 'Attendance Register', icon: BookUser },
];

export default function MainLayout({ children, title }: MainLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
          <Sidebar>
            <SidebarContent className="flex flex-col">
              <SidebarHeader>
                <Link href="/" className="font-bold text-2xl" style={{ color: '#F97316' }}>
                 Vidyalay Sarathi
                </Link>
              </SidebarHeader>
              <SidebarMenu className="flex-1">
                {navLinks.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <Link href={link.href}>
                        <SidebarMenuButton isActive={pathname === link.href}>
                            <link.icon />
                            <span>{link.label}</span>
                        </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <div className="flex flex-col flex-1">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <div>
                    <SidebarTrigger/>
                </div>
                <h1 className="text-xl font-semibold">{title}</h1>
            </header>
            <main className="flex-1 p-4 sm:p-6">
              {children}
            </main>
          </div>
      </div>
    </SidebarProvider>
  );
}
