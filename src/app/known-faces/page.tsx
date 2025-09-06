
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trash2, Loader2, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitleComponent, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getKnownFaces, deleteKnownFace } from '@/app/actions';

interface KnownFace {
  label: string;
  images: string[];
}

export default function KnownFacesPage() {
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFace, setSelectedFace] = useState<KnownFace | null>(null);
  const { toast } = useToast();

  const loadFaces = useCallback(async () => {
    try {
      const faces = await getKnownFaces();
      setKnownFaces(faces);
    } catch (error) {
      console.error("Failed to load faces:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load known faces.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFaces();
  }, [loadFaces]);

  const handleDeleteFace = async () => {
    if (!selectedFace) return;

    try {
        await deleteKnownFace(selectedFace.label);
        
        setKnownFaces(prevFaces => prevFaces.filter(face => face.label !== selectedFace.label));

        toast({
            title: 'Face Deleted',
            description: `${selectedFace.label} has been removed.`,
        });
    } catch (error) {
        console.error("Failed to delete face:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the face. Please try again.',
        });
    }
    setSelectedFace(null);
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Known Faces</h1>
            <div className="flex gap-2">
                <Button asChild variant="outline">
                    <Link href="/scanner">
                        <Camera className="mr-2 h-4 w-4" />
                        Back to Scanner
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading faces...</p>
          </div>
        ) : knownFaces.length > 0 ? (
          <div className="space-y-8">
            {knownFaces.map((faceGroup) => (
              <div key={faceGroup.label}>
                <h2 className="text-2xl font-semibold mb-4">{faceGroup.label}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.isArray(faceGroup.images) && faceGroup.images.map((image, index) => (
                    <Card key={`${faceGroup.label}-${index}`} className="text-center overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedFace(faceGroup)}>
                      <CardContent className="p-0">
                        <div className="relative w-full aspect-square">
                          {image && (
                           <img 
                              src={image} 
                              alt={`${faceGroup.label} - ${index + 1}`}
                              className="w-full h-full object-cover"
                              />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
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

      <Dialog open={!!selectedFace} onOpenChange={() => setSelectedFace(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {selectedFace && <DialogTitleComponent className="text-2xl">{selectedFace.label}</DialogTitleComponent>}
          </DialogHeader>
          {selectedFace && (
            <div className="flex justify-center p-4">
                <img src={selectedFace.images[0]} alt={selectedFace.label} className="rounded-md w-full h-auto object-cover" />
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteFace} disabled={!selectedFace}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
