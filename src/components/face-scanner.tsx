
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, Camera, SwitchCamera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getKnownFaces, saveKnownFace } from '@/app/actions';

declare const faceapi: any;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

interface KnownFaceData {
    label: string;
    images: string[];
}

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
  const { toast } = useToast();
  const detectionInterval = useRef<NodeJS.Timeout>();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);


  const loadModels = useCallback(async () => {
    if (typeof faceapi === 'undefined') {
        setLoadingMessage('FaceAPI script not loaded yet. Retrying...');
        setTimeout(loadModels, 1000);
        return false;
    }
    setLoadingMessage('Loading face detection models...');
    try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return true;
    } catch (error) {
        console.error("Error loading models: ", error);
        setLoadingMessage('Failed to load face detection models.');
        return false;
    }
  }, []);

  const startVideo = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        setLoadingMessage('Accessing camera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: facingMode 
            } 
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
        }
    } catch (err) {
        console.error('Error accessing camera:', err);
        setLoadingMessage(`Camera access denied. Please enable permissions.`);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Could not access the camera. Please check your browser permissions.',
        });
    }
  }, [facingMode, toast]);
  
  const loadKnownFaces = useCallback(async () => {
    if (typeof faceapi === 'undefined') return;
    
    try {
        setLoadingMessage('Loading known faces...');
        const savedFaces: KnownFaceData[] = await getKnownFaces();

        const labeledFaceDescriptors = await Promise.all(
            savedFaces.map(async (face: KnownFaceData) => {
                const descriptors: any[] = [];
                if (!Array.isArray(face.images)) {
                    console.warn('Skipping face with invalid images format:', face.label);
                    return null;
                }
                for (const image of face.images) {
                    if (!image || !image.startsWith('data:image')) {
                        console.warn('Skipping invalid image data for:', face.label);
                        continue;
                    }
                    try {
                        const img = await faceapi.fetchImage(image);
                        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                        if (detection) {
                            descriptors.push(detection.descriptor);
                        }
                    } catch (e) {
                        console.error("Error loading saved face:", face.label, e)
                    }
                }

                if (descriptors.length > 0) {
                    return new faceapi.LabeledFaceDescriptors(face.label, descriptors);
                }
                return null;
            })
        );
        setKnownFaces(labeledFaceDescriptors.filter(d => d !== null));
        setLoadingMessage('');
    } catch (error) {
        console.error("Failed to load known faces from server:", error);
        setLoadingMessage('Could not load known faces.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
        const modelsLoaded = await loadModels();
        if (modelsLoaded) {
            await loadKnownFaces();
            await startVideo();
        }
    };
    init();

    return () => {
      if (detectionInterval.current) {
          clearInterval(detectionInterval.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handlePlay = useCallback(() => {
    setLoadingMessage('');
    setIsReady(true);
    
    if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
    }

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
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let foundUnknownFace = false;

      if (knownFaces.length > 0 && resizedDetections.length > 0) {
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

          if (bestMatch.label === 'unknown') {
            foundUnknownFace = true;
          }
        });
      } else if (resizedDetections.length > 0) {
        foundUnknownFace = true;
        resizedDetections.forEach((detection: any) => {
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: 'unknown',
              boxColor: '#E74C3C',
            });
            drawBox.draw(canvas);
          });
      }
      setUnknownFaceDetected(foundUnknownFace);
    }, 1000);

  }, [isDialogOpen, knownFaces]);

  const handleCaptureFace = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setIsDialogOpen(true);
      }
    }
  };

  const handleSaveFace = async () => {
    if (newFaceName && capturedImage) {
        try {
            await saveKnownFace({
                label: newFaceName,
                image: capturedImage,
            });
            
            await loadKnownFaces();

            toast({
                title: "Face Saved!",
                description: `${newFaceName} has been added to your known faces.`,
            });
            
        } catch (error) {
            console.error("Failed to save face:", error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save the face. Please try again.",
            });
        } finally {
            closeDialog();
        }
    }
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewFaceName('');
    setCapturedImage(null);
  }

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full h-full bg-card flex items-center justify-center">
      {hasCameraPermission === false && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
             <Alert variant="destructive" className="max-w-md">
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use this feature. You may need to refresh the page after granting permissions.
              </AlertDescription>
            </Alert>
         </div>
      )}

      {loadingMessage && (
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
        className={`w-full h-full object-cover transition-opacity duration-500 ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''} ${isReady ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
      
      {isReady && hasCameraPermission && (
        <Button 
            onClick={toggleCamera}
            variant="outline"
            size="icon"
            className="absolute top-4 left-4 z-20"
        >
            <SwitchCamera className="h-5 w-5" />
            <span className="sr-only">Switch Camera</span>
        </Button>
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
              A new face was detected. Enter a name to save it. If the name already exists, this image will be added to their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {capturedImage && (
                <div className="flex justify-center">
                    <img src={capturedImage} alt="Captured face" className="rounded-md w-48 h-48 object-cover" />
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
