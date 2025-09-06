
'use client';

import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/main-layout';

export default function ScannerPage() {
  return (
    <MainLayout title="Take Attendance">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col">
        <Card className="overflow-hidden shadow-2xl flex-1">
          <CardContent className="p-0 h-full">
            <FaceScanner />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
