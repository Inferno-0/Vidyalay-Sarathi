
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Camera, Users } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/scanner', label: 'Take Attendance', icon: Camera },
  { href: '/known-faces', label: 'Known Faces', icon: Users },
];

export default function MainLayout({ children, title }: MainLayoutProps) {
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
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-lg font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="hidden md:flex items-center gap-6">
             <Link href="/" className="text-xl font-bold mr-4">
                AI Attendance
             </Link>
             {navLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    {link.label}
                </Link>
             ))}
          </div>

          <div className="flex-1 md:hidden">
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="hidden md:block text-3xl font-bold mb-6 self-start">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
