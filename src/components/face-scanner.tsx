
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, SwitchCamera, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getKnownFaces, saveKnownFace } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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

type Pose = 'front' | 'left' | 'right' | 'up' | 'down' | 'jaw_left' | 'jaw_right' | 'unknown';

const enrollmentSteps: { instruction: string; requiredPose: Pose }[] = [
    { instruction: "Look directly at the camera for a front-facing view.", requiredPose: 'front' },
    { instruction: "Turn your head to the right for a side profile.", requiredPose: 'right' },
    { instruction: "Turn your head to the left for the other side profile.", requiredPose: 'left' },
    { instruction: "Tilt your head slightly up.", requiredPose: 'up' },
    { instruction: "Tilt your head slightly down.", requiredPose: 'down' },
    { instruction: "Turn 45 degrees to the right.", requiredPose: 'jaw_right' },
    { instruction: "Turn 45 degrees to the left.", requiredPose: 'jaw_left' }
];

const getPose = (landmarks: any): Pose => {
    if (!landmarks) return 'unknown';

    const nose = landmarks.getNose()[3];
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3];
    // const jawline = landmarks.getJawOutline();
    // const chin = jawline[8];

    const eyeMidPoint = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const eyeDist = Math.abs(leftEye.x - rightEye.x);

    const noseToMidEyeX = nose.x - eyeMidPoint.x;
    const yawRatio = noseToMidEyeX / eyeDist;

    const noseToMidEyeY = nose.y - eyeMidPoint.y;
    const pitchRatio = noseToMidEyeY / eyeDist;

    if (pitchRatio > 0.35) return 'down';
    if (pitchRatio < -0.1) return 'up';
    if (yawRatio > 0.25) return 'left';
    if (yawRatio < -0.25) return 'right';
    if (Math.abs(yawRatio) > 0.1 && Math.abs(yawRatio) < 0.25) {
        return yawRatio > 0 ? 'jaw_left' : 'jaw_right';
    }
    if (Math.abs(yawRatio) < 0.1 && pitchRatio < 0.4 && pitchRatio > -0.1) return 'front';

    return 'unknown';
};

const FaceScanner: React.FC<FaceScannerProps> = ({ mode = 'enrollment', onFaceRecognized, recognizedLabels = new Set() }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFaceData, setNewFaceData] = useState({ name: '', class: '', rollNo: ''});
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [enrollmentStep, setEnrollmentStep] = useState(0);
  const [faceMatcher, setFaceMatcher] = useState<any>(null);
  const [alreadyEnrolledMessage, setAlreadyEnrolledMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const detectionInterval = useRef<NodeJS.Timeout>();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentPose, setCurrentPose] = useState<Pose>('unknown');
  const poseHeldSince = useRef<number | null>(null);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);

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
                const descriptors: Float32Array[] = [];
                if (!Array.isArray(face.images)) return null;
                
                for (const image of face.images) {
                    if (!image || !image.startsWith('data:image')) continue;
                    try {
                        const img = await faceapi.fetchImage(image);
                        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                        if (detection) descriptors.push(detection.descriptor);
                    } catch (e) {
                        console.error("Error loading saved face:", face.label, e);
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
    if (videoRef.current && capturedImages.length < enrollmentSteps.length) {
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
        const newImages = [...capturedImages, dataUrl];
        setCapturedImages(newImages);
        
        // Reset timers and advance step
        poseHeldSince.current = null;
        setCaptureCountdown(null);

        if (enrollmentStep < enrollmentSteps.length - 1) {
            setEnrollmentStep(prev => prev + 1);
        } else {
            setIsDialogOpen(true);
        }
      }
    }
  }, [capturedImages, enrollmentStep, facingMode]);

  const handlePlay = useCallback(() => {
    setLoadingMessage('');
    setIsReady(true);
    
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    
    const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });

    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || typeof faceapi === 'undefined' || (isDialogOpen && mode === 'enrollment') || capturedImages.length >= enrollmentSteps.length) {
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
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        const currentDetectedPose = getPose(resizedDetections.landmarks);
        setCurrentPose(currentDetectedPose);
        
        let label = 'Unknown';
        let boxColor = '#E74C3C'; // Red for unknown
        
        if (faceMatcher) {
            const bestMatch = faceMatcher.findBestMatch(resizedDetections.descriptor);
            if (bestMatch.label !== 'unknown') {
                label = bestMatch.label;
                boxColor = '#2ECC71'; // Green for known
                if (mode === 'enrollment') {
                   setAlreadyEnrolledMessage(`${label} is already enrolled.`);
                }
            } else {
                 setAlreadyEnrolledMessage(null);
            }
        }
        
        const isPoseCorrect = mode === 'enrollment' && enrollmentStep < enrollmentSteps.length && currentDetectedPose === enrollmentSteps[enrollmentStep].requiredPose;

        // Auto-capture logic for enrollment
        if (mode === 'enrollment' && isPoseCorrect && !alreadyEnrolledMessage) {
            if (poseHeldSince.current === null) {
                poseHeldSince.current = Date.now();
            } else if (Date.now() - poseHeldSince.current > 2000) { // 2 second hold
                handleCaptureFace();
            } else {
                 const timeLeft = 2 - Math.floor((Date.now() - poseHeldSince.current) / 1000);
                 setCaptureCountdown(timeLeft);
            }
        } else {
            poseHeldSince.current = null;
            setCaptureCountdown(null);
        }

        // Drawing logic
        const isMarked = recognizedLabels.has(label);
        if (label !== 'Unknown' && isMarked) {
          const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label: `${label} (Present)`, boxColor: '#2ECC71' });
          drawBox.draw(canvas);
          ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
          ctx.fillRect(resizedDetections.detection.box.x, resizedDetections.detection.box.y, resizedDetections.detection.box.width, resizedDetections.detection.box.height);
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.fillText('✓', resizedDetections.detection.box.x + 10, resizedDetections.detection.box.y + 28);
        } else if (label !== 'Unknown' && onFaceRecognized) {
          const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label, boxColor: '#3498DB' });
          drawBox.draw(canvas);
          onFaceRecognized(label);
        } else {
          const drawBox = new faceapi.draw.DrawBox(resizedDetections.detection.box, { label, boxColor });
          drawBox.draw(canvas);
        }
        
      } else {
        setCurrentPose('unknown');
        setAlreadyEnrolledMessage(null);
        poseHeldSince.current = null;
        setCaptureCountdown(null);
      }
    }, 500);

  }, [isDialogOpen, faceMatcher, mode, onFaceRecognized, recognizedLabels, handleCaptureFace, enrollmentStep, alreadyEnrolledMessage, capturedImages.length]);


  const handleSaveFace = async () => {
    if (newFaceData.name && capturedImages.length === enrollmentSteps.length) {
        try {
            await saveKnownFace({
                label: newFaceData.name,
                class: newFaceData.class,
                rollNo: newFaceData.rollNo,
                images: capturedImages,
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
    setCapturedImages([]);
    setEnrollmentStep(0);
  }

  const toggleCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const progress = (enrollmentStep / enrollmentSteps.length) * 100;
  const isPoseCorrect = currentPose === enrollmentSteps[enrollmentStep]?.requiredPose;

  const getPoseFeedback = () => {
    if (alreadyEnrolledMessage) return { text: "Already registered.", color: "text-yellow-600" };
    if (!enrollmentSteps[enrollmentStep]) return { text: "Scan Complete!", color: "text-green-600" };

    const required = enrollmentSteps[enrollmentStep].requiredPose;
    if (isPoseCorrect) {
        if (captureCountdown !== null) {
            return { text: `Hold it... ${captureCountdown}`, color: "text-blue-600" };
        }
        return { text: "Pose Correct! Hold still...", color: "text-green-600" };
    }

    switch (required) {
        case 'front': return { text: "Please look straight ahead.", color: "text-red-600" };
        case 'left': return { text: "Please turn your head to the left.", color: "text-red-600" };
        case 'right': return { text: "Please turn your head to the right.", color: "text-red-600" };
        case 'up': return { text: "Please tilt your head up.", color: "text-red-600" };
        case 'down': return { text: "Please tilt your head down.", color: "text-red-600" };
        case 'jaw_left': return { text: "Turn slightly left (45°).", color: "text-red-600" };
        case 'jaw_right': return { text: "Turn slightly right (45°).", color: "text-red-600" };
        default: return { text: "Searching for face...", color: "text-muted-foreground" };
    }
  };
  
  const poseFeedback = getPoseFeedback();

  const renderEnrollmentControls = () => (
    <div className="bg-muted/50 p-4 rounded-lg shadow-lg text-center backdrop-blur-sm">
        {alreadyEnrolledMessage ? (
             <Alert variant="destructive" className="mb-4">
                <UserCheck className="h-4 w-4"/>
                <AlertTitle>Face Already Registered</AlertTitle>
                <AlertDescription>{alreadyEnrolledMessage}</AlertDescription>
             </Alert>
        ) : (
          <>
            <p className="text-lg font-semibold mb-2">Step {Math.min(enrollmentStep + 1, enrollmentSteps.length)} of {enrollmentSteps.length}</p>
            <p className="text-muted-foreground mb-4">{enrollmentSteps[enrollmentStep]?.instruction || "All poses captured!"}</p>
            <Progress value={progress} className="w-full mb-4" />
            <div className="my-4 h-6">
                <Badge variant={isPoseCorrect ? "default" : "destructive"} className={`transition-all duration-300 ${isPoseCorrect ? 'bg-green-600' : ''} ${poseFeedback.color.includes('blue') ? 'bg-blue-600' : ''}`}>
                    <span className={`font-bold ${poseFeedback.color}`}>{poseFeedback.text}</span>
                </Badge>
            </div>
             {captureCountdown !== null && (
                 <div className="text-6xl font-bold text-primary my-4">{captureCountdown}</div>
             )}
          </>
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
      
       <div className={`relative w-full h-full flex flex-col md:flex-row gap-6 items-center`}>
        <div className="relative w-full md:w-1/2 aspect-video">
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
          <div className="w-full md:w-1/2">
              {renderEnrollmentControls()}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save New Student</DialogTitle>
            <DialogDescription>
              Enter the student's details. All 7 images will be saved to their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-4">
            {capturedImages.slice(0, 7).map((img, index) => (
                <img key={index} src={img} alt={`Capture ${index + 1}`} className="rounded-md w-full h-auto object-cover" />
            ))}
             {capturedImages.length > 7 && <div className="rounded-md w-full h-auto object-cover bg-muted flex items-center justify-center text-xs">+{capturedImages.length - 7} more</div>}
          </div>
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
            <Button onClick={handleSaveFace}>Save Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaceScanner;
    
