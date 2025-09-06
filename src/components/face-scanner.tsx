
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getWelcomeMessage } from '@/app/actions';
import { Loader, UserPlus } from 'lucide-react';

declare const faceapi: any;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const FaceScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [currentDescriptor, setCurrentDescriptor] = useState<Float32Array | null>(null);
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
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || typeof faceapi === 'undefined') {
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
            if (!isDialogOpen) {
              setCurrentDescriptor(descriptor);
            }
          }
        });
      } else {
        resizedDetections.forEach((detection: any) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: 'unknown',
              boxColor: '#E74C3C'
            });
            drawBox.draw(canvas);
            if (!isDialogOpen) {
              setCurrentDescriptor(detection.descriptor);
            }
        });
      }
    }, 200);

  }, [handleWelcome, isDialogOpen, knownFaces]);

  const handleSaveFace = () => {
    if (newFaceName && currentDescriptor) {
        const newKnownFace = new faceapi.LabeledFaceDescriptors(newFaceName, [currentDescriptor]);
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
        setCurrentDescriptor(null);
    }
  };

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
        className={`w-full h-full object-cover transition-opacity duration-500 transform-none ${isReady ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {isReady && currentDescriptor && !isDialogOpen && (
         <Button 
            onClick={() => setIsDialogOpen(true)}
            className="absolute bottom-4 right-4 z-20 animate-pulse"
            size="lg"
            >
            <UserPlus className="mr-2 h-5 w-5" />
            Save New Face
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save New Face</DialogTitle>
            <DialogDescription>
              A new face was detected. Enter a name to save it for future recognition.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setCurrentDescriptor(null);
            }}>Cancel</Button>
            <Button onClick={handleSaveFace}>Save Face</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaceScanner;
