
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

interface KnownFace {
  label: string;
  image: string;
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
              <Card key={index} className="text-center overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative w-full aspect-square">
                     <Image 
                        src={face.image} 
                        alt={face.label} 
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="person face"
                        />
                  </div>
                </CardContent>
                <CardHeader className="p-4">
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
