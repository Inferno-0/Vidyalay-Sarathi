
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, UserPlus, Users, CalendarCheck, BookUser } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-4xl items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px]">
               <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-lg font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${
                      pathname === link.href ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="flex-1">
            <Link href="/" className="md:hidden text-xl font-bold">{title}</Link>
             <h1 className="hidden md:block text-2xl font-bold">{title}</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
