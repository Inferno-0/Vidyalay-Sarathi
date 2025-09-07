
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, UserPlus, BookUser, Smile } from 'lucide-react';

const TopLeftRibbon = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 z-0 opacity-50">
        <path d="M-50 50C-50 50 50 -50 150 50S250 150 150 150S-50 50 -50 50Z" fill="#FFE9D6"/>
    </svg>
);

const BottomRightBubbles = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 right-0 z-0 opacity-50">
        <circle cx="150" cy="150" r="50" fill="#E8F9F2"/>
        <circle cx="175" cy="125" r="25" fill="#E8F9F2"/>
    </svg>
);

const TopRightBubbles = () => (
    <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[-2rem] right-[-2rem] z-0 opacity-40">
        <circle cx="100" cy="50" r="80" fill="#D6EAF8" />
        <circle cx="150" cy="100" r="30" fill="#D6EAF8" />
    </svg>
);

const BottomLeftRibbon = () => (
    <svg width="250" height="250" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-[-3rem] left-[-3rem] z-0 opacity-30 transform -scale-x-100">
        <path d="M-50 50C-50 50 50 -50 150 50S250 150 150 150S-50 50 -50 50Z" fill="#FADBD8" />
    </svg>
);


export default function Home() {
  return (
    <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <TopLeftRibbon />
        <BottomRightBubbles />
        <TopRightBubbles />
        <BottomLeftRibbon />

        <div className="relative z-10 w-full max-w-4xl p-8">
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-primary">
                Vidyalay Sarathi
              </h1>
              <p className="text-md md:text-lg text-muted-foreground max-w-md mx-auto">
                Smart Attendance Tracking Application for Rural Schools
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/attendance" passHref>
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card">
                    <CardHeader className="p-6">
                      <CalendarCheck className="w-12 h-12 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <CardTitle className="text-xl font-bold">Take Attendance</CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground text-sm">
                        Start the live scanner and mark daily attendance.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                
                <Link href="/scanner" passHref>
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card">
                    <CardHeader className="p-6">
                      <UserPlus className="w-12 h-12 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <CardTitle className="text-xl font-bold">Add New Student</CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground text-sm">
                        Enroll a new face into the recognition system.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/known-faces" passHref>
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card">
                    <CardHeader className="p-6">
                      <Smile className="w-12 h-12 mb-4 text-green-500 transition-transform duration-300 group-hover:scale-110" />
                      <CardTitle className="text-xl font-bold">Known Faces</CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground text-sm">
                        View and manage the list of recognized individuals.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/attendance-history" passHref>
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card">
                    <CardHeader className="p-6">
                      <BookUser className="w-12 h-12 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <CardTitle className="text-xl font-bold">Attendance Register</CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground text-sm">
                        View and manage historical attendance records.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
            </div>
        </div>
    </div>
  );
}
