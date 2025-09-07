
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, SwitchCamera, UserCheck, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getKnownFaces, saveKnownFace } from '@/app/actions';

declare const faceapi: any;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

interface KnownFaceData {
    label: string;
    class: string;
    rollNo: string;
    images: string[];
}

interface FaceScannerProps {
  mode?: 'enrollment' | 'attendance';
  onFaceRecognized?: (name: string) => void;
  recognizedLabels?: Set<string>;
}

const FaceScanner: React.FC<FaceScannerProps> = ({ mode = 'enrollment', onFaceRecognized, recognizedLabels = new Set() }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFaceData, setNewFaceData] = useState({ name: '', class: '', rollNo: ''});
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceMatcher, setFaceMatcher] = useState<any>(null);
  const [alreadyEnrolledMessage, setAlreadyEnrolledMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const detectionInterval = useRef<NodeJS.Timeout>();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);


  const loadModels = useCallback(async () => {
    if (typeof faceapi === 'undefined') {
        setLoadingMessage('FaceAPI script not loaded yet. Retrying...');
        setTimeout(loadModels, 1000);
        return false;
    }
    setLoadingMessage('Loading face detection models...');
    try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
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

  const loadKnownFaces = useCallback(async () => {
    if (typeof faceapi === 'undefined') return;
    
    setLoadingMessage('Loading known faces...');
    try {
        const savedFaces: KnownFaceData[] = await getKnownFaces();

        if (savedFaces.length === 0) {
            setFaceMatcher(null);
            return;
        }

        const labeledFaceDescriptors = await Promise.all(
            savedFaces.map(async (face) => {
                if (!face.images || face.images.length === 0) return null;
                
                const descriptors: Float32Array[] = [];
                for (const image of face.images) {
                    try {
                        const img = await faceapi.fetchImage(image);
                        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                        if (detection) descriptors.push(detection.descriptor);
                    } catch (e) {
                        console.error("Error processing image for face:", face.label, e);
                    }
                }

                if (descriptors.length > 0) {
                    return new faceapi.LabeledFaceDescriptors(face.label, descriptors);
                }
                return null;
            })
        );
        
        const validDescriptors = labeledFaceDescriptors.filter(d => d !== null) as any[];
        if (validDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(validDescriptors, 0.5));
        } else {
          setFaceMatcher(null);
        }
    } catch (error) {
        console.error("Failed to load known faces from server:", error);
        setLoadingMessage('Could not load known faces.');
    } finally {
        setLoadingMessage('');
    }
  }, []);
  
  const startVideo = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    try {
      setLoadingMessage('Accessing camera...');
      setIsReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraPermission(true);
      }
      return stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setLoadingMessage(`Camera access denied. Please enable permissions.`);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Could not access the camera. Please check your browser permissions.',
      });
      return null;
    }
  }, [facingMode, toast]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const init = async () => {
        const modelsLoaded = await loadModels();
        if (modelsLoaded) {
            await loadKnownFaces();
            stream = await startVideo();
        }
    };
    init();
  
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    }
  }, [loadModels, loadKnownFaces, startVideo]);
  
  const handleCaptureFace = useCallback(() => {
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
  }, [facingMode]);

  const handlePlay = useCallback(() => {
    setLoadingMessage('');
    setIsReady(true);
    
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    
    const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || typeof faceapi === 'undefined') {
        return;
      }
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detection = await faceapi
        .detectSingleFace(video, detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (detection) {
        setIsFaceDetected(true);
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        
        let label = 'Unknown';
        let boxColor = '#E74C3C'; // Red for unknown
        
        if (faceMatcher) {
            const bestMatch = faceMatcher.findBestMatch(resizedDetections.descriptor);
            if (bestMatch.label !== 'unknown') {
                label = bestMatch.label;
                 boxColor = recognizedLabels.has(label) ? '#2ECC71' : '#3498DB';
            }
        }
        
        if (mode === 'attendance') {
            if (label !== 'Unknown') {
                if (recognizedLabels.has(label)) {
                    const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label: `${label} (Present)`, boxColor });
                    drawBox.draw(canvas);
                } else {
                    const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label, boxColor });
                    drawBox.draw(canvas);
                    if (onFaceRecognized) {
                        onFaceRecognized(label);
                    }
                }
            } else {
                 const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label: 'Unknown', boxColor });
                 drawBox.draw(canvas);
            }
        } else { // Enrollment mode
             if (label !== 'Unknown') {
                 boxColor = '#2ECC71'; // Green for already enrolled
                 setAlreadyEnrolledMessage(`${label} is already enrolled.`);
             } else {
                 boxColor = '#3498DB'; // Blue for new face
                 setAlreadyEnrolledMessage(null);
             }
             const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label, boxColor });
             drawBox.draw(canvas);
        }
        
      } else {
        setIsFaceDetected(false);
        setAlreadyEnrolledMessage(null);
      }
    }, 500);

  }, [faceMatcher, onFaceRecognized, recognizedLabels, mode]);


  const handleSaveFace = async () => {
    if (newFaceData.name && capturedImage) {
        try {
            await saveKnownFace({
                label: newFaceData.name,
                class: newFaceData.class,
                rollNo: newFaceData.rollNo,
                images: [capturedImage],
            });
            
            await loadKnownFaces();

            toast({
                title: "Face Saved!",
                description: `${newFaceData.name} has been added to your known faces.`,
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
    setNewFaceData({ name: '', class: '', rollNo: '' });
    setCapturedImage(null);
  }

  const toggleCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const renderEnrollmentControls = () => (
    <div className="w-full md:w-1/3 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-muted-foreground">
            Position a new face in the frame and click capture.
        </p>
        <Button 
            onClick={handleCaptureFace} 
            disabled={!isFaceDetected || !!alreadyEnrolledMessage}
            size="lg"
            className="w-full"
        >
            <Camera className="mr-2 h-5 w-5"/>
            Capture
        </Button>
        {alreadyEnrolledMessage && (
             <Alert variant="destructive">
                <UserCheck className="h-4 w-4"/>
                <AlertTitle>Face Already Registered</AlertTitle>
                <AlertDescription>{alreadyEnrolledMessage}</AlertDescription>
             </Alert>
        )}
    </div>
  );

  return (
    <div className="relative w-full bg-card flex flex-col md:flex-row items-center justify-center p-4 min-h-[60vh] md:min-h-[70vh]">
      {loadingMessage && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      )}
      
      {hasCameraPermission === false && (
         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Alert variant="destructive">
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use this feature. You may need to refresh the page after granting permissions.
              </AlertDescription>
            </Alert>
         </div>
      )}
      
       <div className={`relative w-full h-full flex flex-col md:flex-row gap-6 items-center justify-center`}>
        <div className="relative w-full md:w-2/3 lg:w-1/2 aspect-video">
          <video
            ref={videoRef}
            onPlay={handlePlay}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover rounded-md transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'} ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
          />
          <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`} />
          {isReady && hasCameraPermission && (
            <Button 
                onClick={toggleCamera}
                variant="outline"
                size="icon"
                className="absolute top-4 left-4 z-10"
            >
                <SwitchCamera className="h-5 w-5" />
                <span className="sr-only">Switch Camera</span>
            </Button>
          )}
        </div>
        {isReady && mode === 'enrollment' && !isDialogOpen && (
          renderEnrollmentControls()
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save New Student</DialogTitle>
            <DialogDescription>
              Enter the student's details and click save.
            </DialogDescription>
          </DialogHeader>
          {capturedImage && (
            <div className="flex justify-center py-4">
                <img src={capturedImage} alt="Captured face" className="rounded-md w-48 h-48 object-cover" />
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newFaceData.name} onChange={(e) => setNewFaceData({...newFaceData, name: e.target.value})} className="col-span-3" placeholder="Student's full name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class" className="text-right">Class</Label>
              <Input id="class" value={newFaceData.class} onChange={(e) => setNewFaceData({...newFaceData, class: e.target.value})} className="col-span-3" placeholder="e.g., 10th A" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rollNo" className="text-right">Roll No</Label>
              <Input id="rollNo" value={newFaceData.rollNo} onChange={(e) => setNewFaceData({...newFaceData, rollNo: e.target.value})} className="col-span-3" placeholder="e.g., 25" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSaveFace} disabled={!newFaceData.name || !newFaceData.class || !newFaceData.rollNo}>Save Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaceScanner;
