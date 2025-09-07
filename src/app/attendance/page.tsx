
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

interface Student {
  label: string;
  images: string[];
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday' | 'Not Marked';
}

export default function AttendancePage() {
  const [date] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const markedPresentToday = useRef(new Set<string>());
  
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
  
  useEffect(() => {
    fetchStudentsAndAttendance();
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

  return (
    <MainLayout title="Take Attendance">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Student Roster</CardTitle>
                    <CardDescription>Attendance status for {format(date, 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[75vh] overflow-y-auto">
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
    </MainLayout>
  );
}
