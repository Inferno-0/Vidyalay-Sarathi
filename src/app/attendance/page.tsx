
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getKnownFaces, getAttendanceForStudent, takeAttendance } from '@/app/actions';
import { Loader2, UserX, Plane } from 'lucide-react';
import MainLayout from '@/components/main-layout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import FaceScanner from '@/components/face-scanner';

interface Student {
  label: string;
  images: string[];
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
}

export default function AttendancePage() {
  const [date, setDate] = useState<Date | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [markedPresentToday, setMarkedPresentToday] = useState(new Set<string>());
  const processingRef = useRef(new Set<string>());

  const fetchStudentsAndAttendance = useCallback(async (currentDate: Date) => {
    setLoading(true);
    try {
      const knownFacesData = await getKnownFaces();
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      const newMarkedPresent = new Set<string>();
      const studentsWithAttendance = await Promise.all(
        knownFacesData.map(async (face) => {
          const status = await getAttendanceForStudent(face.label, formattedDate);
          if (status === 'Present') {
            newMarkedPresent.add(face.label);
          }
          return { ...face, status };
        })
      );
      setStudents(studentsWithAttendance);
      setMarkedPresentToday(newMarkedPresent);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAttendance = useCallback(async (studentId: string, status: 'Present' | 'Absent' | 'Leave') => {
    if (!date) return;
    const formattedDate = format(date, 'yyyy-MM-dd');
    try {
      await takeAttendance(studentId, formattedDate, status);
      
      // We optimistically update the UI
      setStudents(prev => prev.map(s => s.label === studentId ? { ...s, status } : s));
      
      if (status === 'Present') {
        setMarkedPresentToday(prev => new Set(prev).add(studentId));
      } else {
        setMarkedPresentToday(prev => {
          const newSet = new Set(prev);
          newSet.delete(studentId);
          return newSet;
        });
      }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: `Failed to mark ${studentId} as ${status}.` });
        // Re-fetch to revert optimistic update on error
        fetchStudentsAndAttendance(date); 
    }
  }, [date, toast, fetchStudentsAndAttendance]);
  
  useEffect(() => {
    const today = new Date();
    setDate(today);
    fetchStudentsAndAttendance(today);
  }, [fetchStudentsAndAttendance]);

  
  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
        case 'Present': return <Badge variant="default" className="bg-green-600">Present</Badge>;
        case 'Absent': return <Badge variant="destructive">Absent</Badge>;
        case 'Leave': return <Badge variant="secondary" className="bg-blue-600 text-white">On Leave</Badge>;
        case 'Holiday': return <Badge variant="outline">Holiday</Badge>;
        default: return <Badge variant="outline">Not Marked</Badge>;
    }
  };
  
  const onFaceRecognized = (name: string) => {
    if (markedPresentToday.has(name) || processingRef.current.has(name)) {
      return;
    }
    
    processingRef.current.add(name);

    handleMarkAttendance(name, 'Present');
    toast({
      title: 'Attendance Marked',
      description: `${name} has been marked as Present.`,
    });
    
    setTimeout(() => {
      processingRef.current.delete(name);
    }, 2000);
  };

  if (!date) {
    return (
      <MainLayout title="Take Attendance">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Take Attendance">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col h-[75vh]">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full">
               <FaceScanner 
                  onFaceRecognized={onFaceRecognized} 
                  mode="attendance"
                  recognizedLabels={markedPresentToday}
                />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Student Roster</CardTitle>
                    <CardDescription>Attendance status for {format(date, 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[65vh] overflow-y-auto">
                  {loading ? (
                     <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                  ) : (
                    students.map(student => (
                        <div key={student.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                           <span className="font-medium text-lg">{student.label}</span>
                           <div className="flex items-center gap-2">
                                {getStatusBadge(student.status)}
                                {student.status !== 'Holiday' && student.status !== 'Present' && (
                                  <>
                                    <Button size="sm" variant={student.status === 'Absent' ? "outline" : "destructive"} onClick={() => handleMarkAttendance(student.label, 'Absent')}><UserX className="h-4 w-4" /></Button>
                                    <Button size="sm" variant={student.status === 'Leave' ? "secondary" : "outline"} className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleMarkAttendance(student.label, 'Leave')}><Plane className="h-4 w-4" /></Button>
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
