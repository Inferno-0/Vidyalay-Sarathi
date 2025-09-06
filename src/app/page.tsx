import FaceScanner from '@/components/face-scanner';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="overflow-hidden shadow-2xl">
          <CardContent className="p-0">
            <FaceScanner />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
