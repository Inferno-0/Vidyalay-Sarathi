import FaceScanner from '@/components/face-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary font-headline">
            Face Scanner
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Real-time face detection and recognition.
          </p>
        </header>
        <Card className="overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Live Face Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FaceScanner />
          </CardContent>
        </Card>
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Point your camera at a face. Unknown faces can be saved with a name.</p>
          <p>Press `ctrl+b` or `cmd+b` to toggle the sidebar (if available).</p>
        </footer>
      </div>
    </main>
  );
}
