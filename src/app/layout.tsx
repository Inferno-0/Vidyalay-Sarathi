
'use client';
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Vidyalay Sarathi</title>
        <meta name="description" content="An AI-powered attendance tracking application" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script defer src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
      </head>
      <body className="font-body antialiased">
        <main className="relative flex flex-col min-h-screen">
             <div className="fixed bottom-4 right-4 z-20 w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl overflow-hidden pointer-events-none">
                <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
                    <source src="https://cdn.jsdelivr.net/gh/firebase/genkit/site/docs/assets/solutions/vidyalay-sarathi/teacher_takes_attendance_phone.mp4" type="video/mp4" />
                </video>
            </div>
            {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
