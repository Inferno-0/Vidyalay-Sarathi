
'use client';

import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

export default function ScannerPage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Take Attendance</h1>
            </div>
            <Button asChild>
                <Link href="/known-faces">
                    <Users className="mr-2 h-4 w-4" />
                    Known Faces
                </Link>
            </Button>
        </div>
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <FaceScanner />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
