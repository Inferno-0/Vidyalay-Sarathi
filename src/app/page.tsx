
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Users, UserPlus, BookUser, Smile } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-cover bg-center" style={{backgroundImage: "url('https://storage.googleapis.com/app-prototyper.appspot.com/66a4f387e3a364121a88a032/5914611.png')"}}>
        <div className="relative z-10 w-full max-w-4xl p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-primary">
                Vidyalay Sarathi
              </h1>
              <p className="text-md md:text-lg text-muted-foreground max-w-md mx-auto">
                Smart Attendance Tracking Application for Rural Schools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/attendance" passHref>
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card border-border/20">
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
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card border-border/20">
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
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card border-border/20">
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
                  <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg rounded-2xl cursor-pointer bg-card border-border/20">
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
