
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface KnownFace {
  label: string;
}

export default function KnownFacesPage() {
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedFacesJson = localStorage.getItem('knownFaces');
    if (savedFacesJson) {
      const savedFaces = JSON.parse(savedFacesJson);
      setKnownFaces(savedFaces);
    }
    setLoading(false);
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Known Faces</h1>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Scanner
                </Link>
            </Button>
        </div>

        {loading ? (
          <p>Loading faces...</p>
        ) : knownFaces.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {knownFaces.map((face, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{face.label}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTitle>No Known Faces</AlertTitle>
            <AlertDescription>
              No faces have been saved yet. Go back to the scanner to add some.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}
