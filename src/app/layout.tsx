
'use client';
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"


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
        <main className="relative flex flex-col min-h-screen p-4 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Carousel
                    className="w-full h-full"
                    plugins={[ Autoplay({ delay: 5000, stopOnInteraction: false })]}
                    opts={{ loop: true }}
                >
                    <CarouselContent>
                    <CarouselItem>
                        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
                            <source src="https://cdn.jsdelivr.net/gh/firebase/genkit/site/docs/assets/solutions/vidyalay-sarathi/teacher_takes_attendance_phone.mp4" type="video/mp4" />
                        </video>
                    </CarouselItem>
                    </CarouselContent>
                </Carousel>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
              {children}
            </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
