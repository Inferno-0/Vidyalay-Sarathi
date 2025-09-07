
'use client';

import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/main-layout';

export default function ScannerPage() {
  return (
    <MainLayout title="Add New Student">
      <div className="flex-1 flex items-center justify-center w-full">
        <Card className="overflow-hidden shadow-2xl w-full max-w-6xl">
            <FaceScanner />
        </Card>
      </div>
    </MainLayout>
  );
}
