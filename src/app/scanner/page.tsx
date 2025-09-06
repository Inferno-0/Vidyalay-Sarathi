
'use client';

import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

export default function ScannerPage() {
  return (
    <main className="flex flex-col h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
         <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 self-start">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold whitespace-nowrap">Take Attendance</h1>
            </div>
            <Button asChild className="w-full sm:w-auto">
                <Link href="/known-faces">
                    <Users className="mr-2 h-4 w-4" />
                    Known Faces
                </Link>
            </Button>
        </div>
      </div>
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 pb-4 sm:pb-8">
        <Card className="overflow-hidden shadow-2xl h-full">
          <CardContent className="p-0 h-full">
            <FaceScanner />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
