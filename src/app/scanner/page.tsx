
'use client';

import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/main-layout';

export default function ScannerPage() {
  return (
    <MainLayout title="Take Attendance">
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto pb-4 sm:pb-8">
        <Card className="overflow-hidden shadow-2xl flex-1">
          <CardContent className="p-0 h-full">
            <FaceScanner />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
