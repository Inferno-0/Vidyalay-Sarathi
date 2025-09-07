
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getKnownFaces, getAttendanceForStudent, takeAttendance } from '@/app/actions';
import { Loader2, UserX, Plane, SwitchCamera } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

declare const faceapi: any;
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

interface Student {
  label: string;
  images: string[];
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
}

export default function AttendancePage() {
  const [date] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScannerReady, setIsScannerReady] = useState(false);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionInterval = useRef<NodeJS.Timeout>();
  const [knownFaces, setKnownFaces] = useState<any[]>([]);
  const markedPresentToday = useRef(new Set<string>());
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const setupFaceScanner = useCallback(async () => {
    if (typeof faceapi === 'undefined') {
        setTimeout(setupFaceScanner, 500);
        return;
    }
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    const savedFaces = await getKnownFaces();
    if (savedFaces.length === 0) {
        setIsScannerReady(true);
        return;
    }
    const labeledFaceDescriptors = await Promise.all(
        savedFaces.map(async (face) => {
            const descriptors: any[] = [];
            for (const image of face.images) {
              try {
                  const img = await faceapi.fetchImage(image);
                  const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                  if (detection) descriptors.push(detection.descriptor);
              } catch (e) { console.error("Error processing image for", face.label, e); }
            }
            if (descriptors.length > 0) return new faceapi.LabeledFaceDescriptors(face.label, descriptors);
            return null;
        })
    );
    setKnownFaces(labeledFaceDescriptors.filter(d => d !== null));
    setIsScannerReady(true);
  }, []);

  const startVideo = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraPermission(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access the camera. Please check permissions.' });
    }
  }, [facingMode, toast]);
  
  const fetchStudentsAndAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const knownFacesData = await getKnownFaces();
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const studentsWithAttendance = await Promise.all(
        knownFacesData.map(async (face) => {
          const status = await getAttendanceForStudent(face.label, formattedDate);
          if (status === 'Present') {
              markedPresentToday.current.add(face.label);
          }
          return { ...face, status };
        })
      );
      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const handleMarkAttendance = useCallback(async (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    try {
      await takeAttendance(studentId, formattedDate, status);
      setStudents(prev => prev.map(s => s.label === studentId ? { ...s, status } : s));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to mark ${studentId} as ${status}.` });
    }
  }, [date, toast]);
  
  const handlePlay = useCallback(() => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);

    detectionInterval.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || typeof faceapi === 'undefined' || knownFaces.length === 0) return;

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        if (detections.length === 0) return;

        const faceMatcher = new faceapi.FaceMatcher(knownFaces, 0.6);
        for (const detection of detections) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            if (bestMatch.label !== 'unknown') {
                if (!markedPresentToday.current.has(bestMatch.label)) {
                    markedPresentToday.current.add(bestMatch.label);
                    handleMarkAttendance(bestMatch.label, 'Present');
                    toast({
                      title: 'Attendance Marked',
                      description: `${bestMatch.label} marked as Present.`,
                      className: 'bg-green-100 dark:bg-green-900'
                    });
                }
            }
        }
    }, 2000);
  }, [knownFaces, toast, handleMarkAttendance]);

  useEffect(() => {
    fetchStudentsAndAttendance();
    setupFaceScanner();

    return () => {
        if (detectionInterval.current) clearInterval(detectionInterval.current);
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [fetchStudentsAndAttendance, setupFaceScanner]);


  useEffect(() => {
    if (isScannerReady) {
        startVideo();
    }
  }, [isScannerReady, startVideo]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-green-600">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Leave': return <Badge variant="secondary" className="bg-blue-600 text-white">On Leave</Badge>;
        case 'Holiday': return <Badge variant="outline">Holiday</Badge>;
        default: return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  return (
    <MainLayout title="Take Attendance">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Camera Feed</CardTitle>
              <CardDescription>{format(date, 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                {!isScannerReady ? (
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Initializing Scanner...</p>
                    </div>
                ) : hasCameraPermission === false ? (
                    <Alert variant="destructive">
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access to use this feature.
                      </AlertDescription>
                    </Alert>
                ) : (
                   <>
                    <video ref={videoRef} autoPlay muted playsInline onPlay={handlePlay} className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} />
                    <Button onClick={toggleCamera} variant="outline" size="icon" className="absolute top-2 right-2 z-10"><SwitchCamera/></Button>
                   </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Student Roster</CardTitle>
                    <CardDescription>Attendance status for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                     <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : (
                    students.map(student => (
                        <div key={student.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                           <span className="font-medium text-lg">{student.label}</span>
                           <div className="flex items-center gap-2">
                                {getStatusBadge(student.status)}
                                {student.status !== 'Present' && student.status !== 'Holiday' && (
                                  <>
                                    <Button size="sm" variant="destructive" onClick={() => handleMarkAttendance(student.label, 'Absent')}><UserX className="h-4 w-4" /></Button>
                                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleMarkAttendance(student.label, 'Leave')}><Plane className="h-4 w-4" /></Button>
                                  </>
                                )}
                           </div>
                        </div>
                    ))
                  )}
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}

