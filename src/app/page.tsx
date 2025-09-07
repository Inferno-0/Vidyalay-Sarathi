
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Users, UserPlus, BookUser } from 'lucide-react';


export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center flex-1 overflow-hidden p-4">

      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-15%] w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-72 h-72 bg-green-500/10 rounded-full filter blur-3xl opacity-50 animate-pulse delay-2000"></div>


      <div className="relative z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-primary">
          Vidyalay Sarathi
        </h1>
        <p className="text-md md:text-lg text-muted-foreground max-w-md mx-auto">
          Smart Attendance Tracking Application for Rural Schools
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/attendance" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg rounded-2xl cursor-pointer bg-card">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <CalendarCheck className="w-16 h-16 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Take Attendance</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Start the live scanner and mark daily attendance.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/scanner" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg rounded-2xl cursor-pointer bg-card">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <UserPlus className="w-16 h-16 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Add New Student</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Enroll a new face into the recognition system.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/known-faces" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg rounded-2xl cursor-pointer bg-card">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="w-16 h-16 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Known Faces</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                View and manage the list of recognized individuals.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/attendance-history" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg rounded-2xl cursor-pointer bg-card">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <BookUser className="w-16 h-16 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Attendance Register</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                View and manage historical attendance records.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
