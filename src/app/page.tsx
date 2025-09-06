import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          AI Attendance Tracker
        </h1>
        <p className="text-lg text-muted-foreground">
          Streamline your attendance process with smart face recognition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/scanner" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <Camera className="w-16 h-16 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Take Attendance</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                Start the camera to recognize faces and mark attendance.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/known-faces" passHref>
          <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/20 cursor-pointer">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="w-16 h-16 mb-4 text-accent transition-transform duration-300 group-hover:scale-110" />
              <CardTitle className="text-2xl font-bold">Known Faces</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                View and manage the list of recognized individuals.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}
