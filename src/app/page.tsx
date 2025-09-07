
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Users, UserPlus, BookUser, Smile } from 'lucide-react';
import Image from 'next/image';

const WavyLine = () => (
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
        <path d="M0 10C10 0, 20 20, 30 10S50 0, 60 10" stroke="#FFE9D6" strokeWidth="2"/>
    </svg>
);

const Dots = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
        <circle cx="5" cy="5" r="2" fill="#E8F9F2"/>
        <circle cx="15" cy="5" r="2" fill="#E8F9F2"/>
        <circle cx="25" cy="5" r="2" fill="#E8F9F2"/>
        <circle cx="35" cy="5" r="2" fill="#E8F9F2"/>
        <circle cx="5" cy="15" r="2" fill="#E8F9F2"/>
        <circle cx="15" cy="15" r="2" fill="#E8F9F2"/>
        <circle cx="25" cy="15" r="2" fill="#E8F9F2"/>
        <circle cx="35" cy="15" r="2" fill="#E8F9F2"/>
        <circle cx="5" cy="25" r="2" fill="#E8F9F2"/>
        <circle cx="15" cy="25" r="2" fill="#E8F9F2"/>
        <circle cx="25" cy="25" r="2" fill="#E8F9F2"/>
        <circle cx="35" cy="25" r="2" fill="#E8F9F2"/>
        <circle cx="5" cy="35" r="2" fill="#E8F9F2"/>
        <circle cx="15" cy="35" r="2" fill="#E8F9F2"/>
        <circle cx="25" cy="35" r="2" fill="#E8F9F2"/>
        <circle cx="35" cy="35" r="2" fill="#E8F9F2"/>
    </svg>
);


export default function Home() {
  return (
    <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-10 left-10 z-0">
            <WavyLine />
        </div>
        <div className="absolute bottom-10 right-10 z-0">
            <Dots />
        </div>

        <div className="relative z-10 w-full max-w-6xl p-8 grid grid-cols-1 items-center">
            <div className="flex flex-col">
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
    </div>
  );
}
