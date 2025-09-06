
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getWelcomeMessage } from '@/app/actions';
import { Loader, Camera, Users } from 'lucide-react';
import Link from 'next/link';

declare const faceapi: any;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const FaceScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [unknownFaceDetected, setUnknownFaceDetected] = useState(false);
  const [knownFaces, setKnownFaces] = useState<any[]>([]);
  const [recentlyWelcomed, setRecentlyWelcomed] = useState<string[]>([]);
  const { toast } = useToast();
  const detectionInterval = useRef<NodeJS.Timeout>();

  const loadModels = useCallback(async () => {
    if (typeof faceapi === 'undefined') {
        setLoadingMessage('FaceAPI script not loaded yet. Retrying...');
        return false;
    }
    setLoadingMessage('Loading models...');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    return true;
  }, []);

  const startVideo = useCallback(async () => {
    setLoadingMessage('Accessing camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setLoadingMessage('Camera access denied. Please enable camera permissions.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
        const modelsLoaded = await loadModels();
        if (modelsLoaded) {
            // Load known faces from localStorage
            const savedFacesJson = localStorage.getItem('knownFaces');
            if (savedFacesJson) {
                const savedFaces = JSON.parse(savedFacesJson);
                const loadedDescriptors = savedFaces.map((face: any) => 
                    new faceapi.LabeledFaceDescriptors(
                        face.label,
                        face.descriptors.map((d: number[]) => new Float32Array(d))
                    )
                );
                setKnownFaces(loadedDescriptors);
            }
            startVideo();
        } else {
            setTimeout(init, 1000); // Retry if faceapi is not ready
        }
    };
    init();

    return () => {
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current);
        }
    }
  }, [loadModels, startVideo]);


  const handleWelcome = useCallback(async (name: string) => {
    if (recentlyWelcomed.includes(name)) return;

    setRecentlyWelcomed(prev => [...prev, name]);
    setTimeout(() => {
        setRecentlyWelcomed(prev => prev.filter(n => n !== name));
    }, 30000); // 30 second cooldown

    const result = await getWelcomeMessage(name);
    if ('message' in result) {
      toast({
        title: `Welcome, ${name}!`,
        description: result.message,
      });
    }
  }, [recentlyWelcomed, toast]);

  const handlePlay = useCallback(() => {
    setLoadingMessage('');
    setIsReady(true);
    
    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || typeof faceapi === 'undefined' || isDialogOpen) {
        return;
      }
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

      let foundUnknownFace = false;
      if (resizedDetections.length > 0) {
        if (knownFaces.length > 0) {
          const faceMatcher = new faceapi.FaceMatcher(knownFaces, 0.6);
          
          resizedDetections.forEach((detection: any) => {
            const { descriptor } = detection;
            const bestMatch = faceMatcher.findBestMatch(descriptor);
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: bestMatch.toString(),
              boxColor: bestMatch.label !== 'unknown' ? '#2ECC71' : '#E74C3C',
            });
            drawBox.draw(canvas);

            if (bestMatch.label !== 'unknown') {
              handleWelcome(bestMatch.label);
            } else {
              foundUnknownFace = true;
            }
          });
        } else {
          foundUnknownFace = true;
          resizedDetections.forEach((detection: any) => {
              const box = detection.detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { 
                label: 'unknown',
                boxColor: '#E74C3C'
              });
              drawBox.draw(canvas);
          });
        }
      }
      setUnknownFaceDetected(foundUnknownFace);
    }, 200);

  }, [handleWelcome, isDialogOpen, knownFaces]);

  const handleCaptureFace = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setIsDialogOpen(true);
      }
    }
  };

  const handleSaveFace = async () => {
    if (newFaceName && capturedImage) {
        const imageElement = await faceapi.fetchImage(capturedImage);
        const detection = await faceapi
          .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (!detection) {
             toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "Could not detect a face in the captured image. Please try again.",
            });
            return;
        }

        const newKnownFace = new faceapi.LabeledFaceDescriptors(newFaceName, [detection.descriptor]);
        const updatedKnownFaces = [...knownFaces, newKnownFace];
        setKnownFaces(updatedKnownFaces);

        const facesToSave = updatedKnownFaces.map(face => ({
            label: face.label,
            descriptors: face.descriptors.map(d => Array.from(d))
        }));
        localStorage.setItem('knownFaces', JSON.stringify(facesToSave));

        toast({
            title: "Face Saved!",
            description: `${newFaceName} has been added to your known faces.`,
        });
        
        setIsDialogOpen(false);
        setNewFaceName('');
        setCapturedImage(null);
    }
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewFaceName('');
    setCapturedImage(null);
  }

  return (
    <div className="relative w-full aspect-video bg-card flex items-center justify-center">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      )}
      <video
        ref={videoRef}
        onPlay={handlePlay}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

       {isReady && (
        <div className="absolute top-4 right-4 z-20">
            <Button asChild>
                <Link href="/known-faces">
                    <Users className="mr-2 h-5 w-5" />
                    Known Faces
                </Link>
            </Button>
        </div>
       )}

      {isReady && unknownFaceDetected && !isDialogOpen && (
         <Button 
            onClick={handleCaptureFace}
            className="absolute bottom-4 right-4 z-20 animate-pulse"
            size="lg"
            >
            <Camera className="mr-2 h-5 w-5" />
            Capture New Face
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save New Face</DialogTitle>
            <DialogDescription>
              A new face was detected. Enter a name to save it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {capturedImage && (
                <div className="flex justify-center">
                    <img src={capturedImage} alt="Captured face" className="rounded-md w-48 h-48 object-cover" style={{ transform: 'scaleX(-1)' }} />
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newFaceName}
                onChange={(e) => setNewFaceName(e.target.value)}
                className="col-span-3"
                placeholder="Enter name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSaveFace}>Save Face</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaceScanner;
