
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, Users, UserPlus, BookUser, Smile } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-green-500/10 rounded-full filter blur-3xl opacity-50 animate-pulse delay-2000"></div>
            {/* Wavy line top left */}
            <svg className="absolute top-0 left-0 w-1/4 h-1/4 text-primary/20 opacity-50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M 20,80 Q 40,20 80,60 T 160,50" />
            </svg>
             {/* Wavy line bottom right */}
            <svg className="absolute bottom-0 right-0 w-1/3 h-1/3 text-green-500/20 opacity-40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="none" stroke="currentColor" strokeWidth="2" d="M 30,150 Q 70,100 110,140 T 190,120" />
            </svg>
            <div className="absolute top-[15%] right-[10%] w-12 h-12 bg-primary/10 rounded-full filter blur-xl"></div>
            <div className="absolute bottom-[20%] left-[5%] w-8 h-8 bg-green-500/10 rounded-full filter blur-lg"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl">
          {/* Left Side: Title and Cards */}
          <div className="w-full lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0">
             <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-primary">
                Vidyalay Sarathi
              </h1>
              <p className="text-md md:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                Smart Attendance Tracking Application for Rural Schools
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          
          {/* Right Side: Illustration */}
          <div className="w-full lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
             <Image 
                src="https://storage.googleapis.com/app-prototyper.appspot.com/669f91a2214a4c5ffaba3983_5914611.png" 
                alt="Teacher with students taking attendance"
                width={600}
                height={500}
                className="max-w-sm md:max-w-md lg:max-w-lg"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
